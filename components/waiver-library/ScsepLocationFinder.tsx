"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

export interface ScsepAgency {
  name: string;
  shortName?: string;
  city: string;
  phone: string;
  address: string;
  counties: string;
  region: string;
  website?: string;
  lat: number;
  lng: number;
  unverified?: boolean;
}

// SCSEP is delivered in Texas through the Texas Workforce Commission and
// national grantees like the AARP Foundation, SER-Jobs for Progress, Goodwill,
// NAPCA, and MET, Inc.
export const SCSEP_AGENCIES: ScsepAgency[] = [
  // --- Central Texas ---
  {
    name: "AARP Foundation — Austin",
    shortName: "AARP Foundation — Austin",
    city: "Austin",
    phone: "(512) 391-9299",
    address: "7701 N. Lamar Boulevard, Suite 319, Austin, TX 78752",
    counties: "Travis and surrounding Central Texas counties",
    region: "Central Texas",
    lat: 30.3358,
    lng: -97.7104,
  },
  {
    name: "Texas Workforce Commission — AARP Foundation (Waco)",
    shortName: "TWC/AARP — Waco",
    city: "Waco",
    phone: "(254) 730-4190",
    address: "900 Austin Avenue, Suite 303, Waco, TX 76701",
    counties: "McLennan and surrounding Central Texas counties",
    region: "Central Texas",
    lat: 31.5516,
    lng: -97.1412,
  },

  // --- North Texas ---
  {
    name: "AARP Foundation — Dallas",
    shortName: "AARP Foundation — Dallas",
    city: "Dallas",
    phone: "(972) 716-9571",
    address: "1700 Pacific Avenue, Suite 1015, Dallas, TX 75201",
    counties: "Dallas County",
    region: "North Texas",
    lat: 32.7000,
    lng: -96.7400,
  },
  {
    name: "Texas Workforce Commission / AARP — Dallas (Mockingbird)",
    shortName: "TWC/AARP — Dallas",
    city: "Dallas",
    phone: "(210) 223-8900",
    address: "1625 W. Mockingbird, Suite 108, Dallas, TX 75235",
    counties: "Dallas County",
    region: "North Texas",
    lat: 32.9200,
    lng: -96.9400,
  },
  {
    name: "SER SCSEP TX — Fort Worth",
    shortName: "SER SCSEP — Fort Worth",
    city: "Fort Worth",
    phone: "(817) 536-3600",
    address: "4200 South Freeway, Suite 550, Fort Worth, TX 76115",
    counties: "Tarrant and surrounding North Texas counties",
    region: "North Texas",
    website: "https://ser-national.org/programs/employment/",
    lat: 32.6849,
    lng: -97.3370,
  },
  {
    name: "Texas Workforce Commission AARP Foundation — Tyler",
    shortName: "TWC/AARP — Tyler",
    city: "Tyler",
    phone: "(903) 707-8307",
    address: "215 Winchester Drive, Suite 112, Tyler, TX 75703",
    counties: "Smith and surrounding East Texas counties",
    region: "North Texas",
    lat: 32.3204,
    lng: -95.3015,
  },

  // --- Greater Houston & Gulf Coast ---
  {
    name: "AARP Foundation — Harris County",
    shortName: "AARP Foundation — Harris County",
    city: "Houston",
    phone: "(281) 922-9952",
    address: "12727 Featherwood Drive, Suite 270, Houston, TX 77034",
    counties: "Harris County (southeast)",
    region: "Greater Houston & Gulf Coast",
    lat: 29.5200,
    lng: -95.1400,
  },
  {
    name: "AARP Foundation — North Houston",
    shortName: "AARP Foundation — North Houston",
    city: "Houston",
    phone: "(281) 820-7451",
    address: "16770 Imperial Valley, Suite 165, Houston, TX 77060",
    counties: "Harris County (north)",
    region: "Greater Houston & Gulf Coast",
    lat: 29.9561,
    lng: -95.4119,
  },
  {
    name: "NAPCA — Chinese Community Center of Houston",
    shortName: "NAPCA / CCC Houston",
    city: "Houston",
    phone: "(713) 271-6100",
    address: "9800 Town Park Drive, Houston, TX 77036",
    counties: "Harris County (southwest)",
    region: "Greater Houston & Gulf Coast",
    website: "https://ccchouston.org/",
    lat: 29.7500,
    lng: -95.6600,
  },
  {
    name: "SER SCSEP TX — Houston",
    shortName: "SER SCSEP — Houston",
    city: "Houston",
    phone: "(346) 330-9931",
    address: "2525 A San Jacinto, #206, Houston, TX 77002",
    counties: "Harris County (central)",
    region: "Greater Houston & Gulf Coast",
    website: "https://ser-national.org/programs/employment/",
    lat: 29.8800,
    lng: -95.3600,
  },
  {
    name: "CWI — MET, Inc.",
    shortName: "MET, Inc.",
    city: "New Caney",
    phone: "(281) 622-1036",
    address: "P.O. Box 1838, New Caney, TX 77357",
    counties: "Montgomery and surrounding counties",
    region: "Greater Houston & Gulf Coast",
    website: "https://www.metinc.org/senior-employment-program",
    lat: 30.1530,
    lng: -95.2094,
  },
  {
    name: "Texas Workforce Commission / AARP Foundation (Stafford)",
    shortName: "TWC/AARP — Stafford",
    city: "Stafford",
    phone: "(346) 767-6036",
    address: "11104 West Airport Blvd., Suite 218, Stafford, TX 77477",
    counties: "Fort Bend County",
    region: "Greater Houston & Gulf Coast",
    lat: 29.5200,
    lng: -95.7200,
  },
  {
    name: "SER SCSEP TX — Texas City",
    shortName: "SER SCSEP — Texas City",
    city: "Texas City",
    phone: "(409) 207-5900",
    address: "2000 Texas Avenue, Suite 200, Texas City, TX 77590",
    counties: "Galveston County",
    region: "Greater Houston & Gulf Coast",
    website: "https://ser-national.org/programs/employment/",
    lat: 29.3838,
    lng: -94.9027,
  },
  {
    name: "SER SCSEP TX — Beaumont",
    shortName: "SER SCSEP — Beaumont",
    city: "Beaumont",
    phone: "(409) 833-1860",
    address: "700 North Street, Suite B-2, Beaumont, TX 77701",
    counties: "Jefferson and surrounding Southeast Texas counties",
    region: "Greater Houston & Gulf Coast",
    website: "https://ser-national.org/programs/employment/",
    lat: 30.0860,
    lng: -94.1018,
  },

  // --- South Texas ---
  {
    name: "Texas Workforce Commission AARP Foundation — San Antonio",
    shortName: "TWC/AARP — San Antonio",
    city: "San Antonio",
    phone: "(210) 223-8900",
    address: "816 Cameron Street, Suite 107, San Antonio, TX 78212",
    counties: "Bexar and surrounding South Texas counties",
    region: "South Texas",
    lat: 29.4478,
    lng: -98.4951,
  },
  {
    name: "Texas Workforce Commission AARP Foundation — Corpus Christi",
    shortName: "TWC/AARP — Corpus Christi",
    city: "Corpus Christi",
    phone: "(361) 879-0076",
    address: "714 Buffalo Street, Corpus Christi, TX 78401",
    counties: "Nueces and surrounding Coastal Bend counties",
    region: "South Texas",
    lat: 27.8014,
    lng: -97.3950,
  },
  {
    name: "Texas Workforce Commission AARP Foundation — Laredo",
    shortName: "TWC/AARP — Laredo",
    city: "Laredo",
    phone: "(956) 794-6500",
    address: "1406 Jacaman Road, Suite A, Laredo, TX 78041",
    counties: "Webb and surrounding border counties",
    region: "South Texas",
    lat: 27.5698,
    lng: -99.4813,
  },
  {
    name: "AARP Foundation — Edinburg",
    shortName: "AARP Foundation — Edinburg",
    city: "Edinburg",
    phone: "(956) 287-0673",
    address: "1508 South Sugar Road, Suite B1, Edinburg, TX 78539",
    counties: "Hidalgo and Rio Grande Valley counties",
    region: "South Texas",
    lat: 26.2885,
    lng: -98.1264,
  },

  // --- West Texas ---
  {
    name: "Goodwill Industries of El Paso, Inc.",
    shortName: "Goodwill El Paso",
    city: "El Paso",
    phone: "(915) 778-1858",
    address: "11460 Pellicano Drive, El Paso, TX 79936",
    counties: "El Paso (also serves New Mexico counties)",
    region: "West Texas",
    lat: 31.6800,
    lng: -106.2200,
  },
  {
    name: "Texas Workforce Commission AARP Foundation — El Paso",
    shortName: "TWC/AARP — El Paso",
    city: "El Paso",
    phone: "(915) 542-1705",
    address: "2111 East Missouri, Suite 238, El Paso, TX 79903",
    counties: "El Paso County",
    region: "West Texas",
    lat: 31.7672,
    lng: -106.4577,
  },
  {
    name: "Texas Workforce Commission / AARP Foundation (El Paso)",
    shortName: "TWC/AARP — El Paso (2)",
    city: "El Paso",
    phone: "(915) 542-1705",
    address: "2211 East Missouri, Suite 239, El Paso, TX 79903",
    counties: "El Paso County",
    region: "West Texas",
    lat: 31.7820,
    lng: -106.4420,
  },
];

