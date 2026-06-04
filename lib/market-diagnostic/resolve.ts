import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * City resolver for the market diagnostic — turns (city, state) into the geo inputs the
 * engine needs WITHOUT any paid geocoding call:
 *   - center lat/lng   (Places locationBias)
 *   - ZCTA set          (Census ACS5 demographics — the city's own ZIP codes)
 *
 * Source: data/geo/city-zips.json, a slimmed server-only port of the expansion-map
 * cities dataset (17.8K US cities, each with lat/lng + ZIP set + county). Loaded once and
 * cached in module memory.
 */

export type CareType = "homecare" | "assisted_living";

export interface ResolvedCity {
  city: string;
  state: string;
  lat: number;
  lng: number;
  zctas: string[];
  county: string | null;
}

type CityRecord = { la: number; ln: number; z: string[]; p: number; cn: string | null };

let CITY_INDEX: Record<string, CityRecord> | null = null;

function loadIndex(): Record<string, CityRecord> {
  if (CITY_INDEX) return CITY_INDEX;
  const file = path.join(process.cwd(), "data/geo/city-zips.json");
  CITY_INDEX = JSON.parse(readFileSync(file, "utf8")) as Record<string, CityRecord>;
  return CITY_INDEX;
}

/** Normalize a care-type string from the provider profile into the engine's two buckets. */
export function normCareType(input: string | null | undefined): CareType {
  const s = (input || "").toLowerCase();
  if (/assisted|memory|residential|senior[_\s-]?living|retirement/.test(s)) return "assisted_living";
  return "homecare"; // default — home care is the primary case and the gated dogfood
}

/** Look up a city's geo. Returns null if the city isn't in the dataset (→ can't diagnose). */
export function resolveCity(city: string, state: string): ResolvedCity | null {
  const index = loadIndex();
  const key = `${city.trim()}|${state.trim()}`.toLowerCase();
  const rec = index[key];
  if (!rec || rec.la == null || rec.ln == null) return null;
  return {
    city: city.trim(),
    state: state.trim().toUpperCase(),
    lat: rec.la,
    lng: rec.ln,
    zctas: rec.z || [],
    county: rec.cn,
  };
}
