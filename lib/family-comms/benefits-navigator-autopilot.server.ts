/**
 * Navigator autopilot: releases first-step letters that no longer need a
 * person, and keeps the rest from sitting forever.
 *
 * WHY (2026-09-24). Every navigator letter sent between Aug 2 and Sep 14 went
 * out because TJ scheduled a batch from /admin/benefits. Nothing was broken:
 * the scheduler cron ran every hour and reported `due: 0` because nobody had
 * scheduled anything since Sep 14. The coordinator kept composing about five
 * letters a day into the queue, the packet builder kept routing them, and 140
 * sat pending. The only step in the pipeline without a clock was the human
 * one. TJ approved removing it for letters the packet already calls clean.
 *
 * WHAT IT DOES, each hourly scheduler run:
 *  1. SEND  a pending letter whose packet routed `auto`, whose packet was
 *     built after the letter's latest change, and whose text is at most
 *     STALE_LETTER_DAYS old. Same send path as TJ's button, so every gate
 *     applies: nudges_unsubscribed, the reply hold, do_not_contact, email
 *     suppression, the family nudge cap, SMS consent, opt-out, and the
 *     recipient's 8am-8pm window.
 *  2. RECOMPOSE a letter that is `auto` but stale, or routed `recompose`.
 *     Same compose path the coordinator already runs unattended every day.
 *     The new letter has no packet, so the packet cron judges it before it
 *     can send. Capped per letter (MAX_AUTO_RECOMPOSES) and per run.
 *
 * WHAT IT NEVER DOES: touch `review` or `ask`, touch a letter a person has
 * scheduled or edited, or send while the family's reply is waiting on a human.
 *
 * SLA: an `auto` letter goes out at the first hourly run after its verdict
 * lands (packets build at :25, this runs at :10, so within about 45 minutes),
 * subject to the recipient's texting window. A blocked letter is stamped with
 * the reason in the queue and named in Slack, never retried silently.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isTransientSkip } from "@/lib/email-governance";
import { packetNeedsBuild } from "@/lib/benefits/navigator-packet";
import {
  composeNavigatorDraft,
  pickSnapshot,
  readBenefitsNavigator,
  type BenefitsNavigatorMeta,
} from "./benefits-navigator.server";
import { markScheduleFailed, sendNavigatorLetter } from "./benefits-navigator-send.server";
import { isBenefitsAutomationHeld } from "./benefits-automation";

const DAY = 24 * 60 * 60 * 1000;

/**
 * A letter older than this is recomposed before it can send without a
 * person. Letters name when the family used the finder ("on Tuesday") and
 * rest on program data as of composition. Past a week, the first reads as a
 * mistake and the second may have been corrected underneath it.
 */
export const STALE_LETTER_DAYS = 7;

/** Automatic recomposes per letter before it waits for a person. */
export const MAX_AUTO_RECOMPOSES = 2;

export type AutopilotAction =
  | { kind: "send" }
  | { kind: "recompose"; why: "stale" | "ruled_out" }
  | { kind: "skip"; why: string };

/** The newest moment the letter's text changed. */
export function letterChangedAt(nav: BenefitsNavigatorMeta): string | null {
  return (
    [nav.composed_at, nav.recomposed_at, nav.edited_at]
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .sort()
      .pop() ?? null
  );
}

/**
 * Decide what the autopilot does with one pending letter. Pure, so the dry
 * run, the cron and the PR's first-run estimate all read the same rule.
 */
