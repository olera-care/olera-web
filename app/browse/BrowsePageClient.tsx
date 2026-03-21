"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  type Provider,
  PROVIDERS_TABLE,
  formatLocation,
  formatPriceRange,
  getCategoryDisplayName,
  getPrimaryImage,
  toCardFormat,
  type ProviderCardData,
  businessProfileToCardFormat,
  mergeProviderCards,
  enrichBpCards,
  SUPABASE_CAT_TO_PROFILE_CATEGORY,
} from "@/lib/types/provider";
import type { BusinessProfile } from "@/lib/types";
import BrowseFilters from "@/components/browse/BrowseFilters";
import { useSavedProviders } from "@/hooks/use-saved-providers";

// Care types matching iOS Supabase provider_category values
const CARE_TYPE_OPTIONS = [
  { label: "Home Care", value: "Home Care (Non-medical)" },
  { label: "Home Health", value: "Home Health Care" },
  { label: "Assisted Living", value: "Assisted Living" },
  { label: "Memory Care", value: "Memory Care" },
  { label: "Independent Living", value: "Independent Living" },
  { label: "Nursing Home", value: "Nursing Home" },
];

interface BrowsePageClientProps {
  searchQuery: string;
  careTypeFilter: string;
  stateFilter: string;
}

export default function BrowsePageClient({
  searchQuery,
  careTypeFilter,
  stateFilter,
}: BrowsePageClientProps) {
  const [providers, setProviders] = useState<ProviderCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProviders() {
      // Always try Supabase first (don't check isSupabaseConfigured - it can give false negatives)
      try {
        const supabase = createClient();

        // Build query with filters
        let query = supabase
          .from(PROVIDERS_TABLE)
          .select("*")
          .not("deleted", "is", true);

        // Apply care type filter
        if (careTypeFilter) {
          const careTypeOption = CARE_TYPE_OPTIONS.find(
            (ct) => ct.label.toLowerCase().replace(/\s+/g, "-") === careTypeFilter
          );
          if (careTypeOption) {
            // Use ilike for flexible matching (handles "Memory Care | Assisted Living" etc)
            query = query.ilike("provider_category", `%${careTypeOption.value}%`);
          }
        }

        // Apply location filter (searchQuery can be "City, ST" or just "City" or state code)
        if (searchQuery) {
          const trimmed = searchQuery.trim();

          // Check if it's "City, State" format
          const cityStateMatch = trimmed.match(/^(.+),\s*([A-Z]{2})$/i);
          if (cityStateMatch) {
            const city = cityStateMatch[1].trim();
            const state = cityStateMatch[2].toUpperCase();
            query = query.ilike("city", `%${city}%`).eq("state", state);
          } else if (/^[A-Z]{2}$/i.test(trimmed)) {
            // Just a state code like "TX" or "CA"
            query = query.eq("state", trimmed.toUpperCase());
          } else {
            // Search by city name or provider name
            query = query.or(`city.ilike.%${trimmed}%,provider_name.ilike.%${trimmed}%`);
          }
        }

        // Apply state filter if provided separately
        if (stateFilter) {
          query = query.eq("state", stateFilter.toUpperCase());
        }

        // Build parallel business_profiles query
        let bpQuery = supabase
          .from("business_profiles")
          .select("*")
          .eq("claim_state", "claimed")
          .eq("is_active", true)
          .eq("type", "organization");

        if (careTypeFilter) {
          const careTypeOption = CARE_TYPE_OPTIONS.find(
            (ct) => ct.label.toLowerCase().replace(/\s+/g, "-") === careTypeFilter
          );
          if (careTypeOption) {
            const profileCat = SUPABASE_CAT_TO_PROFILE_CATEGORY[careTypeOption.value];
            if (profileCat) {
              bpQuery = bpQuery.eq("category", profileCat);
            }
          }
        }

        if (searchQuery) {
          const trimmed = searchQuery.trim();
          const cityStateMatch = trimmed.match(/^(.+),\s*([A-Z]{2})$/i);
          if (cityStateMatch) {
            const city = cityStateMatch[1].trim();
            const state = cityStateMatch[2].toUpperCase();
            bpQuery = bpQuery.ilike("city", `%${city}%`).eq("state", state);
          } else if (/^[A-Z]{2}$/i.test(trimmed)) {
            bpQuery = bpQuery.eq("state", trimmed.toUpperCase());
          } else {
            bpQuery = bpQuery.or(`city.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`);
          }
        }

        if (stateFilter) {
          bpQuery = bpQuery.eq("state", stateFilter.toUpperCase());
        }

        bpQuery = bpQuery.order("created_at", { ascending: false }).limit(50);

        // Run both queries in parallel
        const [seededResult, bpResult] = await Promise.all([
          query.order("google_rating", { ascending: false }).limit(50),
          bpQuery,
        ]);

        if (seededResult.error) {
          console.error("Browse fetch error:", seededResult.error.message);
          setProviders([]);
        } else {
          const seededCards = (seededResult.data as Provider[]).map(toCardFormat);
          const bpData = (bpResult.data as BusinessProfile[] | null) ?? [];
          const bpCards = bpData.map(businessProfileToCardFormat);
          const bpSourceIds = bpData.map((bp) => bp.source_provider_id);
          const dedupeIds = new Set(
            bpSourceIds.filter((id): id is string => id != null)
          );
          enrichBpCards(bpCards, seededCards, bpSourceIds);
          setProviders(mergeProviderCards(seededCards, bpCards, dedupeIds));
        }
      } catch (err) {
        console.error("Browse page error:", err);
        setProviders([]);
      }

      setIsLoading(false);
    }

    fetchProviders();
  }, [searchQuery, careTypeFilter, stateFilter]);

  // Server already filters by care type, location, and state
  const filteredProviders = providers;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Browse Care Providers
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Find and compare trusted senior care providers in your area.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <BrowseFilters
          careTypes={CARE_TYPE_OPTIONS.map((ct) => ct.label)}
          currentQuery={searchQuery}
          currentType={careTypeFilter}
          currentState={stateFilter}
        />
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-lg text-gray-600">Loading providers...</p>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No providers found
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {searchQuery || careTypeFilter || stateFilter
                ? "Try adjusting your filters or search term."
                : "No providers have been listed yet."}
            </p>
            {(searchQuery || careTypeFilter || stateFilter) && (
              <Link
                href="/browse"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-base text-gray-500 mb-6">
              {filteredProviders.length} provider{filteredProviders.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider) => (
                <ProviderBrowseCard key={provider.id} provider={provider} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProviderBrowseCard({ provider }: { provider: ProviderCardData }) {
  const { isSaved: checkSaved, toggleSave } = useSavedProviders();
  const isSaved = checkSaved(provider.id);
  const displayedHighlights = provider.highlights?.slice(0, 3) || [];

  return (
    <Link
      href={`/provider/${provider.slug || provider.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-shadow duration-200"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50">
        {provider.imageType === "placeholder" || !provider.image ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
              <span className="text-xl font-bold text-primary-400">
                {provider.name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-medium text-primary-300 mt-1.5">{provider.primaryCategory}</span>
          </div>
        ) : provider.imageType === "logo" ? (
          <div className="w-full h-full flex items-center justify-center p-6">
            <img
              src={provider.image}
              alt={provider.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <img
            src={provider.image}
            alt={provider.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Heart/Save Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSave({
              providerId: provider.id,
              slug: provider.slug,
              name: provider.name,
              location: provider.address,
              careTypes: [provider.primaryCategory],
              image: provider.image,
              rating: provider.rating || undefined,
            });
          }}
          className="absolute top-2 right-2 z-10 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-colors shadow-sm"
          aria-label={isSaved ? "Remove from saved" : "Save provider"}
        >
          <svg
            className={`w-5 h-5 transition-colors ${isSaved ? "text-primary-600" : "text-gray-500"}`}
            fill={isSaved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Name + Rating */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-base group-hover:text-primary-700 transition-colors line-clamp-2 flex-1 leading-snug">
            {provider.name}
          </h3>
          {provider.rating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">{provider.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">on Google</span>
            </div>
          )}
        </div>

        {/* Category · Location */}
        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
          {provider.primaryCategory}{provider.address ? ` · ${provider.address}` : ""}
        </p>

        {/* Highlights */}
        {displayedHighlights.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
            {displayedHighlights.map((h) => (
              <span key={h} className="flex items-center gap-1.5 text-xs text-gray-600">
                <svg className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-2" />

        {/* Price */}
        {provider.priceRange && (
          <p className="text-sm font-bold text-gray-900 mt-3">{provider.priceRange}</p>
        )}
      </div>
    </Link>
  );
}
