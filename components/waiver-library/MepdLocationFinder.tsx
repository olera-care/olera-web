"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

export interface MepdOffice {
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
}

export const MEPD_OFFICES: MepdOffice[] = [
  {
    name: "Dallas HHSC Benefits Office",
    city: "Dallas",
    address: "1010 Cadiz St, Dallas, TX 75215",
    lat: 32.7715,
    lng: -96.7969,
  },
  {
    name: "Fort Worth HHSC Benefits Office",
    city: "Fort Worth",
    address: "201 N Rupert St, Fort Worth, TX 76107",
    lat: 32.7568,
    lng: -97.3428,
  },
  {
    name: "Irving HHSC Benefits Office",
    city: "Irving",
    address: "440 S Nursery Rd, Irving, TX 75060",
    lat: 32.8097,
    lng: -96.9508,
  },
  {
    name: "Mesquite HHSC Benefits Office",
    city: "Mesquite",
    address: "6500 Northwest Dr, Mesquite, TX 75150",
    lat: 32.8040,
    lng: -96.6186,
  },
  {
    name: "Houston HHSC Benefits Office",
    city: "Houston",
    address: "4802 Lockwood Dr, Houston, TX 77026",
    lat: 29.8041,
    lng: -95.3312,
  },
  {
    name: "San Antonio HHSC Benefits Office",
    city: "San Antonio",
    address: "2700 NE Loop 410, Suite 101, San Antonio, TX 78217",
    lat: 29.5390,
    lng: -98.4124,
  },
];

const WeatherizationMap = dynamic(() => import("./WeatherizationMap").then((m) => m.WeatherizationMap), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[560px] bg-gray-100 animate-pulse" />,
});

export function MepdLocationFinder() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const selected = selectedIndex !== null ? MEPD_OFFICES[selectedIndex] : null;

  const handleSelect = useCallback((index: number | null) => {
    setSelectedIndex(index);
  }, []);

  const findNearest = useCallback((lat: number, lng: number) => {
    let nearestDist = Infinity;
    let nearestIdx = 0;
    MEPD_OFFICES.forEach((o, i) => {
      const d = Math.sqrt((o.lat - lat) ** 2 + (o.lng - lng) ** 2);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    });
    return nearestIdx;
  }, []);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearchError("");
    setSearching(true);

    try {
      const isZip = /^\d{5}$/.test(q);

      if (!isZip) {
        const lowerQ = q.toLowerCase();
        const localMatch = MEPD_OFFICES.findIndex((o) => o.city.toLowerCase() === lowerQ);
        if (localMatch !== -1) {
          setSelectedIndex(localMatch);
          setUserLocation({ lat: MEPD_OFFICES[localMatch].lat, lng: MEPD_OFFICES[localMatch].lng, label: q });
          setSearching(false);
          return;
        }
      }

      const params = isZip
        ? new URLSearchParams({ postalcode: q, country: "US", format: "json", limit: "1" })
        : new URLSearchParams({ q: `${q}, Texas, United States`, format: "json", limit: "1" });

      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const nearestIdx = findNearest(lat, lng);
        setUserLocation({ lat, lng, label: q });
        setSelectedIndex(nearestIdx);
      } else {
        setSearchError("We couldn't find that location. Try a Texas city or zip code.");
      }
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }, [query, findNearest]);

  const popularIndices = useMemo(() => new Set<number>(MEPD_OFFICES.map((_, i) => i)), []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left — offices list */}
        <div className="p-6 md:p-8 flex flex-col">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Key HHSC Benefits Offices
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            You can apply in person at any local HHSC benefits office. Select an office below or search by city or ZIP code to find the one nearest you.
          </p>

          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">Featured Offices</p>
            <p className="text-[11px] text-gray-400 font-medium">{MEPD_OFFICES.length} locations</p>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {MEPD_OFFICES.map((office, i) => {
              const isActive = selectedIndex === i;
              return (
                <button
                  key={office.name}
                  type="button"
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    isActive ? "bg-primary-50/60" : "bg-gray-50/50 hover:bg-primary-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-primary-700 uppercase tracking-wide leading-none">{office.city}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{office.address}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-primary-50 border border-primary-100 rounded-lg px-4 py-3.5">
            <div>
              <p className="text-sm font-bold text-gray-900">Don&apos;t see a location close to you?</p>
              <p className="text-xs text-gray-500 mt-0.5">Call 2-1-1 (Option 2) to find the nearest HHSC benefits office in your county.</p>
            </div>
            <a href="tel:211" className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-800 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors no-underline">
              2-1-1
            </a>
          </div>
        </div>

        {/* Right — map with search + overlay details */}
        <div className="relative border-t lg:border-t-0 lg:border-l border-gray-200 min-h-[560px] flex flex-col bg-gray-50/50">
          {/* Search */}
          <div className="px-5 py-4 border-b border-gray-100">
            <label className="text-sm font-bold text-gray-900 block mb-2.5">
              Search by city or zip code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="e.g. Austin or 78701"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
            {searchError && <p className="mt-2 text-xs text-error-600">{searchError}</p>}
          </div>

          {/* Map */}
          <div className="relative flex-1">
            <WeatherizationMap
              agencies={MEPD_OFFICES}
              popularIndices={popularIndices}
              selectedIndex={selectedIndex}
              onSelect={handleSelect}
              userLocation={userLocation}
            />

            {/* Overlay details "message box" */}
            {selected && (
              <div className="absolute top-3 right-3 w-[calc(100%-1.5rem)] sm:w-[340px] max-h-[calc(100%-1.5rem)] overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-200 z-[500]">
                <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">Selected Office</p>
                    <h3 className="mt-0.5 text-base font-bold text-gray-900 leading-snug">{selected.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect(null)}
                    aria-label="Close"
                    className="shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-5 py-4 space-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-gray-900">{selected.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-primary-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href="tel:211" className="font-semibold text-primary-700 hover:text-primary-600 no-underline">
                      Call 2-1-1 for hours
                    </a>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-600 no-underline"
                  >
                    Open in Google Maps
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
