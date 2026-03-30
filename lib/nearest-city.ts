/**
 * Find the nearest major city with provider coverage.
 *
 * Used by the power page empty state to suggest a nearby city when the
 * user's searched city has no providers.
 */

import { expandCityAliases } from "@/lib/city-aliases";

// Top 200 cities — format: [city, state, population, lat, lng]
type CityTuple = [string, string, number, number, number];

let citiesCache: CityTuple[] | null = null;

async function loadCities(): Promise<CityTuple[]> {
  if (citiesCache) return citiesCache;
  // Server-side: read from filesystem. Client-side: fetch from public dir.
  if (typeof window === "undefined") {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "public/data/cities-tier1.json");
    const raw = await fs.readFile(filePath, "utf-8");
    citiesCache = JSON.parse(raw) as CityTuple[];
  } else {
    const res = await fetch("/data/cities-tier1.json");
    citiesCache = (await res.json()) as CityTuple[];
  }
  return citiesCache;
}

/** Haversine distance in miles between two lat/lng points. */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const STATE_SLUGS: Record<string, string> = {
  AL: "alabama", AK: "alaska", AZ: "arizona", AR: "arkansas", CA: "california",
  CO: "colorado", CT: "connecticut", DE: "delaware", FL: "florida", GA: "georgia",
  HI: "hawaii", ID: "idaho", IL: "illinois", IN: "indiana", IA: "iowa",
  KS: "kansas", KY: "kentucky", LA: "louisiana", ME: "maine", MD: "maryland",
  MA: "massachusetts", MI: "michigan", MN: "minnesota", MS: "mississippi", MO: "missouri",
  MT: "montana", NE: "nebraska", NV: "nevada", NH: "new-hampshire", NJ: "new-jersey",
  NM: "new-mexico", NY: "new-york", NC: "north-carolina", ND: "north-dakota", OH: "ohio",
  OK: "oklahoma", OR: "oregon", PA: "pennsylvania", PR: "puerto-rico", RI: "rhode-island",
  SC: "south-carolina", SD: "south-dakota", TN: "tennessee", TX: "texas", UT: "utah",
  VT: "vermont", VA: "virginia", WA: "washington", WV: "west-virginia", WI: "wisconsin",
  WY: "wyoming", DC: "district-of-columbia",
};

export interface NearestCityResult {
  city: string;
  state: string;
  distance: number; // miles
  citySlug: string;
  stateSlug: string;
  population: number;
}

/**
 * Find the nearest major city (from tier-1 list) that is different from
 * the searched city. Prefers same-state results but will cross state
 * lines if nothing is nearby.
 */
export async function getNearestCoveredCity(
  cityName: string,
  stateAbbrev: string
): Promise<NearestCityResult | null> {
  const cities = await loadCities();

  // Find the searched city's coordinates
  const origin = cities.find(
    (c) => c[0].toLowerCase() === cityName.toLowerCase() && c[1] === stateAbbrev
  );
  if (!origin) return null;

  const [, , , originLat, originLng] = origin;

  // Build exclusion set: the searched city + its aliases
  const excludeNames = new Set(
    expandCityAliases(cityName).map((n) => n.toLowerCase())
  );
  excludeNames.add(cityName.toLowerCase());

  let bestSameState: { tuple: CityTuple; dist: number } | null = null;
  let bestAny: { tuple: CityTuple; dist: number } | null = null;

  for (const c of cities) {
    if (excludeNames.has(c[0].toLowerCase()) && c[1] === stateAbbrev) continue;

    const dist = haversineDistance(originLat, originLng, c[3], c[4]);

    if (c[1] === stateAbbrev) {
      if (!bestSameState || dist < bestSameState.dist) {
        bestSameState = { tuple: c, dist };
      }
    }
    if (!bestAny || dist < bestAny.dist) {
      bestAny = { tuple: c, dist };
    }
  }

  // Prefer same state; fall back to closest overall
  const best = bestSameState || bestAny;
  if (!best) return null;

  const [city, state, population] = best.tuple;
  return {
    city,
    state,
    distance: Math.round(best.dist),
    citySlug: cityToSlug(city),
    stateSlug: STATE_SLUGS[state] || state.toLowerCase(),
    population,
  };
}
