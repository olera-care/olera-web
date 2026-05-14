"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface MobileClaimTooltipProps {
  content: string;
}

export default function MobileClaimTooltip({ content }: MobileClaimTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showTooltip) return;

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
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowTooltip((prev) => !prev)}
        className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-500 transition-colors"
        aria-label="More info"
        aria-expanded={showTooltip}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {showTooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed left-4 right-4 z-[100]"
            style={{ top: tooltipPosition.top }}
          >
            <div className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-xl leading-relaxed">
              <p>{content}</p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
