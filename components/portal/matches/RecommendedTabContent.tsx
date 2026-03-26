"use client";

import Link from "next/link";
import MatchProviderCard from "./MatchProviderCard";

interface RecommendedProvider {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  provider_logo: string | null;
  provider_images: string | null;
  city: string | null;
  state: string | null;
  google_rating: number | null;
  lower_price: number | null;
  upper_price: number | null;
}

interface RecommendedTabContentProps {
  providers: RecommendedProvider[];
  loading: boolean;
  onSendMessage: (providerId: string, message: string) => Promise<void>;
}

// Shimmer effect for loading skeletons
function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export default function RecommendedTabContent({
  providers,
  loading,
  onSendMessage,
}: RecommendedTabContentProps) {
  // Loading state with shimmer effect
  if (loading) {
    return (
      <div
        role="tabpanel"
        id="tabpanel-recommended"
        aria-labelledby="tab-recommended"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Shimmer className="h-40" />
              <div className="p-4 space-y-3">
                <Shimmer className="h-5 rounded-lg w-3/4" />
                <Shimmer className="h-4 rounded-lg w-1/2" />
                <Shimmer className="h-4 rounded-lg w-1/3" />
                <Shimmer className="h-11 rounded-xl w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
        {/* Add shimmer keyframes via style tag */}
        <style jsx>{`
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    );
  }

  // Empty state
  if (providers.length === 0) {
    return (
      <div
        role="tabpanel"
        id="tabpanel-recommended"
        aria-labelledby="tab-recommended"
        className="bg-white rounded-2xl border border-gray-200/80 p-10 text-center"
      >
        <div
          className="w-16 h-16 mx-auto mb-5 rounded-full bg-warm-50 flex items-center justify-center"
          style={{ animation: "float 3s ease-in-out infinite" }}
        >
          <svg className="w-8 h-8 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h4 className="text-lg font-display font-bold text-gray-900 mb-2">
          No providers found yet
        </h4>
        <p className="text-[15px] text-gray-500 mb-6 max-w-[320px] mx-auto leading-relaxed">
          We couldn&apos;t find providers in your area. Try browsing our full directory.
        </p>
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary-600 text-white text-[14px] font-semibold rounded-xl hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Browse all providers
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
      </div>
    );
  }

  // Provider grid with staggered entrance animation
  return (
    <div
      role="tabpanel"
      id="tabpanel-recommended"
      aria-labelledby="tab-recommended"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {providers.map((provider, index) => {
          const imageUrl = provider.provider_logo || provider.provider_images?.split(" | ")[0] || null;
          const priceRange = provider.lower_price
            ? provider.upper_price
              ? `$${provider.lower_price.toLocaleString()}–$${provider.upper_price.toLocaleString()}/mo`
              : `From $${provider.lower_price.toLocaleString()}/mo`
            : null;

          return (
            <div
              key={provider.provider_id}
              className="card-entrance"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <MatchProviderCard
                provider={{
                  id: provider.provider_id,
                  name: provider.provider_name,
                  slug: provider.provider_id,
                  image: imageUrl,
                  category: provider.provider_category,
                  city: provider.city,
                  state: provider.state,
                  rating: provider.google_rating,
                  priceRange,
                }}
                onMessage={onSendMessage}
              />
            </div>
          );
        })}
      </div>

      {/* View all button at bottom */}
      <div className="mt-6 text-center">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          View all providers
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <style jsx>{`
        .card-entrance {
          animation: cardFadeIn 0.3s ease-out backwards;
        }
        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