const WeatherizationMap = dynamic(() => import("./WeatherizationMap").then((m) => m.WeatherizationMap), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[560px] bg-gray-100 animate-pulse" />,
});

export function ScsepLocationFinder() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const selected = selectedIndex !== null ? SCSEP_AGENCIES[selectedIndex] : null;

  const handleSelect = useCallback((index: number | null) => {
    setSelectedIndex(index);
  }, []);

  const findNearest = useCallback((lat: number, lng: number) => {
    let nearestDist = Infinity;
    let nearestIdx = 0;
    SCSEP_AGENCIES.forEach((a, i) => {
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
        const localMatch = SCSEP_AGENCIES.findIndex((a) => a.city.toLowerCase() === lowerQ);
        if (localMatch !== -1) {
          setSelectedIndex(localMatch);
          setUserLocation({ lat: SCSEP_AGENCIES[localMatch].lat, lng: SCSEP_AGENCIES[localMatch].lng, label: q });
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

  const popularIndices = useMemo(() => new Set<number>(), []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-5 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Older Worker Programs — SCSEP found in Texas
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl mx-auto">
          Put in your zip code and we&apos;ll show you all of them.
        </p>

        {/* Search */}
        <div className="mt-5 max-w-xl mx-auto">
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
                placeholder="Enter ZIP code"
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
      </div>

      {/* Map */}
      <div className="relative border-t border-gray-200 bg-gray-50/50">
        <div className="relative h-[720px]">
            <WeatherizationMap
              agencies={SCSEP_AGENCIES}
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
                        Verify before visiting
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Address</p>
                      <p className="text-gray-700 leading-relaxed">{selected.address}</p>
                    </div>
                  </div>

                  {selected.website && (
                    <div className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Website</p>
                        <a
                          href={selected.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary-700 hover:text-primary-600 break-all no-underline"
                        >
                          {selected.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
