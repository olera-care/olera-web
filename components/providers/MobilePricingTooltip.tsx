"use client";

import { useState, useRef, useEffect } from "react";

interface MobilePricingTooltipProps {
  topText: string;
  bottomText: string;
  tooltipContent: string;
  /** When true, renders topText as large bold price */
  isPrice?: boolean;
}

export default function MobilePricingTooltip({
  topText,
  bottomText,
  tooltipContent,
  isPrice = false,
}: MobilePricingTooltipProps) {
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
    <div className="relative flex flex-col items-center" ref={ref}>
      <div className="flex items-center gap-1">
        <span
          className={
            isPrice
              ? "text-xl font-bold text-gray-900"
              : "text-sm font-medium text-gray-700"
          }
        >
          {topText}
        </span>
        <button
          type="button"
          onClick={() => setShowTooltip((prev) => !prev)}
          className="w-8 h-8 -m-1 flex items-center justify-center text-gray-300 hover:text-gray-400 active:text-gray-500 transition-colors"
          aria-label="Pricing info"
          aria-expanded={showTooltip}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>
      <span className="text-xs text-gray-400">{bottomText}</span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 z-30 w-[min(18rem,calc(100vw-3rem))] right-1/2 translate-x-1/2">
          <div className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-xl leading-relaxed">
            <p>{tooltipContent}</p>
          </div>
        </div>
      )}
    </div>
  );
}
