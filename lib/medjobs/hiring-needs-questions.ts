/**
 * Shared "hiring needs" question definitions — the single source of truth for
 * both the upfront capture modal ("Initial hiring needs", in the funnel) and the
 * dashboard "Hire more caregivers" block editor. Keeping them here prevents the
 * two surfaces from drifting apart.
 *
 * The demand-profile answers persist to business_profiles.metadata under
 * DEMAND_PROFILE_KEY (see lib/medjobs/eligibility.ts); the requirement booleans
 * persist under REQUIREMENTS_KEY below.
 */

import type { DemandProfile } from "@/lib/medjobs/eligibility";

export const DEMAND_SHAPE_OPTIONS: { value: DemandProfile["demand_shape"]; label: string }[] = [
  { value: "regular", label: "Regular and recurring" },
  { value: "varies", label: "Varies week to week" },
  { value: "unpredictable", label: "Unpredictable" },
];

export const PRN_OPTIONS: { value: DemandProfile["prn_open"]; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "Not now" },
];

export const COVERAGE_OPTIONS: { value: DemandProfile["coverage_buckets"][number]; label: string }[] = [
  { value: "day", label: "Days" },
  { value: "evening", label: "Evenings" },
  { value: "overnight", label: "Overnights" },
  { value: "weekend", label: "Weekends" },
];

/** Optional hiring requirements a provider can flag, surfaced to students. */
export const REQUIREMENTS_KEY = "medjobs_requirements";

export interface MedjobsRequirements {
  background_check?: boolean;
  drug_test?: boolean;
  transportation?: boolean;
}

export const REQUIREMENT_OPTIONS: { key: keyof MedjobsRequirements; label: string }[] = [
  { key: "background_check", label: "Require background check" },
  { key: "drug_test", label: "Require drug test" },
  { key: "transportation", label: "Require reliable transportation (car insurance + driver's license)" },
];

export function readRequirements(
  metadata: Record<string, unknown> | null | undefined,
): MedjobsRequirements {
  const raw = metadata?.[REQUIREMENTS_KEY];
  return raw && typeof raw === "object" ? (raw as MedjobsRequirements) : {};
}
