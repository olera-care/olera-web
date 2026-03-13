"use client";

import { useState, useEffect } from "react";
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
 * One-time dismissible welcome banner shown on the browse page after a new
 * family user completes onboarding and chooses "I'll browse on my own".
 *
 * Gracefully degrades if dynamic data is unavailable.
 */
export default function WelcomeBanner({ providerCount, locationCity }: WelcomeBannerProps) {
  const { account, activeProfile } = useAuth();
  const [visible, setVisible] = useState(false);
  const [city, setCity] = useState<string | null>(null);

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
      setVisible(true);
      // Immediately clear the flag so it only shows once
      sessionStorage.removeItem(WELCOME_BANNER_KEY);
      sessionStorage.removeItem(WELCOME_CITY_KEY);
    }
  }, [activeProfile]);

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  // Extract first name from account display_name (graceful fallback)
  const displayName = account?.display_name || "";
  const firstName = displayName.split(" ")[0] || null;

  // Use stored city from onboarding, or fall back to current browse location
  const displayCity = city || locationCity || null;

  // Build the welcome message with graceful degradation
  const buildWelcomeMessage = () => {
    const parts: string[] = [];

    if (firstName) {
      parts.push(`Welcome to Olera, ${firstName}.`);
    } else {
      parts.push("Welcome to Olera.");
    }

    if (providerCount > 0 && displayCity) {
      parts.push(`You're browsing ${providerCount} care providers in ${displayCity}.`);
    } else if (providerCount > 0) {
      parts.push(`You're browsing ${providerCount} care providers.`);
    } else if (displayCity) {
      parts.push(`You're browsing care providers in ${displayCity}.`);
    } else {
      parts.push("You're browsing care providers in your area.");
    }

    return parts.join(" ");
  };

  return (
    <div className="bg-gradient-to-r from-warm-50 to-vanilla-50 border border-warm-200/60 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[15px] text-gray-700 min-w-0">
          {buildWelcomeMessage()}
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/portal/matches"
            onClick={handleDismiss}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap"
          >
            Want providers to find you instead? Set up your care profile &rarr;
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
