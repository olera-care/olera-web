"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

export interface CeapAgency {
  name: string;
  shortName?: string;
  city: string;
  phone: string;
  counties: string;
  region: string;
  lat: number;
  lng: number;
  unverified?: boolean;
}

// CEAP is delivered through local Community Action Agencies. This list is
// CEAP-specific — the phone numbers for Dallas, BakerRipley, and Travis County
// differ from the WAP subrecipient numbers because CEAP has its own intake lines.
export const CEAP_AGENCIES: CeapAgency[] = [
  // --- Main Offices (shown in the left sidebar) ---
  {
    name: "Dallas County Health and Human Services",
    shortName: "Dallas County HHS",
    city: "Dallas",
    phone: "(214) 819-1848",
    counties: "Dallas",
    region: "Dallas County",
    lat: 32.7767,
    lng: -96.7970,
  },
  {
    name: "BakerRipley Utility Assistance",
    shortName: "BakerRipley",
    city: "Houston",
    phone: "(713) 590-2327",
    counties: "Harris, Brazoria, Galveston",
    region: "Greater Houston",
    lat: 29.7604,
    lng: -95.3698,
  },
  {
    name: "Travis County Health and Human Services",
    shortName: "Travis County HHS",
    city: "Austin",
    phone: "(512) 854-4120",
    counties: "Travis",
    region: "Austin / Travis County",
    lat: 30.2672,
    lng: -97.7431,
  },

  // --- North & Central Texas ---
  {
    name: "Texas Neighborhood Services",
    shortName: "Texas Neighborhood Services",
    city: "Cleburne",
    phone: "(817) 598-5700",
    counties: "Erath, Hood, Johnson, Palo Pinto, Parker, Somervell, Wise",
    region: "North & Central Texas",
    lat: 32.3476,
    lng: -97.3867,
  },
  {
    name: "Tarrant County Human Services",
    city: "Fort Worth",
    phone: "2-1-1",
    counties: "Tarrant",
    region: "North & Central Texas",
    lat: 32.7555,
    lng: -97.3308,
    unverified: true,
  },
  {
    name: "City of Fort Worth Neighborhood Services",
    shortName: "City of Fort Worth",
    city: "Fort Worth",
    phone: "(817) 392-5790",
    counties: "Fort Worth city limits",
    region: "North & Central Texas",
    lat: 32.7505,
    lng: -97.3258,
  },
  {
    name: "Community Action Inc. of Central Texas",
    shortName: "Community Action Inc. of Central Texas",
    city: "San Marcos",
    phone: "(512) 392-1161",
    counties: "Blanco, Caldwell, Hays",
    region: "North & Central Texas",
    lat: 29.8833,
    lng: -97.9414,
  },
  {
    name: "Economic Opportunities Advancement Corp",
    shortName: "EOAC",
    city: "Waco",
    phone: "(254) 753-0331",
    counties: "McLennan, Bosque, Limestone",
    region: "North & Central Texas",
    lat: 31.5493,
    lng: -97.1467,
  },

  // --- Greater Houston & Gulf Coast ---
  {
    name: "Economic Action Committee of the Gulf Coast",
    shortName: "EAC Gulf Coast",
    city: "Bay City",
    phone: "2-1-1",
    counties: "Matagorda (Bay City region)",
    region: "Greater Houston & Gulf Coast",
    lat: 28.9828,
    lng: -95.9694,
    unverified: true,
  },
  {
    name: "Greater East Texas Community Action Program",
    shortName: "GETCAP",
    city: "Nacogdoches",
    phone: "(800) 621-5746",
    counties: "Multiple counties in East Texas — Anderson, Angelina, Cherokee, Gregg, Harrison, Henderson, Houston, Jasper, Jefferson, Nacogdoches, Newton, Orange, Rusk, Sabine, Shelby, Smith, Tyler, and more",
    region: "Greater Houston & Gulf Coast",
    lat: 31.6035,
    lng: -94.6555,
  },

  // --- South Texas ---
  {
    name: "Community Action Corporation of South Texas",
    shortName: "CACOST",
    city: "Alice",
    phone: "(361) 664-0145",
    counties: "Bee, Brooks, Cameron, Duval, Jim Wells, San Patricio, Willacy",
    region: "South Texas",
    lat: 27.7525,
    lng: -98.0697,
  },
  {
    name: "South Texas Development Council",
    shortName: "STDC",
    city: "Laredo",
    phone: "2-1-1",
    counties: "Jim Hogg, Starr, Zapata",
    region: "South Texas",
    lat: 27.5036,
    lng: -99.5076,
    unverified: true,
  },
  {
    name: "Hidalgo County Community Service Agency",
    shortName: "Hidalgo County CSA",
    city: "Edinburg",
    phone: "2-1-1",
    counties: "Hidalgo",
    region: "South Texas",
    lat: 26.3020,
    lng: -98.1633,
    unverified: true,
  },

  // --- West Texas & Permian Basin ---
  {
    name: "West Texas Opportunities, Inc.",
    shortName: "West Texas Opportunities",
    city: "Lamesa",
    phone: "(806) 872-8354",
    counties: "Pecos, Ward, Upton, and surrounding West Texas counties",
    region: "West Texas & Permian Basin",
    lat: 32.7376,
    lng: -101.9510,
  },
  {
    name: "Concho Valley Community Action Agency",
    shortName: "Concho Valley CAA",
    city: "San Angelo",
    phone: "(325) 653-2411",
    counties: "Tom Green and surrounding Concho Valley counties (San Angelo area)",
    region: "West Texas & Permian Basin",
    lat: 31.4638,
    lng: -100.4370,
  },
  {
    name: "El Paso Community Action Program (Project BRAVO)",
    shortName: "Project BRAVO",
    city: "El Paso",
    phone: "(915) 562-4100",
    counties: "El Paso",
    region: "West Texas & Permian Basin",
    lat: 31.7619,
    lng: -106.4850,
  },

  // --- Panhandle & Rolling Plains ---
  {
    name: "Panhandle Community Services",
    city: "Amarillo",
    phone: "(806) 372-2531",
    counties: "Texas Panhandle region — Potter, Randall, Hutchinson, Moore, Hartley, Dallam, and surrounding counties",
    region: "Panhandle & Rolling Plains",
    lat: 35.2220,
    lng: -101.8313,
  },
  {
    name: "South Plains Community Action Association",
    shortName: "SPCAA",
    city: "Levelland",
    phone: "(806) 894-6104",
    counties: "Lubbock, Hockley, and surrounding Levelland/Lubbock area counties",
    region: "Panhandle & Rolling Plains",
    lat: 33.5879,
    lng: -102.3779,
  },
];

