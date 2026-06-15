/**
 * MedJobs eligibility — the provider funnel access gate (Phase A).
 *
 * Replaces the old pilot/paid + verified blurring model. A provider becomes
 * "eligible" by completing the eligibility screener, which sets
 * `medjobs_eligibility_completed_at` on business_profiles.metadata.
 *
 * Eligibility gates the meaningful actions — inviting a student, and the
 * post-eligibility banner state — NOT viewing or contact, which are open to
 * any authenticated provider (we no longer hide contact; the de-platforming
 * moat is the student's on-platform credential + the platform Terms).
 *
 * Legacy grandfather: existing pilot/subscription holders are treated as
 * eligible so the transition doesn't lock anyone out. The billing flags
 * themselves (written by Stripe) are untouched.
 *
 * See docs/medjobs/PROVIDER_FUNNEL_BUILD_PLAN.md.
 */

import { medjobsAccessActive } from "@/lib/medjobs/pilot-tier";

export const ELIGIBILITY_COMPLETED_KEY = "medjobs_eligibility_completed_at";
export const DEMAND_PROFILE_KEY = "medjobs_demand_profile";
export const PLATFORM_TERMS_KEY = "platform_terms_accepted_at";

/**
 * The host (caregiving internship) agreement a provider reads before/while
 * getting set up. Placeholder sample PDF for now — swap in the real file at
 * this path when legal sign-off lands. Opened in a new tab; no acceptance is
 * recorded (soft read, not a gate).
 */
export const HOST_AGREEMENT_URL = "/docs/host-agreement-sample.pdf";

/** What the eligibility screener captures, stored at DEMAND_PROFILE_KEY. */
export interface DemandProfile {
  /** Q1 — how steady their client staffing needs are. */
  demand_shape: "regular" | "varies" | "unpredictable";
  /** Q2 — openness to PRN / on-call students. */
  prn_open: "yes" | "maybe" | "no";
  /** Q3 — hardest shifts to cover. */
  coverage_buckets: Array<"day" | "evening" | "overnight" | "weekend">;
}

/**
 * True when the provider has completed the eligibility screener (or is a
 * grandfathered pilot/subscription holder). Gates inviting + the banner state.
 */
export function isMedjobsEligible(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  if (!metadata) return false;
  if (typeof metadata[ELIGIBILITY_COMPLETED_KEY] === "string") return true;
  // Legacy grandfather: existing access holders remain eligible.
  return medjobsAccessActive(metadata);
}
