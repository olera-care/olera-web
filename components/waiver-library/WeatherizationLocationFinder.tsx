"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

export interface WapAgency {
  name: string;
  shortName?: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  chiefExecutive: string;
  counties: string;
  lat: number;
  lng: number;
}

export const WAP_AGENCIES: WapAgency[] = [
  { name: "Alamo Area Council of Governments", shortName: "AACOG", address: "2700 NE Loop 410, Ste. 101", city: "San Antonio", zip: "78217-6228", phone: "(210) 362-5200", chiefExecutive: "Diane Rath", counties: "Atascosa, Bandera, Bexar, Comal, Frio, Gillespie, Guadalupe, Karnes, Kendall, Kerr, Medina, Wilson", lat: 29.4241, lng: -98.4936 },
  { name: "BakerRipley", address: "PO Box 271389", city: "Houston", zip: "77277-1389", phone: "(713) 667-9400", chiefExecutive: "Claudia Aguirre", counties: "Harris", lat: 29.7604, lng: -95.3698 },
  { name: "Brazos Valley Community Action Programs", address: "4001 E 29th Street, Suite 175", city: "Bryan", zip: "77802-2738", phone: "(979) 595-2800", chiefExecutive: "Michael Parks", counties: "Brazos, Burleson, Grimes, Leon, Madison, Montgomery, Robertson, Walker, Waller, Washington", lat: 30.6744, lng: -96.3698 },
  { name: "Cameron and Willacy Counties Community Projects, Inc.", address: "864 Central Blvd.", city: "Brownsville", zip: "78520", phone: "(956) 544-6411", chiefExecutive: "Amalia Garza", counties: "Cameron, Willacy", lat: 25.9017, lng: -97.4975 },
  { name: "Combined Community Action, Inc.", address: "165 W Austin St", city: "Giddings", zip: "78942", phone: "(979) 540-2980", chiefExecutive: "Kelly Franke", counties: "Austin, Bastrop, Blanco, Caldwell, Colorado, Fayette, Fort Bend, Hays, Lee", lat: 30.1827, lng: -96.9358 },
  { name: "Community Action Committee of Victoria Texas", address: "PO Box 3607, 4007 Halsey St", city: "Victoria", zip: "77903-3607", phone: "(800) 695-0314", chiefExecutive: "Mark Bethune", counties: "Aransas, Bee, Brazoria, Calhoun, DeWitt, Goliad, Gonzales, Jackson, Lavaca, Live Oak, Matagorda, McMullen, Refugio, Victoria, Wharton", lat: 28.8053, lng: -96.9828 },
  { name: "Community Action Corporation of South Texas", address: "204 E 1st Street", city: "Alice", zip: "78333-4822", phone: "(361) 664-0145", chiefExecutive: "Ann Awalt", counties: "Brooks, Cameron, Duval, Hidalgo, Jim Hogg, Jim Wells, Kenedy, Kleberg, San Patricio, Starr, Webb, Willacy, Zapata", lat: 27.7525, lng: -98.0697 },
  { name: "Community Council of South Central Texas, Inc.", shortName: "CCSCT", address: "801 N. State Hwy 123 Bypass", city: "Seguin", zip: "78155", phone: "(830) 303-4376", chiefExecutive: "Bobby Deike", counties: "Brewster, Crane, Culberson, Jeff Davis, Dimmit, Edwards, Hudspeth, Kinney, La Salle, Maverick, Pecos, Presidio, Real, Terrell, Uvalde, Val Verde, Zavala", lat: 29.5688, lng: -97.9647 },
  { name: "Concho Valley Community Action Agency", address: "133 W. Concho Ave., Suite 301", city: "San Angelo", zip: "76903", phone: "(325) 653-2411", chiefExecutive: "Mike Burnett", counties: "Coke, Coleman, Concho, Crockett, Irion, Kimble, McCulloch, Menard, Reagan, Runnels, Schleicher, Sterling, Sutton, Tom Green", lat: 31.4638, lng: -100.4370 },
  { name: "Dallas County Department of Health and Human Services", shortName: "Dallas County HHS", address: "2377 N Stemmons Fwy, Ste 600 L", city: "Dallas", zip: "75207-2710", phone: "(214) 819-1848", chiefExecutive: "Dr. Philip Huang", counties: "Dallas", lat: 32.7767, lng: -96.7970 },
  { name: "Economic Opportunities Advancement Corporation", address: "500 Franklin Avenue", city: "Waco", zip: "76701-2111", phone: "(254) 753-0331", chiefExecutive: "Robert Kunze", counties: "Bosque, Ellis, Falls, Freestone, Hill, Johnson, Limestone, McLennan, Navarro", lat: 31.5493, lng: -97.1467 },
  { name: "El Paso Community Action, Project BRAVO", address: "2000 Texas Avenue", city: "El Paso", zip: "79901", phone: "(915) 562-4100", chiefExecutive: "Laura Ponce", counties: "El Paso", lat: 31.7619, lng: -106.4850 },
  { name: "City of Fort Worth, Neighborhood Services Department", address: "200 Texas Street Annex, 3rd Floor", city: "Fort Worth", zip: "76102", phone: "(817) 392-5790", chiefExecutive: "Sonia Singleton", counties: "Tarrant", lat: 32.7555, lng: -97.3308 },
  { name: "Greater East Texas Community Action Program (GETCAP)", address: "116 W. Hospital", city: "Nacogdoches", zip: "75961", phone: "(800) 621-5746", chiefExecutive: "Karen Swenson", counties: "Anderson, Angelina, Chambers, Cherokee, Galveston, Gregg, Hardin, Harrison, Henderson, Houston, Jasper, Jefferson, Kaufman, Liberty, Nacogdoches, Newton, Orange, Panola, Polk, Rusk, Sabine, San Augustine, San Jacinto, Shelby, Smith, Trinity, Tyler, Upshur, Van Zandt, Wood", lat: 31.6035, lng: -94.6555 },
  { name: "Hill Country Community Action Association, Inc.", address: "2905 W Wallace Street", city: "San Saba", zip: "76877", phone: "(325) 372-5167", chiefExecutive: "Ashley Johnson", counties: "Bell, Burnet, Coryell, Erath, Hamilton, Lampasas, Llano, Mason, Milam, Mills, San Saba, Somervell, Williamson", lat: 31.1896, lng: -98.7189 },
  { name: "Nueces County Community Action Agency", address: "101 S Padres Island Drive", city: "Corpus Christi", zip: "78405", phone: "(361) 883-7201", chiefExecutive: "Alma Barrera", counties: "Nueces", lat: 27.8006, lng: -97.3964 },
  { name: "Panhandle Community Services", address: "PO Box 32150, 139 SW 8th Avenue", city: "Amarillo", zip: "79120-2150", phone: "(806) 372-2531", chiefExecutive: "Magi York", counties: "Armstrong, Briscoe, Carson, Castro, Childress, Collingsworth, Dallam, Deaf Smith, Donley, Gray, Hall, Hansford, Hartley, Hemphill, Hutchinson, Lipscomb, Moore, Ochiltree, Oldham, Parmer, Potter, Randall, Roberts, Sherman, Swisher, Wheeler", lat: 35.2220, lng: -101.8313 },
  { name: "Rolling Plains Management Corporation", address: "118 North 1st Street, PO Box 490", city: "Crowell", zip: "76301", phone: "(940) 684-1571", chiefExecutive: "Debra Thomas", counties: "Archer, Baylor, Brown, Callahan, Clay, Comanche, Cottle, Eastland, Foard, Hardeman, Haskell, Hood, Jack, Jones, Kent, Knox, Montague, Palo Pinto, Parker, Shackelford, Stephens, Stonewall, Taylor, Throckmorton, Wichita, Wilbarger, Wise, Young", lat: 33.9840, lng: -99.7228 },
  { name: "South Plains Community Action Association, Inc.", address: "PO Box 610", city: "Levelland", zip: "79336-0610", phone: "(806) 894-6104", chiefExecutive: "William D. Powell, Jr.", counties: "Bailey, Cochran, Crosby, Dickens, Floyd, Garza, Hale, Hockley, King, Lamb, Lubbock, Lynn, Motley, Terry, Yoakum", lat: 33.5879, lng: -102.3779 },
  { name: "Texoma Council of Governments", shortName: "TCOG", address: "1117 Gallagher Drive", city: "Sherman", zip: "75090", phone: "(903) 893-2161", chiefExecutive: "Eric Bridges", counties: "Bowie, Camp, Cass, Collin, Cooke, Delta, Denton, Fannin, Franklin, Grayson, Hopkins, Hunt, Lamar, Marion, Morris, Rains, Red River, Rockwall, Titus", lat: 33.6357, lng: -96.6089 },
  { name: "Travis County Health & Human Services / Veterans Services", shortName: "Travis County HHS", address: "5325 Airport Blvd.", city: "Austin", zip: "78751", phone: "(512) 854-7250", chiefExecutive: "Pilar Sanchez", counties: "Travis", lat: 30.2672, lng: -97.7431 },
  { name: "West Texas Opportunities, Inc.", address: "PO Box 1308, 603 North 4th Street", city: "Lamesa", zip: "79331", phone: "(806) 872-8354", chiefExecutive: "Jenny Gibson", counties: "Andrews, Borden, Dawson, Ector, Fisher, Gaines, Glasscock, Howard, Loving, Martin, Midland, Mitchell, Nolan, Reeves, Scurry, Upton, Ward, Winkler", lat: 32.7376, lng: -101.9510 },
];