// The 3 main offices the user wants highlighted in the left sidebar.
const MAIN_OFFICES: {
  label: string;
  agencyIndex: number;
}[] = [
  { label: "Dallas County", agencyIndex: 0 },
  { label: "Greater Houston", agencyIndex: 1 },
  { label: "Travis County", agencyIndex: 2 },
];

const WeatherizationMap = dynamic(() => import("./WeatherizationMap").then((m) => m.WeatherizationMap), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[560px] bg-gray-100 animate-pulse" />,
});

export function CeapLocationFinder() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const selected = selectedIndex !== null ? CEAP_AGENCIES[selectedIndex] : null;

  const handleSelect = useCallback((index: number | null) => {
    setSelectedIndex(index);
  }, []);

  const findNearest = useCallback((lat: number, lng: number) => {
    let nearestDist = Infinity;
    let nearestIdx = 0;
    CEAP_AGENCIES.forEach((a, i) => {
      const d = Math.sqrt((a.lat - lat) ** 2 + (a.lng - lng) ** 2);
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
        const localMatch = CEAP_AGENCIES.findIndex((a) => a.city.toLowerCase() === lowerQ);
        if (localMatch !== -1) {
          setSelectedIndex(localMatch);
          setUserLocation({ lat: CEAP_AGENCIES[localMatch].lat, lng: CEAP_AGENCIES[localMatch].lng, label: q });
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

  const popularIndices = useMemo(() => new Set(MAIN_OFFICES.map((p) => p.agencyIndex)), []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left — main offices list */}
        <div className="p-6 md:p-8 flex flex-col">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Find Your Local CEAP Agency
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            Texas does not accept CEAP applications directly. Every household applies through a local Community Action Agency that covers their county. Search the map or pick a main office below.
          </p>

          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">Main Offices</p>
            <p className="text-[11px] text-gray-400 font-medium">3 of {CEAP_AGENCIES.length}</p>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {MAIN_OFFICES.map((provider) => {
              const agency = CEAP_AGENCIES[provider.agencyIndex];
              const isActive = selectedIndex === provider.agencyIndex;
              return (
                <button
                  key={provider.label}
                  type="button"
                  onClick={() => handleSelect(provider.agencyIndex)}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    isActive
                      ? "bg-primary-50/60"
                      : "bg-gray-50/50 hover:bg-primary-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-primary-700 uppercase tracking-wide leading-none">{provider.label}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{agency.shortName ?? agency.name}</p>
                    </div>
                    <a
                      href={`tel:${agency.phone.replace(/\D/g, "")}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 text-xs font-semibold text-primary-700 hover:text-primary-600 no-underline whitespace-nowrap"
                    >
                      {agency.phone}
                    </a>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-primary-50 border border-primary-100 rounded-lg px-4 py-3.5">
            <div>
              <p className="text-sm font-bold text-gray-900">Don&apos;t see a location close to you?</p>
              <p className="text-xs text-gray-500 mt-0.5">Call 2-1-1 or 1-877-399-8939 to reach the CEAP provider in your county.</p>
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
              agencies={CEAP_AGENCIES}
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
                    <p className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">Selected Provider</p>
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
                      <p className="text-gray-900">{selected.city}, TX</p>
                      <p className="text-[11px] font-semibold text-primary-700 uppercase tracking-wide mt-0.5">{selected.region}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-primary-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${selected.phone.replace(/\D/g, "")}`} className="font-semibold text-primary-700 hover:text-primary-600 no-underline">
                      {selected.phone}
                    </a>
                    {selected.unverified && (
                      <span className="text-[10px] font-semibold text-warning-700 bg-warning-50 border border-warning-200 rounded px-1.5 py-0.5">
                        Call 2-1-1 to verify
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Counties Served</p>
                      <p className="text-gray-700 leading-relaxed">{selected.counties}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
