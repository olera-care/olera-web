"use client";

import { useState, useRef, useEffect } from "react";

interface PriceEstimateProps {
  priceRange: string;
}

export default function PriceEstimate({ priceRange }: PriceEstimateProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={ref}>
      <p className="text-lg font-semibold text-gray-900">{priceRange}</p>
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
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-30 w-[min(18rem,calc(100vw-2.5rem))]">
          <div className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-xl leading-relaxed">
            <p>Price is an estimate and may vary.</p>
            <p className="text-gray-400 mt-1">Contact the provider for exact rates.</p>
          </div>
        </div>
      )}
    </div>
  );
}
