"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface MobilePricingTooltipProps {
  topText: string;
  bottomText: string;
  tooltipContent: string;
  /** When true, renders topText as large bold price */
  isPrice?: boolean;
  /** Alignment of content */
  align?: "left" | "center" | "right";
}

export default function MobilePricingTooltip({
  topText,
  bottomText,
  tooltipContent,
  isPrice = false,
  align = "center",
}: MobilePricingTooltipProps) {
  const alignClass = {
    left: "items-start",
    center: "items-center",
    right: "items-end",
  }[align];
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showTooltip) return;

    // Calculate position when tooltip opens
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPosition({ top: rect.bottom + 8 });
    }

    const handleOutside = (e: TouchEvent | MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
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
    <div className={`flex flex-col ${alignClass}`}>
      {/* Top line: Price or Medicare/Medicaid (large, bold) */}
      <span
        className={
          isPrice
            ? "text-xl font-bold text-gray-900"
            : "text-base font-semibold text-gray-900"
        }
      >
        {topText}
      </span>

      {/* Bottom line: Subtitle with tooltip (matches star row size) */}
      <div className="flex items-center gap-0.5">
        <span className="text-xs text-gray-500 font-medium">{bottomText}</span>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setShowTooltip((prev) => !prev)}
          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-500 active:text-gray-600 transition-colors"
          aria-label="Pricing info"
          aria-expanded={showTooltip}
        >
          <svg
            className="w-3.5 h-3.5"
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

      {/* Tooltip - fixed position portal to prevent layout shift */}
      {showTooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed left-4 right-4 z-[100]"
            style={{ top: tooltipPosition.top }}
          >
            <div className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-xl leading-relaxed">
              <p>{tooltipContent}</p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