export function classifyForAutopilot(
  nav: BenefitsNavigatorMeta,
  meta: Record<string, unknown>,
  now: number,
): AutopilotAction {
  if (nav.status !== "pending" || !nav.body) return { kind: "skip", why: "not pending" };
  if (nav.scheduled_at) return { kind: "skip", why: "a person scheduled it" };
  if (meta.nudges_unsubscribed === true) return { kind: "skip", why: "unsubscribed" };
  if (isBenefitsAutomationHeld(meta)) return { kind: "skip", why: "family replied, waiting on a person" };
  if (!nav.packet || packetNeedsBuild(nav)) return { kind: "skip", why: "waiting on a verdict" };

  const changedAt = letterChangedAt(nav);
  const ageMs = changedAt ? now - new Date(changedAt).getTime() : Infinity;
  const recomposes = nav.auto_recompose_count ?? 0;
  const humanEdited = !!nav.edited_at;

  if (nav.packet.route === "auto") {
    // A previous send of THIS text was blocked for a non-transient reason
    // (suppressed address, data problem). Retrying hourly would hit the same
    // wall; a person has to look.
    if (nav.schedule_failed_at && changedAt && nav.schedule_failed_at > changedAt) {
      return { kind: "skip", why: "an earlier send was blocked" };
    }
    if (ageMs <= STALE_LETTER_DAYS * DAY) return { kind: "send" };
    if (humanEdited) return { kind: "skip", why: "stale, but a person edited it" };
    if (recomposes >= MAX_AUTO_RECOMPOSES) return { kind: "skip", why: "recompose limit reached" };
    return { kind: "recompose", why: "stale" };
  }

  if (nav.packet.route === "recompose") {
    if (humanEdited) return { kind: "skip", why: "ruled out, but a person edited it" };
    if (nav.auto_recompose_failed_at) return { kind: "skip", why: "no other qualifying program" };
    if (recomposes >= MAX_AUTO_RECOMPOSES) return { kind: "skip", why: "recompose limit reached" };
    return { kind: "recompose", why: "ruled_out" };
  }

  return { kind: "skip", why: `routed ${nav.packet.route}, a person decides` };
}

// ── Recompose (shared with the admin button) ───────────────────────────────

export type RecomposeResult =
  | { ok: true; navigator: BenefitsNavigatorMeta }
  | { ok: false; status: 409 | 500; error: string };

/**
 * Re-draft a pending letter from current program data. The ONE recompose
 * path: TJ's "Recompose" button and the autopilot both run it.
 *
 * On a `recompose` verdict the ruled-out program is excluded and, when both
 * fit models named the same better program, that program is preferred.
 * Otherwise it re-drafts against today's facts, usually the same program.
 */
