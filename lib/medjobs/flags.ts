/**
 * MedJobs MVP feature flags (env-driven).
 *
 * The interview-scheduling MVP standardizes on the Gen 1 interview flow and
 * hides the unfinished post-job + inbox ("marketplace v2") surfaces. These
 * flags let us ship that consolidation reversibly — flip an env var to bring
 * the hidden surfaces back without a code change.
 *
 *   MEDJOBS_MARKETPLACE_V2_HIDDEN — hide post-a-job + inbox; present a single
 *     interview-scheduling front door. Default ON (hidden) for the MVP.
 *   MEDJOBS_INTERVIEW_OPEN_LOOP   — bypass the paid-tier paywall and the
 *     pending-verification hold so the interview loop runs end-to-end. The new
 *     gate is Terms acceptance, not payment. Default ON for the MVP.
 *
 * Flags read NEXT_PUBLIC_* env so the same value resolves on client and server.
 * A flag is only OFF when explicitly set to "false" or "0"; otherwise the MVP
 * default applies.
 */

function envBool(value: string | undefined, defaultOn: boolean): boolean {
  if (value == null || value === "") return defaultOn;
  return value !== "false" && value !== "0";
}

/** Hide the post-a-job + inbox (marketplace v2) surfaces. */
export const MEDJOBS_MARKETPLACE_V2_HIDDEN = envBool(
  process.env.NEXT_PUBLIC_MEDJOBS_MARKETPLACE_V2_HIDDEN,
  true,
);

/** Open the interview loop: no paywall, no pending-verification hold. */
export const MEDJOBS_INTERVIEW_OPEN_LOOP = envBool(
  process.env.NEXT_PUBLIC_MEDJOBS_INTERVIEW_OPEN_LOOP,
  true,
);
