"use client";

import { useState, useRef, useEffect } from "react";
import { getPricingConfig } from "@/lib/pricing-config";

interface PricingEducationBadgeProps {
  /** Provider category (e.g., "Nursing Home", "Hospice") */
  category: string;
  /** Compact mode for cards (single line). Default false shows full note. */
  compact?: boolean;
}

/**
 * Education-first pricing badge for Tier 3 categories (Nursing Home, Hospice).
 * Replaces dollar price labels with coverage information.
 *
 * - Nursing Home: "Medicare / Medicaid may cover"
 * - Hospice: "Usually covered by Medicare"
 *
 * Includes an info button that expands to show the full coverage note.
 */
export default function PricingEducationBadge({
  category,
  compact = false,
}: PricingEducationBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = getPricingConfig(category);

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

  // Only render for Tier 3 categories
  if (config.tier !== 3) return null;

  const badgeText =
    category === "Hospice"
      ? "Usually covered by Medicare"
      : "Medicare / Medicaid may cover";

  if (compact) {
    return (
      <span className="text-xs text-teal-700 font-medium">{badgeText}</span>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-1" ref={ref}>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 rounded-lg">
        {/* Shield icon */}
        <svg
          className="w-3.5 h-3.5 text-teal-600 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <span className="text-xs text-teal-700 font-medium leading-tight">
          {badgeText}
        </span>
      </div>

      {/* Info button */}
      {config.coverageNote && (
        <button
          type="button"
          onClick={() => setShowTooltip((prev) => !prev)}
          className="w-8 h-8 -m-1.5 flex items-center justify-center text-gray-300 hover:text-gray-400 active:text-gray-500 transition-colors"
          aria-label="Coverage details"
          aria-expanded={showTooltip}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}

      {/* Coverage tooltip */}
      {showTooltip && config.coverageNote && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-30 w-[min(20rem,calc(100vw-2.5rem))]">
          <div className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-xl leading-relaxed">
            <p>{config.coverageNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
