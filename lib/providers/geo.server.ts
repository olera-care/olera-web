import type { SupabaseClient } from "@supabase/supabase-js";
import { citiesWithAliases, expandCityAliases } from "@/lib/city-aliases";

/** One city Olera has live providers in. */
export interface ProviderCity {
  /** Display form, e.g. "Fort Worth". */
  city: string;
  /** Two-letter abbreviation, upper case. */
  state: string;
  /** Stable key for URLs and lookups, e.g. "fort-worth-tx". */
  slug: string;
  /** Non-deleted provider rows resolving to this city. */
  providers: number;
}

const PAGE_SIZE = 1000;

/**
 * Hard ceiling on rows scanned, so a runaway table can never turn an admin
 * page into a full-table read. If this trips the result is flagged
 * `truncated` and the caller must say so rather than report a low count as
 * fact.
 */
const MAX_ROWS = 200_000;

/**
 * City values on provider rows are free text and genuinely messy — see
 * `lib/city-aliases.ts` (providers live under "Brooklyn", search resolves to
 * "New York") and `scripts/fix-mislabeled-cities.js` (a legacy import wrote
 * the wrong city on a swath of rows). Counting distinct raw values would
 * inflate the total with case and spacing variants, so everything collapses
 * to one normalized key first.
 *
 * The convention matches `market_diagnostics`: city lower-cased, state upper.
 */
function normalizeCity(city: string): string {
  return city.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Reverse of `expandCityAliases`: the name a group of aliases rolls up to. */
function buildAliasIndex(): Map<string, string> {
  const index = new Map<string, string>();
  // expandCityAliases maps a search term to the names providers are stored
  // under. Walking it backwards gives us alias -> canonical, so five borough
  // spellings collapse into one city instead of five.
  for (const term of citiesWithAliases()) {
    for (const alias of expandCityAliases(term)) {
      if (normalizeCity(alias) !== normalizeCity(term)) {
        index.set(normalizeCity(alias), normalizeCity(term));
      }
    }
  }
  return index;
}

/** Title-case a normalized city for display ("fort worth" -> "Fort Worth"). */
function toDisplay(normalized: string): string {
  return normalized
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join("-"),
    )
    .join(" ");
}

function toSlug(normalizedCity: string, state: string): string {
  return `${normalizedCity.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${state.toLowerCase()}`;
}

/**
 * Every city with at least one live provider, with how many.
 *
 * This is the operating map's definition of "a city we have": the cities the
 * public site actually publishes pages for. It is deliberately wider than
 * "cities we launched" — the directory carries rows in places the city
 * pipeline never ran — so callers presenting it as coverage should say which
 * they mean.
 */
export async function getProviderCities(
  db: SupabaseClient,
): Promise<{ cities: ProviderCity[]; truncated: boolean }> {
  const aliases = buildAliasIndex();
  const counts = new Map<string, ProviderCity>();
  let scanned = 0;
  let truncated = false;

  for (;;) {
    if (scanned >= MAX_ROWS) {
      truncated = true;
      break;
    }
    const { data, error } = await db
      .from("olera-providers")
      .select("city, state")
      .or("deleted.is.null,deleted.eq.false")
      .not("city", "is", null)
      .not("state", "is", null)
      .range(scanned, scanned + PAGE_SIZE - 1);

    if (error) throw error;
    const rows = (data ?? []) as { city: string | null; state: string | null }[];
    if (rows.length === 0) break;

    for (const row of rows) {
      const rawCity = (row.city ?? "").trim();
      const rawState = (row.state ?? "").trim().toUpperCase();
      if (!rawCity || !rawState) continue;

      const normalized = normalizeCity(rawCity);
      const canonical = aliases.get(normalized) ?? normalized;
      const key = `${rawState}::${canonical}`;

      const existing = counts.get(key);
      if (existing) {
        existing.providers += 1;
      } else {
        counts.set(key, {
          city: toDisplay(canonical),
          state: rawState,
          slug: toSlug(canonical, rawState),
          providers: 1,
        });
      }
    }

    scanned += rows.length;
    if (rows.length < PAGE_SIZE) break;
  }

  const cities = [...counts.values()].sort(
    (a, b) => b.providers - a.providers || a.city.localeCompare(b.city),
  );
  return { cities, truncated };
}
