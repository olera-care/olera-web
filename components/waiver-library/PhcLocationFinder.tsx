"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

export interface PhcAgency {
  name: string;
  shortName?: string;
  city: string;
  phone: string;
  tollFree?: string;
  address: string;
  counties: string;
  region: string;
  website?: string;
  lat: number;
  lng: number;
  unverified?: boolean;
}

// Primary Home Care in Texas is accessed through local Aging and Disability
// Resource Centers (ADRCs), which help connect people to HHSC community care
// services including PHC.
export const PHC_AGENCIES: PhcAgency[] = [
  {
    name: "Alamo ADRC",
    shortName: "Alamo ADRC",
    city: "Kerrville",
    phone: "(210) 477-3275",
    tollFree: "(866) 231-4922",
    address: "206 Schreiner St., Kerrville, TX 78028",
    counties: "Atascosa, Bandera, Comal, Frio, Gillespie, Guadalupe, Karnes, Kendall, Kerr, McMullen, Medina, Wilson",
    region: "Central Texas",
    lat: 30.0474,
    lng: -99.1403,
  },
  {
    name: "Ark-Tex ADRC",
    shortName: "Ark-Tex ADRC",
    city: "Texarkana",
    phone: "(903) 793-2756",
    tollFree: "(855) 937-2372",
    address: "4808 Elizabeth Street, Texarkana, TX 75503",
    counties: "Bowie, Cass, Delta, Franklin, Hopkins, Lamar, Morris, Red River, Titus",
    region: "North East Texas",
    lat: 33.4418,
    lng: -94.0377,
  },
  {
    name: "Bexar County ADRC",
    shortName: "Bexar County ADRC",
    city: "San Antonio",
    phone: "(210) 477-3275",
    tollFree: "(855) 937-2372",
    address: "2700 NE Loop 410, Suite 101, San Antonio, TX 78217",
    counties: "Bexar",
    region: "South Texas",
    lat: 29.5369,
    lng: -98.4390,
  },
  {
    name: "Brazos Valley ADRC",
    shortName: "Brazos Valley ADRC",
    city: "Bryan",
    phone: "(979) 595-2831",
    tollFree: "(855) 937-2372",
    address: "3991 E. 29th St., Bryan, TX 77802",
    counties: "Brazos, Burleson, Grimes, Leon, Madison, Robertson, Washington",
    region: "Central Texas",
    lat: 30.6744,
    lng: -96.3698,
  },
  {
    name: "Capital Area ADRC",
    shortName: "Capital Area ADRC",
    city: "Austin",
    phone: "(855) 937-2372",
    tollFree: "(855) 937-2372",
    address: "6800 Burleson Road, Bldg. 310, Suite 165, Austin, TX 78744",
    counties: "Bastrop, Blanco, Burnet, Caldwell, Fayette, Hays, Lee, Llano, Travis, Williamson",
    region: "Central Texas",
    lat: 30.2195,
    lng: -97.7126,
  },
  {
    name: "Central Texas ADRC",
    shortName: "Central Texas ADRC",
    city: "Belton",
    phone: "(855) 937-2372",
    tollFree: "(855) 937-2372",
    address: "2180 N. Main St., Belton, TX 76513",
    counties: "Bell, Coryell, Hamilton, Lampasas, Milam, Mills, San Saba",
    region: "Central Texas",
    lat: 31.0554,
    lng: -97.4641,
  },
  {
    name: "Coastal Bend ADRC",
    shortName: "Coastal Bend ADRC",
    city: "Corpus Christi",
    phone: "(361) 883-3935",
    tollFree: "(855) 937-2372",
    address: "2910 Leopard St., Corpus Christi, TX 78408",
    counties: "Aransas, Bee, Brooks, Duval, Jim Wells, Kenedy, Kleberg, Live Oak, Nueces, Refugio, San Patricio",
    region: "South Texas",
    lat: 27.8135,
    lng: -97.4340,
  },
  {
    name: "Concho Valley ADRC",
    shortName: "Concho Valley ADRC",
    city: "San Angelo",
    phone: "(325) 944-9666",
    tollFree: "(855) 937-2372",
    address: "2801 W. Loop 306, Suite A, San Angelo, TX 76904",
    counties: "Coke, Concho, Crockett, Edwards, Irion, Kimble, Mason, McCulloch, Menard, Reagan, Schleicher, Sterling, Sutton, Tom Green",
    region: "West Texas",
    lat: 31.4188,
    lng: -100.4860,
  },
  {
    name: "Dallas ADRC",
    shortName: "Dallas ADRC",
    city: "Dallas",
    phone: "(888) 743-1202",
    tollFree: "(855) 937-2372",
    address: "1345 River Bend Drive, Suite 200, Dallas, TX 75247",
    counties: "Dallas",
    region: "North Texas",
    lat: 32.8155,
    lng: -96.8731,
  },
  {
    name: "Deep East Texas ADRC",
    shortName: "Deep East Texas ADRC",
    city: "Lufkin",
    phone: "(409) 381-5255",
    tollFree: "(855) 937-2372",
    address: "1405 Kurth Drive, Lufkin, TX 75904",
    counties: "Angelina, Houston, Jasper, Nacogdoches, Newton, Polk, Sabine, San Augustine, San Jacinto, Shelby, Trinity, Tyler",
    region: "East Texas",
    lat: 31.3663,
    lng: -94.6992,
  },
  {
    name: "East Texas ADRC",
    shortName: "East Texas ADRC",
    city: "Longview",
    phone: "(903) 295-5922",
    tollFree: "(855) 937-2372",
    address: "501 Pine Tree Road, Longview, TX 75604",
    counties: "Anderson, Camp, Cherokee, Gregg, Harrison, Henderson, Marion, Panola, Rains, Rusk, Smith, Upshur, Van Zandt, Wood",
    region: "East Texas",
    lat: 32.5321,
    lng: -94.7783,
  },
  {
    name: "Golden Crescent ADRC",
    shortName: "Golden Crescent ADRC",
    city: "Victoria",
    phone: "(361) 578-1587",
    tollFree: "(855) 937-2372",
    address: "1908 N. Laurent, Suite 600, Victoria, TX 77901",
    counties: "Calhoun, DeWitt, Goliad, Gonzales, Jackson, Lavaca, Victoria",
    region: "South Texas",
    lat: 28.8246,
    lng: -97.0036,
  },
  {
    name: "Harris County ADRC",
    shortName: "Harris County ADRC",
    city: "Houston",
    phone: "(832) 393-5564",
    tollFree: "(855) 937-2372",
    address: "4802 Lockwood Dr., Houston, TX 77026",
    counties: "Harris",
    region: "Greater Houston & Gulf Coast",
    lat: 29.8009,
    lng: -95.3183,
  },
  {
    name: "Heart of Texas ADRC",
    shortName: "Heart of Texas ADRC",
    city: "Waco",
    phone: "(254) 292-1855",
    tollFree: "(855) 937-2372",
    address: "1514 South New Road, Waco, TX 76711",
    counties: "Bosque, Falls, Freestone, Hill, Limestone, McLennan",
    region: "Central Texas",
    lat: 31.5294,
    lng: -97.1595,
  },
  {
    name: "Houston-Galveston ADRC",
    shortName: "Houston-Galveston ADRC",
    city: "Richmond",
    phone: "(832) 681-2635",
    tollFree: "(855) 937-2372",
    address: "1111 Collins Road, Richmond, TX 77469",
    counties: "Austin, Brazoria, Chambers, Colorado, Fort Bend, Galveston, Liberty, Matagorda, Montgomery, Walker, Waller, Wharton",
    region: "Greater Houston & Gulf Coast",
    lat: 29.5746,
    lng: -95.7615,
  },
  {
    name: "Lower Rio Grande Valley ADRC",
    shortName: "Lower Rio Grande Valley ADRC",
    city: "Weslaco",
    phone: "(956) 412-0958",
    tollFree: "(855) 937-2372",
    address: "301 W. Railroad St., Weslaco, TX 78596",
    counties: "Cameron, Hidalgo, Willacy",
    region: "South Texas",
    lat: 26.1595,
    lng: -97.9908,
  },
  {
    name: "Middle Rio Grande ADRC",
    shortName: "Middle Rio Grande ADRC",
    city: "Eagle Pass",
    phone: "(830) 256-8174",
    tollFree: "(855) 937-2372",
    address: "3406 Bob Rogers Drive, Eagle Pass, TX 78852",
    counties: "Dimmit, Kinney, LaSalle, Maverick, Real, Uvalde, Val Verde, Zavala",
    region: "South Texas",
    lat: 28.7071,
    lng: -100.4996,
  },
  {
    name: "North Central Texas ADRC",
    shortName: "North Central Texas ADRC",
    city: "Arlington",
    phone: "(877) 229-9084",
    tollFree: "(855) 937-2372",
    address: "616 Six Flags Drive, Arlington, TX 76011",
    counties: "Collin, Denton, Ellis, Erath, Hood, Hunt, Johnson, Kaufman, Navarro, Palo Pinto, Parker, Rockwall, Somervell, Wise",
    region: "North Texas",
    lat: 32.7516,
    lng: -97.0820,
  },
  {
    name: "North Texas ADRC",
    shortName: "North Texas ADRC",
    city: "Wichita Falls",
    phone: "(940) 234-1644",
    tollFree: "(855) 937-2372",
    address: "4309 Jacksboro Highway, Suite 200, Wichita Falls, TX 76302",
    counties: "Archer, Baylor, Clay, Cottle, Foard, Hardeman, Jack, Montague, Wichita, Wilbarger, Young",
    region: "North Texas",
    lat: 33.8768,
    lng: -98.4939,
  },
  {
    name: "Panhandle ADRC",
    shortName: "Panhandle ADRC",
    city: "Lubbock",
    phone: "(806) 744-2657",
    tollFree: "(855) 937-2372",
    address: "1323 58th Street, Lubbock, TX 79412",
    counties: "Armstrong, Briscoe, Carson, Castro, Childress, Collingsworth, Dallam, Deaf Smith, Donley, Gray, Hall, Hansford, Hartley, Hemphill, Hutchinson, Lipscomb, Moore, Ochiltree, Oldham, Parmer, Potter, Randall, Roberts, Sherman, Swisher, Wheeler",
    region: "West Texas",
    lat: 33.6074,
    lng: -101.8666,
  },
  {
    name: "Permian Basin ADRC",
    shortName: "Permian Basin ADRC",
    city: "Big Spring",
    phone: "(800) 687-0135",
    tollFree: "(855) 937-2372",
    address: "319 Runnels, Big Spring, TX 79720",
    counties: "Andrews, Borden, Crane, Dawson, Ector, Gaines, Glasscock, Howard, Loving, Martin, Midland, Pecos, Reeves, Terrell, Upton, Ward, Winkler",
    region: "West Texas",
    lat: 32.2504,
    lng: -101.4787,
  },
  {
    name: "Rio Grande ADRC",
    shortName: "Rio Grande ADRC",
    city: "El Paso",
    phone: "(915) 298-7307",
    tollFree: "(855) 937-2372",
    address: "3210 Dyer Street, El Paso, TX 79930",
    counties: "Brewster, Culberson, El Paso, Hudspeth, Jeff Davis, Presidio",
    region: "West Texas",
    lat: 31.7983,
    lng: -106.4666,
  },
  {
    name: "South East Texas ADRC",
    shortName: "South East Texas ADRC",
    city: "Silsbee",
    phone: "(409) 373-6776",
    tollFree: "(855) 937-2372",
    address: "228 Durdin Drive, Silsbee, TX 77656",
    counties: "Hardin, Jefferson, Orange",
    region: "East Texas",
    lat: 30.3485,
    lng: -94.1760,
  },
  {
    name: "South Plains ADRC",
    shortName: "South Plains ADRC",
    city: "Lubbock",
    phone: "(806) 744-2657",
    tollFree: "(855) 937-2372",
    address: "1323 58th Street, Lubbock, TX 79412",
    counties: "Bailey, Cochran, Crosby, Dickens, Floyd, Garza, Hale, Hockley, King, Lamb, Lubbock, Lynn, Motley, Terry, Yoakum",
    region: "West Texas",
    lat: 33.5074,
    lng: -101.8666,
  },
  {
    name: "South Texas ADRC",
    shortName: "South Texas ADRC",
    city: "Laredo",
    phone: "(956) 729-1425",
    tollFree: "(855) 937-2372",
    address: "1002 Dicky Lane, Laredo, TX 78044",
    counties: "Jim Hogg, Starr, Webb, Zapata",
    region: "South Texas",
    lat: 27.5036,
    lng: -99.5075,
  },
  {
    name: "Tarrant County ADRC",
    shortName: "Tarrant County ADRC",
    city: "Fort Worth",
    phone: "(682) 207-6107",
    tollFree: "(855) 937-2372",
    address: "201 Rupert Street, Suite 107, Fort Worth, TX 76107",
    counties: "Tarrant",
    region: "North Texas",
    lat: 32.7470,
    lng: -97.3530,
  },
  {
    name: "Texoma ADRC",
    shortName: "Texoma ADRC",
    city: "Sherman",
    phone: "(903) 813-3581",
    tollFree: "(855) 937-2372",
    address: "1117 Gallagher Drive, Suite 200, Sherman, TX 75090",
    counties: "Cooke, Fannin, Grayson",
    region: "North Texas",
    lat: 33.6357,
    lng: -96.6089,
  },
  {
    name: "West Central Texas ADRC",
    shortName: "West Central Texas ADRC",
    city: "Abilene",
    phone: "(325) 793-8440",
    tollFree: "(855) 937-2372",
    address: "3702 Loop 322, Abilene, TX 79602",
    counties: "Brown, Callahan, Coleman, Comanche, Eastland, Fisher, Haskell, Jones, Kent, Knox, Mitchell, Nolan, Runnels, Scurry, Shackelford, Stephens, Stonewall, Taylor, Throckmorton",
    region: "West Texas",
    lat: 32.4487,
    lng: -99.7331,
  },
];

