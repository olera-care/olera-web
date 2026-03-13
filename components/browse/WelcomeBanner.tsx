"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

// SessionStorage keys (must match PostAuthOnboarding)
const WELCOME_BANNER_KEY = "olera_welcome_banner";
const WELCOME_CITY_KEY = "olera_welcome_city";

interface WelcomeBannerProps {
  providerCount: number;
  locationCity: string;
}

/**
 * Premium floating welcome banner shown on the browse page after a new
 * family user completes onboarding and chooses "I'll browse on my own".
 *
 * Features:
 * - Floating bar with backdrop blur (glassmorphism)
 * - Smooth entrance/exit animations
 * - Mobile-first responsive layout
 * - Branded icon as visual anchor
 * - Graceful degradation for missing data
 */
export default function WelcomeBanner({ providerCount, locationCity }: WelcomeBannerProps) {
  const { account, activeProfile } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      // Small delay to ensure DOM is ready for animation
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 50);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeProfile]);

  const handleDismiss = () => {
    setIsExiting(true);
    // Wait for exit animation to complete before unmounting
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
  const welcomeGreeting = firstName ? `Welcome to Olera, ${firstName}` : "Welcome to Olera";

  const browsingContext = (() => {
    if (providerCount > 0 && displayCity) {
      return `You're browsing ${providerCount} care providers in ${displayCity}.`;
    } else if (providerCount > 0) {
      return `You're browsing ${providerCount} care providers.`;
    } else if (displayCity) {
      return `You're browsing care providers in ${displayCity}.`;
    }
    return "You're browsing care providers in your area.";
  })();

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl mb-6
        bg-white/80 backdrop-blur-xl
        border border-white/60
        shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]
        transition-all duration-300 ease-out
        ${isVisible && !isExiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2"
        }
      `}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-50/40 via-transparent to-warm-50/40 pointer-events-none" />

      <div className="relative px-5 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Left section: Icon + Message */}
          <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
            {/* Branded icon */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3C7.5 3 4 6 4 10c0 3 2 5 4 6v3l4-2 4 2v-3c2-1 4-3 4-6 0-4-3.5-7-8-7z"
                />
                <circle cx="9" cy="10" r="1" fill="currentColor"/>
                <circle cx="15" cy="10" r="1" fill="currentColor"/>
                <path
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  d="M9 13s1.5 2 3 2 3-2 3-2"
                />
              </svg>
            </div>

            {/* Message */}
            <div className="min-w-0">
              <p className="text-[15px] sm:text-base font-medium text-gray-900">
                {welcomeGreeting}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {browsingContext}
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
                bg-primary-600 hover:bg-primary-700
                text-sm font-medium text-white
                shadow-md shadow-primary-600/20
                hover:shadow-lg hover:shadow-primary-600/25
                active:scale-[0.98]
                transition-all duration-200
              "
            >
              <span className="hidden sm:inline">Let providers find you</span>
              <span className="sm:hidden">Set up profile</span>
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
                hover:bg-gray-100/80
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
