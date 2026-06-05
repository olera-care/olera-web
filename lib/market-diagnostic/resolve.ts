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

// Full state names → 2-letter, so a provider whose state is stored as "Georgia" (not "GA")
// still resolves. The index keys on 2-letter codes.
const STATE_ABBR: Record<string, string> = {
  alabama: "al", alaska: "ak", arizona: "az", arkansas: "ar", california: "ca", colorado: "co",
  connecticut: "ct", delaware: "de", "district of columbia": "dc", florida: "fl", georgia: "ga",
  hawaii: "hi", idaho: "id", illinois: "il", indiana: "in", iowa: "ia", kansas: "ks", kentucky: "ky",
  louisiana: "la", maine: "me", maryland: "md", massachusetts: "ma", michigan: "mi", minnesota: "mn",
  mississippi: "ms", missouri: "mo", montana: "mt", nebraska: "ne", nevada: "nv", "new hampshire": "nh",
  "new jersey": "nj", "new mexico": "nm", "new york": "ny", "north carolina": "nc", "north dakota": "nd",
  ohio: "oh", oklahoma: "ok", oregon: "or", pennsylvania: "pa", "rhode island": "ri",
  "south carolina": "sc", "south dakota": "sd", tennessee: "tn", texas: "tx", utah: "ut", vermont: "vt",
  virginia: "va", washington: "wa", "west virginia": "wv", wisconsin: "wi", wyoming: "wy",
};

function stateKey(state: string): string {
  const t = state.trim().toLowerCase();
  return STATE_ABBR[t] || t; // already a 2-letter code → use as-is
}

// Candidate city spellings to try against the index. The dataset mixes full and abbreviated
// forms ("Fort Worth" + "Mount Vernon" full, "St. Paul" abbreviated), and providers send
// either — so for each input we generate both the fully-expanded and the abbreviated form,
// per word. Token-based so a stray period can't be left behind.
function cityKeys(city: string): string[] {
  const toks = city.trim().toLowerCase().replace(/\s+/g, " ").split(" ");
  const FULL: Record<string, string> = { st: "saint", "st.": "saint", ft: "fort", "ft.": "fort", mt: "mount", "mt.": "mount" };
  const ABBR: Record<string, string> = { saint: "st.", st: "st.", fort: "ft.", ft: "ft.", mount: "mt.", mt: "mt." };
  return [...new Set([
    toks.join(" "),
    toks.map((t) => FULL[t] || t).join(" "),
    toks.map((t) => ABBR[t] || t).join(" "),
  ])];
}

/** Look up a city's geo. Returns null if the city isn't in the dataset (→ can't diagnose).
 *  Tolerates full state names and Saint/Fort/Mount abbreviation variants. */
export function resolveCity(city: string, state: string): ResolvedCity | null {
  if (!city || !state) return null;
  const index = loadIndex();
  const sk = stateKey(state);
  for (const ck of cityKeys(city)) {
    const rec = index[`${ck}|${sk}`];
    if (rec && rec.la != null && rec.ln != null) {
      return {
        city: city.trim(),
        state: state.trim().toUpperCase(),
        lat: rec.la,
        lng: rec.ln,
        zctas: rec.z || [],
        county: rec.cn,
      };
    }
  }
  return null;
}
