"use client";

interface RegionalEstimateLabelProps {
  /** Formatted price string (e.g., "$28–$38/hr") */
  priceRange: string;
  /** Whether this is a provider-entered price or a regional fallback */
  isRegionalEstimate: boolean;
  /** Whether the estimate uses metro-level adjustment (vs flat state average) */
  isMetroAdjusted?: boolean;
}

/**
 * Displays a price with visual distinction between provider-entered
 * and regional estimate prices.
 *
 * - Provider-entered: bold, standard styling (same as today)
 * - Metro-adjusted estimate: "Area avg." prefix, lighter styling
 * - State-level estimate: "State avg." prefix, lighter styling
 */
export default function RegionalEstimateLabel({
  priceRange,
  isRegionalEstimate,
  isMetroAdjusted,
}: RegionalEstimateLabelProps) {
  if (!isRegionalEstimate) {
    // Provider-entered price — display as today
    return (
      <p className="text-sm font-bold text-gray-900">{priceRange}</p>
    );
  }

  // Regional estimate — visually lighter with attribution
  const label = isMetroAdjusted ? "Area avg." : "State avg.";

  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
        {label}
      </span>
      <p className="text-sm font-medium text-gray-500">{priceRange}</p>
    </div>
  );
}
