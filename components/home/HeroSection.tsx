"use client";

import React, { useState, useRef } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useCitySearch } from "@/hooks/use-city-search";
import { citySearchService } from "@/lib/us-city-search";
import { useRouter } from "next/navigation";

const careTypeOptions = [
  { value: "home-care", label: "Home Care" },
  { value: "home-health", label: "Home Health" },
  { value: "assisted-living", label: "Assisted Living" },
  { value: "nursing-home", label: "Nursing Home" },
  { value: "memory-care", label: "Memory Care" },
  { value: "independent-living", label: "Independent Living" },
];

const stateAbbreviations: Record<string, string> = {
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

export default function HeroSection() {
  const [location, setLocation] = useState("");
  const [careType, setCareType] = useState("home-care");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showCareTypeDropdown, setShowCareTypeDropdown] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const router = useRouter();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const careTypeDropdownRef = useRef<HTMLDivElement>(null);

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

          const country = data.address?.country_code?.toUpperCase();
          if (country !== "US") {
            setIsGeolocating(false);
            return;
          }

          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "Unknown";
          const stateName = data.address?.state || "";
          const stateAbbr =
            stateAbbreviations[stateName] || stateName.substring(0, 2).toUpperCase();
          const locationString = `${city}, ${stateAbbr}`;
          setLocation(locationString);
        } catch {
          // Silently fail - keep placeholder visible
        }
        setIsGeolocating(false);
      },
      () => {
        setIsGeolocating(false);
      }
    );
  };

  const { results: cityResults, preload: preloadCities } = useCitySearch(location);

  useClickOutside(locationDropdownRef, () => setShowLocationDropdown(false));
  useClickOutside(careTypeDropdownRef, () => setShowCareTypeDropdown(false));

  /** Resolve a "City, ST" string to a power page URL and navigate. */
  const navigateToCityPage = (city: string, stateAbbrev: string) => {
    const stateName = Object.entries(stateAbbreviations).find(
      ([, abbr]) => abbr === stateAbbrev
    )?.[0];
    if (!stateName) return false;

    const stateSlug = stateName.toLowerCase().replace(/\s+/g, "-");
    const citySlug = city.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const categorySlug = careType === "home-health" ? "home-health-care" : careType;
    router.push(`/${categorySlug}/${stateSlug}/${citySlug}`);
    return true;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLocation = location.trim();

    if (trimmedLocation) {
      // 1. Structured "City, ST" — route directly to power page
      const match = trimmedLocation.match(/^(.+),\s*([A-Z]{2})$/);
      if (match) {
        if (navigateToCityPage(match[1].trim(), match[2])) return;
      }

      // 2. ZIP code — resolve to best city using already-loaded data
      if (/^\d{3,5}$/.test(trimmedLocation)) {
        // First try: hook results already in React state (fastest, zero work)
        const hookResult = cityResults[0];
        if (hookResult) {
          if (navigateToCityPage(hookResult.city, hookResult.state)) return;
        }
        // Fallback: synchronous lookup from the service's in-memory cache
        const serviceResult = citySearchService.search(trimmedLocation, 1)[0];
        if (serviceResult) {
          if (navigateToCityPage(serviceResult.city, serviceResult.state)) return;
        }
      }
    }

    // 3. Anything else — pass to browse page
    const params = new URLSearchParams();
    if (trimmedLocation) {
      params.set("location", trimmedLocation);
    }
    if (careType) {
      params.set("type", careType);
    }
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <section className="relative w-full min-h-[400px] sm:min-h-[460px] lg:min-h-[520px]">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/images/hero-home.jpg"
          alt="Family caring for loved one"
          className="absolute inset-0 w-full h-full object-cover object-[center_20%] sm:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/45 via-[35%] to-transparent sm:bg-gradient-to-r sm:from-black/60 sm:via-black/30 sm:to-transparent" />
      </div>

      {/* Content — left-aligned, bottom-anchored */}
      <div className="relative z-10 flex flex-col justify-end h-full min-h-[400px] sm:min-h-[460px] lg:min-h-[520px] pb-6 sm:pb-14 lg:pb-16">
        <div className="max-w-7xl mx-auto w-full relative px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
              Find the right care<br />
              <span className="text-primary-200">for your loved one</span>
            </h1>
            <p className="mt-1 sm:mt-3 text-base sm:text-lg text-white/80 max-w-md leading-relaxed">
              Home care, assisted living, memory care, and more.
            </p>

            {/* Search Bar */}
            <div className="mt-3 sm:mt-5 w-full">
              <form onSubmit={handleSearch}>
                <div className="bg-white/95 backdrop-blur-sm shadow-2xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl">
                  {/* Location Input with Dropdown */}
                  <div className="relative flex-1" ref={locationDropdownRef}>
                    <div
                      className={`flex items-center h-12 px-4 bg-gray-50 rounded-xl border transition-all duration-150 cursor-text ${
                        showLocationDropdown ? "border-primary-400 ring-2 ring-primary-100" : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setShowLocationDropdown(true);
                        locationInputRef.current?.focus();
                      }}
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
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <input
                        ref={locationInputRef}
                        type="text"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          setShowLocationDropdown(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && cityResults.length > 0 && location.trim()) {
                            // Auto-select the first suggestion before form submits
                            setLocation(cityResults[0].full);
                            setShowLocationDropdown(false);
                          }
                        }}
                        onFocus={(e) => {
                          setShowLocationDropdown(true);
                          preloadCities();
                          // On mobile, scroll the form into view so the
                          // dropdown isn't hidden behind the keyboard
                          if (window.innerWidth < 640) {
                            setTimeout(() => {
                              e.target.closest("form")?.scrollIntoView({ block: "start", behavior: "smooth" });
                            }, 300);
                          }
                        }}
                        placeholder="City or ZIP code"
                        className="w-full ml-3 bg-transparent border-none text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 text-base"
                      />
                    </div>

                    {/* Location Dropdown */}
                    {showLocationDropdown && (
                      <div className="absolute left-0 top-[calc(100%+6px)] w-full bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[60] max-h-[340px] animate-dropdown-pop overflow-y-auto">
                        {/* Use Current Location */}
                        <button
                          type="button"
                          onClick={() => {
                            detectLocation();
                            setShowLocationDropdown(false);
                          }}
                          disabled={isGeolocating}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-sm text-primary-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          {isGeolocating ? (
                            <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                            </svg>
                          )}
                          <span className="font-medium">{isGeolocating ? "Detecting location..." : "Use my current location"}</span>
                        </button>

                        {/* Divider */}
                        <div className="mx-4 my-1.5 h-px bg-gray-100" />

                        {/* Popular Cities Label */}
                        {!location.trim() && cityResults.length > 0 && (
                          <div className="px-4 pt-1 pb-1">
                            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Popular cities</span>
                          </div>
                        )}

                        {cityResults.length > 0 ? (
                          cityResults.map((loc, index) => (
                            <button
                              key={loc.full}
                              type="button"
                              onClick={() => {
                                setLocation(loc.full);
                                setShowLocationDropdown(false);
                              }}
                              className={`flex items-center gap-2.5 w-full px-4 py-2 text-left text-sm transition-colors ${
                                location === loc.full
                                  ? "bg-primary-50 text-primary-700"
                                  : index === 0 && location.trim()
                                    ? "bg-gray-50 text-gray-900"
                                    : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{loc.full}</span>
                              {index === 0 && location.trim() && (
                                <span className="ml-auto text-xs text-gray-400">Enter</span>
                              )}
                            </button>
                          ))
                        ) : location.trim() ? (
                          <div className="px-4 py-3 text-center">
                            <p className="text-sm text-gray-500">No locations found</p>
                            <p className="text-xs text-gray-400 mt-1">Try a city name, state, or ZIP code</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Care Type Dropdown */}
                  <div className="relative flex-1" ref={careTypeDropdownRef}>
                    <div
                      className={`flex items-center h-12 px-4 bg-gray-50 rounded-xl border transition-all duration-150 cursor-pointer ${
                        showCareTypeDropdown ? "border-primary-400 ring-2 ring-primary-100" : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setShowCareTypeDropdown(!showCareTypeDropdown)}
                    >
                      <span className="flex-1 text-base text-left text-gray-900 truncate">
                        {careTypeOptions.find(opt => opt.value === careType)?.label}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showCareTypeDropdown ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Care Type Dropdown Menu */}
                    {showCareTypeDropdown && (
                      <div className="absolute left-0 top-[calc(100%+8px)] w-full bg-white rounded-2xl shadow-lg shadow-black/8 border border-gray-100 p-1.5 z-[60] animate-dropdown-pop">
                        {careTypeOptions.map((option) => {
                          const isSelected = careType === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setCareType(option.value);
                                setShowCareTypeDropdown(false);
                              }}
                              className={`flex items-center gap-3 w-full px-3 py-2.5 text-left rounded-lg transition-all duration-150 ${
                                isSelected
                                  ? "bg-primary-50 text-primary-700"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                                isSelected ? "bg-primary-500" : "bg-transparent"
                              }`} />
                              <span className={`text-[15px] ${isSelected ? "font-semibold" : "font-medium"}`}>
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Search Button */}
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-base px-6 h-12 rounded-xl shadow-lg shadow-primary-600/25 transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Secondary path for unsure users */}
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-white/60">Not sure where to start?</span>
                <a
                  href="/benefits"
                  className="text-sm font-medium text-primary-200 hover:text-white transition-colors underline underline-offset-2 decoration-primary-200/40 hover:decoration-white/60"
                >
                  Find local help
                </a>
              </div>
            </div>
          </div>

          {/* NIH badge — bottom-right of hero */}
          <div className="absolute -bottom-4 right-0 hidden sm:flex items-center gap-2">
            <img
              src="/images/nia-logo.png"
              alt="NIH"
              className="h-8 w-auto brightness-0 invert opacity-90"
            />
            <div className="text-white/90 leading-[1.2]">
              <span className="block text-white/50 text-[10px]">Proudly supported by</span>
              <span className="text-[11px] font-medium">National Institute on Aging</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
