"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// SessionStorage keys for Matches activation
const MATCHES_ACTIVATED_KEY = "olera_matches_activated";
const MATCHES_CITY_KEY = "olera_matches_city";

/**
 * Inline banner shown after a user opts into Matches during onboarding.
 *
 * - Positioned below filter bar, above provider list
 * - Light primary gradient background
 * - Smooth entrance/exit animations
 * - Auto-dismissible
 */
export default function MatchesActivatedBanner() {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [city, setCity] = useState("your area");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const activated = sessionStorage.getItem(MATCHES_ACTIVATED_KEY);
    if (activated === "true") {
      const storedCity = sessionStorage.getItem(MATCHES_CITY_KEY);
      if (storedCity) setCity(storedCity);

      // Clear flags immediately
      sessionStorage.removeItem(MATCHES_ACTIVATED_KEY);
      sessionStorage.removeItem(MATCHES_CITY_KEY);

      // Render first, then animate in
      setShouldRender(true);
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 50);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    timeoutRef.current = setTimeout(() => {
      setShouldRender(false);
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`
        transition-all duration-500 ease-out mb-5
        ${isVisible && !isExiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2"
        }
        ${!shouldRender ? "hidden" : ""}
      `}
    >
      {/* Premium card with accent border and glassmorphism */}
      <div className="
        relative overflow-hidden
        bg-white/80 backdrop-blur-sm
        border border-gray-200/80
        rounded-2xl
        shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)]
        hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)]
        transition-shadow duration-300
      ">
        {/* Primary color accent left border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-l-2xl" />

        <div className="flex items-center justify-between gap-4 px-5 py-3.5">
          {/* Left: Icon + Message */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Success icon with glow effect */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-primary-400/20 rounded-xl blur-md" />
              <div className="relative flex w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Text with better hierarchy */}
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-gray-900 tracking-tight truncate">
                Your profile is live!
              </p>
              <p className="text-[13px] text-gray-500 truncate mt-0.5">
                Providers in {city} can now find you
              </p>
            </div>
          </div>

          {/* Right: CTA + Dismiss text */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Not now
            </button>

            <Link
              href="/portal/matches"
              onClick={handleDismiss}
              className="
                inline-flex items-center gap-1.5
                px-4 py-2
                rounded-xl
                bg-gradient-to-r from-primary-600 to-primary-700
                hover:from-primary-700 hover:to-primary-800
                text-sm font-semibold text-white
                shadow-sm shadow-primary-600/25
                hover:shadow-md hover:shadow-primary-600/30
                active:scale-[0.98]
                transition-all duration-200
                whitespace-nowrap
              "
            >
              View profile
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
