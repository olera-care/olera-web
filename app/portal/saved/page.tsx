"use client";

import Link from "next/link";
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

export default function PortalSavedPage() {
  const { savedProviders } = useSavedProviders();

  return (
    <div className="px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Saved Providers</h1>
        <p className="text-lg text-gray-600 mt-1">
          {savedProviders.length > 0
            ? `${savedProviders.length} provider${savedProviders.length !== 1 ? "s" : ""} saved`
            : "Providers you save will appear here."}
        </p>
      </div>

      {/* Browse banner */}
      {savedProviders.length > 0 && (
        <div className="mb-6 px-5 py-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-4 flex-wrap shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Looking for more options?
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Discover more providers that match your care needs.
            </p>
          </div>
          <Link
            href="/browse"
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap bg-primary-600 hover:bg-primary-500 text-white"
          >
            Browse more
          </Link>
        </div>
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
        <div className="flex flex-col items-center justify-center py-20 px-4">
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
          <Link
            href="/browse"
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Browse providers
          </Link>
        </div>
      )}
    </div>
  );
}
