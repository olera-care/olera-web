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

  // When Matches is active: show confirmation banner with premium styling
  if (isMatchesActive) {
    return (
      <div className="mb-6 relative bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300 overflow-hidden">
        {/* Accent left border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-l-2xl" />

        <div className="flex items-center gap-4 px-5 py-3.5">
          {/* Success icon with glow */}
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

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-gray-900 truncate">
              Your care profile is live
            </p>
            <p className="text-[13px] text-gray-500 truncate mt-0.5">
              Providers in {locationText} can find you
            </p>
          </div>

          {/* CTA Link */}
          <Link
            href="/portal/matches"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-sm font-semibold text-white shadow-sm shadow-primary-600/25 hover:shadow-md hover:shadow-primary-600/30 active:scale-[0.98] transition-all duration-200 whitespace-nowrap flex-shrink-0"
          >
            View profile
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden px-5 pb-4">
          <Link
            href="/portal/matches"
            className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-primary-600/25"
          >
            View profile
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // When dismissed for this session, don't show
  if (dismissed) {
    return null;
  }

  // Show CTA banner when Matches is NOT active
  return (
    <div className="mb-6 relative bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300 overflow-hidden">
      {/* Accent left border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-l-2xl" />

      <div className="flex items-center gap-4 px-5 py-4">
        {/* Icon with glow effect */}
        <div className="relative flex-shrink-0 hidden sm:block">
          <div className="absolute inset-0 bg-primary-400/20 rounded-xl blur-md" />
          <div className="relative flex w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
              <path
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h13"
              />
              <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth={1.5} />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5">
            Want these providers to come to you?
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Let qualified providers in {locationText} reach out directly.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Not now
          </button>
          <Link
            href="/portal/matches"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-primary-600/25 hover:shadow-md hover:shadow-primary-600/30 active:scale-[0.98] whitespace-nowrap"
          >
            Set up profile
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Mobile CTA - full width below content */}
      <div className="sm:hidden px-5 pb-4 flex flex-col gap-3">
        <Link
          href="/portal/matches"
          className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-primary-600/25"
        >
          Set up my care profile
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors text-center"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

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

export default function SavedProvidersPage() {
  const { user, activeProfile, openAuth } = useAuth();
  const { savedProviders } = useSavedProviders();
  const [shareLabel, setShareLabel] = useState<"share" | "copied">("share");
  const [showToast, setShowToast] = useState(false);

  // Check Matches status from profile metadata
  const meta = activeProfile?.metadata as FamilyMetadata | undefined;
  const carePostStatus = meta?.care_post?.status;
  const isMatchesActive = carePostStatus === "active";

  // Get city from profile for dynamic text
  const city = activeProfile?.city || null;

  // Show Matches banner when: logged in + has saved providers
  const showMatchesBanner = !!user && savedProviders.length > 0;

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";

    if (navigator.share) {
      try {
        await navigator.share({ title: "My Saved Providers — Olera", url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareLabel("copied");
      setShowToast(true);
      setTimeout(() => {
        setShareLabel("share");
        setShowToast(false);
      }, 2500);
    } catch {
      // Clipboard not available
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notification */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          showToast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-lg">
          <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Link copied to clipboard
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-display-sm sm:text-display-md font-semibold text-gray-900 tracking-tight">
              Saved
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {savedProviders.length > 0
                ? `${savedProviders.length} provider${savedProviders.length !== 1 ? "s" : ""}`
                : "Providers you save will appear here"}
            </p>
          </div>
          {savedProviders.length > 0 && (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-sm font-medium text-gray-400 hover:text-gray-900 bg-transparent border-none cursor-pointer transition-colors shrink-0"
              aria-label="Share saved providers"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {shareLabel === "copied" ? "Copied!" : "Share"}
            </button>
          )}
        </div>

        {/* Matches promotion banner - state-driven (logged-in users only) */}
        {showMatchesBanner && (
          <MatchesPromoBanner city={city} isMatchesActive={isMatchesActive} />
        )}

        {/* Banner — compact for logged-out users */}
        {savedProviders.length > 0 && !user && (
          <div className="mb-6 px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-between gap-3">
            <p className="text-sm text-primary-800">
              <span className="font-medium">Sign up</span> to sync across devices
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/browse"
                className="px-4 py-2 min-h-[40px] text-sm font-medium text-primary-700 hover:bg-primary-100 rounded-lg transition-colors whitespace-nowrap flex items-center"
              >
                Browse
              </Link>
              <button
                onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
                className="px-4 py-2 min-h-[40px] bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Sign up
              </button>
            </div>
          </div>
        )}

        {/* Provider grid or empty state */}
        {savedProviders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

                  {/* CTA Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      href="/browse"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary-600/25 hover:shadow-lg hover:shadow-primary-600/30 active:scale-[0.98]"
                    >
                      Start browsing
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    {!user && (
                      <button
                        onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
                        className="inline-flex items-center px-5 py-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
                      >
                        Sign up
                      </button>
                    )}
                  </div>

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
