"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// SessionStorage keys (must match PostAuthOnboarding)
const MATCHES_ACTIVATED_KEY = "olera_matches_activated";
const MATCHES_CITY_KEY = "olera_matches_city";

/**
 * Floating toast notification shown after a user opts into Matches
 * during onboarding.
 *
 * - Desktop: Fixed bottom-left corner
 * - Mobile: Full width at bottom (iOS-style)
 * - Smooth entrance/exit animations
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
        fixed z-50
        bottom-0 left-0 right-0
        sm:bottom-6 sm:left-6 sm:right-auto
        transition-all duration-300 ease-out
        ${isVisible && !isExiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 sm:translate-y-2"
        }
      `}
    >
      {/* Mobile: full-width bar | Desktop: floating card */}
      <div
        className="
          bg-white
          sm:rounded-2xl
          border-t sm:border border-gray-200
          shadow-[0_-4px_20px_rgba(0,0,0,0.08)] sm:shadow-xl
          sm:max-w-sm
        "
      >
        <div className="px-4 py-3 sm:p-4">
          <div className="flex items-center gap-3">
            {/* Success icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-500/25">
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

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-gray-900">
                Your profile is live!
              </p>
              <p className="text-sm text-gray-500 truncate">
                Providers in {city} can now find you
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Link
                href="/portal/matches"
                onClick={handleDismiss}
                className="
                  px-3 py-1.5
                  rounded-lg
                  text-sm font-medium
                  text-primary-600 hover:text-primary-700
                  hover:bg-primary-50
                  active:scale-[0.97]
                  transition-all duration-150
                "
              >
                View
              </Link>

              <button
                type="button"
                onClick={handleDismiss}
                className="
                  p-1.5 rounded-lg
                  text-gray-400 hover:text-gray-600
                  hover:bg-gray-100
                  active:scale-90
                  transition-all duration-150
                "
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
