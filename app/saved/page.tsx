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
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
              <svg
                className="w-10 h-10 text-gray-300"
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
            <h2 className="font-display text-display-xs font-semibold text-gray-900 mb-2">
              No saved providers yet
            </h2>
            <p className="text-sm text-gray-500 mb-8 max-w-xs text-center leading-relaxed">
              Tap the heart icon on any provider to save them here.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/browse"
                className={`inline-flex items-center justify-center min-h-[48px] px-5 py-3 text-sm font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap ${
                  user
                    ? "bg-primary-600 hover:bg-primary-500 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Browse
              </Link>
              {!user && (
                <button
                  onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
                  className="inline-flex items-center justify-center min-h-[48px] px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap"
                >
                  Sign up
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
