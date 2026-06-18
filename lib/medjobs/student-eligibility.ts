/**
 * MedJobs STUDENT eligibility — the student funnel's front-door gate.
 *
 * Mirrors the provider eligibility model (lib/medjobs/eligibility.ts) but for
 * students. A student becomes "eligible" by completing the 2-question
 * eligibility screener, which sets `medjobs_eligibility_completed_at` on their
 * business_profiles.metadata (type="student"). Eligibility + a captured email
 * are all we need to silently create the account and land them on the families
 * board; the full profile ("complete your application") happens afterward on
 * /portal/medjobs.
 *
 * See plans/medjobs-eligibility-screener.md.
 */

import type { IntendedProfessionalSchool } from "@/lib/types";

export const STUDENT_ELIGIBILITY_COMPLETED_KEY = "medjobs_eligibility_completed_at";
export const AVAILABILITY_PROFILE_KEY = "availability_profile";
export const PLATFORM_TERMS_KEY = "platform_terms_accepted_at";

/**
 * The student caregiver agreement — read (soft, not a gate) before/while
 * completing the application. Placeholder sample PDF for now; swap in the real
 * file at this path when legal sign-off lands. Mirror of HOST_AGREEMENT_URL.
 */
export const STUDENT_AGREEMENT_URL = "/docs/student-caregiver-agreement-sample.pdf";

/**
 * Coverage buckets — SHARED vocabulary with the provider demand_profile
 * (lib/medjobs/eligibility.ts) so the match line ("covers your evenings")
 * works on both the families board and the candidate board.
 */
export type CoverageBucket = "day" | "evening" | "overnight" | "weekend";

/** What the student eligibility screener captures, stored at AVAILABILITY_PROFILE_KEY. */
export interface AvailabilityProfile {
  /** Q2 — when the student is usually free. */
  coverage_buckets: CoverageBucket[];
}

/** Q1 aspiration — reuses the IntendedProfessionalSchool vocabulary. */
export type AspirationTrack = IntendedProfessionalSchool;

/**
 * True when the student has completed the eligibility screener (the gate for
 * the "you're in" note state and requesting interviews).
 */
export function isStudentEligible(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  if (!metadata) return false;
  return typeof metadata[STUDENT_ELIGIBILITY_COMPLETED_KEY] === "string";
}