// The 5 most popular regional providers — shown as cards on the left.
const MOST_POPULAR_PROVIDERS: {
  region: string;
  agencyIndex: number;
}[] = [
  { region: "Dallas County", agencyIndex: 9 },
  { region: "Central / South / West Texas", agencyIndex: 7 },
  { region: "Texoma Region (North Texas)", agencyIndex: 19 },
  { region: "Austin / Travis County", agencyIndex: 20 },
  { region: "San Antonio / AACOG Region", agencyIndex: 0 },
];

const WeatherizationMap = dynamic(() => import("./WeatherizationMap").then((m) => m.WeatherizationMap), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[560px] bg-gray-100 animate-pulse" />,
});

export function WeatherizationLocationFinder() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const selected = selectedIndex !== null ? WAP_AGENCIES[selectedIndex] : null;

  const handleSelect = useCallback((index: number | null) => {
    setSelectedIndex(index);
  }, []);

  const findNearest = useCallback((lat: number, lng: number) => {
    let nearestDist = Infinity;
    let nearestIdx = 0;
    WAP_AGENCIES.forEach((a, i) => {
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
      // Check if it's a zip code
      const isZip = /^\d{5}$/.test(q);

      // Try local city match first (fast path)
      if (!isZip) {
        const lowerQ = q.toLowerCase();
        const localMatch = WAP_AGENCIES.findIndex((a) => a.city.toLowerCase() === lowerQ);
        if (localMatch !== -1) {
          setSelectedIndex(localMatch);
          setUserLocation({ lat: WAP_AGENCIES[localMatch].lat, lng: WAP_AGENCIES[localMatch].lng, label: q });
          setSearching(false);
          return;
        }
      }

      // Geocode via Nominatim
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

  const popularIndices = useMemo(() => new Set(MOST_POPULAR_PROVIDERS.map((p) => p.agencyIndex)), []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left — popular providers list */}
        <div className="p-6 md:p-8 flex flex-col">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Find Your Local Agency
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            The Weatherization Assistance Program is delivered through local subrecipient agencies across all 254 Texas counties. Find the office serving your area below.
          </p>

          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">Most Popular Providers</p>
            <p className="text-[11px] text-gray-400 font-medium">5 of {WAP_AGENCIES.length}</p>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {MOST_POPULAR_PROVIDERS.map((provider) => {
              const agency = WAP_AGENCIES[provider.agencyIndex];
              const isActive = selectedIndex === provider.agencyIndex;
              return (
                <button
                  key={provider.region}
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
                      <p className="text-[10px] font-semibold text-primary-700 uppercase tracking-wide leading-none">{provider.region}</p>
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
              <p className="text-xs text-gray-500 mt-0.5">Search the map, or call 2-1-1 to find the Weatherization provider in your county.</p>
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
              agencies={WAP_AGENCIES}
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
                      <p className="text-gray-900">{selected.address}</p>
                      <p className="text-gray-600">{selected.city}, TX {selected.zip}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-primary-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${selected.phone.replace(/\D/g, "")}`} className="font-semibold text-primary-700 hover:text-primary-600 no-underline">
                      {selected.phone}
                    </a>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Chief Executive</p>
                      <p className="text-gray-900">{selected.chiefExecutive}</p>
                    </div>
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
