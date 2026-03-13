"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import ProviderCard, {
  type Provider,
} from "@/components/providers/ProviderCard";
import type { FamilyMetadata } from "@/lib/types";

const MATCHES_BANNER_DISMISSED_KEY = "olera_saved_matches_banner_dismissed";

/** Map a saved entry to the Provider shape expected by ProviderCard */
function toProvider(entry: {
  providerId: string;
  slug: string;
  name: string;
  location: string;
  careTypes: string[];
  image: string | null;
  rating?: number;
}): Provider {
  return {
    id: entry.providerId,
    slug: entry.slug,
    name: entry.name,
    image: entry.image || "/placeholder-provider.jpg",
    address: entry.location,
    rating: entry.rating || 0,
    priceRange: "Contact for pricing",
    primaryCategory: entry.careTypes[0] || "Senior Care",
    careTypes: entry.careTypes,
    highlights: [],
    verified: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Matches Promotion Banner (state-driven)
// ─────────────────────────────────────────────────────────────────────────────

function MatchesPromoBanner({
  city,
  isMatchesActive,
}: {
  city: string | null;
  isMatchesActive: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);

  // Check sessionStorage on mount for session-only dismiss
  useEffect(() => {
    if (typeof window !== "undefined") {
      const wasDismissed = sessionStorage.getItem(MATCHES_BANNER_DISMISSED_KEY);
      if (wasDismissed === "true") {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(MATCHES_BANNER_DISMISSED_KEY, "true");
    }
  };

  const locationText = city || "near you";

  // When Matches is active: show slim confirmation line
  if (isMatchesActive) {
    return (
      <div className="mb-6 px-4 py-3 bg-primary-50/60 border border-primary-100/60 rounded-xl flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Your care profile is live</span>
          {" — "}providers in {locationText} can find you.
        </p>
        <Link
          href="/portal/matches"
          className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap"
        >
          View your Matches profile →
        </Link>
      </div>
    );
  }

  // When dismissed for this session, don't show
  if (dismissed) {
    return null;
  }

  // Show CTA banner when Matches is NOT active
  return (
    <div className="mb-6 relative bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
      {/* Dismiss X */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="px-5 py-5 pr-12">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
          You've saved providers you like — want them to come to you too?
        </h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Let qualified providers in {locationText} reach out directly. You decide who to talk to.
        </p>
        <Link
          href="/matches"
          className="inline-flex items-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          Set up my care profile
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PortalSavedPage() {
  const { user, activeProfile } = useAuth();
  const { savedProviders } = useSavedProviders();

  // Check Matches status from profile metadata
  const meta = activeProfile?.metadata as FamilyMetadata | undefined;
  const carePostStatus = meta?.care_post?.status;
  const isMatchesActive = carePostStatus === "active";

  // Get city from profile for dynamic text
  const city = activeProfile?.city || null;

  // Determine if we should show the Matches promo banner
  // Show when: logged in + has saved providers + Matches not active
  const showMatchesBanner = !!user && savedProviders.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Saved Providers</h1>
        <p className="text-[15px] text-gray-500 mt-1">
          {savedProviders.length > 0
            ? `${savedProviders.length} provider${savedProviders.length !== 1 ? "s" : ""} saved`
            : "Providers you save will appear here."}
        </p>
      </div>

      {/* Matches promotion banner - state-driven */}
      {showMatchesBanner && (
        <MatchesPromoBanner city={city} isMatchesActive={isMatchesActive} />
      )}

      {savedProviders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedProviders.map((entry) => (
            <ProviderCard
              key={entry.providerId}
              provider={toProvider(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="relative w-full max-w-md">
            {/* Premium card */}
            <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.04)] overflow-hidden">
              {/* Subtle gradient accent at top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />

              <div className="px-8 py-10 sm:px-10 sm:py-12 text-center">
                {/* Icon with glow effect */}
                <div className="relative inline-flex mb-6">
                  <div className="absolute inset-0 bg-primary-400/20 rounded-2xl blur-xl scale-150" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Headline */}
                <h2 className="text-xl font-display font-bold text-gray-900 mb-2">
                  Find providers you love
                </h2>

                {/* Description */}
                <p className="text-[15px] text-gray-500 leading-relaxed mb-8 max-w-sm mx-auto">
                  Browse care providers in your area and save your favorites here for easy comparison.
                </p>

                {/* CTA Button */}
                <Link
                  href="/browse"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary-600/25 hover:shadow-lg hover:shadow-primary-600/30 active:scale-[0.98]"
                >
                  Start browsing
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                {/* Hint text */}
                <p className="text-xs text-gray-400 mt-5">
                  Tap the heart icon on any provider to save them
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