export async function recomposeNavigatorLetter(
  db: SupabaseClient,
  profileId: string,
  opts: { trigger: "admin" | "auto"; reason?: string },
): Promise<RecomposeResult> {
  const { data: profile } = await db
    .from("business_profiles")
    .select("id, email, phone, phone_validity, metadata, account_id, display_name, state, city, care_types")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return { ok: false, status: 409, error: "Family not found" };

  const meta = (profile.metadata as Record<string, unknown>) || {};
  const navigator = readBenefitsNavigator(meta);
  if (navigator.status !== "pending" || !navigator.body) {
    return { ok: false, status: 409, error: "No pending draft for this family" };
  }
  const intakeAt = (meta as { benefits_results?: { completed_at?: string } }).benefits_results
    ?.completed_at;
  if (!intakeAt || !profile.account_id) {
    return { ok: false, status: 409, error: "Family is missing intake data" };
  }
  // A packet routed `recompose` means an independent read found the
  // family's own stated facts rule THIS program out. Re-running the ladder
  // unchanged would pick it straight back: selectFirstStepProgram ranks
  // entry-source first, and the entry page is usually how the family
  // arrived at the wrong program in the first place. So the ruled-out
  // program is excluded and the ladder has to find something else.
  //
  // Only on that verdict. A plain recompose is the fact-check loop,
  // re-drafting the SAME program against corrected data, and excluding there
  // would silently change the family's program because a phone number moved.
  const ruledOut =
    navigator.packet?.route === "recompose" ? navigator.pick?.programId ?? null : null;
  // When both fit models independently named the SAME better program, the
  // recompose has a destination rather than just an exclusion. Prefer it;
  // selectFirstStepProgram falls back to the ladder if it cannot anchor a
  // letter, so an unresolvable suggestion costs nothing.
  const target = navigator.packet?.recomposeTarget ?? null;
  const prefer =
    ruledOut && target?.programId
      ? { programId: target.programId, stateId: navigator.pick?.stateId ?? null }
      : undefined;

  const draft = await composeNavigatorDraft(db, {
    profileId,
    accountId: profile.account_id,
    displayName: profile.display_name || null,
    state: profile.state || null,
    city: profile.city || null,
    careTypes: (profile.care_types as string[] | null) || [],
    intakeAt,
    profileMeta: meta,
    factsRow: profile,
    ...(ruledOut ? { exclude: [ruledOut] } : {}),
    ...(prefer ? { prefer } : {}),
  });
  if (!draft) {
    return {
      ok: false,
      status: 409,
      error: ruledOut
        ? "No other qualifying program for this family with current data. The letter is unchanged. This family probably needs a question rather than a program, so dismiss the draft."
        : "No qualifying first-step program with current data. The old draft is unchanged. Dismiss it if the program no longer exists.",
    };
  }
  const nowIso = new Date().toISOString();
  const navStamp: BenefitsNavigatorMeta = {
    status: "pending",
    composed_at: nowIso,
    recomposed_at: nowIso,
    recomposed_reason:
      opts.reason ?? (opts.trigger === "auto" ? "automatic" : "admin"),
    subject: draft.subject,
    body: draft.body,
    sms: draft.sms,
    model: "claude-opus-5",
    pick: pickSnapshot(draft.pick),
    provider_count: draft.providerCount,
    auto_recompose_count:
      (navigator.auto_recompose_count ?? 0) + (opts.trigger === "auto" ? 1 : 0),
  };
  // Composition took seconds, so re-read metadata: a mid-compose write (a
  // family tapping /m gap chips, a reply hold) must not be lost to a blind
  // spread.
  const { data: freshRow } = await db
    .from("business_profiles")
    .select("metadata")
    .eq("id", profileId)
    .maybeSingle();
  const freshMeta = (freshRow?.metadata as Record<string, unknown> | null) || meta;
  if (opts.trigger === "auto") {
    // A person acted on this letter while it was being redrafted (sent,
    // dismissed, edited, scheduled, or recomposed it). Their action wins.
    const freshNav = readBenefitsNavigator(freshMeta);
    if (
      freshNav.status !== "pending" ||
      freshNav.edited_at !== navigator.edited_at ||
      freshNav.scheduled_at ||
      freshNav.composed_at !== navigator.composed_at
    ) {
      return { ok: false, status: 409, error: "The letter changed while it was being redrafted" };
    }
  }
  const { error: updateErr } = await db
    .from("business_profiles")
    .update({ metadata: { ...freshMeta, benefits_navigator: navStamp } })
    .eq("id", profileId);
  if (updateErr) return { ok: false, status: 500, error: "Couldn't save the new draft" };
  return { ok: true, navigator: navStamp };
}

// ── The run ────────────────────────────────────────────────────────────────

export interface AutopilotCounts {
  pending: number;
  sendable: number;
  sent: number;
  deferred: number;
  retry_later: number;
  blocked: number;
  recompose_due: number;
  recomposed: number;
  recompose_failed: number;
  skipped: Record<string, number>;
}

export interface AutopilotOptions {
  /** When the cron run started, for the time guard. */
  startedAt: number;
  maxSends?: number;
  maxRecomposes?: number;
  /** Stop starting recomposes past this many ms since startedAt. */
  timeGuardMs?: number;
  dryRun?: boolean;
}

