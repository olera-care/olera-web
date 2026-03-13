"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import ProviderCard, {
  type Provider,
} from "@/components/providers/ProviderCard";

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
  const { user, openAuth } = useAuth();
  const { savedProviders } = useSavedProviders();
  const [shareLabel, setShareLabel] = useState<"share" | "copied">("share");

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
      setTimeout(() => setShareLabel("share"), 2000);
    } catch {
      // Clipboard not available
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
