/**
 * Brand hub data.
 *
 * A "brand" is a franchise or multi-location operator that the directory has
 * tagged via `olera-providers.parent_organization` (migration 101, populated by
 * scripts/franchise-classify.js). One hub page per brand lists every tagged
 * location, grouped by state, with the aggregate rating and typical rate.
 *
 * Why these pages exist (September 2026 traffic review, item 4a): a Google
 * Business Profile answers a single facility; it cannot answer "home instead
 * locations" or "brookdale reviews" for a brand with hundreds of communities.
 * Directories that still hold organic traffic (Seniorly) hold it on exactly
 * this page type. It is a probe: expect a page-one slot under the brand's own
 * site, read impressions in Search Console after 6 to 8 weeks.
 *
 * Aggregates are shown as text only. No AggregateRating markup is emitted for
 * a brand: the ratings are Google's, about individual locations, and marking
 * them up as a rating of the brand would be third-party review markup.
 */

import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import {
  type Provider,
  type ProviderCardData,
  PROVIDERS_TABLE,
  toCardFormat,
  getCategoryDisplayName,
  getCategoryFallbackImage,
  parseProviderImages,
} from "@/lib/types/provider";
import { getPricingConfig } from "@/lib/pricing-config";
import { stateAbbrevToName } from "@/lib/power-pages";
import { slugify } from "@/lib/slugify";

export const BRANDS_BASE_PATH = "/brands";

/** Minimum tagged locations for a brand to get a hub page and a sitemap entry. */
export const MIN_BRAND_LOCATIONS = 10;

/** URL slug for a brand name: "Home Instead" → "home-instead". */
export function brandSlug(name: string): string {
  return slugify(name);
}

