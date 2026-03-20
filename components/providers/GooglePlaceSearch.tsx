"use client";

import { useState, useRef, useEffect } from "react";

interface GooglePlaceSearchProps {
  value: string | null;
  selectedName: string | null;
  onSelect: (placeId: string, name: string, rating: number | null) => void;
  onClear: () => void;
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
}

/**
 * Google Place search input — lets providers find and link their Google Business listing.
 * Uses the Google Places Text Search API via a server-side proxy to keep the API key private.
 */
export default function GooglePlaceSearch({ value, selectedName, onSelect, onClear }: GooglePlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/internal/google-place-search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
        setShowDropdown(true);
      }
    } catch {
      // Silent fail
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  if (value && selectedName) {
    return (
      <div className="space-y-1.5">
        <label className="block text-base font-medium text-gray-700">
          Google Business <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary-200 bg-primary-50/50">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="text-sm font-medium text-gray-900 flex-1 truncate">{selectedName}</span>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-base font-medium text-gray-700">
        Google Business <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <div ref={dropdownRef} className="relative">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Search your business on Google..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] placeholder:text-gray-400"
            autoComplete="off"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {showDropdown && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto">
            {results.map((place) => (
              <button
                key={place.place_id}
                type="button"
                onClick={() => {
                  onSelect(place.place_id, place.name, place.rating ?? null);
                  setQuery("");
                  setResults([]);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">{place.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{place.formatted_address}</p>
                {place.rating && (
                  <p className="text-xs text-amber-600 mt-0.5">★ {place.rating}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">Link your Google listing to show reviews on your page</p>
    </div>
  );
}
