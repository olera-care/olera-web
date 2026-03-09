"use client";

import { useState, useRef, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { useCitySearch } from "@/hooks/use-city-search";
import {
  SERVICE_OPTIONS,
  PAYMENT_OPTIONS,
  TIMELINE_OPTIONS,
  type MatchesFilters,
} from "./MatchesFilterBar";

// ── State Abbreviations (for geolocation) ──

const STATE_ABBREVIATIONS: Record<string, string> = {
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

// ── Icons ──

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function LocationIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function CurrentLocationIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </svg>
  );
}

function SpinnerIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ── Types ──

export type FilterSheetType = "location" | "services" | "payment" | "timeline";

interface MatchesFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  type: FilterSheetType;
  filters: MatchesFilters;
  onChange: (filters: MatchesFilters) => void;
  resultCount: number;
  providerLocation: string | null;
}

// ── Sheet Titles ──

const SHEET_TITLES: Record<FilterSheetType, string> = {
  location: "Location",
  services: "Services",
  payment: "Payment methods",
  timeline: "Timeline",
};

// ── Main Component ──

export default function MatchesFilterSheet({
  isOpen,
  onClose,
  type,
  filters,
  onChange,
  resultCount,
  providerLocation,
}: MatchesFilterSheetProps) {
  // Get title for header
  const title = SHEET_TITLES[type];

  // Location search state
  const [locationQuery, setLocationQuery] = useState("");
  const [isGeolocating, setIsGeolocating] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // City search hook
  const { results: cityResults, preload: preloadCities } = useCitySearch(locationQuery);

  // Geolocation handler
  const detectLocation = useCallback(() => {
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
            STATE_ABBREVIATIONS[stateName] || stateName.substring(0, 2).toUpperCase();
          const locationString = `${city}, ${stateAbbr}`;
          onChange({ ...filters, location: locationString });
          setLocationQuery("");
          onClose();
        } catch {
          // Silently fail
        }
        setIsGeolocating(false);
      },
      () => {
        setIsGeolocating(false);
      }
    );
  }, [filters, onChange, onClose]);

  // Clear handler for multi-select types
  const handleClear = () => {
    if (type === "services") {
      onChange({ ...filters, services: [] });
    } else if (type === "payment") {
      onChange({ ...filters, payment: [] });
    } else if (type === "location") {
      onChange({ ...filters, location: null });
    } else if (type === "timeline") {
      onChange({ ...filters, timeline: "all" });
    }
  };

  // Check if clear should be shown
  const showClear =
    (type === "services" && filters.services.length > 0) ||
    (type === "payment" && filters.payment.length > 0) ||
    (type === "location" && filters.location !== null) ||
    (type === "timeline" && filters.timeline !== "all");

  // Toggle helpers
  const toggleService = (id: string) => {
    const newServices = filters.services.includes(id)
      ? filters.services.filter((s) => s !== id)
      : [...filters.services, id];
    onChange({ ...filters, services: newServices });
  };

  const togglePayment = (id: string) => {
    const newPayment = filters.payment.includes(id)
      ? filters.payment.filter((p) => p !== id)
      : [...filters.payment, id];
    onChange({ ...filters, payment: newPayment });
  };

  // Render content based on type
  const renderContent = () => {
    switch (type) {
      case "location":
        return (
          <div className="space-y-3">
            {/* Search input */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-colors">
              <LocationIcon className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={locationInputRef}
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onFocus={preloadCities}
                placeholder="Search city or ZIP code..."
                className="flex-1 bg-transparent border-none text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
              />
            </div>

            {/* Use current location */}
            <button
              type="button"
              onClick={detectLocation}
              disabled={isGeolocating}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-left text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
            >
              {isGeolocating ? (
                <SpinnerIcon className="w-5 h-5 shrink-0" />
              ) : (
                <CurrentLocationIcon className="w-5 h-5 shrink-0" />
              )}
              <span className="text-[15px] font-medium">
                {isGeolocating ? "Detecting location..." : "Use my current location"}
              </span>
            </button>

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Quick options */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onChange({ ...filters, location: null });
                  setLocationQuery("");
                  onClose();
                }}
                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-left transition-colors ${
                  filters.location === null
                    ? "bg-primary-50 border border-primary-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <span className="text-[15px] text-gray-900">All locations</span>
                {filters.location === null && (
                  <CheckIcon className="w-5 h-5 text-primary-600 shrink-0" />
                )}
              </button>
              {providerLocation && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...filters, location: providerLocation });
                    setLocationQuery("");
                    onClose();
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-left transition-colors ${
                    filters.location === providerLocation
                      ? "bg-primary-50 border border-primary-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[15px] text-gray-900">{providerLocation}</span>
                  {filters.location === providerLocation && (
                    <CheckIcon className="w-5 h-5 text-primary-600 shrink-0" />
                  )}
                </button>
              )}
            </div>

            {/* City suggestions */}
            {locationQuery.trim() && cityResults.length > 0 && (
              <>
                <div className="h-px bg-gray-100" />
                <div className="space-y-1">
                  <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Suggestions
                  </p>
                  {cityResults.slice(0, 6).map((city) => (
                    <button
                      key={city.full}
                      type="button"
                      onClick={() => {
                        onChange({ ...filters, location: city.full });
                        setLocationQuery("");
                        onClose();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left hover:bg-gray-50 transition-colors"
                    >
                      <LocationIcon className="w-4 h-4 text-gray-300 shrink-0" />
                      <span className="text-[15px] text-gray-900">{city.full}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* No results */}
            {locationQuery.trim() && cityResults.length === 0 && (
              <div className="py-4 text-center">
                <p className="text-[15px] text-gray-500">No locations found</p>
                <p className="text-sm text-gray-400 mt-1">Try a city name or ZIP code</p>
              </div>
            )}
          </div>
        );

      case "services":
        return (
          <div className="space-y-1 pt-2">
            {SERVICE_OPTIONS.map((opt) => {
              const isSelected = filters.services.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary-50 border border-primary-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[15px] text-gray-900">{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleService(opt.id)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              );
            })}
          </div>
        );

      case "payment":
        return (
          <div className="space-y-1 pt-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const isSelected = filters.payment.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary-50 border border-primary-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[15px] text-gray-900">{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePayment(opt.id)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              );
            })}
          </div>
        );

      case "timeline":
        return (
          <div className="space-y-1 pt-2">
            {TIMELINE_OPTIONS.map((opt) => {
              const isSelected = filters.timeline === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange({ ...filters, timeline: opt.id });
                    onClose();
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? "bg-primary-50 border border-primary-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[15px] text-gray-900">{opt.label}</span>
                  {isSelected && (
                    <CheckIcon className="w-5 h-5 text-primary-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  // Footer for multi-select types (services, payment)
  const showFooter = type === "services" || type === "payment";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        showFooter ? (
          <button
            type="button"
            onClick={onClose}
            disabled={resultCount === 0}
            className={`w-full py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${
              resultCount === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-primary-600 text-white hover:bg-primary-700"
            }`}
          >
            Show {resultCount} {resultCount === 1 ? "match" : "matches"}
          </button>
        ) : undefined
      }
    >
      {/* Clear button for multi-select types */}
      {showClear && (
        <div className="flex justify-end -mt-2 mb-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Clear
          </button>
        </div>
      )}
      {renderContent()}
    </Modal>
  );
}