const WeatherizationMap = dynamic(() => import("./WeatherizationMap").then((m) => m.WeatherizationMap), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[560px] bg-gray-100 animate-pulse" />,
});

export function PhcLocationFinder() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const selected = selectedIndex !== null ? PHC_AGENCIES[selectedIndex] : null;

  const handleSelect = useCallback((index: number | null) => {
    setSelectedIndex(index);
  }, []);

  const findNearest = useCallback((lat: number, lng: number) => {
    let nearestDist = Infinity;
    let nearestIdx = 0;
    PHC_AGENCIES.forEach((a, i) => {
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
        const localMatch = PHC_AGENCIES.findIndex((a) => a.city.toLowerCase() === lowerQ);
        if (localMatch !== -1) {
          setSelectedIndex(localMatch);
          setUserLocation({ lat: PHC_AGENCIES[localMatch].lat, lng: PHC_AGENCIES[localMatch].lng, label: q });
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
          Find Your Aging and Disability Resource Center
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
            agencies={PHC_AGENCIES}
            popularIndices={popularIndices}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            userLocation={userLocation}
          />

          {/* Overlay details */}
          {selected && (
            <div className="absolute top-3 right-3 w-[calc(100%-1.5rem)] sm:w-[360px] max-h-[calc(100%-1.5rem)] overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-200 z-[500]">
              <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">Selected ADRC</p>
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
                </div>

                {selected.tollFree && (
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-primary-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Toll-Free</p>
                      <a href={`tel:${selected.tollFree.replace(/\D/g, "")}`} className="font-semibold text-primary-700 hover:text-primary-600 no-underline">
                        {selected.tollFree}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Address</p>
                    <p className="text-gray-700 leading-relaxed">{selected.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
  );
}
