"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useProviderDashboardData } from "@/hooks/useProviderDashboardData";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage, getFreeConnectionsRemaining, FREE_CONNECTION_LIMIT, isProfileShareable } from "@/lib/membership";
import type { Profile, FamilyMetadata } from "@/lib/types";
import { avatarGradient } from "@/components/portal/ConnectionDetailContent";
import { calculateProfileCompleteness, type ExtendedMetadata } from "@/lib/profile-completeness";
import {
  type MatchesFilters,
  DEFAULT_FILTERS,
} from "@/components/provider/matches/MatchesFilterBar";
import FamilyMatchCard from "@/components/provider/matches/FamilyMatchCard";
import { useCitySearch } from "@/hooks/use-city-search";

// Tab types for the matches view
type MatchesTab = "best_match" | "most_recent" | "most_urgent" | "reached_out";
import ReachOutDrawer from "@/components/provider/matches/ReachOutDrawer";
import Pagination from "@/components/ui/Pagination";


// ── Timeline config ──

const TIMELINE_CONFIG: Record<string, { label: string; dot: string; glow: string; border: string; text: string; bg: string }> = {
  immediate: { label: "Immediate", dot: "bg-red-400", glow: "glowRed", border: "border-red-200", text: "text-red-600", bg: "bg-red-50/50" },
  within_1_month: { label: "Within 1 month", dot: "bg-amber-400", glow: "glowAmber", border: "border-amber-200", text: "text-amber-600", bg: "bg-amber-50/50" },
  within_3_months: { label: "Within 3 months", dot: "bg-blue-400", glow: "glowBlue", border: "border-blue-200", text: "text-blue-600", bg: "bg-blue-50/50" },
  exploring: { label: "Exploring", dot: "bg-warm-300", glow: "glowWarm", border: "border-warm-200", text: "text-gray-500", bg: "bg-warm-50/50" },
};


