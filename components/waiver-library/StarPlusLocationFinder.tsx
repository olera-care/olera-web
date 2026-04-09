"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

export interface StarPlusServiceArea {
  name: string;
  city: string;
  counties: string[];
  currentMcos: string[];
  futureMcos: string[];
  lat: number;
  lng: number;
}

// STAR+PLUS service areas cover the entire state of Texas. Each area is managed
// by Managed Care Organizations (MCOs) selected by HHSC. See the official list:
// https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-members/starplus
export const STAR_PLUS_SERVICE_AREAS: StarPlusServiceArea[] = [
  {
    name: "Bexar",
    city: "San Antonio",
    counties: ["Atascosa", "Bandera", "Bexar", "Comal", "Guadalupe", "Kendall", "Medina", "Wilson"],
    currentMcos: ["Molina", "Wellpoint", "Superior"],
    futureMcos: ["Community First", "Molina", "United Healthcare"],
    lat: 29.4241,
    lng: -98.4936,
  },
  {
    name: "Dallas",
    city: "Dallas",
    counties: ["Collin", "Dallas", "Ellis", "Hunt", "Kaufman", "Navarro", "Rockwall"],
    currentMcos: ["Molina", "Superior"],
    futureMcos: ["Molina", "Superior", "United Healthcare"],
    lat: 32.7767,
    lng: -96.7970,
  },
  {
    name: "El Paso",
    city: "El Paso",
    counties: ["El Paso", "Hudspeth"],
    currentMcos: ["Wellpoint", "Molina"],
    futureMcos: ["El Paso Health", "Molina"],
    lat: 31.7619,
    lng: -106.4850,
  },
  {
    name: "Harris",
    city: "Houston",
    counties: ["Austin", "Brazoria", "Fort Bend", "Galveston", "Harris", "Matagorda", "Montgomery", "Waller", "Wharton"],
    currentMcos: ["Wellpoint", "Molina", "United Healthcare"],
    futureMcos: ["Community Health Choice", "Molina", "United Healthcare"],
    lat: 29.7604,
    lng: -95.3698,
  },
  {
    name: "Hidalgo",
    city: "McAllen",
    counties: ["Cameron", "Duval", "Hidalgo", "Jim Hogg", "Maverick", "McMullen", "Starr", "Webb", "Willacy", "Zapata"],
    currentMcos: ["Molina", "Superior"],
    futureMcos: ["Molina", "Superior", "United Healthcare"],
    lat: 26.2034,
    lng: -98.2300,
  },
  {
    name: "Jefferson",
    city: "Beaumont",
    counties: ["Chambers", "Hardin", "Jasper", "Jefferson", "Liberty", "Newton", "Orange", "Polk", "San Jacinto", "Tyler", "Walker"],
    currentMcos: ["Molina", "United Healthcare", "Wellpoint"],
    futureMcos: ["Molina", "Wellpoint"],
    lat: 30.0860,
    lng: -94.1018,
  },
  {
    name: "Lubbock",
    city: "Lubbock",
    counties: ["Carson", "Crosby", "Deaf Smith", "Floyd", "Garza", "Hale", "Hockley", "Hutchinson", "Lamb", "Lubbock", "Lynn", "Potter", "Randall", "Swisher", "Terry"],
    currentMcos: ["Superior", "Wellpoint"],
    futureMcos: ["Superior", "Wellpoint"],
    lat: 33.5779,
    lng: -101.8552,
  },
  {
    name: "Nueces",
    city: "Corpus Christi",
    counties: ["Aransas", "Bee", "Brooks", "Calhoun", "Goliad", "Jim Wells", "Karnes", "Kenedy", "Kleberg", "Live Oak", "Nueces", "Refugio", "San Patricio", "Victoria"],
    currentMcos: ["Superior", "United Healthcare"],
    futureMcos: ["Superior", "Wellpoint"],
    lat: 27.8006,
    lng: -97.3964,
  },
  {
    name: "Tarrant",
    city: "Fort Worth",
    counties: ["Denton", "Hood", "Johnson", "Parker", "Tarrant", "Wise"],
    currentMcos: ["Molina", "Wellpoint"],
    futureMcos: ["Molina", "United Healthcare"],
    lat: 32.7555,
    lng: -97.3308,
  },
  {
    name: "Travis",
    city: "Austin",
    counties: ["Bastrop", "Burnet", "Caldwell", "Fayette", "Hays", "Lee", "Travis", "Williamson"],
    currentMcos: ["United Healthcare", "Wellpoint"],
    futureMcos: ["Superior", "United Healthcare"],
    lat: 30.2672,
    lng: -97.7431,
  },
  {
    name: "West Texas",
    city: "Midland",
    counties: [
      "Andrews", "Archer", "Armstrong", "Bailey", "Baylor", "Borden", "Brewster", "Briscoe", "Brown", "Callahan",
      "Castro", "Childress", "Clay", "Cochran", "Coke", "Coleman", "Collingsworth", "Concho", "Cottle", "Crane",
      "Crockett", "Culberson", "Dallam", "Dawson", "Dickens", "Dimmit", "Donley", "Eastland", "Ector", "Edwards",
      "Fisher", "Foard", "Frio", "Gaines", "Glasscock", "Gray", "Hall", "Hansford", "Hardeman", "Hartley",
      "Haskell", "Hemphill", "Howard", "Irion", "Jack", "Jeff Davis", "Jones", "Kent", "Kerr", "Kimble",
      "King", "Kinney", "Knox", "La Salle", "Lipscomb", "Loving", "Martin", "Mason", "McCulloch", "Menard",
      "Midland", "Mitchell", "Moore", "Motley", "Nolan", "Ochiltree", "Oldham", "Palo Pinto", "Parmer", "Pecos",
      "Presidio", "Reagan", "Real", "Reeves", "Roberts", "Runnels", "Schleicher", "Scurry", "Shackelford", "Sherman",
      "Stephens", "Sterling", "Stonewall", "Sutton", "Taylor", "Terrell", "Throckmorton", "Tom Green", "Upton", "Uvalde",
      "Val Verde", "Ward", "Wheeler", "Wichita", "Wilbarger", "Winkler", "Yoakum", "Young", "Zavala",
    ],
    currentMcos: ["Superior", "Wellpoint"],
    futureMcos: ["Superior", "Wellpoint"],
    lat: 31.9973,
    lng: -102.0779,
  },
  {
    name: "Central Texas",
    city: "Waco",
    counties: [
      "Bell", "Blanco", "Bosque", "Brazos", "Burleson", "Colorado", "Comanche", "Coryell", "DeWitt", "Erath",
      "Falls", "Freestone", "Gillespie", "Gonzales", "Grimes", "Hamilton", "Hill", "Jackson", "Lampasas", "Lavaca",
      "Leon", "Limestone", "Llano", "Madison", "McLennan", "Milam", "Mills", "Robertson", "San Saba", "Somervell",
      "Washington",
    ],
    currentMcos: ["Superior", "United Healthcare"],
    futureMcos: ["Superior", "United Healthcare"],
    lat: 31.5493,
    lng: -97.1467,
  },
  {
    name: "Northeast Texas",
    city: "Tyler",
    counties: [
      "Anderson", "Angelina", "Bowie", "Camp", "Cass", "Cherokee", "Cooke", "Delta", "Fannin", "Franklin",
      "Grayson", "Gregg", "Harrison", "Henderson", "Hopkins", "Houston", "Lamar", "Marion", "Montague", "Morris",
      "Nacogdoches", "Panola", "Rains", "Red River", "Rusk", "Sabine", "San Augustine", "Shelby", "Smith", "Titus",
      "Trinity", "Upshur", "Van Zandt", "Wood",
    ],
    currentMcos: ["Molina", "United Healthcare"],
    futureMcos: ["Molina", "United Healthcare"],
    lat: 32.3513,
    lng: -95.3011,
  },
];

