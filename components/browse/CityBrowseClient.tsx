"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useCitySearch } from "@/hooks/use-city-search";
import BrowseCard from "@/components/browse/BrowseCard";
import { useNavbar } from "@/components/shared/NavbarContext";
import Pagination from "@/components/ui/Pagination";
import { createClient } from "@/lib/supabase/client";
import {
  type Provider as SupabaseProvider,
  PROVIDERS_TABLE,
  toCardFormat,
  type ProviderCardData,
} from "@/lib/types/provider";

const BrowseMap = dynamic(() => import("@/components/browse/BrowseMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
      <span className="text-sm text-gray-400">Loading map...</span>
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const careTypes = [
  { id: "all", label: "All Care Types" },
  { id: "home-care", label: "Home Care" },
  { id: "home-health", label: "Home Health" },
  { id: "assisted-living", label: "Assisted Living" },
  { id: "memory-care", label: "Memory Care" },
  { id: "nursing-homes", label: "Nursing Homes" },
  { id: "independent-living", label: "Independent Living" },
];

const ratingOptions = [
  { value: "any", label: "Any Rating" },
  { value: "4.5", label: "4.5+ Stars" },
  { value: "4.0", label: "4.0+ Stars" },
  { value: "3.5", label: "3.5+ Stars" },
  { value: "3.0", label: "3.0+ Stars" },
];

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviewed" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const CARE_TYPE_TO_SUPABASE: Record<string, string> = {
  "home-care": "Home Care (Non-medical)",
  "home-health": "Home Health Care",
  "assisted-living": "Assisted Living",
  "memory-care": "Memory Care",
  "nursing-homes": "Nursing Home",
  "independent-living": "Independent Living",
};

/** Map power-page slugs → dropdown IDs where they differ */
const PAGE_SLUG_TO_DROPDOWN_ID: Record<string, string> = {
  "nursing-home": "nursing-homes",
  "home-health-care": "home-health",
};

function getCareTypeLabel(id: string): string {
  return careTypes.find((c) => c.id === id)?.label || "All Care Types";
}

const PROVIDERS_PER_PAGE = 24;

function parsePrice(price: string): number {
  const numericValue = parseInt(price.replace(/[^0-9]/g, ""));
  if (price.includes("/hr")) return numericValue * 160;
  if (price.includes("/day")) return numericValue * 30;
  return numericValue;
}

// US state abbreviation mapping (for geolocation reverse-geocode)
const STATE_ABBREVS: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO",
  Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH",
  Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
  "District of Columbia": "DC",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrossLink {
  href: string;
  label: string;
}

interface SeoContent {
  h1: string;
  description: string;
  breadcrumbs: { label: string; href?: string }[];
  avgCost: string | null;
  totalCount: number;
}

interface CityBrowseClientProps {
  initialProviders: ProviderCardData[];
  totalCount: number;
  categorySlug: string;
  categoryLabel: string;
  cityName: string;
  stateAbbrev: string;
  stateName: string;
  stateSlug: string;
  crossLinks: CrossLink[];
  seoContent: SeoContent;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CityBrowseClient({
  initialProviders,
  totalCount,
  categorySlug,
  categoryLabel,
  cityName,
  stateAbbrev,
  stateName,
  stateSlug,
  crossLinks,
  seoContent,
}: CityBrowseClientProps) {
  const { visible: navbarVisible, enableAutoHide, disableAutoHide } = useNavbar();

  const initialCareTypeId = PAGE_SLUG_TO_DROPDOWN_ID[categorySlug] || categorySlug;
  const initialLocation = `${cityName}, ${stateAbbrev}`;

  // Enable navbar auto-hide on scroll
  useEffect(() => {
    enableAutoHide();
    return () => disableAutoHide();
  }, [enableAutoHide, disableAutoHide]);

  // ── Filter state ──
  const [searchLocation, setSearchLocation] = useState(initialLocation);
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [selectedCareType, setSelectedCareType] = useState(initialCareTypeId);
  const [selectedRating, setSelectedRating] = useState("any");
  const [sortBy, setSortBy] = useState("recommended");
  const [hoveredProviderId, setHoveredProviderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Dropdown open states ──
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showCareTypeDropdown, setShowCareTypeDropdown] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // ── Geolocation ──
  const [isGeolocating, setIsGeolocating] = useState(false);

  // ── Provider data (seeded with SSR providers) ──
  const [providers, setProviders] = useState<ProviderCardData[]>(initialProviders);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  // Skip the initial Supabase fetch — we already have data from the server
  const isFirstRender = useRef(true);

  // ── Client-side fetch when location or care type changes ──
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function fetchProviders() {
      setIsLoadingProviders(true);

      try {
        const supabase = createClient();
        let query = supabase
          .from(PROVIDERS_TABLE)
          .select("*")
          .or("deleted.is.null,deleted.eq.false");

        // Care type filter
        if (selectedCareType && selectedCareType !== "all") {
          const supabaseCategory = CARE_TYPE_TO_SUPABASE[selectedCareType];
          if (supabaseCategory) {
            query = query.ilike("provider_category", `%${supabaseCategory}%`);
          }
        }

        // Location filter
        if (searchLocation) {
          const trimmed = searchLocation.trim();
          const cityStateMatch = trimmed.match(/^(.+),\s*([A-Z]{2})$/i);
          if (cityStateMatch) {
            const city = cityStateMatch[1].trim();
            const state = cityStateMatch[2].toUpperCase();
            query = query.ilike("city", `%${city}%`).eq("state", state);
          } else if (/^[A-Z]{2}$/i.test(trimmed)) {
            query = query.eq("state", trimmed.toUpperCase());
          } else {
            query = query.or(
              `city.ilike.%${trimmed}%,provider_name.ilike.%${trimmed}%`
            );
          }
        }

        const { data, error } = await query
          .order("google_rating", { ascending: false })
          .limit(100)
          .abortSignal(controller.signal);

        if (cancelled) return;

        if (error) {
          console.error("City browse fetch error:", error.message);
          setProviders([]);
        } else {
          setProviders((data as SupabaseProvider[]).map(toCardFormat));
        }
      } catch (err: unknown) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError"))
          return;
        console.error("City browse error:", err);
        if (!cancelled) setProviders([]);
      }
      if (!cancelled) setIsLoadingProviders(false);
    }

    fetchProviders();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [searchLocation, selectedCareType]);

  // ── Refs ──
  const locationInputRef = useRef<HTMLInputElement>(null);

  // ── City search hook ──
  const { results: cityResults, preload: preloadCities } =
    useCitySearch(locationInput);

  // ── Geolocation ──
  const detectLocation = () => {
    if (!navigator.geolocation) return;

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&countrycodes=us`
          );
          const data = await response.json();

          if (data.address?.country_code?.toUpperCase() !== "US") {
            setIsGeolocating(false);
            return;
          }

          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "Unknown";
          const sName = data.address?.state || "";
          const sAbbr =
            STATE_ABBREVS[sName] || sName.substring(0, 2).toUpperCase();
          const loc = `${city}, ${sAbbr}`;
          setSearchLocation(loc);
          setLocationInput(loc);
        } catch {
          // Keep current location on error
        }
        setIsGeolocating(false);
      },
      () => setIsGeolocating(false)
    );
  };

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setShowLocationDropdown(false);
        setLocationInput(searchLocation);
        setShowCareTypeDropdown(false);
        setShowRatingDropdown(false);
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [searchLocation]);

  // ── Filter & sort (client-side) ──
  const filteredProviders = useMemo(() => {
    let result = [...providers];

    if (selectedRating !== "any") {
      const minRating = parseFloat(selectedRating);
      result = result.filter((p) => p.rating >= minRating);
    }

    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "price-low":
        result.sort(
          (a, b) => parsePrice(a.priceRange) - parsePrice(b.priceRange)
        );
        break;
      case "price-high":
        result.sort(
          (a, b) => parsePrice(b.priceRange) - parsePrice(a.priceRange)
        );
        break;
      case "reviews":
        result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      default:
        result.sort(
          (a, b) =>
            b.rating * (b.reviewCount || 1) - a.rating * (a.reviewCount || 1)
        );
    }

    return result;
  }, [providers, selectedRating, sortBy]);

  // ── Pagination ──
  const totalPages = Math.ceil(filteredProviders.length / PROVIDERS_PER_PAGE);

  const topRatedIds = useMemo(() => {
    return new Set(
      filteredProviders
        .filter((p) => p.rating >= 4.5)
        .slice(0, 3)
        .map((p) => p.id)
    );
  }, [filteredProviders]);

  const paginatedProviders = useMemo(() => {
    const startIndex = (currentPage - 1) * PROVIDERS_PER_PAGE;
    return filteredProviders
      .slice(startIndex, startIndex + PROVIDERS_PER_PAGE)
      .map((p) => ({
        ...p,
        badge: topRatedIds.has(p.id) ? ("Top Rated" as const) : undefined,
      }));
  }, [filteredProviders, currentPage, topRatedIds]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCareType, selectedRating, sortBy, searchLocation]);

  // ── Derived state ──
  const isAllTypes = selectedCareType === "all";
  const careTypeLabel = getCareTypeLabel(selectedCareType);

  const hasActiveFilters =
    selectedRating !== "any" ||
    sortBy !== "recommended" ||
    selectedCareType !== initialCareTypeId ||
    searchLocation !== initialLocation;

  const clearFilters = () => {
    setSearchLocation(initialLocation);
    setLocationInput(initialLocation);
    setSelectedCareType(initialCareTypeId);
    setSelectedRating("any");
    setSortBy("recommended");
  };

  const closeAllDropdowns = () => {
    setShowLocationDropdown(false);
    setShowCareTypeDropdown(false);
    setShowRatingDropdown(false);
    setShowSortDropdown(false);
  };

  const sortLabel =
    sortOptions.find((o) => o.value === sortBy)?.label || "Recommended";

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="bg-gray-50">
      {/* ── Sticky Filter Bar ── */}
      <div
        className="sticky z-40 bg-white border-b border-gray-200"
        style={{
          top: navbarVisible ? "64px" : "0px",
          transition: "top 200ms cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* ── Location Dropdown ── */}
            <div className="relative dropdown-container flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const opening = !showLocationDropdown;
                  closeAllDropdowns();
                  setShowLocationDropdown(opening);
                  if (opening) {
                    setLocationInput("");
                    setTimeout(
                      () =>
                        locationInputRef.current?.focus({
                          preventScroll: true,
                        }),
                      100
                    );
                  }
                }}
                className={`flex items-center justify-between h-9 px-4 w-[200px] rounded-full text-sm font-medium transition-colors overflow-hidden ${
                  searchLocation.trim()
                    ? "bg-white text-gray-900 border-2 border-primary-400"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isGeolocating ? (
                    <svg
                      className="w-4 h-4 text-gray-500 flex-shrink-0 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-gray-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                  <span className="truncate">
                    {isGeolocating
                      ? "Detecting..."
                      : searchLocation || "Enter location"}
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showLocationDropdown && (
                <div className="absolute left-0 top-[calc(100%+8px)] w-[300px] bg-white rounded-xl shadow-xl border border-gray-200 py-3 z-[100] max-h-[340px] overflow-y-auto">
                  <div className="px-3 pb-2">
                    <div
                      className={`flex items-center px-4 py-3 bg-gray-50 rounded-xl border transition-colors ${
                        locationInput.trim()
                          ? "border-primary-400 ring-2 ring-primary-100"
                          : "border-gray-200"
                      }`}
                    >
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <input
                        ref={locationInputRef}
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        onFocus={preloadCities}
                        placeholder="City or ZIP code"
                        className="w-full ml-3 bg-transparent border-none text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 text-base"
                      />
                    </div>
                  </div>

                  <div className="px-3 pb-3">
                    <button
                      type="button"
                      onClick={() => {
                        detectLocation();
                        setShowLocationDropdown(false);
                      }}
                      disabled={isGeolocating}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-primary-700 font-medium transition-colors disabled:opacity-60"
                    >
                      {isGeolocating ? (
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                        </svg>
                      )}
                      <span>
                        {isGeolocating
                          ? "Detecting location..."
                          : "Use my current location"}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">
                      or search
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {!locationInput.trim() && cityResults.length > 0 && (
                    <div className="px-4 pt-2 pb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Popular cities
                      </span>
                    </div>
                  )}

                  {cityResults.map((loc) => (
                    <button
                      key={loc.full}
                      type="button"
                      onClick={() => {
                        setSearchLocation(loc.full);
                        setLocationInput(loc.full);
                        setShowLocationDropdown(false);
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                        searchLocation === loc.full
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-900"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="font-medium">{loc.full}</span>
                    </button>
                  ))}
                  {cityResults.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No locations found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Care Type Dropdown ── */}
            <div className="relative dropdown-container flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const opening = !showCareTypeDropdown;
                  closeAllDropdowns();
                  setShowCareTypeDropdown(opening);
                }}
                className={`flex items-center justify-between h-9 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  !isAllTypes
                    ? "bg-white text-gray-900 border-2 border-primary-400"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                <span>{careTypeLabel}</span>
                <svg
                  className={`w-4 h-4 ml-2 transition-transform ${showCareTypeDropdown ? "rotate-180" : ""} ${!isAllTypes ? "text-gray-900" : "text-gray-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showCareTypeDropdown && (
                <div className="absolute left-0 top-[calc(100%+6px)] w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[100]">
                  {careTypes.map((type) => {
                    const isActive =
                      (isAllTypes && type.id === "all") ||
                      selectedCareType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => {
                          setSelectedCareType(type.id);
                          setShowCareTypeDropdown(false);
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-1 text-left text-base hover:bg-gray-50 transition-colors ${
                          isActive
                            ? "text-gray-900 font-medium"
                            : "text-gray-900"
                        }`}
                      >
                        {isActive ? (
                          <svg
                            className="w-5 h-5 text-primary-600 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <span className="w-5" />
                        )}
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Rating Dropdown ── */}
            <div className="relative dropdown-container flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const opening = !showRatingDropdown;
                  closeAllDropdowns();
                  setShowRatingDropdown(opening);
                }}
                className={`flex items-center justify-between h-9 px-4 rounded-full text-sm font-medium transition-colors overflow-hidden ${
                  selectedRating !== "any"
                    ? "bg-white text-gray-900 border-2 border-primary-400"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                <span className="truncate">
                  {selectedRating === "any"
                    ? "Rating"
                    : `${selectedRating}+ Stars`}
                </span>
                <svg
                  className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${showRatingDropdown ? "rotate-180" : ""} ${selectedRating !== "any" ? "text-gray-900" : "text-gray-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showRatingDropdown && (
                <div className="absolute left-0 top-[calc(100%+6px)] w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[100]">
                  {ratingOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedRating(option.value);
                        setShowRatingDropdown(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-1 text-left text-base hover:bg-gray-50 transition-colors ${
                        selectedRating === option.value
                          ? "text-gray-900 font-medium"
                          : "text-gray-900"
                      }`}
                    >
                      {selectedRating === option.value ? (
                        <svg
                          className="w-5 h-5 text-primary-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="w-5" />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Clear Filters ── */}
            <button
              onClick={clearFilters}
              className={`flex items-center gap-1 h-9 px-3 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                hasActiveFilters
                  ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                  : "invisible"
              }`}
              aria-hidden={!hasActiveFilters}
              tabIndex={hasActiveFilters ? 0 : -1}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content — Split Layout ── */}
      <div className="lg:mr-[45%]">
        {/* Left Panel — Provider List */}
        <div className="px-4 sm:px-6 lg:pl-8 lg:pr-6 py-6">
          {/* Heading + Sort */}
          <div className="relative z-20">
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold font-serif text-gray-900">
                {isLoadingProviders ? "" : `${filteredProviders.length} `}{careTypeLabel} in {cityName}, {stateAbbrev}
              </h1>

              {/* Sort Dropdown */}
              <div className="relative dropdown-container flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const opening = !showSortDropdown;
                    closeAllDropdowns();
                    setShowSortDropdown(opening);
                  }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap transition-colors"
                >
                  Sort by:{" "}
                  <span className="font-medium text-gray-900">
                    {sortLabel}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${showSortDropdown ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[100]">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-1 text-left text-base hover:bg-gray-50 transition-colors ${
                          sortBy === option.value
                            ? "text-gray-900 font-medium"
                            : "text-gray-900"
                        }`}
                      >
                        {sortBy === option.value ? (
                          <svg
                            className="w-5 h-5 text-primary-600 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <span className="w-5" />
                        )}
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Provider Cards */}
          {isLoadingProviders ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 animate-pulse"
                >
                  <div className="w-full aspect-[16/10] bg-gray-200" />
                  <div className="p-3.5 space-y-2.5">
                    <div className="flex justify-between">
                      <div className="h-5 w-3/4 bg-gray-200 rounded" />
                      <div className="h-5 w-10 bg-gray-100 rounded" />
                    </div>
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    <div className="flex gap-2">
                      <div className="h-5 w-20 bg-gray-100 rounded-full" />
                      <div className="h-5 w-16 bg-gray-100 rounded-full" />
                    </div>
                    <div className="h-4 w-28 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProviders.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paginatedProviders.map((provider) => (
                  <div
                    key={provider.id}
                    onMouseEnter={() => setHoveredProviderId(provider.id)}
                    onMouseLeave={() => setHoveredProviderId(null)}
                  >
                    <BrowseCard provider={provider} />
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredProviders.length}
                itemsPerPage={PROVIDERS_PER_PAGE}
                onPageChange={setCurrentPage}
                itemLabel="providers"
                className="mt-6"
              />
            </>
          ) : (
            <EmptyState onClear={clearFilters} />
          )}

          {/* ── SEO Content (bottom of left panel for crawlers) ── */}
          <section className="mt-12 pt-8 border-t border-gray-200">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex items-center gap-1.5 text-sm text-gray-400">
                {seoContent.breadcrumbs.map((crumb, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span>/</span>}
                    {crumb.href ? (
                      <a href={crumb.href} className="hover:text-primary-600 transition-colors">
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-gray-600">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <h2 className="text-xl font-bold text-gray-900 font-serif mb-2">
              {seoContent.h1}
            </h2>

            {seoContent.avgCost && (
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Avg. Cost: {seoContent.avgCost}
              </p>
            )}

            <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
              {seoContent.description}
            </p>
          </section>

          {/* ── Cross-links (SEO internal links) ── */}
          {crossLinks.length > 0 && (
            <section className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 font-serif mb-4">
                More Senior Care Options in {stateName}
              </h2>
              <div className="flex flex-wrap gap-2">
                {crossLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Right Panel — Fixed Map ── */}
      <div
        className="hidden lg:block fixed right-0 w-[45%] p-4 z-30"
        style={{
          top: navbarVisible ? "125px" : "61px",
          height: navbarVisible
            ? "calc(100vh - 125px)"
            : "calc(100vh - 61px)",
          transition:
            "top 200ms cubic-bezier(0.33, 1, 0.68, 1), height 200ms cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 isolate">
          <BrowseMap
            providers={filteredProviders}
            hoveredProviderId={hoveredProviderId}
            onMarkerHover={setHoveredProviderId}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No providers found
      </h3>
      <p className="text-gray-500 mb-6">
        Try adjusting your filters or search in a different area.
      </p>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
      >
        Clear all filters
      </button>
    </div>
  );
}