// ── Helpers ──

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function blurName(name: string): string {
  if (!name) return "***";
  return name.charAt(0) + "***";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function computeMatchingServices(
  familyNeeds: string[],
  providerServices: string[],
): number {
  if (!familyNeeds.length || !providerServices.length) return 0;
  const providerSet = new Set(providerServices.map((s) => s.toLowerCase()));
  return familyNeeds.filter((n) => providerSet.has(n.toLowerCase())).length;
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3959; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDriveTime(miles: number): string {
  const minutes = Math.round(miles / 0.5); // ~30 mph avg
  if (minutes < 1) return "1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

const URGENCY_ORDER: Record<string, number> = {
  immediate: 0,
  within_1_month: 1,
  within_3_months: 2,
  exploring: 3,
};

const DEFAULT_NOTE_KEY = "olera_default_reachout_note";
const PAGE_SIZE = 12;

// ── Inline keyframes ──

const floatKeyframes = `
@keyframes matchFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes glowRed {
  0%, 100% { box-shadow: 0 0 3px 1px rgba(248,113,113,0.3); }
  50% { box-shadow: 0 0 8px 3px rgba(248,113,113,0.6); }
}
@keyframes glowAmber {
  0%, 100% { box-shadow: 0 0 3px 1px rgba(251,191,36,0.3); }
  50% { box-shadow: 0 0 8px 3px rgba(251,191,36,0.6); }
}
@keyframes glowBlue {
  0%, 100% { box-shadow: 0 0 3px 1px rgba(96,165,250,0.3); }
  50% { box-shadow: 0 0 8px 3px rgba(96,165,250,0.6); }
}
@keyframes glowWarm {
  0%, 100% { box-shadow: 0 0 3px 1px rgba(168,162,158,0.25); }
  50% { box-shadow: 0 0 8px 3px rgba(168,162,158,0.45); }
}
`;

// ---------------------------------------------------------------------------
// State abbreviations for geolocation
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Care Illustration SVG Component
// ---------------------------------------------------------------------------

function CareIllustration({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="110" cy="80" r="70" fill="#d6cec4" fillOpacity="0.3" />

      {/* Chair 1 (left) */}
      <path d="M35 130 Q30 100 35 80 Q40 75 50 75 L55 130 Z" fill="#c4b8a8" />
      <path d="M50 75 Q65 75 70 80 Q75 100 70 130 L55 130 Z" fill="#b8a898" />

      {/* Chair 2 (right) */}
      <path d="M110 130 Q105 100 110 80 Q115 75 125 75 L130 130 Z" fill="#c4b8a8" />
      <path d="M125 75 Q140 75 145 80 Q150 100 145 130 L130 130 Z" fill="#b8a898" />

      {/* Senior person (left) */}
      {/* Head */}
      <circle cx="52" cy="45" r="18" fill="#e8d5b7" />
      {/* White hair */}
      <ellipse cx="52" cy="38" rx="16" ry="12" fill="#f5f5f5" />
      <path d="M36 42 Q36 30 52 28 Q68 30 68 42" fill="#f5f5f5" />
      {/* Face */}
      <circle cx="46" cy="46" r="2" fill="#4a4a4a" /> {/* Eye */}
      <circle cx="58" cy="46" r="2" fill="#4a4a4a" /> {/* Eye */}
      <path d="M48 54 Q52 57 56 54" stroke="#c4a882" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Body */}
      <path d="M35 65 Q40 60 52 60 Q64 60 69 65 L72 110 L32 110 Z" fill="#f5f5f5" />
      {/* Hands reaching out */}
      <ellipse cx="78" cy="90" rx="8" ry="6" fill="#e8d5b7" />

      {/* Caregiver (right) */}
      {/* Head */}
      <circle cx="128" cy="42" r="20" fill="#8b6f4e" />
      {/* Hair */}
      <ellipse cx="128" cy="32" rx="18" ry="14" fill="#3d2b1f" />
      <path d="M110 38 Q110 22 128 20 Q146 22 146 38" fill="#3d2b1f" />
      {/* Hair bun with accessory */}
      <circle cx="140" cy="22" r="8" fill="#3d2b1f" />
      <circle cx="144" cy="18" r="4" fill="#e8a0a0" /> {/* Pink accessory */}
      {/* Face */}
      <circle cx="122" cy="44" r="2.5" fill="#2d2d2d" /> {/* Eye */}
      <circle cx="134" cy="44" r="2.5" fill="#2d2d2d" /> {/* Eye */}
      <path d="M123 52 Q128 56 133 52" stroke="#6d5a4a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Body - teal scrubs */}
      <path d="M108 62 Q115 58 128 58 Q141 58 148 62 L152 115 L104 115 Z" fill="#199087" />
      {/* Hands reaching to senior */}
      <ellipse cx="98" cy="88" rx="8" ry="6" fill="#8b6f4e" />

      {/* Connection heart between hands */}
      <path d="M88 85 Q88 80 92 80 Q96 80 96 85 Q96 80 100 80 Q104 80 104 85 Q104 92 96 98 Q88 92 88 85 Z" fill="#199087" fillOpacity="0.3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Location Selector Component (shared across banner variants)
// ---------------------------------------------------------------------------

function LocationSelector({
  currentLocation,
  providerLocation,
  onLocationChange,
}: {
  currentLocation: string | null;
  providerLocation: string | null;
  onLocationChange: (location: string | null) => void;
}) {
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [isGeolocating, setIsGeolocating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results: cityResults, preload: preloadCities } = useCitySearch(locationInput, {
    limit: 6,
  });

  useEffect(() => {
    if (!locationOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [locationOpen]);

  useEffect(() => {
    if (!locationOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLocationOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [locationOpen]);

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
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Unknown";
          const stateName = data.address?.state || "";
          const stateAbbr = STATE_ABBREVIATIONS[stateName] || stateName.substring(0, 2).toUpperCase();
          onLocationChange(`${city}, ${stateAbbr}`);
          setLocationInput("");
          setLocationOpen(false);
        } catch { /* Silently fail */ }
        setIsGeolocating(false);
      },
      () => setIsGeolocating(false)
    );
  }, [onLocationChange]);

  const handleSelectLocation = useCallback((location: string | null) => {
    onLocationChange(location);
    setLocationInput("");
    setLocationOpen(false);
  }, [onLocationChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && cityResults.length > 0 && locationInput.trim()) {
      e.preventDefault();
      handleSelectLocation(cityResults[0].full);
    }
  }, [cityResults, locationInput, handleSelectLocation]);

  const displayLocation = currentLocation || providerLocation || "All locations";

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setLocationOpen(!locationOpen);
          if (!locationOpen) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/90 hover:bg-white rounded-full border border-gray-200/80 shadow-sm transition-all group"
      >
        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
        <span className="text-sm font-semibold text-primary-700">{displayLocation}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${locationOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {locationOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-72 bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden z-50 animate-fade-in">
          <div className="p-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onFocus={preloadCities}
                onKeyDown={handleKeyDown}
                placeholder="City or ZIP code"
                className="flex-1 bg-transparent border-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
              />
              {locationInput && (
                <button type="button" onClick={() => setLocationInput("")} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto py-1">
            <button type="button" onClick={detectLocation} disabled={isGeolocating} className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-sm text-primary-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
              {isGeolocating ? (
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                </svg>
              )}
              <span className="font-medium">{isGeolocating ? "Detecting..." : "Use my current location"}</span>
            </button>
            <div className="mx-3.5 my-1 h-px bg-gray-100" />
            <button type="button" onClick={() => handleSelectLocation(null)} className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${currentLocation === null ? "bg-primary-50 text-primary-700" : "text-gray-700"}`}>
              {currentLocation === null ? (
                <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : <span className="w-4" />}
              <span>All locations</span>
            </button>
            {providerLocation && (
              <button type="button" onClick={() => handleSelectLocation(providerLocation)} className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${currentLocation === providerLocation ? "bg-primary-50 text-primary-700" : "text-gray-700"}`}>
                {currentLocation === providerLocation ? (
                  <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                )}
                <span>{providerLocation}</span>
                <span className="ml-auto text-xs text-gray-400">Your area</span>
              </button>
            )}
            {locationInput.trim() && cityResults.length > 0 && (
              <>
                <div className="mx-3.5 my-1 h-px bg-gray-100" />
                {cityResults.map((city, index) => (
                  <button key={city.full} type="button" onClick={() => handleSelectLocation(city.full)} className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-sm transition-colors ${currentLocation === city.full ? "bg-primary-50 text-primary-700" : index === 0 ? "bg-gray-50 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}>
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span>{city.full}</span>
                    {index === 0 && <span className="ml-auto text-xs text-gray-400">Enter</span>}
                  </button>
                ))}
              </>
            )}
            {!locationInput.trim() && cityResults.length > 0 && (
              <>
                <div className="mx-3.5 my-1 h-px bg-gray-100" />
                <div className="px-3.5 pt-1.5 pb-1">
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Popular cities</span>
                </div>
                {cityResults.slice(0, 5).map((city) => (
                  <button key={city.full} type="button" onClick={() => handleSelectLocation(city.full)} className={`flex items-center gap-2.5 w-full px-3.5 py-2 text-left text-sm transition-colors ${currentLocation === city.full ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50"}`}>
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span>{city.full}</span>
                  </button>
                ))}
              </>
            )}
            {locationInput.trim() && cityResults.length === 0 && (
              <div className="px-3.5 py-4 text-center">
                <p className="text-sm text-gray-500">No locations found</p>
                <p className="text-xs text-gray-400 mt-1">Try a city name or ZIP code</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Discovery Banner Variants
// ---------------------------------------------------------------------------

type BannerVariant = "illustrated" | "editorial" | "minimal";

function DiscoveryBanner({
  familyCount,
  currentLocation,
  providerLocation,
  onLocationChange,
  variant = "illustrated",
}: {
  familyCount: number;
  currentLocation: string | null;
  providerLocation: string | null;
  onLocationChange: (location: string | null) => void;
  variant?: BannerVariant;
}) {
  // Variant 1: Illustrated (matches your reference image)
  if (variant === "illustrated") {
    return (
      <div className="relative rounded-3xl overflow-hidden">
        {/* Warm cream background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #f5f1eb 0%, #ebe5dc 50%, #e5ded3 100%)' }} />

        {/* Subtle organic shape accent */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #c9bfb0 0%, transparent 70%)' }} />

        <div className="relative flex items-center justify-between px-6 py-6 sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          {/* Left: Content */}
          <div className="flex-1 max-w-xl">
            {/* Location pill */}
            <div className="mb-5">
              <LocationSelector
                currentLocation={currentLocation}
                providerLocation={providerLocation}
                onLocationChange={onLocationChange}
              />
            </div>

            {/* Large serif headline */}
            <h1 className="font-display text-[28px] sm:text-[34px] lg:text-[40px] font-bold leading-[1.15] tracking-tight text-gray-900">
              <span className="text-gray-900">{familyCount} {familyCount === 1 ? 'family is' : 'families are'} looking</span>
              <br />
              <span className="text-gray-900">for care near you</span>
            </h1>

            {/* Subtitle with accent */}
            <p className="mt-4 text-[15px] sm:text-base text-gray-600 leading-relaxed">
              First to reach out is <span className="font-semibold text-primary-600">3× more likely</span> to connect.
            </p>
          </div>

          {/* Right: Illustration (desktop) */}
          <div className="hidden lg:block flex-shrink-0 ml-8">
            <CareIllustration className="w-44 h-40" />
          </div>
        </div>
      </div>
    );
  }

  // Variant 2: Editorial (clean typography focus, no illustration)
  if (variant === "editorial") {
    return (
      <div className="relative rounded-3xl overflow-hidden">
        {/* Pure white with subtle warm tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-vanilla-50/50 to-vanilla-100/30" />

        {/* Accent line */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 via-primary-500 to-primary-600" />

        <div className="relative px-8 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          {/* Location - smaller, inline */}
          <div className="flex items-center gap-3 mb-6">
            <LocationSelector
              currentLocation={currentLocation}
              providerLocation={providerLocation}
              onLocationChange={onLocationChange}
            />
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500">Updated live</span>
          </div>

          {/* Large number + text split */}
          <div className="flex items-baseline gap-4">
            <span className="font-display text-[72px] sm:text-[88px] lg:text-[100px] font-bold leading-none tracking-tighter text-primary-600">
              {familyCount}
            </span>
            <div className="pb-2">
              <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-medium leading-snug tracking-tight text-gray-900">
                {familyCount === 1 ? 'family is' : 'families are'} looking
                <br />
                for care near you
              </h1>
            </div>
          </div>

          {/* Subtle divider + CTA text */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-[15px] text-gray-500">
              Providers who respond first are <span className="font-semibold text-gray-800">3× more likely</span> to connect with families.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Variant 3: Minimal (compact, clean)
  return (
    <div className="relative rounded-2xl border border-gray-200/80 bg-white">
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-5">
            {/* Count badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="font-display text-2xl font-bold text-white">{familyCount}</span>
            </div>

            <div>
              <h1 className="font-display text-lg sm:text-xl font-semibold text-gray-900">
                {familyCount === 1 ? 'Family' : 'Families'} looking for care
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                First to respond is <span className="font-medium text-primary-600">3× more likely</span> to connect
              </p>
            </div>
          </div>

          {/* Right side - location */}
          <LocationSelector
            currentLocation={currentLocation}
            providerLocation={providerLocation}
            onLocationChange={onLocationChange}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Matches Tabs (replaces filter bar)
// ---------------------------------------------------------------------------

const TABS: { id: MatchesTab; label: string }[] = [
  { id: "best_match", label: "Best Matches" },
  { id: "most_recent", label: "Most Recent" },
  { id: "most_urgent", label: "Urgent First" },
  { id: "reached_out", label: "Reached Out" },
];

function MatchesTabs({
  activeTab,
  onTabChange,
  reachedOutCount,
}: {
  activeTab: MatchesTab;
  onTabChange: (tab: MatchesTab) => void;
  reachedOutCount: number;
}) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-6 lg:gap-8">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === "reached_out" && reachedOutCount > 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative pb-3 text-[15px] transition-colors ${
                  isActive
                    ? "font-semibold text-gray-900"
                    : "font-normal text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {showBadge && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold text-white bg-gray-700 rounded-full">
                      {reachedOutCount}
                    </span>
                  )}
                </span>
                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile Snapshot Card (Upwork-style sidebar header)
// ---------------------------------------------------------------------------

function ProfileSnapshotCard({
  profile,
  completeness,
}: {
  profile: Profile;
  completeness: number;
}) {
  const displayName = profile.display_name || "Your Business";
  const category = profile.category || profile.care_types?.[0] || "Care Provider";
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start gap-3.5">
        {/* Profile image or initials */}
        {profile.image_url ? (
          <Image
            src={profile.image_url}
            alt={displayName}
            width={52}
            height={52}
            className="w-13 h-13 rounded-xl object-cover shrink-0"
            style={{ width: 52, height: 52 }}
          />
        ) : (
          <div
            className="w-13 h-13 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: avatarGradient(displayName), width: 52, height: 52 }}
          >
            {initials}
          </div>
        )}

        {/* Name and category */}
        <div className="flex-1 min-w-0 pt-0.5">
          <Link
            href={profile.slug ? `/provider/${profile.slug}` : "/provider"}
            className="block text-[15px] font-semibold text-gray-900 hover:underline truncate leading-tight"
          >
            {displayName}
          </Link>
          <p className="text-sm text-gray-500 truncate mt-0.5">
            {category}
          </p>
        </div>
      </div>

      {/* Complete your profile link */}
      <Link
        href="/provider"
        className="inline-block text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline mt-4 transition-colors"
      >
        Complete your profile
      </Link>

      {/* Progress bar - simple, Upwork style */}
      <div className="flex items-center gap-3 mt-2">
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 tabular-nums">{completeness}%</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckCircleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function LocationIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function PeopleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function MatchesSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-32 bg-warm-100 rounded-lg mb-2.5" />
          <div className="h-4 w-96 bg-warm-50 rounded" />
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-11 w-[420px] bg-vanilla-50 border border-warm-100/60 rounded-xl" />
          <div className="h-5 w-32 bg-warm-50 rounded" />
        </div>
        <div className="h-16 bg-white rounded-2xl border border-warm-100/60 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-warm-100/60 overflow-hidden">
                <div className="p-7">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-warm-100 shrink-0" />
                    <div className="flex-1">
                      <div className="h-5 w-40 bg-warm-100 rounded mb-2" />
                      <div className="h-3.5 w-24 bg-warm-50 rounded" />
                    </div>
                    <div className="h-7 w-24 bg-warm-50 rounded-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-px bg-warm-100/60 rounded-xl overflow-hidden mb-5">
                    {[0, 1, 2].map((j) => (
                      <div key={j} className="bg-warm-50/50 py-3 px-4">
                        <div className="h-4 w-20 bg-warm-100 rounded mx-auto" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 mb-5 pl-4 border-l-2 border-warm-100">
                    <div className="h-3.5 bg-warm-50 rounded w-full" />
                    <div className="h-3.5 bg-warm-50 rounded w-4/5" />
                  </div>
                  <div className="flex gap-2.5">
                    <div className="h-8 w-24 bg-warm-50 rounded-full" />
                    <div className="h-8 w-28 bg-warm-50 rounded-full" />
                  </div>
                </div>
                <div className="bg-warm-50/40 px-7 py-4">
                  <div className="h-4 w-48 bg-warm-100/60 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="h-72 bg-warm-50/50 rounded-2xl border border-warm-100/60" />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function MatchesEmptyState() {
  return (
    <div className="lg:col-span-2">
      <div className="flex flex-col items-center text-center py-20 px-8">
        <div
          className="w-16 h-16 rounded-2xl bg-warm-100/60 border border-warm-200/50 flex items-center justify-center mb-6"
          style={{ animation: "matchFloat 3s ease-in-out infinite" }}
        >
          <PeopleIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-display font-bold text-gray-900">
          No families found yet
        </h3>
        <p className="text-[15px] text-gray-500 mt-2 leading-relaxed max-w-sm">
          When families publish care profiles matching your services and location,
          they&apos;ll appear here. Check back soon.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReachedOutCard — Full card for Reached Out tab
// Three visual states: Pending Reply (amber), Connected (teal), Not a match (grey)
// ---------------------------------------------------------------------------

function ReachedOutCard({
  family,
  connectionInfo,
  isConnected,
  isDeclined,
  reminderSent,
  onSendReminder,
  onArchive,
  sendingReminder,
}: {
  family: Profile;
  connectionInfo: {
    id: string;
    message: string | null;
    created_at: string;
    status: "pending" | "accepted" | "declined";
    reply_message?: string | null;
    replied_at?: string | null;
    reminder_sent?: boolean;
  };
  isConnected: boolean;
  isDeclined: boolean;
  reminderSent: boolean;
  onSendReminder: (connectionId: string) => void;
  onArchive: (connectionId: string) => void;
  sendingReminder: boolean;
}) {
  const displayName = family.display_name || "Family";
  const initials = getInitials(displayName);
  const locationStr = [family.city, family.state].filter(Boolean).join(", ");
  const meta = family.metadata as FamilyMetadata;
  const timeline = meta?.timeline ? TIMELINE_CONFIG[meta.timeline] : null;

  // Calculate hours since reach-out
  const reachedOutAt = new Date(connectionInfo.created_at);
  const hoursSinceReachOut = Math.floor((Date.now() - reachedOutAt.getTime()) / (1000 * 60 * 60));
  const canSendReminder = hoursSinceReachOut >= 48 && !reminderSent && !isConnected && !isDeclined;
  const hoursUntilReminder = Math.max(0, 48 - hoursSinceReachOut);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Border and accent colors based on state
  const borderColor = isDeclined ? "#9ca3af" : isConnected ? "#2a7a6e" : "#b86e1a";
  const pillBg = isDeclined ? "bg-gray-100" : isConnected ? "bg-teal-50" : "bg-amber-50";
  const pillText = isDeclined ? "text-gray-600" : isConnected ? "text-teal-700" : "text-amber-700";
  const pillBorder = isDeclined ? "border-gray-200" : isConnected ? "border-teal-200" : "border-amber-200";

  return (
    <div
      className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden"
      style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
    >
      <div className="p-5">
        {/* Header row: Avatar + Name/Location + Status pill */}
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white shadow-sm"
            style={{ background: avatarGradient(displayName) }}
          >
            {initials}
          </div>

          {/* Name + location + timeline */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-gray-900 truncate">{displayName}</p>
            {locationStr && (
              <p className="text-sm text-gray-500 truncate">{locationStr}</p>
            )}
            {/* Timeline badge */}
            {timeline && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border mt-1.5 ${timeline.border} ${timeline.text} ${timeline.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${timeline.dot}`} />
                {timeline.label}
              </span>
            )}
          </div>

          {/* Status pill */}
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full shrink-0 border ${pillBg} ${pillText} ${pillBorder}`}>
            {isDeclined ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>Not a match</span>
              </>
            ) : isConnected ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>Connected</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>Pending reply</span>
              </>
            )}
          </div>
        </div>

        {/* YOUR MESSAGE block (always shown) */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Your message</p>
          <div className="bg-warm-50/50 rounded-lg px-3.5 py-3 border border-warm-100/60">
            <p className="text-sm text-gray-600 italic leading-relaxed">
              {connectionInfo.message || "No message sent."}
            </p>
          </div>
        </div>

        {/* CONNECTED STATE: Their reply + Contact details */}
        {isConnected && (
          <>
            {/* THEIR REPLY block */}
            {connectionInfo.reply_message && (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Their reply</p>
                <div className="bg-teal-50/50 rounded-lg px-3.5 py-3 border border-teal-100/60">
                  <p className="text-sm text-gray-700 italic leading-relaxed">
                    {connectionInfo.reply_message}
                  </p>
                </div>
              </div>
            )}

            {/* CONTACT DETAILS UNLOCKED */}
            <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Contact details unlocked</p>
              </div>

              <div className="space-y-2.5">
                {/* Email */}
                {family.email && (
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <a href={`mailto:${family.email}`} className="text-sm text-primary-600 hover:underline">
                      {family.email}
                    </a>
                  </div>
                )}

                {/* Phone */}
                {family.phone && (
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    <a href={`tel:${family.phone}`} className="text-sm text-primary-600 hover:underline">
                      {family.phone}
                    </a>
                  </div>
                )}

                {/* Preferred contact method */}
                {meta?.contact_preference && (
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Prefers <span className="font-medium capitalize">{meta.contact_preference}</span>
                    </span>
                  </div>
                )}

                {/* Connected timestamp */}
                {connectionInfo.replied_at && (
                  <div className="flex items-center gap-2.5 pt-1.5 border-t border-gray-200/60">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      Connected {formatDate(connectionInfo.replied_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* View in Leads link */}
            <div className="mt-4 flex justify-end">
              <Link
                href="/provider/leads"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors group"
              >
                View in Leads
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </>
        )}

        {/* DECLINED STATE: Archive link */}
        {isDeclined && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Reached out {timeAgo(connectionInfo.created_at)}
            </p>
            <button
              type="button"
              onClick={() => onArchive(connectionInfo.id)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Archive
            </button>
          </div>
        )}

        {/* PENDING STATE: Follow-up reminder logic */}
        {!isConnected && !isDeclined && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Reached out {timeAgo(connectionInfo.created_at)}
            </p>

            {/* Follow-up status/button */}
            {reminderSent || connectionInfo.reminder_sent ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Reminder sent
              </span>
            ) : canSendReminder ? (
              <button
                type="button"
                onClick={() => onSendReminder(connectionInfo.id)}
                disabled={sendingReminder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full transition-colors disabled:opacity-50"
              >
                {sendingReminder ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Send a reminder
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs text-gray-400">
                Follow-up available in {hoursUntilReminder}h
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Matches Sidebar (sticky — mirrors dashboard completeness sidebar)
// ---------------------------------------------------------------------------

// Avatar colors by position
const AVATAR_COLORS = [
  { bg: "#d4ede7", text: "#1a6055" }, // green
  { bg: "#fce5d8", text: "#a04020" }, // orange
  { bg: "#e0ddf4", text: "#4838a0" }, // purple
  { bg: "#fcdede", text: "#982828" }, // red
];

function getInitialsForSidebar(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function MatchesSidebar({
  families,
  contactedIds,
  providerLocation,
}: {
  families: Profile[];
  contactedIds: Set<string>;
  providerLocation: string | null;
}) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  // Calculate counts
  const totalFamilies = families.length;
  const contactedCount = contactedIds.size;
  const remainingFamilies = totalFamilies - contactedCount;

  // Determine state
  const isZeroOutreach = contactedCount === 0;
  const isActive = contactedCount > 0;

  // Get families for avatar display (up to 4 + overflow)
  const displayFamilies = families.slice(0, 4);
  const overflowCount = Math.max(0, totalFamilies - 4);

  return (
    <div className="space-y-3">
      {/* ── Main sidebar card ── */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
        <div className="p-5">
          {/* ── STATE 1: ZERO OUTREACH ── */}
          {isZeroOutreach && totalFamilies > 0 && (
            <>
              {/* Full Access header */}
              <div className="flex items-center gap-1.5 mb-5">
                <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-[10.5px] font-bold text-primary-600 uppercase tracking-wide">
                  Full Access {providerLocation && `· ${providerLocation}`}
                </span>
              </div>

              {/* Avatar stack - all bright */}
              <div className="flex items-center mb-4">
                {displayFamilies.map((family, index) => (
                  <div
                    key={family.id}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-[2.5px] border-white"
                    style={{
                      backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length].bg,
                      color: AVATAR_COLORS[index % AVATAR_COLORS.length].text,
                      marginRight: index < displayFamilies.length - 1 || overflowCount > 0 ? "-10px" : "0",
                      zIndex: displayFamilies.length - index,
                    }}
                  >
                    {getInitialsForSidebar(family.display_name || "?")}
                  </div>
                ))}
                {overflowCount > 0 && (
                  <div
                    className="relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold border-[2.5px] border-white bg-gray-100 text-gray-500"
                    style={{ zIndex: 0 }}
                  >
                    +{overflowCount}
                  </div>
                )}
              </div>

              {/* Family count */}
              <p className="text-[22px] font-display font-bold text-gray-900 leading-tight">
                {totalFamilies} {totalFamilies === 1 ? "family" : "families"}
              </p>
              <p className="text-[14px] text-gray-500 mt-0.5">
                haven&apos;t heard from you yet.
              </p>

              {/* Tip section */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Tip</p>
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      First to reach out is 3× more likely to be chosen.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STATE 2: ACTIVE (reached out to some) ── */}
          {isActive && totalFamilies > 0 && (
            <>
              {/* Full Access header */}
              <div className="flex items-center gap-1.5 mb-5">
                <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-[10.5px] font-bold text-primary-600 uppercase tracking-wide">
                  Full Access {providerLocation && `· ${providerLocation}`}
                </span>
              </div>

              {/* Avatar stack - contacted are dimmed with checkmark */}
              <div className="flex items-center mb-4">
                {displayFamilies.map((family, index) => {
                  const isContacted = contactedIds.has(family.id);
                  return (
                    <div
                      key={family.id}
                      className="relative"
                      style={{
                        marginRight: index < displayFamilies.length - 1 || overflowCount > 0 ? "-10px" : "0",
                        zIndex: displayFamilies.length - index,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-[2.5px] border-white transition-opacity"
                        style={{
                          backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length].bg,
                          color: AVATAR_COLORS[index % AVATAR_COLORS.length].text,
                          opacity: isContacted ? 0.3 : 1,
                        }}
                      >
                        {getInitialsForSidebar(family.display_name || "?")}
                      </div>
                      {/* Checkmark badge for contacted */}
                      {isContacted && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary-500 flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
                {overflowCount > 0 && (
                  <div
                    className="relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold border-[2.5px] border-white bg-gray-100 text-gray-500"
                    style={{ zIndex: 0 }}
                  >
                    +{overflowCount}
                  </div>
                )}
              </div>

              {/* Remaining family count */}
              <p className="text-[22px] font-display font-bold text-gray-900 leading-tight">
                {remainingFamilies} {remainingFamilies === 1 ? "family" : "families"}
              </p>
              <p className="text-[14px] text-gray-500 mt-0.5">
                haven&apos;t heard from you yet.
              </p>
            </>
          )}

          {/* ── ALL CAUGHT UP (no families) ── */}
          {totalFamilies === 0 && (
            <>
              {/* Full Access header */}
              <div className="flex items-center gap-1.5 mb-5">
                <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-[10.5px] font-bold text-primary-600 uppercase tracking-wide">
                  Full Access {providerLocation && `· ${providerLocation}`}
                </span>
              </div>

              {/* Checkmark circle */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-primary-50/60 flex items-center justify-center">
                  <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              </div>

              <h3 className="text-lg font-display font-bold text-gray-900 text-center">
                You&apos;re all caught up
              </h3>
              <p className="text-[13px] text-gray-400 text-center mt-2 leading-relaxed">
                No new families waiting. We&apos;ll notify you when someone&apos;s looking for care in your area.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
         STATE 3: FREE PLAN (commented out — enable when subscriptions launch)
         ══════════════════════════════════════════════════════════════════════

      {isFreeTier && (
        <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
          <div className="p-5">
            {/* Free Plan header *}
            <div className="flex items-center gap-1.5 mb-5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10.5px] font-bold text-amber-600 uppercase tracking-wide">
                Free Plan {providerLocation && `· ${providerLocation}`}
              </span>
            </div>

            {/* Avatar stack - 3 bright, 1 blurred, dashed overflow *}
            <div className="flex items-center mb-4">
              {displayFamilies.slice(0, 3).map((family, index) => (
                <div
                  key={family.id}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-[2.5px] border-white"
                  style={{
                    backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length].bg,
                    color: AVATAR_COLORS[index % AVATAR_COLORS.length].text,
                    marginRight: "-10px",
                    zIndex: 4 - index,
                  }}
                >
                  {getInitialsForSidebar(family.display_name || "?")}
                </div>
              ))}
              {/* Blurred avatar *}
              {displayFamilies[3] && (
                <div
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-[2.5px] border-white"
                  style={{
                    backgroundColor: AVATAR_COLORS[3].bg,
                    color: AVATAR_COLORS[3].text,
                    marginRight: "-10px",
                    zIndex: 1,
                    opacity: 0.25,
                    filter: "blur(2px)",
                  }}
                >
                  {getInitialsForSidebar(displayFamilies[3].display_name || "?")}
                </div>
              )}
              {/* Dashed overflow *}
              {overflowCount > 0 && (
                <div
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-50 text-gray-400"
                  style={{
                    zIndex: 0,
                    border: "2px dashed #d1d5db",
                  }}
                >
                  +{overflowCount}
                </div>
              )}
            </div>

            {/* Family count *}
            <p className="text-[22px] font-display font-bold text-gray-900 leading-tight">
              {totalFamilies} families
            </p>
            <p className="text-[14px] text-gray-500 mt-0.5 leading-relaxed">
              in your area. You can reach <span className="font-semibold">{FREE_CONNECTION_LIMIT} per month</span> on the free plan.
            </p>

            {/* Upgrade CTA *}
            <Link
              href="/provider/pro"
              className="flex items-center justify-center w-full mt-5 py-3 rounded-xl bg-primary-500 text-white text-[14px] font-semibold hover:bg-primary-600 transition-colors"
            >
              Unlock all {totalFamilies} families
            </Link>
          </div>
        </div>
      )}

      ══════════════════════════════════════════════════════════════════════ */}

      {/* ── How It Works accordion ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setHowItWorksOpen(!howItWorksOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-warm-50/30 transition-colors"
        >
          <span className="text-[13px] font-semibold text-gray-500">How it works</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${howItWorksOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
          style={{ gridTemplateRows: howItWorksOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4 border-t border-warm-100/60 pt-4">
              {[
                { num: 1, bold: "Send a note", rest: "explaining why you\u2019re a good fit" },
                { num: 2, bold: "Family reviews", rest: "your profile and message" },
                { num: 3, bold: "If they reply,", rest: "you\u2019re connected" },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-warm-100/70 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[12px] font-bold text-gray-500">{step.num}</span>
                  </div>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">{step.bold}</span> {step.rest}
                  </p>
                </div>
              ))}
              <p className="text-[12px] text-gray-400 leading-relaxed pt-2 border-t border-warm-100/60">
                Families choose the first provider who responds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ProviderMatchesPage() {
  const providerProfile = useProviderProfile();
  const { membership, refreshAccountData } = useAuth();
  const { metadata: dashboardMetadata } = useProviderDashboardData(providerProfile);
  const [families, setFamilies] = useState<Profile[]>([]);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  const [reachOutCounts, setReachOutCounts] = useState<Map<string, number>>(new Map());
  // Full connection data for Reached Out tab cards
  const [connectionData, setConnectionData] = useState<Map<string, {
    id: string;
    message: string | null;
    created_at: string;
    status: "pending" | "accepted" | "declined";
    reply_message?: string | null;
    replied_at?: string | null;
    reminder_sent?: boolean;
  }>>(new Map());
  // Track which connections have had reminders sent (local state, persisted via DB)
  const [reminderSentIds, setReminderSentIds] = useState<Set<string>>(new Set());
  const [archivedConnectionIds, setArchivedConnectionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MatchesFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<MatchesTab>("best_match");

  // Reach-out drawer state
  const [drawerFamily, setDrawerFamily] = useState<Profile | null>(null);
  const [reachOutNote, setReachOutNote] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Reminder sending state
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Track if initial fetch has completed (ref to avoid re-renders)
  const hasFetchedOnceRef = useRef(false);
  const [totalCount, setTotalCount] = useState(0);

  const hasFullAccess = canEngage(
    providerProfile?.type,
    membership,
    "view_inquiry_details"
  );

  const freeRemaining = getFreeConnectionsRemaining(membership);
  const isFreeTier = freeRemaining !== null;
  const providerCareTypes = providerProfile?.care_types || [];
  const providerPaymentMethods = useMemo(() => {
    const meta = providerProfile?.metadata as ExtendedMetadata | undefined;
    return meta?.accepted_payments || [];
  }, [providerProfile]);

  const profileId = providerProfile?.id;

  // Profile completeness for sidebar snapshot
  const profileCompleteness = useMemo(() => {
    if (!providerProfile) return 0;
    const meta = (dashboardMetadata || providerProfile.metadata || {}) as ExtendedMetadata;
    return calculateProfileCompleteness(providerProfile, meta).overall;
  }, [providerProfile, dashboardMetadata]);

  // ── Drawer handlers ──

  const handleReachOut = useCallback(
    (family: Profile) => {
      if (!isProfileShareable(providerProfile)) return;
      setSendError(null);
      try {
        const saved = localStorage.getItem(DEFAULT_NOTE_KEY);
        if (saved) {
          setReachOutNote(saved);
          setSaveAsDefault(true);
        } else {
          setReachOutNote("");
          setSaveAsDefault(false);
        }
      } catch {
        setReachOutNote("");
        setSaveAsDefault(false);
      }
      setDrawerFamily(family);
    },
    [providerProfile],
  );

  const handleCloseDrawer = useCallback(() => {
    if (!sending) {
      setDrawerFamily(null);
      setSendError(null);
    }
  }, [sending]);

  // Handle sending a follow-up reminder (48-hour rule, max 1 per family)
  const handleSendReminder = useCallback(
    async (connectionId: string) => {
      if (!profileId || !isSupabaseConfigured() || sendingReminderId) return;

      setSendingReminderId(connectionId);

      try {
        const supabase = createClient();

        // Update the connection metadata to mark reminder as sent
        const { error } = await supabase
          .from("connections")
          .update({
            metadata: {
              provider_initiated: true,
              reminder_sent: true,
              reminder_sent_at: new Date().toISOString(),
            },
          })
          .eq("id", connectionId);

        if (error) throw error;

        // Update local state
        setReminderSentIds((prev) => new Set([...prev, connectionId]));

        // Optionally trigger a notification to the family (fire-and-forget)
        // This could be expanded with an API route similar to notify-reach-out
      } catch (err) {
        console.error("[olera] Failed to send reminder:", err);
      } finally {
        setSendingReminderId(null);
      }
    },
    [profileId, sendingReminderId],
  );

  // Handle archiving a declined connection (removes from view)
  const handleArchiveConnection = useCallback(
    async (connectionId: string) => {
      if (!isSupabaseConfigured()) return;

      try {
        const supabase = createClient();

        // Update the connection metadata to mark as archived
        const { error } = await supabase
          .from("connections")
          .update({
            metadata: {
              archived: true,
              archived_at: new Date().toISOString(),
            },
          })
          .eq("id", connectionId);

        if (error) throw error;

        // Update local state to hide the card immediately
        setArchivedConnectionIds((prev) => new Set([...prev, connectionId]));
      } catch (err) {
        console.error("[olera] Failed to archive connection:", err);
      }
    },
    [],
  );

  const handleSendFromDrawer = useCallback(
    async (toProfileId: string, message: string, shouldSaveAsDefault: boolean) => {
      if (!profileId || !isSupabaseConfigured()) return;

      setSending(true);
      setSendError(null);

      try {
        const supabase = createClient();

        const { error: insertError } = await supabase
          .from("connections")
          .insert({
            from_profile_id: profileId,
            to_profile_id: toProfileId,
            type: "request",
            status: "pending",
            message: message.trim() || null,
            metadata: { provider_initiated: true },
          });

        if (insertError) {
          if (
            insertError.code === "23505" ||
            insertError.message.includes("duplicate") ||
            insertError.message.includes("unique")
          ) {
            setContactedIds((prev) => new Set([...prev, toProfileId]));
            setDrawerFamily(null);
            return;
          }
          throw new Error(insertError.message);
        }

        // Notify family of reach-out (fire-and-forget)
        fetch("/api/matches/notify-reach-out", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toProfileId }),
        }).catch(() => {});

        // Increment free_responses_used only for free tier (not trial)
        if (membership && membership.status === "free") {
          const newCount = (membership.free_responses_used ?? 0) + 1;
          await supabase
            .from("memberships")
            .update({ free_responses_used: newCount })
            .eq("account_id", membership.account_id);

          await refreshAccountData();
        }

        // Persist default note
        if (shouldSaveAsDefault && message.trim()) {
          try {
            localStorage.setItem(DEFAULT_NOTE_KEY, message.trim());
          } catch {
            /* ignore */
          }
        } else if (!shouldSaveAsDefault) {
          try {
            localStorage.removeItem(DEFAULT_NOTE_KEY);
          } catch {
            /* ignore */
          }
        }

        // Mark as contacted and close drawer
        setContactedIds((prev) => new Set([...prev, toProfileId]));
        setDrawerFamily(null);
        setReachOutNote("");
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : String(err);
        setSendError(`Something went wrong: ${msg}`);
      } finally {
        setSending(false);
      }
    },
    [profileId, membership, refreshAccountData],
  );

  const fetchFamilies = useCallback(
    async (isBackgroundRefresh = false) => {
      if (!profileId || !isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      // Only show loading skeleton on initial load, not during background refreshes
      // Also skip loading state if we've already fetched once (covers effect re-runs)
      const shouldShowLoading = !isBackgroundRefresh && !hasFetchedOnceRef.current;
      if (shouldShowLoading) {
        setLoading(true);
      }
      setFetchError(null);

      try {
        const supabase = createClient();

        // Fetch all families + provider's own connections (+ responded)
        const [familiesRes, connectionsRes, respondedRes, fullConnectionsRes] = await Promise.all([
          supabase
            .from("business_profiles")
            .select("id, display_name, city, state, lat, lng, type, care_types, metadata, image_url, slug, created_at", { count: "exact" })
            .eq("type", "family")
            .eq("is_active", true)
            .filter("metadata->care_post->>status", "eq", "active")
            .order("created_at", { ascending: false }),
          supabase
            .from("connections")
            .select("to_profile_id")
            .eq("from_profile_id", profileId)
            .eq("type", "request")
            .in("status", ["pending", "accepted", "declined"]),
          supabase
            .from("connections")
            .select("to_profile_id")
            .eq("from_profile_id", profileId)
            .eq("type", "request")
            .eq("status", "accepted"),
          // Full connection data for Reached Out tab (includes message, timestamps, metadata)
          // Include declined to show "Not a match" state
          supabase
            .from("connections")
            .select("id, to_profile_id, message, created_at, status, metadata")
            .eq("from_profile_id", profileId)
            .eq("type", "request")
            .in("status", ["pending", "accepted", "declined"])
            .order("created_at", { ascending: false }),
        ]);

        if (familiesRes.error) {
          throw new Error(familiesRes.error.message);
        }

        const fetchedFamilies = (familiesRes.data as Profile[]) || [];
        setFamilies(fetchedFamilies);
        setTotalCount(familiesRes.count || fetchedFamilies.length);
        setContactedIds(
          new Set(connectionsRes.data?.map((c: { to_profile_id: string }) => c.to_profile_id) || [])
        );
        setRespondedIds(
          new Set(respondedRes.data?.map((c: { to_profile_id: string }) => c.to_profile_id) || [])
        );

        // Process full connection data for Reached Out tab
        const connDataMap = new Map<string, {
          id: string;
          message: string | null;
          created_at: string;
          status: "pending" | "accepted" | "declined";
          reply_message?: string | null;
          replied_at?: string | null;
          reminder_sent?: boolean;
        }>();
        const reminderIds = new Set<string>();

        (fullConnectionsRes.data || []).forEach((conn: {
          id: string;
          to_profile_id: string;
          message: string | null;
          created_at: string;
          status: string;
          metadata: Record<string, unknown> | null;
        }) => {
          const meta = conn.metadata as {
            reply_message?: string;
            replied_at?: string;
            reminder_sent?: boolean;
          } | null;

          connDataMap.set(conn.to_profile_id, {
            id: conn.id,
            message: conn.message,
            created_at: conn.created_at,
            status: conn.status as "pending" | "accepted" | "declined",
            reply_message: meta?.reply_message || null,
            replied_at: meta?.replied_at || null,
            reminder_sent: meta?.reminder_sent || false,
          });

          if (meta?.reminder_sent) {
            reminderIds.add(conn.id);
          }
        });

        setConnectionData(connDataMap);
        setReminderSentIds(reminderIds);

        // Reach-out counts per family
        const familyIds = fetchedFamilies.map((f) => f.id);
        if (familyIds.length > 0) {
          const { data: reachOuts } = await supabase
            .from("connections")
            .select("to_profile_id")
            .in("to_profile_id", familyIds)
            .eq("type", "request")
            .in("status", ["pending", "accepted"]);

          const counts = new Map<string, number>();
          (reachOuts || []).forEach((r: { to_profile_id: string }) => {
            counts.set(r.to_profile_id, (counts.get(r.to_profile_id) || 0) + 1);
          });
          setReachOutCounts(counts);
        }
      } catch (err) {
        console.error("[olera] matches fetch failed:", err);
        setFetchError(
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Failed to load matches. Please try again.",
        );
      } finally {
        setLoading(false);
        hasFetchedOnceRef.current = true;
      }
    },
    [profileId],
  );

  // Fetch families on mount or when profileId changes
  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  // Poll for updates every 45 seconds (family profile changes, new listings)
  // Pass isBackgroundRefresh=true to avoid showing loading skeleton during refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFamilies(true);
    }, 45000);

    return () => clearInterval(interval);
  }, [fetchFamilies]);

  // Reset to page 1 when filters or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab]);

  // Filter + sort families (excludes contacted - those show in "Reached Out" tab)
  const filteredFamilies = useMemo(() => {
    let result = families.filter((f) => !contactedIds.has(f.id));

    // Location filter
    if (filters.location) {
      result = result.filter((f) => {
        const familyLocation = [f.city, f.state].filter(Boolean).join(", ");
        return familyLocation.toLowerCase() === filters.location!.toLowerCase();
      });
    }

    // Sort based on active tab
    const sorted = [...result].sort((a, b) => {
      const metaA = a.metadata as FamilyMetadata;
      const metaB = b.metadata as FamilyMetadata;

      if (activeTab === "most_recent") {
        const dateA = metaA?.care_post?.published_at || a.created_at;
        const dateB = metaB?.care_post?.published_at || b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }

      if (activeTab === "most_urgent") {
        const urgA = URGENCY_ORDER[metaA?.timeline || "exploring"] ?? 3;
        const urgB = URGENCY_ORDER[metaB?.timeline || "exploring"] ?? 3;
        return urgA - urgB;
      }

      // best_match (default): most service overlap first, then urgent, then recent
      const needsA = metaA?.care_needs || a.care_types || [];
      const needsB = metaB?.care_needs || b.care_types || [];
      const matchA = computeMatchingServices(needsA, providerCareTypes);
      const matchB = computeMatchingServices(needsB, providerCareTypes);
      if (matchA !== matchB) return matchB - matchA;
      const urgA = URGENCY_ORDER[metaA?.timeline || "exploring"] ?? 3;
      const urgB = URGENCY_ORDER[metaB?.timeline || "exploring"] ?? 3;
      if (urgA !== urgB) return urgA - urgB;
      const dateA = metaA?.care_post?.published_at || a.created_at;
      const dateB = metaB?.care_post?.published_at || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return sorted;
  }, [families, contactedIds, filters, activeTab, providerCareTypes]);

  // Paginate filtered families
  const totalPages = Math.ceil(filteredFamilies.length / PAGE_SIZE);
  const paginatedFamilies = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredFamilies.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredFamilies, currentPage]);

  const contactedFamilies = useMemo(
    () => families.filter((f) => contactedIds.has(f.id)),
    [families, contactedIds],
  );

  // Compute new matches today for sidebar (must be before early returns for hooks rules)
  const newTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return families.filter((f) => {
      const meta = f.metadata as FamilyMetadata;
      const publishedAt = meta?.care_post?.published_at || f.created_at;
      return publishedAt && new Date(publishedAt).toDateString() === today;
    }).length;
  }, [families]);

  const providerLocation = providerProfile
    ? [providerProfile.city, providerProfile.state].filter(Boolean).join(", ") || null
    : null;

  if (!providerProfile || loading) {
    return <MatchesSkeleton />;
  }

  // Error state — show after loading completes with no data
  if (fetchError && families.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center text-center min-h-[50vh]">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-[17px] font-display font-semibold text-gray-900 mb-1.5">
            Couldn&apos;t load matches
          </p>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            {fetchError}
          </p>
          <button
            type="button"
            onClick={() => fetchFamilies()}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <style dangerouslySetInnerHTML={{ __html: floatKeyframes }} />

      {/* ── Main layout ── */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* ── LEFT COLUMN: Banner + Filters + Content ── */}
        <div className="flex-1 min-w-0">
          {/* Discovery Banner - separate entity */}
          <div className="mb-8">
            <DiscoveryBanner
              familyCount={filteredFamilies.length}
              currentLocation={filters.location}
              providerLocation={providerLocation}
              onLocationChange={(location) => setFilters({ ...filters, location })}
            />
          </div>

          {/* Tabs + Cards = one grouped stack */}
          <MatchesTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            reachedOutCount={contactedFamilies.length}
          />

          {/* Content based on active tab */}
          {activeTab === "reached_out" ? (
            // Reached Out tab - show contacted families with full card view
            contactedFamilies.length === 0 ? (
              <div className="text-center py-16 px-8">
                <div className="w-14 h-14 rounded-2xl bg-warm-50 border border-warm-100/60 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-warm-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </div>
                <h3 className="text-[17px] font-display font-bold text-gray-900 mb-1.5">
                  No reach-outs yet
                </h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                  When you reach out to families, they&apos;ll appear here. You can track responses and send follow-up reminders.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {contactedFamilies.map((family) => {
                  const connInfo = connectionData.get(family.id);
                  if (!connInfo) return null;
                  // Skip archived connections
                  if (archivedConnectionIds.has(connInfo.id)) return null;

                  const isDeclined = connInfo.status === "declined";

                  return (
                    <ReachedOutCard
                      key={family.id}
                      family={family}
                      connectionInfo={connInfo}
                      isConnected={respondedIds.has(family.id)}
                      isDeclined={isDeclined}
                      reminderSent={reminderSentIds.has(connInfo.id)}
                      onSendReminder={handleSendReminder}
                      onArchive={handleArchiveConnection}
                      sendingReminder={sendingReminderId === connInfo.id}
                    />
                  );
                })}
              </div>
            )
          ) : (
            // Other tabs - show filtered/sorted families
            <>
              {families.length === 0 ? (
                <MatchesEmptyState />
              ) : filteredFamilies.length === 0 ? (
                <div className="text-center py-16 px-8">
                  <div className="w-12 h-12 rounded-2xl bg-warm-50 border border-warm-100/60 flex items-center justify-center mx-auto mb-4">
                    <PeopleIcon className="w-6 h-6 text-warm-300" />
                  </div>
                  <p className="text-[15px] font-display font-semibold text-gray-900 mb-1">
                    No matches in this location
                  </p>
                  <p className="text-sm text-gray-500">
                    Try selecting a different location.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 mt-4">
                  {paginatedFamilies.map((family, index) => (
                    <FamilyMatchCard
                      key={family.id}
                      family={family}
                      hasFullAccess={hasFullAccess}
                      providerCareTypes={providerCareTypes}
                      providerPaymentMethods={providerPaymentMethods}
                      contacted={contactedIds.has(family.id)}
                      reachOutCount={reachOutCounts.get(family.id) || 0}
                      onReachOut={handleReachOut}
                      animationDelay={index * 40}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {filteredFamilies.length > PAGE_SIZE && (
            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredFamilies.length}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="families"
                showItemCount={true}
              />
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Profile Snapshot + Sidebar (fixed width, hidden on mobile) ── */}
        <div className="hidden lg:block w-[300px] shrink-0">
          <div className="sticky top-24 space-y-4">
            {/* Profile Snapshot Card */}
            <ProfileSnapshotCard
              profile={providerProfile}
              completeness={profileCompleteness}
            />

            {/* Membership / Access Card + How it works */}
            <MatchesSidebar
              families={families}
              contactedIds={contactedIds}
              providerLocation={providerLocation}
            />
          </div>
        </div>
      </div>

      {/* ── Reach Out Drawer ── */}
      <ReachOutDrawer
        family={drawerFamily}
        isOpen={!!drawerFamily}
        onClose={handleCloseDrawer}
        onSend={handleSendFromDrawer}
        defaultMessage={reachOutNote}
        providerProfile={providerProfile}
        providerCareTypes={providerCareTypes}
        providerPaymentMethods={providerPaymentMethods}
        sending={sending}
        sendError={sendError}
      />
    </div>
    </div>
  );
}
