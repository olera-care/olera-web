/**
 * Provider communications frequency governance.
 *
 * Provider email is sent by ~27 independent senders (crons + inline event sends) with NO global
 * coordination — a single provider could receive 2-9 emails/week, with duplicates, threatening
 * olera.care's sender reputation (already brushed Resend's <4% bounce ceiling once). This caps
 * PROACTIVE NUDGES (digests, reminders, re-engagement) at a small budget per provider per rolling
 * window. TRANSACTIONAL / real-time mail (a family asked a question, a lead came in, verification)
 * is never a governed nudge → always sends and never counts.
 *
 * The cap is enforced inside sendEmail() — the single chokepoint every send flows through — so it
 * cannot be bypassed by any sender. Rollout scope is controlled by NUDGE_EMAIL_TYPES: start with
 * the highest-volume senders and expand deliberately. See plans/provider-comms-gate.md.
 */

/** Max governed-nudge emails per provider per rolling window. Transactional mail is exempt. */
export const NUDGE_WEEKLY_CAP = 3;

/** Rolling window (days) the cap is measured over. */
export const NUDGE_WINDOW_DAYS = 7;

/**
 * email_type values that count as governed nudges. Phase 1 starts with the three highest-volume
 * senders (weekly digest, unread reminders, the lead-followup sequence). Everything else —
 * including all transactional/real-time mail AND any unlisted type — sends freely (safe default:
 * a stray send is a minor annoyance; wrongly suppressing a real notification is not).
 *
 * Full nudge catalog to migrate in later (add one line each, watching volume): provider_nudge,
 * stale_conversation, dormant_reengagement, provider_still_silent, post_connection_followup,
 * matches_nudge, matches_encouragement, provider_incomplete_profile, profile_incomplete_nudge,
 * go_live_reminder, review_request, provider_milestone, provider_anniversary.
 */
export const NUDGE_EMAIL_TYPES = new Set<string>([
  "weekly_analytics_digest",
  "unread_reminder",
  "provider_followup_day1",
  "provider_followup_day3",
  "provider_followup_day6",
  "provider_followup", // Catch-all for any provider followup variants
]);

/** True when this email_type is a governed nudge (subject to the per-provider weekly cap). */
export function isGovernedNudge(emailType: string | undefined | null): boolean {
  return !!emailType && NUDGE_EMAIL_TYPES.has(emailType);
}
