"use client";

import { useState, useRef, useEffect } from "react";
import { getPricingConfig, type PricingTier } from "@/lib/pricing-config";

interface PriceEstimateProps {
  priceRange: string;
  /** Provider category — enables category-specific disclaimers */
  category?: string;
  /** Override: treat price as provider-entered (skips "est." for Tier 3) */
  isProviderEntered?: boolean;
  /** Provider name — when supplied, the disclaimer + coverage tooltip are parameterized with it for SEO uniqueness. */
  providerName?: string;
  /** Provider city — combined with state to produce " in {city}, {state}" suffix. */
  city?: string;
  /** Provider state — see `city`. */
  state?: string;
}

export default function PriceEstimate({
  priceRange,
  category,
  isProviderEntered,
  providerName,
  city,
  state,
}: PriceEstimateProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const config = category ? getPricingConfig(category) : null;
  const tier: PricingTier = config?.tier ?? 1;
  const copyCtx = { providerName, city, state };

  useEffect(() => {
    if (!showTooltip) return;
    const handleOutside = (e: TouchEvent | MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [showTooltip]);

  // Tier 3 (Nursing Home / Hospice): lead with coverage, price secondary
  if (tier === 3 && !isProviderEntered) {
    return (
      <div className="relative inline-flex items-center gap-1.5" ref={ref}>
        <p className="text-sm text-gray-500 font-medium leading-snug">
          {config!.disclaimer(copyCtx).split(".")[0]}.
        </p>

        <button
          type="button"
          onClick={() => setShowTooltip((prev) => !prev)}
          className="w-11 h-11 -m-3 flex items-center justify-center text-gray-300 hover:text-gray-400 active:text-gray-500 transition-colors shrink-0"
          aria-label="Coverage info"
          aria-expanded={showTooltip}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {showTooltip && config!.coverageNote && (
          <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-30 w-[min(20rem,calc(100vw-2.5rem))]">
            <div className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-xl leading-relaxed">
              <p>{config!.coverageNote(copyCtx)}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tier 1 & 2 (and Tier 3 with provider-entered prices): show price + disclaimer
  const disclaimer = config?.disclaimer(copyCtx) ?? "Price is an estimate and may vary.";
  const coverageNote = config?.coverageNote ? config.coverageNote(copyCtx) : null;

  // Extract the low end from range strings like "$2,255-$5,500/mo" or "$2 255 - $7 667/mo"
  // and normalize the number to use comma separators
  const rangeMatch = priceRange.match(/^(\$[\d,\s]+)\s*[-–]\s*\$[\d,\s]+(\/\w+.*)$/);
  let displayPrice = priceRange;
  if (rangeMatch) {
    const rawNum = rangeMatch[1].replace(/[$,\s]/g, "");
    const formatted = Number(rawNum).toLocaleString("en-US");
    displayPrice = `From $${formatted}${rangeMatch[2]}`;
  }

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={ref}>
      <p className="text-lg font-semibold text-gray-900">{displayPrice}</p>
      <span className="text-xs text-gray-400 font-normal self-center">est.</span>

      {/* Info button with proper 44px touch target (visually small icon) */}
      <button
        type="button"
        onClick={() => setShowTooltip((prev) => !prev)}
        className="w-11 h-11 -m-3 flex items-center justify-center text-gray-300 hover:text-gray-400 active:text-gray-500 transition-colors"
        aria-label="Price estimate info"
        aria-expanded={showTooltip}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Tooltip - positioned for both mobile and desktop */}
      {showTooltip && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-30 w-[min(20rem,calc(100vw-2.5rem))]">
          <div className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-xl leading-relaxed">
            <p>{disclaimer}</p>
            {coverageNote && (
              <p className="text-gray-300 mt-1.5">{coverageNote}</p>
            )}
            {!coverageNote && (
              <p className="text-gray-400 mt-1">Contact the provider for exact rates.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
