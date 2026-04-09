"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

export interface MowProvider {
  name: string;
  city: string;
  address: string;
  phone?: string;
  region: string;
  website?: string;
  lat: number;
  lng: number;
}

// Curated list of major Texas Meals on Wheels providers.
// Sourced from Meals on Wheels America directory.
export const MOW_PROVIDERS: MowProvider[] = [
  // --- Greater Houston & Gulf Coast ---
  {
    name: "Meals on Wheels for Greater Houston (Interfaith Ministries)",
    city: "Houston",
    address: "3303 Main St, Houston, TX 77002",
    phone: "(713) 533-4900",
    region: "Greater Houston",
    website: "https://imgh.org",
    lat: 29.7414,
    lng: -95.3776,
  },
  {
    name: "Target Hunger",
    city: "Houston",
    address: "2814 Sultan St, Houston, TX 77093",
    phone: "(713) 226-4953",
    region: "Greater Houston",
    website: "https://www.targethunger.org",
    lat: 29.8447,
    lng: -95.3350,
  },
  {
    name: "YWCA of Houston",
    city: "Houston",
    address: "6309 N Lydia Mendoza Blvd, Houston, TX 77091",
    phone: "(713) 868-9922",
    region: "Greater Houston",
    website: "https://www.ywcahouston.org",
    lat: 29.8668,
    lng: -95.4394,
  },
  {
    name: "Northwest Assistance Ministries Meals on Wheels",
    city: "Houston",
    address: "15555 Kuykendahl Rd, Houston, TX 77090",
    phone: "(281) 885-4555",
    region: "Greater Houston",
    website: "https://www.namonline.org",
    lat: 30.0222,
    lng: -95.4779,
  },
  {
    name: "BakerRipley",
    city: "Houston",
    address: "6500 Rookin St, Houston, TX 77074",
    phone: "(713) 667-9400",
    region: "Greater Houston",
    website: "https://www.bakerripley.org",
    lat: 29.6892,
    lng: -95.5242,
  },
  {
    name: "Harris County Area Agency on Aging",
    city: "Houston",
    address: "8000 N Stadium Dr Fl 2, Houston, TX 77054",
    phone: "(832) 393-4301",
    region: "Greater Houston",
    lat: 29.6841,
    lng: -95.4108,
  },
  {
    name: "Fort Bend Seniors Meals on Wheels",
    city: "Rosenberg",
    address: "1330 140th St, Rosenberg, TX 77469",
    phone: "(281) 633-7049",
    region: "Greater Houston",
    website: "https://www.fortbendseniors.org",
    lat: 29.5574,
    lng: -95.8083,
  },
  {
    name: "Meals on Wheels Montgomery County",
    city: "Conroe",
    address: "111 S 2nd St, Conroe, TX 77301",
    phone: "(936) 271-3393",
    region: "Greater Houston",
    website: "https://www.mowmc.org",
    lat: 30.3119,
    lng: -95.4560,
  },
  {
    name: "Baytown Meals On Wheels",
    city: "Baytown",
    address: "1500 E Main St, Baytown, TX 77520",
    phone: "(281) 427-3140",
    region: "Greater Houston",
    website: "https://www.btmow.org",
    lat: 29.7355,
    lng: -94.9669,
  },
  {
    name: "Gleanings From the Harvest (Galveston)",
    city: "Texas City",
    address: "3314 25th Ave N, Texas City, TX 77590",
    phone: "(409) 945-4232",
    region: "Greater Houston",
    lat: 29.4013,
    lng: -94.9113,
  },

  // --- North Texas (Dallas / Fort Worth) ---
  {
    name: "VNA Meals on Wheels (Visiting Nurse Association of Texas)",
    city: "Dallas",
    address: "1440 W Mockingbird Ln Ste 350, Dallas, TX 75247",
    phone: "(214) 689-2200",
    region: "North Texas",
    website: "https://www.vnatexas.org",
    lat: 32.8233,
    lng: -96.8667,
  },
  {
    name: "Meals On Wheels, Inc. of Tarrant County",
    city: "Fort Worth",
    address: "320 S Freeway, Fort Worth, TX 76104",
    phone: "(817) 336-0912",
    region: "North Texas",
    website: "https://www.mealsonwheels.org",
    lat: 32.7378,
    lng: -97.3246,
  },
  {
    name: "Meals on Wheels of Collin County",
    city: "McKinney",
    address: "600 N Tennessee St, McKinney, TX 75069",
    phone: "(972) 562-6996",
    region: "North Texas",
    website: "https://www.mealsonwheelscollincounty.org",
    lat: 33.1986,
    lng: -96.6164,
  },
  {
    name: "Meals on Wheels Denton County",
    city: "Denton",
    address: "306 N Loop 288 Ste 100, Denton, TX 76209",
    phone: "(940) 382-2224",
    region: "North Texas",
    website: "https://mowdentoncounty.org",
    lat: 33.2276,
    lng: -97.1106,
  },

  // --- Central Texas (Austin / Waco) ---
  {
    name: "Meals on Wheels Central Texas",
    city: "Austin",
    address: "3227 E 5th St, Austin, TX 78702",
    phone: "(512) 476-6325",
    region: "Central Texas",
    website: "https://www.mealsonwheelscentraltexas.org",
    lat: 30.2588,
    lng: -97.7071,
  },
  {
    name: "Area Agency on Aging of the Capital Area",
    city: "Austin",
    address: "6800 Burleson Rd Bldg 310 Ste 165, Austin, TX 78744",
    phone: "(512) 916-6062",
    region: "Central Texas",
    website: "https://www.aaacap.org",
    lat: 30.1924,
    lng: -97.6674,
  },
  {
    name: "Opportunities for Williamson & Burnet Counties",
    city: "Georgetown",
    address: "604 High Tech Dr, Georgetown, TX 78626",
    phone: "(512) 763-1400",
    region: "Central Texas",
    website: "https://www.owbc-tx.org",
    lat: 30.6328,
    lng: -97.6779,
  },
  {
    name: "Bell County Meals on Wheels",
    city: "Temple",
    address: "1721 S 61st St, Temple, TX 76504",
    phone: "(254) 778-4088",
    region: "Central Texas",
    website: "https://bellcountymow.org",
    lat: 31.0715,
    lng: -97.3831,
  },
  {
    name: "Caritas of Waco — Meals on Wheels",
    city: "Waco",
    address: "300 S 15th St, Waco, TX 76701",
    phone: "(254) 753-4593",
    region: "Central Texas",
    website: "https://www.caritas-waco.org",
    lat: 31.5467,
    lng: -97.1336,
  },

  // --- San Antonio & Surrounding ---
  {
    name: "Meals on Wheels San Antonio",
    city: "San Antonio",
    address: "1718 Fredericksburg Rd, San Antonio, TX 78201",
    phone: "(210) 735-5115",
    region: "San Antonio Area",
    website: "https://www.mowsatx.org",
    lat: 29.4517,
    lng: -98.5103,
  },
  {
    name: "The Center",
    city: "San Antonio",
    address: "17 N San Saba St, San Antonio, TX 78207",
    phone: "(210) 299-2110",
    region: "San Antonio Area",
    website: "https://www.mysacenter.org",
    lat: 29.4256,
    lng: -98.5050,
  },
  {
    name: "Presa Senior Center",
    city: "San Antonio",
    address: "3721 S Presa St, San Antonio, TX 78210",
    phone: "(210) 532-5996",
    region: "San Antonio Area",
    lat: 29.3778,
    lng: -98.4719,
  },
  {
    name: "Alamo Area Council of Governments",
    city: "San Antonio",
    address: "8700 Tesoro Dr Suite 700, San Antonio, TX 78217",
    phone: "(210) 362-5200",
    region: "San Antonio Area",
    website: "https://www.aacog.com",
    lat: 29.5286,
    lng: -98.4502,
  },
  {
    name: "Medina Senior Center & Meals on Wheels",
    city: "Castroville",
    address: "1401 24th St, Hondo, TX 78861",
    phone: "(830) 741-4148",
    region: "San Antonio Area",
    lat: 29.3480,
    lng: -99.1420,
  },
  {
    name: "Meals on Wheels Bulverde Spring Branch",
    city: "Spring Branch",
    address: "28820 Cibolo Creek Rd, Bulverde, TX 78070",
    phone: "(830) 980-5011",
    region: "San Antonio Area",
    website: "https://www.bsbmow.com",
    lat: 29.7428,
    lng: -98.4089,
  },
  {
    name: "Comal County Senior Citizens Foundation",
    city: "New Braunfels",
    address: "655 Landa St, New Braunfels, TX 78130",
    phone: "(830) 629-4547",
    region: "San Antonio Area",
    website: "https://www.ccscftx.org",
    lat: 29.7044,
    lng: -98.1233,
  },
  {
    name: "Silver Sage Community Center",
    city: "Bulverde",
    address: "803 Loop 337, Bulverde, TX 78163",
    phone: "(830) 438-2580",
    region: "San Antonio Area",
    website: "https://www.silversagesa.org",
    lat: 29.7436,
    lng: -98.4542,
  },
  {
    name: "Comfort Golden Age Center",
    city: "Comfort",
    address: "620 Front Street, Comfort, TX 78013",
    phone: "(830) 995-3966",
    region: "San Antonio Area",
    lat: 29.9691,
    lng: -98.9061,
  },
  {
    name: "Greater Randolph Area Services Program",
    city: "Universal City",
    address: "280 Tuleta Dr, Converse, TX 78109-1480",
    phone: "(210) 658-6351",
    region: "San Antonio Area",
    website: "https://www.grasptx.org",
    lat: 29.5180,
    lng: -98.3092,
  },
  {
    name: "Dietert Center",
    city: "Kerrville",
    address: "451 Guadalupe St, Kerrville, TX 78028",
    phone: "(830) 792-4044",
    region: "San Antonio Area",
    website: "https://www.dietert.org",
    lat: 30.0474,
    lng: -99.1403,
  },
  {
    name: "Habitat for Safe Seniors, Inc.",
    city: "Canyon Lake",
    address: "1171 Old Sattler Rd, Canyon Lake, TX 78133",
    phone: "(830) 964-4536",
    region: "San Antonio Area",
    lat: 29.8758,
    lng: -98.2611,
  },

  // --- South Texas (Corpus / RGV) ---
  {
    name: "Meals on Wheels of Corpus Christi",
    city: "Corpus Christi",
    address: "5919 S Staples St, Corpus Christi, TX 78413",
    phone: "(361) 853-9978",
    region: "South Texas",
    website: "https://www.mowcc.org",
    lat: 27.7009,
    lng: -97.3782,
  },
  {
    name: "Rio Grande Valley Council — Area Agency on Aging",
    city: "Weslaco",
    address: "301 W Railroad St, Weslaco, TX 78596",
    phone: "(956) 682-3481",
    region: "South Texas",
    website: "https://www.lrgvdc.org",
    lat: 26.1590,
    lng: -97.9908,
  },
  {
    name: "Bee Community Action Agency",
    city: "Beeville",
    address: "202 E Corpus Christi St, Beeville, TX 78102",
    phone: "(361) 358-1529",
    region: "South Texas",
    lat: 28.4013,
    lng: -97.7478,
  },

  // --- East Texas ---
  {
    name: "Meals on Wheels East Texas",
    city: "Tyler",
    address: "3001 Robertson Rd, Tyler, TX 75701",
    phone: "(903) 593-7385",
    region: "East Texas",
    website: "https://www.mowet.org",
    lat: 32.3513,
    lng: -95.2605,
  },
  {
    name: "Nutrition & Services for Seniors",
    city: "Beaumont",
    address: "4590 Concord Rd, Beaumont, TX 77703",
    phone: "(409) 892-4455",
    region: "East Texas",
    website: "https://www.nssseniors.org",
    lat: 30.1208,
    lng: -94.1316,
  },

  // --- West Texas / Panhandle ---
  {
    name: "Project Amistad — Meals on Wheels",
    city: "El Paso",
    address: "3210 Dyer St, El Paso, TX 79930",
    phone: "(915) 532-3790",
    region: "West Texas",
    website: "https://www.projectamistad.org",
    lat: 31.8040,
    lng: -106.4510,
  },
  {
    name: "Lubbock Meals on Wheels",
    city: "Lubbock",
    address: "2304 34th St, Lubbock, TX 79411",
    phone: "(806) 792-7971",
    region: "West Texas",
    website: "https://www.lubbockmealsonwheels.org",
    lat: 33.5568,
    lng: -101.8623,
  },
  {
    name: "Meals on Wheels of Amarillo",
    city: "Amarillo",
    address: "1909 S Jackson St, Amarillo, TX 79109",
    phone: "(806) 374-4364",
    region: "West Texas",
    website: "https://www.mealsonwheelsamarillo.org",
    lat: 35.1920,
    lng: -101.8363,
  },
  {
    name: "Meals on Wheels of Abilene",
    city: "Abilene",
    address: "717 Cypress St, Abilene, TX 79601",
    phone: "(325) 672-5050",
    region: "West Texas",
    website: "https://www.mealsonwheelsplus.org",
    lat: 32.4487,
    lng: -99.7331,
  },
  {
    name: "Senior Life Midland",
    city: "Midland",
    address: "3301 Sinclair Ave, Midland, TX 79707",
    phone: "(432) 689-6693",
    region: "West Texas",
    website: "https://www.seniorlifemidland.org",
    lat: 32.0010,
    lng: -102.1268,
  },
];

