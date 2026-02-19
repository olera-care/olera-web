"use client";

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

function handleShare() {
  const url = typeof window !== "undefined" ? window.location.href : "";
  if (navigator.share) {
    navigator.share({ title: "My Saved Providers — Olera", url });
  } else {
    navigator.clipboard.writeText(url);
  }
}

export default function SavedProvidersPage() {
  const { user, openAuth } = useAuth();
  const { savedProviders } = useSavedProviders();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Saved providers
            </h1>
            <p className="text-base text-gray-500 mt-1">
              {savedProviders.length > 0
                ? `${savedProviders.length} provider${savedProviders.length !== 1 ? "s" : ""} saved`
                : "Providers you save will appear here"}
            </p>
          </div>
          {savedProviders.length > 0 && (
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          )}
        </div>

        {/* Banner — auth-aware */}
        {savedProviders.length > 0 && (
          <div className="mb-6 px-5 py-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-4 flex-wrap shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user
                  ? "Looking for more options?"
                  : "Keep your saves across sessions"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {user
                  ? "Discover more providers that match your care needs."
                  : "Create a free account to save more than 3 providers and access them anytime."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/browse"
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  user
                    ? "bg-primary-600 hover:bg-primary-500 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Browse more
              </Link>
              {!user && (
                <button
                  onClick={() =>
                    openAuth({ defaultMode: "sign-up", intent: "family" })
                  }
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  Create account
                </button>
              )}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No saved providers yet
            </h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md text-center leading-relaxed">
              When you find a provider you like, tap the heart icon to save them
              here for easy comparison later.
            </p>
            {!user && (
              <p className="text-sm text-gray-500 mb-6 max-w-md text-center leading-relaxed">
                Create a free account to save providers and access them anytime.
              </p>
            )}
            <div className="flex items-center gap-3">
              <Link
                href="/browse"
                className={`inline-flex items-center px-6 py-3 text-sm font-semibold rounded-xl transition-colors shadow-sm ${
                  user
                    ? "bg-primary-600 hover:bg-primary-500 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Browse providers
              </Link>
              {!user && (
                <button
                  onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Create account
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
