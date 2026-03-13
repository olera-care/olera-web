"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

// SessionStorage keys (must match PostAuthOnboarding)
const WELCOME_BANNER_KEY = "olera_welcome_banner";
const WELCOME_CITY_KEY = "olera_welcome_city";

const AUTO_DISMISS_MS = 8000;

interface WelcomeBannerProps {
  providerCount: number;
  locationCity: string;
}

/**
 * Inline banner shown after a new family user completes onboarding
 * and chooses "I'll browse on my own".
 *
 * - Positioned below filter bar, above provider list
 * - Auto-dismisses after 8 seconds with progress indicator
 * - Dark gradient for visual distinction
 * - Mobile-optimized compact layout
 */
export default function WelcomeBanner({ providerCount, locationCity }: WelcomeBannerProps) {
  const { account, activeProfile } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [progressStarted, setProgressStarted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoDismissRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't show if user already has an active Matches profile
    const carePostStatus = (activeProfile?.metadata as Record<string, unknown>)?.care_post as { status?: string } | undefined;
    if (carePostStatus?.status === "active" || carePostStatus?.status === "paused") {
      return;
    }

    const shouldShow = sessionStorage.getItem(WELCOME_BANNER_KEY);
    if (shouldShow === "true") {
      const storedCity = sessionStorage.getItem(WELCOME_CITY_KEY);
      if (storedCity) setCity(storedCity);

      // Clear flags immediately so it only shows once
      sessionStorage.removeItem(WELCOME_BANNER_KEY);
      sessionStorage.removeItem(WELCOME_CITY_KEY);

      // Render first, then animate in
      setShouldRender(true);
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        // Start progress bar animation after banner is visible
        setTimeout(() => setProgressStarted(true), 50);
      }, 50);

      // Auto-dismiss after 8 seconds
      autoDismissRef.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_MS);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
  }, [activeProfile]);

  const handleDismiss = () => {
    if (isExiting) return; // Prevent double-dismiss
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);

    setIsExiting(true);
    timeoutRef.current = setTimeout(() => {
      setShouldRender(false);
    }, 300);
  };

  if (!shouldRender) return null;

  // Extract first name from account display_name (graceful fallback)
  const displayName = account?.display_name || "";
  const firstName = displayName.split(" ")[0] || null;

  // Use stored city from onboarding, or fall back to current browse location
  const displayCity = city || locationCity || null;

  // Build the welcome message with graceful degradation
  const welcomeGreeting = firstName ? `Welcome, ${firstName}!` : "Welcome to Olera!";

  const browsingContext = (() => {
    if (providerCount > 0 && displayCity) {
      return `Browsing ${providerCount} providers in ${displayCity}`;
    } else if (providerCount > 0) {
      return `Browsing ${providerCount} providers`;
    } else if (displayCity) {
      return `Browsing providers in ${displayCity}`;
    }
    return "Browsing providers in your area";
  })();

  return (
    <div
      className={`
        transition-all duration-300 ease-out overflow-hidden mb-5
        ${isVisible && !isExiting
          ? "opacity-100 max-h-24"
          : "opacity-0 max-h-0 mb-0"
        }
      `}
    >
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-lg overflow-hidden">
        {/* Progress bar for auto-dismiss - shrinks from left to right */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-primary-400/70 transition-[width] ease-linear rounded-bl-xl"
          style={{
            width: progressStarted ? '0%' : '100%',
            transitionDuration: progressStarted ? `${AUTO_DISMISS_MS}ms` : '0ms',
          }}
        />

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {/* Left: Message */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Icon */}
            <div className="flex w-9 h-9 rounded-lg bg-primary-500/20 items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3C7.5 3 4 6 4 10c0 3 2 5 4 6v3l4-2 4 2v-3c2-1 4-3 4-6 0-4-3.5-7-8-7z"
                />
              </svg>
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-white truncate">
                {welcomeGreeting}
              </p>
              <p className="text-sm text-gray-300 truncate">
                {browsingContext}
              </p>
            </div>
          </div>

          {/* Right: CTA + Dismiss */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/portal/matches"
              onClick={handleDismiss}
              className="
                inline-flex items-center gap-1.5
                px-4 py-2
                rounded-lg
                bg-primary-500 hover:bg-primary-400
                text-sm font-medium text-white
                active:scale-[0.97]
                transition-all duration-150
                whitespace-nowrap
              "
            >
              Get matched
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              className="
                p-1.5 rounded-lg
                text-gray-400 hover:text-white
                hover:bg-white/10
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
  );
}
