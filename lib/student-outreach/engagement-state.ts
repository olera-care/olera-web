/**
 * Engagement sub-state — the post-launch sub-states derived from Smartlead
 * open/click events that have landed on the latest `email_sent` touchpoint
 * (per Phase 1 Bullet 3 webhook expansion).
 *
 * Single source of truth used by:
 *   - NextStepCard (Bullet 6) — branches the body text + primary action
 *   - Calls tab (Bullet 7) — bumps clicked-not-activated rows to top
 *   - Emails tab (Bullet 8) — activity-log filter
 *
 * The four states:
 *   - "no_engagement"          → email landed but no open or click yet
 *   - "opened_not_clicked"     → at least one open, no clicks
 *   - "clicked_not_activated"  → at least one click, hasn't accepted pilot
 *                                terms yet (highest admin attention)
 *   - null                     → not applicable (already Pilot Active, or
 *                                row is in a terminal/non-cadence state)
 *
 * Phase 1 Pass C1 (2026-06-04).
 */

import type { Touchpoint } from "./types";

export type EngagementSubState =
  | "no_engagement"
  | "opened_not_clicked"
  | "clicked_not_activated";

interface OutreachLike {
  status: string;
  touchpoints: Touchpoint[];
}

const ENGAGEMENT_APPLICABLE_STATUSES = new Set([
  "outreach_sent",
  "engaged",
]);

export function getEngagementSubState(
  outreach: OutreachLike,
): EngagementSubState | null {
  // Active partner = already Pilot Active → engagement sub-state no
  // longer applies (we're past conversion).
  if (outreach.status === "active_partner") return null;
  // Sub-state only applies to in-cadence and recently-engaged rows.
  if (!ENGAGEMENT_APPLICABLE_STATUSES.has(outreach.status)) return null;

  const latestEmailSent = outreach.touchpoints
    .filter((t) => t.touchpoint_type === "email_sent")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  if (!latestEmailSent) return "no_engagement";

  const payload = (latestEmailSent.payload as Record<string, unknown> | null) ?? {};
  const clickCount = Number(payload.click_count ?? 0);
  const openCount = Number(payload.open_count ?? 0);

  if (clickCount > 0) return "clicked_not_activated";
  if (openCount > 0) return "opened_not_clicked";
  return "no_engagement";
}

/** Helper for Calls tab priority sort + Next Step "clicked" branch:
 *  returns true when the row should bump up in admin attention because
 *  the provider clicked an email CTA but hasn't activated the pilot. */
export function hasClickedNotActivation(outreach: OutreachLike): boolean {
  return getEngagementSubState(outreach) === "clicked_not_activated";
}

/** Helper for the "They opened — give them time" state. */
export function hasOpenedNotClicked(outreach: OutreachLike): boolean {
  return getEngagementSubState(outreach) === "opened_not_clicked";
}

/** Helper for the latest engagement timestamps (opens/clicks counts +
 *  last-opened-at, last-clicked-at, clicked-CTAs) on the most recent
 *  email_sent touchpoint. Returns null when no email_sent exists. */
export function getLatestEngagementStats(
  outreach: OutreachLike,
): {
  openCount: number;
  clickCount: number;
  lastOpenedAt: string | null;
  lastClickedAt: string | null;
  clickedCtas: string[];
  emailSentAt: string;
} | null {
  const latestEmailSent = outreach.touchpoints
    .filter((t) => t.touchpoint_type === "email_sent")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!latestEmailSent) return null;
  const payload = (latestEmailSent.payload as Record<string, unknown> | null) ?? {};
  return {
    openCount: Number(payload.open_count ?? 0),
    clickCount: Number(payload.click_count ?? 0),
    lastOpenedAt: (payload.last_opened_at as string | undefined) ?? null,
    lastClickedAt: (payload.last_clicked_at as string | undefined) ?? null,
    clickedCtas: (payload.clicked_ctas as string[] | undefined) ?? [],
    emailSentAt: latestEmailSent.created_at,
  };
}
