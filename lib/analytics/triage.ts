/**
 * Provider traffic-tier classification.
 *
 * Drives differentiated UX on the onboard teaser card (pipeline-opportunity
 * framing for `low`, deeper analytics for `medium`+) and the dashboard.
 *
 * PLACEHOLDER THRESHOLDS — these are deliberate guesses for Phase 1 build
 * against sparse data. Phase 1E task 15 revisits them from the real
 * distribution once ~2 weeks of data have accrued post-Phase-0 launch.
 *
 * Method for tuning: compute the 33rd and 67th percentiles of 30-day raw
 * view counts across claimed providers with non-zero traffic. Use those as
 * `low_max` and `medium_max`. Adjust by eye so the buckets feel right.
 */
export type TrafficTier = "low" | "medium" | "high";

export interface TierThresholds {
  low_max: number;
  medium_max: number;
}

export const TIER_THRESHOLDS: TierThresholds = {
  low_max: 5,
  medium_max: 25,
};

export function classifyTier(
  viewsInWindow: number,
  thresholds: TierThresholds = TIER_THRESHOLDS,
): TrafficTier {
  if (viewsInWindow <= thresholds.low_max) return "low";
  if (viewsInWindow <= thresholds.medium_max) return "medium";
  return "high";
}
