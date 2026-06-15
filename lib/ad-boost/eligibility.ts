import {
  calculateProfileCompleteness,
  type ExtendedMetadata,
  type ReviewsSummary,
  type ResponseRateSummary,
} from "@/lib/profile-completeness";
import type { Profile } from "@/lib/types";

/**
 * Ad Boost eligibility — Managed Lead-Gen (concierge v1).
 *
 * A provider must reach a minimum profile-completeness score before we'll
 * run paid external ads to their Olera page. The gate protects ad ROI: we
 * don't spend driving families to a thin profile that won't convert.
 *
 * This module is the PURE evaluator — no DB, no server deps — so it's safe to
 * import in client components (the apply UI computes eligibility from the
 * dashboard data it already loads). The authoritative server-side re-check
 * (used before persisting a campaign request) lives in `./eligibility.server`.
 *
 * Decisions locked with TJ 2026-06-13: threshold = 70% of the weighted overall
 * score from `lib/profile-completeness.ts`. See
 * `plans/provider-paid-ad-boost-plan.md`.
 */

/** Minimum weighted completeness (0–100) required to request a campaign. */
export const AD_BOOST_THRESHOLD = 70;

export interface AdBoostMissingSection {
  /** Completeness section id (overview, pricing, reviews, response_rate, …). */
  id: string;
  label: string;
  /** Current 0–100 score for this section. */
  percent: number;
  /** Contribution weight — used to surface the highest-impact gaps first. */
  weight: number;
  /** Where the provider should go to improve this section. */
  href: string;
}

export interface AdBoostEligibility {
  /** Completeness over the 7 self-completable sections, 0–100. */
  overall: number;
  /** True when `overall >= threshold`. */
  eligible: boolean;
  /** The threshold this was evaluated against (so the UI can show "70%"). */
  threshold: number;
  /** Sub-100 controllable sections, highest-weight first — the "finish these to
   *  launch" list. Reviews/response-rate are NOT here (they don't gate). */
  missingSections: AdBoostMissingSection[];
  /** Non-gating quality signals shown as "boost your results" carrots. `null` =
   *  none yet. We never require these to launch — that would be circular. */
  boosters: { reviews: number | null; responseRate: number | null };
}

/**
 * Map a completeness section id to where the provider edits it. All gating
 * sections are self-completable profile fields, so they open the section editor
 * via `?edit=` (the boost page opens it inline; the param is the fallback).
 */
function hrefForSection(id: string): string {
  return `/provider?edit=${id}`;
}

/**
 * Evaluate ad-boost eligibility from already-loaded profile data.
 *
 * `reviews` / `responseRate` are optional and should be passed whenever
 * available — omitting them drops those sections from the score (matching
 * `calculateProfileCompleteness`'s backward-compat behavior), which inflates
 * the overall and can let a thin profile through. Always pass them when the
 * caller has the data (the dashboard endpoint returns both).
 */
export function evaluateAdBoostEligibility(
  profile: Profile,
  metadata: ExtendedMetadata,
  reviews?: ReviewsSummary,
  responseRate?: ResponseRateSummary,
): AdBoostEligibility {
  const completeness = calculateProfileCompleteness(
    profile,
    metadata,
    reviews,
    responseRate,
  );

  const missingSections: AdBoostMissingSection[] = completeness.sections
    .filter((s) => s.percent < 100)
    // Rank by REMAINING impact (weight × how-incomplete), not raw weight — so the
    // headline "Next" is the gap that moves the score most, and a high-weight
    // section that's nearly done never outranks a genuinely empty lower-weight one.
    .sort((a, b) => b.weight * (100 - b.percent) - a.weight * (100 - a.percent))
    .map((s) => ({
      id: s.id,
      label: s.label,
      percent: s.percent,
      weight: s.weight,
      href: hrefForSection(s.id),
    }));

  return {
    overall: completeness.overall,
    eligible: completeness.overall >= AD_BOOST_THRESHOLD,
    threshold: AD_BOOST_THRESHOLD,
    missingSections,
    boosters: completeness.boosters,
  };
}
