/**
 * Timeline status line — the one-glance "read" at the top of the drawer
 * timeline (Chunk 3). Answers the two questions an admin actually has when
 * they open a card: how warm is this prospect, and whose move is it?
 *
 * This is the single source of truth for the warm/cold interpretation. It's a
 * pure, presentation-only derivation from the drawer context — no stored
 * state, no new backend concept. Keeping the rules here (not sprinkled in the
 * component) means the temperature can be tuned, or reused on other surfaces
 * later, from one place.
 *
 * Temperature (approved vocabulary):
 *   💬 Replied     — they wrote back            → your move
 *   🔥 Engaged     — clicked, or opened 3+ times
 *   🌤 Warm        — opened at least once
 *   🧊 Cold        — sent, never opened
 *   (Not started)  — no outreach sent yet       → returns null (the timeline's
 *                    own empty / upcoming state already says this)
 */

import type { DrawerContext } from "./types";

export interface TimelineSummary {
  emoji: string;
  /** Temperature word — "Engaged", "Warm", "Cold", "Replied". */
  label: string;
  /** The specifics: engagement phrase + whose-move clause, e.g.
   *  "opened 3×, clicked once · waiting on their reply (5d)". */
  detail: string;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function daysAgo(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 86_400_000) : 0;
}

export function deriveTimelineSummary(ctx: DrawerContext): TimelineSummary | null {
  const tps = ctx.touchpoints ?? [];

  let sentCount = 0;
  let openCount = 0;
  let clickCount = 0;
  let replyCount = 0;
  let lastSentIso: string | null = null;

  for (const t of tps) {
    if (t.touchpoint_type === "email_sent") {
      sentCount += 1;
      const p = (t.payload ?? {}) as Record<string, unknown>;
      openCount += num(p.open_count);
      clickCount += num(p.click_count);
      if (!lastSentIso || t.created_at > lastSentIso) lastSentIso = t.created_at;
    } else if (
      t.touchpoint_type === "email_replied" ||
      t.touchpoint_type === "ig_dm_replied"
    ) {
      replyCount += 1;
    }
  }

  // Pre-outreach: nothing sent and no reply → no summary. The timeline's own
  // "Upcoming" / "No outreach activity yet" state already communicates this,
  // so a "Not started" line would just be redundant.
  if (sentCount === 0 && replyCount === 0) return null;

  // ── Temperature (first match wins) ──
  let emoji: string;
  let label: string;
  if (replyCount > 0) {
    emoji = "💬";
    label = "Replied";
  } else if (clickCount > 0 || openCount >= 3) {
    emoji = "🔥";
    label = "Engaged";
  } else if (openCount >= 1) {
    emoji = "🌤";
    label = "Warm";
  } else {
    emoji = "🧊";
    label = "Cold";
  }

  // ── Engagement phrase ──
  let engagement: string;
  if (replyCount > 0) {
    engagement = "they replied";
  } else {
    const parts: string[] = [];
    if (openCount > 0) parts.push(openCount === 1 ? "opened once" : `opened ${openCount}×`);
    if (clickCount > 0) parts.push(clickCount === 1 ? "clicked once" : `clicked ${clickCount}×`);
    engagement =
      parts.length > 0
        ? parts.join(", ")
        : `${sentCount} email${sentCount === 1 ? "" : "s"} sent, never opened`;
  }

  // ── Whose-move clause ──
  let move: string | null = null;
  if (ctx.meeting_state === "scheduled") {
    move = "meeting booked";
  } else if (ctx.meeting_state === "in_flight") {
    move = "finding a meeting time";
  } else if (replyCount > 0) {
    move = "your move";
  } else if (ctx.awaiting_callback_at) {
    move = "awaiting their callback";
  } else if (lastSentIso) {
    const d = daysAgo(lastSentIso);
    move = d > 0 ? `waiting on their reply (${d}d)` : "waiting on their reply";
  }

  const detail = move ? `${engagement} · ${move}` : engagement;
  return { emoji, label, detail };
}
