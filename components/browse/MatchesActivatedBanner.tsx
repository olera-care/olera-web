"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// SessionStorage keys (must match PostAuthOnboarding)
const MATCHES_ACTIVATED_KEY = "olera_matches_activated";
const MATCHES_CITY_KEY = "olera_matches_city";

/**
 * Premium confirmation banner shown on the browse page after a user
 * opts into Matches during onboarding.
 *
 * Features:
 * - Success-themed glassmorphism design
 * - Smooth entrance/exit animations
 * - Mobile-first responsive layout
 * - Celebratory icon with subtle animation
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
    setIsExiting(true);
    timeoutRef.current = setTimeout(() => {
      setShouldRender(false);
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl mb-6
        bg-white/80 backdrop-blur-xl
        border border-primary-200/40
        shadow-[0_8px_32px_rgba(25,144,135,0.1),0_2px_8px_rgba(0,0,0,0.04)]
        transition-all duration-300 ease-out
        ${isVisible && !isExiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2"
        }
      `}
    >
      {/* Success gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-50/60 via-primary-50/30 to-transparent pointer-events-none" />

      <div className="relative px-5 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Left section: Icon + Message */}
          <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
            {/* Success icon with pulse animation */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
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
              {/* Subtle pulse ring */}
              <div className="absolute inset-0 rounded-xl bg-primary-400/30 animate-ping" style={{ animationDuration: "2s" }} />
            </div>

            {/* Message */}
            <div className="min-w-0">
              <p className="text-[15px] sm:text-base font-medium text-gray-900">
                Your profile is live!
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Providers in {city} can now find you and reach out directly.
              </p>
            </div>
          </div>

          {/* Right section: CTA + Dismiss */}
          <div className="flex items-center gap-2 sm:gap-3 pl-15 sm:pl-0">
            <Link
              href="/portal/matches"
              onClick={handleDismiss}
              className="
                inline-flex items-center gap-1.5
                px-4 py-2 rounded-full
                bg-white hover:bg-gray-50
                border border-gray-200 hover:border-gray-300
                text-sm font-medium text-gray-700
                shadow-sm hover:shadow
                active:scale-[0.98]
                transition-all duration-200
              "
            >
              <span className="hidden sm:inline">View your Matches profile</span>
              <span className="sm:hidden">View profile</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              className="
                p-2 rounded-full
                text-gray-400 hover:text-gray-600
                hover:bg-white/80
                active:scale-95
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
  );
}
