import type { SupabaseClient } from "@supabase/supabase-js";
import { citiesWithAliases, expandCityAliases } from "@/lib/city-aliases";
import { cityKey, normalizeCityName } from "@/lib/city-key";

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
 * Slugs come from `lib/city-key.ts`, shared with the visitor geo recorded on
 * page events, so a provider's city and a visitor's city are the same string.
 */
const normalizeCity = normalizeCityName;

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
          slug: cityKey(canonical, rawState) ?? `${canonical}-${rawState.toLowerCase()}`,
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

/** PostgREST puts filters in the URL, so id batches stay short. */
export const PROVIDER_ID_CHUNK = 100;

/**
 * Turn a city slug back into the values providers are actually stored under.
 *
 * "fort-worth-tx" becomes { names: ["Fort Worth"], state: "TX" }. Aliases are
 * expanded, so New York also matches the borough names the directory really
 * uses. A city whose real name contains a hyphen (Winston-Salem) will not
 * round-trip through the slug — a known limit, not a silent one.
 */
export function cityFilterFromSlug(
  slug: string,
): { names: string[]; state: string } | null {
  const match = /^(.+)-([a-z]{2})$/.exec(slug.trim().toLowerCase());
  if (!match) return null;
  const [, cityPart, state] = match;
  const name = cityPart
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  return { names: expandCityAliases(name), state: state.toUpperCase() };
}

/** The subset of the query builder this file needs, kept explicit. */
interface CityFilterable<T> {
  in: (column: string, values: string[]) => T;
  eq: (column: string, value: string) => T;
}

function applyCity<T>(query: T, citySlug: string | null): T {
  if (!citySlug) return query;
  const filter = cityFilterFromSlug(citySlug);
  if (!filter) return query;
  // `in` on the alias list keeps New York's boroughs together; state is an
  // exact match because it is always stored as a two-letter code.
  const q = query as CityFilterable<T>;
  return (q.in("city", filter.names) as unknown as CityFilterable<T>).eq(
    "state",
    filter.state,
  );
}

/**
 * Providers listed, optionally in one city.
 *
 * Same rule as the admin Directory's Published tab and the operating map's
 * city picker: any provider row that has not been deleted. Those three
 * agreeing matters more than any of them being cleverer.
 */
export async function countListedProviders(
  db: SupabaseClient,
  citySlug: string | null = null,
): Promise<number> {
  let query = db
    .from("olera-providers")
    .select("provider_id", { count: "exact", head: true })
    .or("deleted.is.null,deleted.eq.false");
  query = applyCity(query, citySlug);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

/** Every non-deleted provider id in one city. Bounded, like every scan here. */
export async function listedProviderIdsInCity(
  db: SupabaseClient,
  citySlug: string,
): Promise<string[]> {
  const ids: string[] = [];
  let scanned = 0;

  for (;;) {
    if (scanned >= MAX_ROWS) break;
    let query = db
      .from("olera-providers")
      .select("provider_id")
      .or("deleted.is.null,deleted.eq.false");
    query = applyCity(query, citySlug);

    const { data, error } = await query.range(scanned, scanned + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data ?? []) as { provider_id: string | null }[];
    if (rows.length === 0) break;
    for (const r of rows) if (r.provider_id) ids.push(r.provider_id);
    scanned += rows.length;
    if (rows.length < PAGE_SIZE) break;
  }

  return ids;
}
