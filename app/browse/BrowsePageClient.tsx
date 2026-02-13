"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  type Provider,
  PROVIDERS_TABLE,
  toCardFormat,
  type ProviderCardData,
} from "@/lib/types/provider";
import type { Profile } from "@/lib/types";
import BrowseFilters from "@/components/browse/BrowseFilters";

// Care types matching iOS Supabase provider_category values
const CARE_TYPE_OPTIONS = [
  { label: "Home Care", value: "Home Care (Non-medical)" },
  { label: "Home Health", value: "Home Health Care" },
  { label: "Assisted Living", value: "Assisted Living" },
  { label: "Memory Care", value: "Memory Care" },
  { label: "Independent Living", value: "Independent Living" },
  { label: "Nursing Home", value: "Nursing Home" },
];

// Map ProfileCategory slug → display name (must match getCategoryDisplayName output)
const PROFILE_CATEGORY_DISPLAY: Record<string, string> = {
  home_care_agency: "Home Care",
  home_health_agency: "Home Health",
  hospice_agency: "Hospice",
  assisted_living: "Assisted Living",
  independent_living: "Independent Living",
  memory_care: "Memory Care",
  nursing_home: "Nursing Home",
  inpatient_hospice: "Hospice",
  rehab_facility: "Rehabilitation",
  adult_day_care: "Adult Day Care",
  wellness_center: "Wellness Center",
  private_caregiver: "Home Care",
};

/** Map web business_profiles category to a display label */
function profileCategoryLabel(category: string | null): string {
  if (!category) return "Senior Care";
  return PROFILE_CATEGORY_DISPLAY[category] || "Senior Care";
}

/** Convert a web business_profiles row to ProviderCardData */
function profileToCardFormat(p: Profile): ProviderCardData {
  const location = [p.city, p.state].filter(Boolean).join(", ");
  return {
    id: p.id,
    slug: p.slug,
    name: p.display_name,
    image: p.image_url || "/placeholder-provider.jpg",
    images: p.image_url ? [p.image_url] : [],
    address: location,
    rating: 0,
    priceRange: "Contact for pricing",
    primaryCategory: profileCategoryLabel(p.category),
    careTypes: p.care_types || [],
    highlights: p.care_types?.slice(0, 2) || [],
    acceptedPayments: [],
    verified: p.verification_state === "verified",
    description: p.description?.slice(0, 100) || undefined,
    lat: p.lat,
    lon: p.lng,
  };
}

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
      try {
        const supabase = createClient();

        // ── Query 1: iOS olera-providers ──
        let iosQuery = supabase
          .from(PROVIDERS_TABLE)
          .select("*")
          .not("deleted", "is", true);

        // Apply care type filter (iOS format)
        if (careTypeFilter) {
          const careTypeOption = CARE_TYPE_OPTIONS.find(
            (ct) => ct.label.toLowerCase().replace(/\s+/g, "-") === careTypeFilter
          );
          if (careTypeOption) {
            iosQuery = iosQuery.ilike("provider_category", `%${careTypeOption.value}%`);
          }
        }

        // Apply location filter
        if (searchQuery) {
          const trimmed = searchQuery.trim();
          const cityStateMatch = trimmed.match(/^(.+),\s*([A-Z]{2})$/i);
          if (cityStateMatch) {
            const city = cityStateMatch[1].trim();
            const state = cityStateMatch[2].toUpperCase();
            iosQuery = iosQuery.ilike("city", `%${city}%`).eq("state", state);
          } else if (/^[A-Z]{2}$/i.test(trimmed)) {
            iosQuery = iosQuery.eq("state", trimmed.toUpperCase());
          } else {
            iosQuery = iosQuery.or(`city.ilike.%${trimmed}%,provider_name.ilike.%${trimmed}%`);
          }
        }

        if (stateFilter) {
          iosQuery = iosQuery.eq("state", stateFilter.toUpperCase());
        }

        iosQuery = iosQuery.order("google_rating", { ascending: false }).limit(50);

        // ── Query 2: Web-created business_profiles (organizations + caregivers) ──
        let webQuery = supabase
          .from("business_profiles")
          .select("id, slug, display_name, description, image_url, city, state, category, care_types, verification_state, lat, lng, source_provider_id")
          .in("type", ["organization", "caregiver"])
          .eq("is_active", true)
          .is("source_provider_id", null) // Exclude claimed iOS providers (already in iOS results)
          .order("created_at", { ascending: false })
          .limit(20);

        // Apply same location filters to web profiles
        if (searchQuery) {
          const trimmed = searchQuery.trim();
          const cityStateMatch = trimmed.match(/^(.+),\s*([A-Z]{2})$/i);
          if (cityStateMatch) {
            const city = cityStateMatch[1].trim();
            const state = cityStateMatch[2].toUpperCase();
            webQuery = webQuery.ilike("city", `%${city}%`).eq("state", state);
          } else if (/^[A-Z]{2}$/i.test(trimmed)) {
            webQuery = webQuery.eq("state", trimmed.toUpperCase());
          } else {
            webQuery = webQuery.or(`city.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`);
          }
        }

        if (stateFilter) {
          webQuery = webQuery.eq("state", stateFilter.toUpperCase());
        }

        // Run both queries in parallel
        const [iosResult, webResult] = await Promise.all([iosQuery, webQuery]);

        const iosCards = iosResult.error
          ? []
          : (iosResult.data as Provider[]).map(toCardFormat);

        let webCards = webResult.error
          ? []
          : (webResult.data as Profile[]).map(profileToCardFormat);

        // Client-side care type filter for web profiles (naming differs from iOS)
        if (careTypeFilter && webCards.length > 0) {
          const filterLabel = careTypeFilter.replace(/-/g, " ").toLowerCase();
          webCards = webCards.filter((card) =>
            card.careTypes.some((ct) => ct.toLowerCase().includes(filterLabel))
          );
        }

        if (iosResult.error) {
          console.error("Browse iOS fetch error:", iosResult.error.message);
        }

        // Merge: web-created first, then iOS directory
        setProviders([...webCards, ...iosCards]);
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
  const rating = provider.rating;

  return (
    <Link
      href={`/provider/${provider.slug || provider.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-shadow duration-200 block cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {provider.image ? (
          <img
            src={provider.image}
            alt={provider.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-300 flex items-center justify-center">
            <span className="text-4xl font-bold text-primary-600/40">
              {provider.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Rating badge */}
        {rating && rating >= 4.0 && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {provider.primaryCategory && (
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">
            {provider.primaryCategory}
          </p>
        )}

        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
          {provider.name}
        </h3>

        {provider.address && (
          <p className="text-gray-500 text-base mt-1">{provider.address}</p>
        )}

        {provider.priceRange && (
          <div className="mt-3">
            <p className="text-gray-500 text-sm">Estimated Pricing</p>
            <p className="text-gray-900 font-semibold">{provider.priceRange}</p>
          </div>
        )}

        <div className="mt-4 text-primary-600 font-medium text-base">
          View provider
        </div>
      </div>
    </Link>
  );
}