const WeatherizationMap = dynamic(() => import("./WeatherizationMap").then((m) => m.WeatherizationMap), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[560px] bg-gray-100 animate-pulse" />,
});

export function MealsOnWheelsLocationFinder() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const selected = selectedIndex !== null ? MOW_PROVIDERS[selectedIndex] : null;

  const handleSelect = useCallback((index: number | null) => {
    setSelectedIndex(index);
  }, []);

  const findNearest = useCallback((lat: number, lng: number) => {
    let nearestDist = Infinity;
    let nearestIdx = 0;
    MOW_PROVIDERS.forEach((a, i) => {
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
        const localMatch = MOW_PROVIDERS.findIndex((a) => a.city.toLowerCase() === lowerQ);
        if (localMatch !== -1) {
          setSelectedIndex(localMatch);
          setUserLocation({ lat: MOW_PROVIDERS[localMatch].lat, lng: MOW_PROVIDERS[localMatch].lng, label: q });
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
          Meals on Wheels Providers Across Texas
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
            agencies={MOW_PROVIDERS}
            popularIndices={popularIndices}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            userLocation={userLocation}
          />

          {/* Overlay details */}
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
                    <p className="text-[11px] font-semibold text-primary-700 uppercase tracking-wide mt-0.5">{selected.region}</p>
                  </div>
                </div>

                {selected.phone && (
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-primary-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${selected.phone.replace(/\D/g, "")}`} className="font-semibold text-primary-700 hover:text-primary-600 no-underline">
                      {selected.phone}
                    </a>
                  </div>
                )}

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

      {/* Footer — national directory fallback */}
      <div className="px-6 md:px-8 py-5 border-t border-gray-200 bg-primary-50/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-gray-900">Can&apos;t find a location near you?</p>
              <p className="text-xs text-gray-600 mt-0.5">Search the full national Meals on Wheels America directory by ZIP code.</p>
            </div>
          </div>
          <a
            href="https://www.mealsonwheelsamerica.org/find-meals-and-services/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-700 text-white text-xs font-semibold rounded-lg hover:bg-primary-800 transition-colors no-underline"
          >
            Visit Directory
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
