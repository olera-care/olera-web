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
        {/* Accent left border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-l-2xl" />

        {/* Progress bar for auto-dismiss */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-200 origin-left"
          style={{
            transform: `scaleX(${progressStarted ? 0 : 1})`,
            transition: progressStarted ? `transform ${AUTO_DISMISS_MS}ms linear` : 'none',
          }}
        />

        <div className="flex items-center justify-between gap-4 px-5 py-3.5">
          {/* Left: Icon + Message */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Icon with glow effect */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-primary-400/20 rounded-xl blur-md" />
              <div className="relative flex w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3C7.5 3 4 6 4 10c0 3 2 5 4 6v3l4-2 4 2v-3c2-1 4-3 4-6 0-4-3.5-7-8-7z"
                  />
                </svg>
              </div>
            </div>

            {/* Text with better hierarchy */}
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-gray-900 tracking-tight truncate">
                {welcomeGreeting}
              </p>
              <p className="text-[13px] text-gray-500 truncate mt-0.5">
                {browsingContext}
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
              Get matched
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