export async function runNavigatorAutopilot(
  db: SupabaseClient,
  opts: AutopilotOptions,
): Promise<{ counts: AutopilotCounts; sentLines: string[]; blockedLines: string[]; recomposeLines: string[] }> {
  const maxSends = opts.maxSends ?? 15;
  const maxRecomposes = opts.maxRecomposes ?? 6;
  const timeGuardMs = opts.timeGuardMs ?? 200_000;
  const now = Date.now();

  const { data: rows, error } = await db
    .from("business_profiles")
    .select("id, display_name, email, metadata")
    .eq("type", "family")
    .eq("metadata->benefits_navigator->>status", "pending")
    .limit(500);
  if (error) throw error;

  const counts: AutopilotCounts = {
    pending: rows?.length ?? 0,
    sendable: 0,
    sent: 0,
    deferred: 0,
    retry_later: 0,
    blocked: 0,
    recompose_due: 0,
    recomposed: 0,
    recompose_failed: 0,
    skipped: {},
  };
  const sentLines: string[] = [];
  const blockedLines: string[] = [];
  const recomposeLines: string[] = [];

  const toSend: { id: string; label: string; program: string }[] = [];
  const toRecompose: { id: string; label: string; why: "stale" | "ruled_out" }[] = [];

  for (const row of rows ?? []) {
    const meta = (row.metadata as Record<string, unknown>) || {};
    const nav = readBenefitsNavigator(meta);
    const action = classifyForAutopilot(nav, meta, now);
    // Slack shows the program, never a name or address: this channel is wide.
    const label = `${nav.pick?.shortName ?? "letter"} (${String(row.id).slice(0, 8)})`;
    if (action.kind === "send") {
      counts.sendable++;
      toSend.push({ id: row.id, label, program: nav.pick?.shortName ?? "letter" });
    } else if (action.kind === "recompose") {
      counts.recompose_due++;
      toRecompose.push({ id: row.id, label, why: action.why });
    } else {
      counts.skipped[action.why] = (counts.skipped[action.why] ?? 0) + 1;
    }
  }

  if (opts.dryRun) return { counts, sentLines, blockedLines, recomposeLines };

  // Oldest letters first would starve fresh ones behind a blocked backlog;
  // the list order is arbitrary either way, and the per-run cap drains it.
  for (const item of toSend.slice(0, maxSends)) {
    try {
      const result = await sendNavigatorLetter(db, { profileId: item.id, trigger: "auto" });
      if (result.ok) {
        if (result.deferred) counts.deferred++;
        else {
          counts.sent++;
          sentLines.push(item.program);
        }
      } else if (isTransientSkip(result.error)) {
        // A frequency cap: the family is fine, today is just full. Leave it
        // unmarked and try again next hour. The staleness guard bounds how
        // long this can repeat.
        counts.retry_later++;
      } else {
        counts.blocked++;
        await markScheduleFailed(db, item.id, `Automatic send blocked: ${result.error}`);
        blockedLines.push(`${item.label}: ${result.error}`);
      }
    } catch (err) {
      // Transport failure (provider down, timeout). Unmarked, so the next
      // hourly run retries it.
      counts.retry_later++;
      console.error("[navigator-autopilot] send threw:", item.id, err);
    }
  }

  let recomposesStarted = 0;
  for (const item of toRecompose) {
    if (recomposesStarted >= maxRecomposes) break;
    if (Date.now() - opts.startedAt > timeGuardMs) break;
    recomposesStarted++;
    try {
      const result = await recomposeNavigatorLetter(db, item.id, {
        trigger: "auto",
        reason: item.why === "stale" ? "automatic: letter older than 7 days" : "automatic: verdict ruled the program out",
      });
      if (result.ok) {
        counts.recomposed++;
        recomposeLines.push(`${item.label} → ${result.navigator.pick?.shortName ?? "?"}`);
      } else {
        counts.recompose_failed++;
        // "No qualifying program" will not change by itself. Stamp it so the
        // autopilot stops retrying and the queue shows why it is waiting.
        if (result.error.startsWith("No ")) {
          const { data: fresh } = await db
            .from("business_profiles")
            .select("metadata")
            .eq("id", item.id)
            .maybeSingle();
          const freshMeta = (fresh?.metadata as Record<string, unknown> | null) || {};
          const freshNav = readBenefitsNavigator(freshMeta);
          if (freshNav.status === "pending") {
            await db
              .from("business_profiles")
              .update({
                metadata: {
                  ...freshMeta,
                  benefits_navigator: {
                    ...freshNav,
                    auto_recompose_failed_at: new Date().toISOString(),
                    auto_recompose_failed_reason: result.error.slice(0, 300),
                  },
                },
              })
              .eq("id", item.id);
          }
          blockedLines.push(`${item.label}: could not recompose, no other qualifying program`);
        }
      }
    } catch (err) {
      counts.recompose_failed++;
      console.error("[navigator-autopilot] recompose threw:", item.id, err);
    }
  }

  return { counts, sentLines, blockedLines, recomposeLines };
}
