/**
 * Shared utilities for power pages (category/state/city routes).
 * Maps v1.0 URL slugs ↔ Supabase provider_category values and
 * state abbreviations ↔ URL-friendly state slugs.
 */

import { createServerClient } from "@supabase/ssr";
import {
  type Provider,
  PROVIDERS_TABLE,
  toCardFormat,
  type ProviderCardData,
  getCategoryDisplayName,
} from "@/lib/types/provider";

// ============================================================
// Category slug ↔ Supabase mapping
// ============================================================

export interface CategoryConfig {
  slug: string;
  dbValue: string;       // Exact provider_category in Supabase
  displayName: string;   // Human-readable label
  description: string;   // For meta/page content
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    slug: "assisted-living",
    dbValue: "Assisted Living",
    displayName: "Assisted Living",
    description: "Assisted living communities provide housing, meals, personal care, and health services for seniors who need help with daily activities but don't require full-time nursing care.",
  },
  {
    slug: "memory-care",
    dbValue: "Memory Care",
    displayName: "Memory Care",
    description: "Memory care facilities specialize in caring for individuals with Alzheimer's disease, dementia, and other memory impairments in a safe, structured environment.",
  },
  {
    slug: "nursing-home",
    dbValue: "Nursing Home",
    displayName: "Nursing Homes",
    description: "Nursing homes provide 24-hour skilled nursing care, rehabilitation services, and medical supervision for seniors with complex health needs.",
  },
  {
    slug: "home-care",
    dbValue: "Home Care (Non-medical)",
    displayName: "Home Care",
    description: "Home care agencies provide non-medical assistance including companionship, meal preparation, light housekeeping, and personal care in the comfort of your loved one's home.",
  },
  {
    slug: "home-health-care",
    dbValue: "Home Health Care",
    displayName: "Home Health Care",
    description: "Home health care agencies provide skilled medical services including nursing, physical therapy, and health monitoring delivered in the patient's home.",
  },
  {
    slug: "independent-living",
    dbValue: "Independent Living",
    displayName: "Independent Living",
    description: "Independent living communities offer active seniors maintenance-free housing with social activities, dining options, and community amenities.",
  },
];

// Also handle these v1.0 slugs — redirect or alias to the primary slug
export const CATEGORY_ALIASES: Record<string, string> = {
  "home-care-non-medical": "home-care",
  "senior-communities": "assisted-living",
  "elder-law-attorney": "assisted-living",            // no DB match — redirect to closest
  "financial-legal-other-services": "assisted-living", // no DB match — redirect to closest
};

const categoryBySlug = new Map(CATEGORY_CONFIGS.map((c) => [c.slug, c]));

export function getCategoryBySlug(slug: string): CategoryConfig | null {
  return categoryBySlug.get(slug) ?? null;
}

export function getResolvedCategorySlug(slug: string): string | null {
  if (categoryBySlug.has(slug)) return slug;
  return CATEGORY_ALIASES[slug] ?? null;
}

// ============================================================
// State abbreviation ↔ URL slug mapping
// ============================================================

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

// Reverse: slug → abbreviation (e.g. "texas" → "TX", "new-york" → "NY")
const slugToAbbrev = new Map<string, string>();
const abbrevToSlug = new Map<string, string>();
for (const [abbr, name] of Object.entries(US_STATES)) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  slugToAbbrev.set(slug, abbr);
  abbrevToSlug.set(abbr, slug);
}

export function stateSlugToAbbrev(slug: string): string | null {
  return slugToAbbrev.get(slug) ?? null;
}

export function stateAbbrevToSlug(abbrev: string): string {
  return abbrevToSlug.get(abbrev) ?? abbrev.toLowerCase();
}

export function stateAbbrevToName(abbrev: string): string {
  return US_STATES[abbrev] ?? abbrev;
}

// ============================================================
// City slug utilities
// ============================================================

/** "New York" → "new-york" */
export function cityToSlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** "new-york" → "New York" */
export function citySlugToDisplay(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ============================================================
// Supabase client (cookie-less, for server data fetching)
// ============================================================

function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// ============================================================
// Data fetching for power pages
// ============================================================

export interface PowerPageData {
  providers: ProviderCardData[];
  totalCount: number;
  avgLowerPrice: number | null;
  avgUpperPrice: number | null;
  topCities?: { city: string; count: number }[];
}

/**
 * Fetch providers for a power page with optional category/state/city filters.
 * Returns up to `limit` providers sorted by Olera Score (community_Score) desc.
 */
export async function fetchPowerPageData(opts: {
  category: string;     // Supabase provider_category value
  stateAbbrev?: string; // 2-letter state code
  city?: string;        // Title-cased city name
  limit?: number;
}): Promise<PowerPageData | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { category, stateAbbrev, city, limit = 24 } = opts;

  // Build query for provider listing
  let query = supabase
    .from(PROVIDERS_TABLE)
    .select("*", { count: "exact" })
    .eq("provider_category", category)
    .or("deleted.is.null,deleted.eq.false");

  if (stateAbbrev) query = query.eq("state", stateAbbrev);
  if (city) query = query.ilike("city", city);

  query = query
    .order("community_Score", { ascending: false, nullsFirst: false })
    .order("google_rating", { ascending: false, nullsFirst: false })
    .limit(limit);

  const { data: providers, count } = await query;

  if (!providers) return null;

  // Compute average prices
  const priced = (providers as Provider[]).filter((p) => p.lower_price && p.upper_price);
  const avgLowerPrice = priced.length > 0
    ? Math.round(priced.reduce((s, p) => s + (p.lower_price ?? 0), 0) / priced.length)
    : null;
  const avgUpperPrice = priced.length > 0
    ? Math.round(priced.reduce((s, p) => s + (p.upper_price ?? 0), 0) / priced.length)
    : null;

  return {
    providers: (providers as Provider[]).map(toCardFormat),
    totalCount: count ?? providers.length,
    avgLowerPrice,
    avgUpperPrice,
  };
}

/**
 * Fetch top cities for a category+state combination.
 * Used on state pages to list cities with provider counts.
 */
export async function fetchTopCities(
  category: string,
  stateAbbrev: string,
  limit = 50
): Promise<{ city: string; count: number }[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  // Supabase doesn't support GROUP BY directly, so fetch distinct cities with counts
  // via RPC or by fetching city column and counting client-side
  const { data } = await supabase
    .from(PROVIDERS_TABLE)
    .select("city")
    .eq("provider_category", category)
    .eq("state", stateAbbrev)
    .or("deleted.is.null,deleted.eq.false")
    .not("city", "is", null);

  if (!data) return [];

  // Count occurrences
  const counts = new Map<string, number>();
  for (const row of data) {
    const c = row.city as string;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Fetch all distinct state abbreviations that have providers for a category.
 */
export async function fetchStatesForCategory(
  category: string
): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from(PROVIDERS_TABLE)
    .select("state")
    .eq("provider_category", category)
    .or("deleted.is.null,deleted.eq.false")
    .not("state", "is", null);

  if (!data) return [];

  const states = new Set<string>();
  for (const row of data) {
    if (row.state) states.add(row.state as string);
  }

  return Array.from(states).sort();
}

// Re-export for convenience
export { getCategoryDisplayName };