const WeatherizationMap = dynamic(() => import("./WeatherizationMap").then((m) => m.WeatherizationMap), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[560px] bg-gray-100 animate-pulse" />,
});

export function StarPlusLocationFinder() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const selected = selectedIndex !== null ? STAR_PLUS_SERVICE_AREAS[selectedIndex] : null;

  const handleSelect = useCallback((index: number | null) => {
    setSelectedIndex(index);
  }, []);

  const findNearest = useCallback((lat: number, lng: number) => {
    let nearestDist = Infinity;
    let nearestIdx = 0;
    STAR_PLUS_SERVICE_AREAS.forEach((a, i) => {
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
        const localMatch = STAR_PLUS_SERVICE_AREAS.findIndex(
          (a) => a.city.toLowerCase() === lowerQ || a.name.toLowerCase() === lowerQ
        );
        if (localMatch !== -1) {
          setSelectedIndex(localMatch);
          setUserLocation({ lat: STAR_PLUS_SERVICE_AREAS[localMatch].lat, lng: STAR_PLUS_SERVICE_AREAS[localMatch].lng, label: q });
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
          STAR+PLUS Service Areas in Texas
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl mx-auto">
          Enter your ZIP code or city to find your STAR+PLUS service area and the Managed Care Organizations (MCOs) available to you.
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
          <p className="mt-3 text-xs text-gray-500">
            View the complete list on the{" "}
            <a
              href="https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-members/starplus"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-700 hover:text-primary-600 underline"
            >
              official Texas HHS STAR+PLUS page
            </a>
            .
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="relative border-t border-gray-200 bg-gray-50/50">
        <div className="relative h-[720px]">
          <WeatherizationMap
            agencies={STAR_PLUS_SERVICE_AREAS}
            popularIndices={popularIndices}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            userLocation={userLocation}
          />

          {/* Overlay details "message box" */}
          {selected && (
            <div className="absolute top-3 right-3 w-[calc(100%-1.5rem)] sm:w-[360px] max-h-[calc(100%-1.5rem)] overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-200 z-[500]">
              <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">Service Area</p>
                  <h3 className="mt-0.5 text-base font-bold text-gray-900 leading-snug">{selected.name}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">Hub: {selected.city}, TX</p>
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

              <div className="px-5 py-4 space-y-4 text-sm">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">MCOs (through 8/31/24)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.currentMcos.map((mco) => (
                      <span key={mco} className="inline-flex items-center px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                        {mco}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-primary-700 uppercase tracking-wide mb-1.5">MCOs (9/1/24 onward)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.futureMcos.map((mco) => (
                      <span key={mco} className="inline-flex items-center px-2.5 py-1 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-800">
                        {mco}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Counties ({selected.counties.length})
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {selected.counties.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