export function brandPath(name: string): string {
  return `${BRANDS_BASE_PATH}/${brandSlug(name)}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrandSummary {
  name: string;
  slug: string;
  /** The brand's own website, from parent_organization.url. */
  website: string | null;
  locationCount: number;
  stateCount: number;
  /** Most common provider_category among the brand's locations (DB value). */
  primaryCategory: string;
  /** Display label for primaryCategory, e.g. "Home Care". */
  categoryLabel: string;
  /** Mean Google rating across rated locations, one decimal, or null. */
  avgRating: number | null;
  ratedCount: number;
  /** "$28 - $36/hr" style typical rate across priced locations, or null. */
  typicalRate: string | null;
  pricedCount: number;
  /** A representative photo (first location with a live image) or a category stock photo. */
  image: string;
}

export interface BrandLocation {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  category: string;
}

export interface BrandStateGroup {
  abbrev: string;
  name: string;
  locations: BrandLocation[];
}

export interface BrandHub extends BrandSummary {
  /** Highest-rated locations, as browse cards. */
  featured: ProviderCardData[];
  /** Every location, grouped by state, states alphabetical, locations by city. */
  states: BrandStateGroup[];
}

// ---------------------------------------------------------------------------
// Supabase (cookie-less, anon; same pattern as lib/power-pages.ts)
// ---------------------------------------------------------------------------

function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

/** Columns needed for aggregates and the per-state directory. No JSONB blobs. */
const LIGHT_SELECT =
  "provider_id,slug,provider_name,provider_category,city,state,google_rating,lower_price,upper_price,contact_for_price,provider_images,provider_logo,parent_organization";

type LightRow = Pick<
  Provider,
  | "provider_id"
  | "slug"
  | "provider_name"
  | "provider_category"
  | "city"
  | "state"
  | "google_rating"
  | "lower_price"
  | "upper_price"
  | "contact_for_price"
  | "provider_images"
  | "provider_logo"
  | "parent_organization"
>;

const PAGE_SIZE = 1000;

/**
 * Every live, brand-tagged directory row, light columns. About 4K rows.
 * Cached per request so the index, a hub page and the sitemap share one fetch.
 */
const fetchTaggedRows = cache(async (): Promise<LightRow[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  const rows: LightRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(PROVIDERS_TABLE)
      .select(LIGHT_SELECT)
      .not("parent_organization", "is", null)
      .or("deleted.is.null,deleted.eq.false")
      .order("provider_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error("[brands] fetchTaggedRows error:", error.message);
      break;
    }
    const page = (data ?? []) as unknown as LightRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
});

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function unitSuffix(category: string): string {
  const unit = getPricingConfig(category).unit;
  return unit === "hour" ? "/hr" : unit === "day" ? "/day" : "/mo";
}

const MIN_PRICED_FOR_RANGE = 5;

function summarize(name: string, rows: LightRow[]): BrandSummary {
  const categoryCounts = new Map<string, number>();
  for (const r of rows) {
    const cat = (r.provider_category || "").split(" | ")[0] || "Senior Care";
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }
  const primaryCategory =
    [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Senior Care";

  const rated = rows.filter((r) => typeof r.google_rating === "number" && r.google_rating > 0);
  const avgRating = rated.length
    ? Math.round((rated.reduce((s, r) => s + (r.google_rating as number), 0) / rated.length) * 10) / 10
    : null;

  // Tier 3 categories (home health, nursing home, hospice) suppress dollar
  // amounts everywhere else on the site; keep the hub consistent.
  let typicalRate: string | null = null;
  let pricedCount = 0;
  if (getPricingConfig(primaryCategory).tier !== 3) {
    const priced = rows.filter(
      (r) => r.lower_price != null && r.upper_price != null && (r.upper_price as number) >= (r.lower_price as number),
    );
    pricedCount = priced.length;
    if (priced.length >= MIN_PRICED_FOR_RANGE) {
      const lo = median(priced.map((r) => r.lower_price as number));
      const hi = median(priced.map((r) => r.upper_price as number));
      if (lo != null && hi != null) {
        const suffix = unitSuffix(primaryCategory);
        typicalRate =
          hi > lo ? `$${lo.toLocaleString()} - $${hi.toLocaleString()}${suffix}` : `$${lo.toLocaleString()}${suffix}`;
      }
    }
  }

  const withPhoto = rows.find((r) => parseProviderImages(r.provider_images).length > 0);
  const image = withPhoto
    ? parseProviderImages(withPhoto.provider_images)[0]
    : getCategoryFallbackImage(primaryCategory, name);

  const website = rows.find((r) => r.parent_organization?.url)?.parent_organization?.url ?? null;

  return {
    name,
    slug: brandSlug(name),
    website,
    locationCount: rows.length,
    stateCount: new Set(rows.map((r) => r.state).filter(Boolean)).size,
    primaryCategory,
    categoryLabel: getCategoryDisplayName(primaryCategory),
    avgRating,
    ratedCount: rated.length,
    typicalRate,
    pricedCount,
    image,
  };
}

function groupByBrand(rows: LightRow[]): Map<string, LightRow[]> {
  const groups = new Map<string, LightRow[]>();
  for (const r of rows) {
    const name = r.parent_organization?.name?.trim();
    if (!name) continue;
    const list = groups.get(name);
    if (list) list.push(r);
    else groups.set(name, [r]);
  }
  return groups;
}

/** Brands with at least MIN_BRAND_LOCATIONS tagged locations, largest first. */
export const listBrands = cache(async (): Promise<BrandSummary[]> => {
  const rows = await fetchTaggedRows();
  return [...groupByBrand(rows).entries()]
    .filter(([, list]) => list.length >= MIN_BRAND_LOCATIONS)
    .map(([name, list]) => summarize(name, list))
    .sort((a, b) => b.locationCount - a.locationCount || a.name.localeCompare(b.name));
});

function toLocation(r: LightRow): BrandLocation {
  const category = (r.provider_category || "").split(" | ")[0] || "Senior Care";
  let priceRange: string | null = null;
  if (getPricingConfig(category).tier !== 3 && r.lower_price != null && r.upper_price != null) {
    const suffix = unitSuffix(category);
    priceRange =
      r.upper_price > r.lower_price
        ? `$${r.lower_price.toLocaleString()} - $${r.upper_price.toLocaleString()}${suffix}`
        : `$${r.lower_price.toLocaleString()}${suffix}`;
  }
  return {
    id: r.provider_id,
    slug: r.slug || r.provider_id,
    name: r.provider_name,
    city: r.city,
    state: r.state,
    rating: typeof r.google_rating === "number" && r.google_rating > 0 ? r.google_rating : null,
    reviewCount: null,
    priceRange,
    category,
  };
}

const FEATURED_COUNT = 6;

/**
 * Full hub for one brand slug, or null when the slug matches no brand with
 * enough locations. Fetches full rows only for the featured cards.
 */
export const getBrandHub = cache(async (slug: string): Promise<BrandHub | null> => {
  const rows = await fetchTaggedRows();
  const groups = groupByBrand(rows);
  const match = [...groups.entries()].find(([name]) => brandSlug(name) === slug);
  if (!match) return null;
  const [name, list] = match;
  if (list.length < MIN_BRAND_LOCATIONS) return null;

  const summary = summarize(name, list);

  // Featured: highest Google rating, then the site's own score. Only rated rows.
  const featuredIds = [...list]
    .filter((r) => typeof r.google_rating === "number" && r.google_rating > 0)
    .sort((a, b) => (b.google_rating as number) - (a.google_rating as number))
    .slice(0, FEATURED_COUNT * 3) // over-fetch, then let community_Score order the final six
    .map((r) => r.provider_id);

  let featured: ProviderCardData[] = [];
  const supabase = getSupabase();
  if (supabase && featuredIds.length > 0) {
    const { data, error } = await supabase
      .from(PROVIDERS_TABLE)
      .select("*")
      .in("provider_id", featuredIds)
      .order("google_rating", { ascending: false, nullsFirst: false })
      .order("community_Score", { ascending: false, nullsFirst: false })
      .limit(FEATURED_COUNT);
    if (error) console.error("[brands] featured fetch error:", error.message);
    featured = ((data ?? []) as Provider[]).map(toCardFormat);
  }

  const byState = new Map<string, BrandLocation[]>();
  for (const r of list) {
    const abbrev = (r.state || "").toUpperCase();
    if (!abbrev) continue;
    const loc = toLocation(r);
    const bucket = byState.get(abbrev);
    if (bucket) bucket.push(loc);
    else byState.set(abbrev, [loc]);
  }
  const states: BrandStateGroup[] = [...byState.entries()]
    .map(([abbrev, locations]) => ({
      abbrev,
      name: stateAbbrevToName(abbrev),
      locations: locations.sort(
        (a, b) => (a.city || "").localeCompare(b.city || "") || a.name.localeCompare(b.name),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { ...summary, featured, states };
});
