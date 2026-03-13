"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// SessionStorage keys (must match PostAuthOnboarding)
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
        transition-all duration-300 ease-out overflow-hidden
        ${isVisible && !isExiting
          ? "opacity-100 max-h-24"
          : "opacity-0 max-h-0"
        }
      `}
    >
      <div className="bg-gradient-to-r from-primary-50 via-white to-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 py-2.5 sm:py-3">
            {/* Left: Icon + Message */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Success icon */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* Text */}
              <div className="min-w-0 flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                <span className="text-sm sm:text-[15px] font-semibold text-gray-900 truncate">
                  Your profile is live!
                </span>
                <span className="hidden xs:inline text-gray-300">·</span>
                <span className="text-xs sm:text-sm text-gray-600 truncate">
                  Providers in {city} can now find you
                </span>
              </div>
            </div>

            {/* Right: CTA + Dismiss */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/portal/matches"
                onClick={handleDismiss}
                className="
                  inline-flex items-center gap-1
                  px-3 py-1.5 sm:px-4 sm:py-2
                  rounded-full
                  bg-primary-500 hover:bg-primary-600
                  text-xs sm:text-sm font-medium text-white
                  active:scale-[0.97]
                  transition-all duration-150
                  whitespace-nowrap
                "
              >
                <span className="hidden sm:inline">View your profile</span>
                <span className="sm:hidden">View</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <button
                type="button"
                onClick={handleDismiss}
                className="
                  p-1.5 rounded-full
                  text-gray-400 hover:text-gray-600
                  hover:bg-gray-100
                  active:scale-90
                  transition-all duration-150
                "
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
