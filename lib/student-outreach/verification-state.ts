/**
 * Pre-Flight verification state — derived from touchpoints.
 *
 * The Launch Outreach gate enforces a soft verification rule:
 *
 *   1. **Verified** — admin reached someone AND confirmed contacts on the
 *      call. Any `call_connected` touchpoint with `payload.verified === true`
 *      flips the row to verified immediately. Launch enabled.
 *
 *   2. **Attempts complete** — admin tried 3 times across 3 distinct
 *      calendar days. Launch enabled with an "Unverified — 3 attempts
 *      logged" badge so the timeline preserves the discipline.
 *
 *   3. **Exempt (no phone)** — when the prospect has no phone on file
 *      (general_contact.phone null AND no Specific Contact has a phone),
 *      the gate doesn't apply. Launch enabled day one with "No phone on
 *      file" badge.
 *
 *   4. **Blocked** — none of the above. Launch button disabled with a
 *      hint indicating the current attempt count (1 of 3 on N days).
 *
 * Pure function — derives entirely from touchpoints + contact data the
 * drawer already has. No DB round trip, no new touchpoint type (G1), no
 * new action surface (G2). The CallForEmailModal logs through the existing
 * `log_research_call` action; this predicate just reads the payloads.
 */

import type { Touchpoint } from "./types";

export type VerificationStatus =
  | "verified"
  | "attempts_complete"
  | "exempt_no_phone"
  | "blocked";

export interface VerificationState {
  status: VerificationStatus;
  /** Number of call attempts logged (any phone-call touchpoint type). */
  attempts: number;
  /** Number of distinct calendar days those attempts span. */
  days_used: number;
  /** Whether the row can launch outreach. True unless `blocked`. */
  can_launch: boolean;
  /** Human-readable explanation surfaced in the Pre-Flight checklist line. */
  label: string;
}

const CALL_ATTEMPT_TYPES = new Set([
  "call_no_answer",
  "call_voicemail",
  "call_connected",
  "call_wrong_number",
]);

/** UTC date key (YYYY-MM-DD) for grouping attempts by calendar day. */
function dayKey(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}

export function getVerificationState(
  touchpoints: Touchpoint[],
  hasPhone: boolean,
): VerificationState {
  if (!hasPhone) {
    return {
      status: "exempt_no_phone",
      attempts: 0,
      days_used: 0,
      can_launch: true,
      label: "No phone on file.",
    };
  }

  const attempts = touchpoints.filter((t) =>
    CALL_ATTEMPT_TYPES.has(t.touchpoint_type),
  );

  // Verified: any connected call where admin confirmed contacts.
  const verified = attempts.some(
    (t) =>
      t.touchpoint_type === "call_connected" &&
      (t.payload as Record<string, unknown> | null)?.verified === true,
  );
  if (verified) {
    return {
      status: "verified",
      attempts: attempts.length,
      days_used: new Set(attempts.map((t) => dayKey(t.created_at))).size,
      can_launch: true,
      label: "Information confirmed by phone.",
    };
  }

  const distinctDays = new Set(attempts.map((t) => dayKey(t.created_at)));
  const daysUsed = distinctDays.size;
  if (attempts.length >= 3 && daysUsed >= 3) {
    return {
      status: "attempts_complete",
      attempts: attempts.length,
      days_used: daysUsed,
      can_launch: true,
      label: `Unverified — ${attempts.length} attempts across ${daysUsed} days.`,
    };
  }

  // Blocked. Surface progress so the admin sees the gate.
  return {
    status: "blocked",
    attempts: attempts.length,
    days_used: daysUsed,
    can_launch: false,
    label: `Attempt ${attempts.length} of 3 on ${daysUsed} of 3 days.`,
  };
}
