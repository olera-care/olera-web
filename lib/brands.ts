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
  /** Sum of Google review counts across locations. */
  totalReviews: number;
  /** A representative photo (first location with a live image) or a category stock photo. */
  image: string;
}

export interface BrandLocation {
  id: string;
  slug: string;
  name: string;
  /** Name shown beside the city when it says more than the brand name does; null when it is just the brand. */
  distinctName: string | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  category: string;
}

export interface BrandQuote {
  text: string;
  author: string;
  when: string | null;
  rating: number;
  locationName: string;
  locationSlug: string;
  city: string | null;
  state: string | null;
}

export interface BrandCategoryRate {
  category: string;
  label: string;
  range: string;
  pricedCount: number;
}

export interface BrandStateGroup {
  abbrev: string;
  name: string;
  locations: BrandLocation[];
}

export interface BrandHub extends BrandSummary {
  /** Highest-rated locations, as browse cards. */
  featured: ProviderCardData[];
  /** A few recent family reviews from the featured locations. */
  quotes: BrandQuote[];
  /** Typical rate per care type, only when the brand spans more than one. */
  ratesByCategory: BrandCategoryRate[];
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
  "provider_id,slug,provider_name,provider_category,city,state,google_rating,lower_price,upper_price,contact_for_price,provider_images,provider_logo,parent_organization,review_count:google_reviews_data->>review_count,reviews_rating:google_reviews_data->>rating";

type LightRow = { review_count: string | null; reviews_rating: string | null } & Pick<
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

function rateRange(rows: LightRow[], category: string): { range: string; pricedCount: number } | null {
  if (getPricingConfig(category).tier === 3) return null;
  const priced = rows.filter(
    (r) => r.lower_price != null && r.upper_price != null && (r.upper_price as number) >= (r.lower_price as number),
  );
  if (priced.length < MIN_PRICED_FOR_RANGE) return null;
  const lo = median(priced.map((r) => r.lower_price as number));
  const hi = median(priced.map((r) => r.upper_price as number));
  if (lo == null || hi == null) return null;
  const suffix = unitSuffix(category);
  return {
    range: hi > lo ? `$${lo.toLocaleString()} - $${hi.toLocaleString()}${suffix}` : `$${lo.toLocaleString()}${suffix}`,
    pricedCount: priced.length,
  };
}

/** The synced Google rating when we have one, else the older scraped column. */
function ratingOf(r: LightRow): number | null {
  const synced = Number(r.reviews_rating);
  if (Number.isFinite(synced) && synced > 0) return synced;
  return typeof r.google_rating === "number" && r.google_rating > 0 ? r.google_rating : null;
}

function reviewCountOf(r: LightRow): number {
  const n = Number(r.review_count);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * "Home Instead" under the Home Instead brand says nothing; "Home Instead
 * Home Care Services of Birmingham, AL" does. Return the name only when it
 * carries more than the brand.
 */
function distinctLocationName(name: string, brand: string): string | null {
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const n = norm(name);
  const b = norm(brand);
  if (!n || n === b) return null;
  const rest = n.startsWith(b) ? n.slice(b.length).trim() : n;
  // Leftovers like "inc", "llc", "senior care" are not worth a second label.
  if (rest.length < 4 || /^(inc|llc|co|senior care|home care)$/.test(rest)) return null;
  return name;
}

function summarize(name: string, rows: LightRow[]): BrandSummary {
  const categoryCounts = new Map<string, number>();
  for (const r of rows) {
    const cat = (r.provider_category || "").split(" | ")[0] || "Senior Care";
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }
  const primaryCategory =
    [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Senior Care";

  const rated = rows.filter((r) => ratingOf(r) != null);
  const avgRating = rated.length
    ? Math.round((rated.reduce((s, r) => s + (ratingOf(r) as number), 0) / rated.length) * 10) / 10
    : null;

  // Tier 3 categories (home health, nursing home, hospice) suppress dollar
  // amounts everywhere else on the site; keep the hub consistent.
  const rate = rateRange(rows, primaryCategory);
  const typicalRate = rate?.range ?? null;
  const pricedCount = rate?.pricedCount ?? 0;
  const totalReviews = rows.reduce((sum, r) => sum + reviewCountOf(r), 0);

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
    totalReviews,
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

function toLocation(r: LightRow, brand: string): BrandLocation {
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
    distinctName: distinctLocationName(r.provider_name, brand),
    city: r.city,
    state: r.state,
    rating: ratingOf(r),
    reviewCount: reviewCountOf(r) || null,
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

  // Featured: a 5.0 from six reviews should not outrank a 4.8 from 180, so
  // shrink each rating toward the brand mean by review count (m = 10). Then
  // one photo per card (franchisees often upload the same corporate stock
  // photo to Google) and at most two per state, so six cards read as six
  // places and not one franchisee's neighborhood.
  const brandMean = summary.avgRating ?? 4;
  const PRIOR = 10;
  const ranked = list
    .filter((r) => ratingOf(r) != null)
    .map((r) => {
      const n = reviewCountOf(r);
      const score = (n / (n + PRIOR)) * (ratingOf(r) as number) + (PRIOR / (n + PRIOR)) * brandMean;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score || reviewCountOf(b.r) - reviewCountOf(a.r));
  const seenImages = new Set<string>();
  const perState = new Map<string, number>();
  const featuredIds: string[] = [];
  for (const { r } of ranked) {
    if (featuredIds.length >= FEATURED_COUNT) break;
    const image = parseProviderImages(r.provider_images)[0] ?? null;
    if (image && seenImages.has(image)) continue;
    const st = (r.state || "").toUpperCase();
    if ((perState.get(st) ?? 0) >= 2) continue;
    if (image) seenImages.add(image);
    perState.set(st, (perState.get(st) ?? 0) + 1);
    featuredIds.push(r.provider_id);
  }

  let featured: ProviderCardData[] = [];
  const quotes: BrandQuote[] = [];
  const supabase = getSupabase();
  if (supabase && featuredIds.length > 0) {
    const { data, error } = await supabase.from(PROVIDERS_TABLE).select("*").in("provider_id", featuredIds);
    if (error) console.error("[brands] featured fetch error:", error.message);
    const rows = (data ?? []) as Provider[];
    const order = new Map(featuredIds.map((id, i) => [id, i]));
    rows.sort((a, b) => (order.get(a.provider_id) ?? 99) - (order.get(b.provider_id) ?? 99));
    featured = rows.map(toCardFormat);

    // A few real family reviews, one per location, most recent first.
    const candidates = rows.flatMap((row) =>
      (row.google_reviews_data?.reviews ?? [])
        .filter((rv) => rv.rating >= 4 && typeof rv.text === "string" && rv.text.length >= 80)
        .map((rv) => ({ row, rv })),
    );
    candidates.sort((a, b) => (b.rv.time ?? 0) - (a.rv.time ?? 0));
    const usedLocations = new Set<string>();
    for (const { row, rv } of candidates) {
      if (quotes.length >= 3) break;
      if (usedLocations.has(row.provider_id)) continue;
      usedLocations.add(row.provider_id);
      const text = rv.text.length > 320 ? `${rv.text.slice(0, 300).replace(/\s+\S*$/, "")}…` : rv.text;
      quotes.push({
        text,
        author: rv.author_name || "A family member",
        when: rv.relative_time ?? null,
        rating: rv.rating,
        locationName: row.provider_name,
        locationSlug: row.slug || row.provider_id,
        city: row.city,
        state: row.state,
      });
    }
  }

  // Typical rate per care type, only worth a block when the brand spans several.
  const byCategory = new Map<string, LightRow[]>();
  for (const r of list) {
    const cat = (r.provider_category || "").split(" | ")[0];
    if (!cat) continue;
    const bucket = byCategory.get(cat);
    if (bucket) bucket.push(r);
    else byCategory.set(cat, [r]);
  }
  const ratesByCategory: BrandCategoryRate[] = [...byCategory.entries()]
    .map(([category, rows]) => ({ category, rows, rate: rateRange(rows, category) }))
    .filter((x) => x.rate)
    .sort((a, b) => b.rows.length - a.rows.length)
    .map((x) => ({
      category: x.category,
      label: getCategoryDisplayName(x.category),
      range: x.rate!.range,
      pricedCount: x.rate!.pricedCount,
    }));

  const byState = new Map<string, BrandLocation[]>();
  for (const r of list) {
    const abbrev = (r.state || "").toUpperCase();
    if (!abbrev) continue;
    const loc = toLocation(r, name);
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

  return {
    ...summary,
    featured,
    quotes,
    ratesByCategory: ratesByCategory.length >= 2 ? ratesByCategory : [],
    states,
  };
});
