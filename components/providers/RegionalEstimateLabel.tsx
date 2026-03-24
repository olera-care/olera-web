"use client";

interface RegionalEstimateLabelProps {
  /** Formatted price string (e.g., "$28–$38/hr") */
  priceRange: string;
  /** Whether this is a provider-entered price or a regional fallback */
  isRegionalEstimate: boolean;
  /** Optional: state name for attribution (e.g., "Texas") */
  stateName?: string;
}

/**
 * Displays a price with visual distinction between provider-entered
 * and regional estimate (state average fallback) prices.
 *
 * - Provider-entered: bold, standard styling (same as today)
 * - Regional estimate: lighter weight, "State avg." prefix
 */
export default function RegionalEstimateLabel({
  priceRange,
  isRegionalEstimate,
  stateName,
}: RegionalEstimateLabelProps) {
  if (!isRegionalEstimate) {
    // Provider-entered price — display as today
    return (
      <p className="text-sm font-bold text-gray-900">{priceRange}</p>
    );
  }

  // Regional estimate — visually lighter with attribution
  const label = stateName ? `${stateName} avg.` : "State avg.";

  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
        {label}
      </span>
      <p className="text-sm font-medium text-gray-500">{priceRange}</p>
    </div>
  );
}
