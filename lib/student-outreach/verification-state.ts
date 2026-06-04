/**
 * Pre-Flight verification state — derived from touchpoints + the
 * `research_data.pre_flight_overridden` flag.
 *
 * Two ways to unlock Launch Outreach:
 *
 *   1. **Verified** — admin selected "Confirmed Contact Information" in
 *      the Pre-Flight call log modal. Logs a `call_connected` touchpoint
 *      with `payload.verified === true`. Verified once → verified forever.
 *
 *   2. **Overridden** — admin selected "Override Pre-Flight" in the call
 *      log modal (or any equivalent override surface). Writes
 *      `research_data.pre_flight_overridden = true` and emits a
 *      `note_added` touchpoint for audit. Used when verification isn't
 *      possible (already-verified elsewhere, trusted source, leadership
 *      exception).
 *
 * Otherwise: **blocked** — call attempts (no-answer / voicemail /
 * wrong-number) keep the row in Pre-Flight regardless of how many times
 * they're logged. The 3-attempts-across-3-days auto-unblock was removed
 * in favor of the explicit Override path: admins try until they reach
 * someone, or they consciously decide to bypass.
 *
 * Pure function — derives entirely from touchpoints + a single research-
 * data flag the drawer already has. No DB round trip, no new touchpoint
 * type (G1), no new action surface beyond the existing log_research_call
 * and a thin override_pre_flight action (G2).
 */

import type { Touchpoint } from "./types";

export type VerificationStatus = "verified" | "overridden" | "blocked";

export interface VerificationState {
  status: VerificationStatus;
  /** Number of call attempts logged. Informational only — no longer gates. */
  attempts: number;
  /** Whether Launch Outreach can fire (verification-side; the caller still
   *  AND-gates with "email on file"). */
  can_launch: boolean;
  /** Human-readable explanation surfaced in the Pre-Flight checklist. */
  label: string;
}

const CALL_ATTEMPT_TYPES = new Set([
  "call_no_answer",
  "call_voicemail",
  "call_connected",
  "call_wrong_number",
]);

export function getVerificationState(
  touchpoints: Touchpoint[],
  preFlightOverridden: boolean,
): VerificationState {
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
      can_launch: true,
      label: "Information confirmed by phone.",
    };
  }

  if (preFlightOverridden) {
    return {
      status: "overridden",
      attempts: attempts.length,
      can_launch: true,
      label: "Pre-Flight overridden.",
    };
  }

  return {
    status: "blocked",
    attempts: attempts.length,
    can_launch: false,
    label:
      attempts.length === 0
        ? "Not yet confirmed."
        : `Not yet confirmed (${attempts.length} attempt${attempts.length === 1 ? "" : "s"} logged).`,
  };
}
