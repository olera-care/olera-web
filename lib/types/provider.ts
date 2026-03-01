/**
 * Provider Types
 *
 * Matches the iOS Supabase `olera-providers` table schema exactly.
 * The web app uses this schema directly - no adapter needed.
 *
 * Table: olera-providers (39,355+ records)
 */

import { generateProviderSlug } from "@/lib/slugify";

export interface Provider {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  main_category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  google_rating: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: number | null;
  lat: number | null;
  lon: number | null;
  place_id: string | null;
  provider_images: string | null; // Pipe-separated URLs: "url1 | url2 | url3"
  provider_logo: string | null;
  provider_description: string | null;
  community_Score: number | null;
  value_score: number | null;
  information_availability_score: number | null;
  lower_price: number | null;
  upper_price: number | null;
  contact_for_price: string | null; // "True" or "False"
  deleted: boolean;
  deleted_at: string | null;
  hero_image_url: string | null;
  slug: string | null; // Human-readable URL slug (populated via migration)
}

/**
 * Parse pipe-separated images string into array
 */
export function parseProviderImages(images: string | null): string[] {
  if (!images) return [];
  return images.split(" | ").filter(Boolean);
}

/** Categories where pricing is per-hour rather than per-month */
const HOURLY_CATEGORIES = new Set([
  "Home Care (Non-medical)",
  "Home Health Care",
]);

/**
 * Format price range for display
 */
export function formatPriceRange(provider: Provider): string | null {
  const suffix = HOURLY_CATEGORIES.has(provider.provider_category) ? "/hr" : "/mo";
  if (provider.lower_price && provider.upper_price) {
    return `$${provider.lower_price.toLocaleString()} - $${provider.upper_price.toLocaleString()}${suffix}`;
  }
  if (provider.lower_price) {
    return `From $${provider.lower_price.toLocaleString()}${suffix}`;
  }
  if (provider.contact_for_price === "True") {
    return "Contact for pricing";
  }
  return null;
}

/**
 * Get primary image for card hero display.
 * Prefers classified hero, then facility photos, then logo as fallback.
 * Priority: hero_image_url → provider_images[0] → provider_logo → null
 */
export function getPrimaryImage(provider: Provider): string | null {
  if (provider.hero_image_url) return provider.hero_image_url;
  const images = parseProviderImages(provider.provider_images);
  if (images[0]) return images[0];
  if (provider.provider_logo) return provider.provider_logo;
  return null;
}

/**
 * Format location string
 */
export function formatLocation(provider: Provider): string {
  const parts = [provider.city, provider.state].filter(Boolean);
  return parts.join(", ");
}

/**
 * Category display names
 */
export const categoryDisplayNames: Record<string, string> = {
  "Home Care (Non-medical)": "Home Care",
  "Home Health Care": "Home Health",
  "Assisted Living": "Assisted Living",
  "Independent Living": "Independent Living",
  "Memory Care": "Memory Care",
  "Nursing Home": "Nursing Home",
  "Assisted Living | Independent Living": "Assisted Living",
  "Memory Care | Assisted Living": "Memory Care",
};

/**
 * Get display name for category
 */
export function getCategoryDisplayName(category: string | null): string {
  if (!category) return "Senior Care";
  return categoryDisplayNames[category] || category;
}

/**
 * The Supabase table name
 */
export const PROVIDERS_TABLE = "olera-providers";

/**
 * Map Supabase provider_category → inferred highlights (4 per category).
 * These are sensible defaults superseded when a provider claims their page.
 */
const CATEGORY_HIGHLIGHTS: Record<string, string[]> = {
  "Home Care (Non-medical)": ["In-Home Care", "Certified Caregivers", "Companionship", "Light Housekeeping"],
  "Home Health Care":        ["Skilled Nursing", "Health Monitoring", "In-Home Care", "Licensed Providers"],
  "Hospice":                 ["Nursing Care", "Wellness Support", "Community Resources", "Medication Management"],
  "Assisted Living":         ["Licensed Community", "Social Activities", "Health Services", "Light Housekeeping"],
  "Memory Care":             ["Licensed Community", "Certified Staff", "Health Monitoring", "Social Activities"],
  "Independent Living":      ["Community Living", "Social Activities", "Light Housekeeping", "Wellness Programs"],
  "Nursing Home":            ["Skilled Nursing", "Licensed Facility", "Medical Care", "Rehabilitation"],
};

function getHighlightsForCategory(category: string): string[] {
  return CATEGORY_HIGHLIGHTS[category] ?? ["Senior Care", "Professional Staff", "Quality Services", "Community Support"];
}

/**
 * Type for provider card display data
 */
export type CardImageType = "photo" | "logo" | "placeholder";

export interface ProviderCardData {
  id: string;
  slug: string;
  name: string;
  image: string;
  imageType: CardImageType;
  images: string[];
  address: string;
  rating: number;
  reviewCount?: number;
  priceRange: string;
  primaryCategory: string;
  careTypes: string[];
  highlights: string[];
  acceptedPayments: string[];
  verified: boolean;
  badge?: string;
  description?: string;
  lat?: number | null;
  lon?: number | null;
}

/** URL patterns that strongly suggest a logo rather than a facility photo */
const LOGO_URL_PATTERNS = [
  /\/logo/i, /logo[._-]/i, /_logo/i, /-logo/i,
  /\/brand/i, /\/icon/i, /favicon/i,
];

/**
 * Detect whether a URL is likely a logo image.
 * Checks against provider_logo field and URL patterns.
 */
function isLikelyLogo(url: string, provider: Provider): boolean {
  // Exact match with the provider_logo field
  if (provider.provider_logo && url === provider.provider_logo) return true;
  // URL pattern heuristics
  return LOGO_URL_PATTERNS.some((p) => p.test(url));
}

/**
 * Category → pool of curated fallback photos (3 per category).
 * Matches the iOS app's fallback image set. Using multiple images per
 * category avoids the "all identical cards" look on browse pages.
 */
const CATEGORY_FALLBACK_POOLS: Record<string, string[]> = {
  "Home Care (Non-medical)": [
    "/images/fallback/home-care-1.jpg",
    "/images/fallback/home-care-2.jpg",
    "/images/fallback/home-care-3.jpg",
  ],
  "Home Health Care": [
    "/images/fallback/home-care-1.jpg",
    "/images/fallback/home-care-2.jpg",
    "/images/fallback/home-care-3.jpg",
  ],
  "Assisted Living": [
    "/images/fallback/assisted-living-1.jpg",
    "/images/fallback/assisted-living-2.jpg",
    "/images/fallback/assisted-living-3.jpg",
  ],
  "Memory Care": [
    "/images/fallback/memory-care-1.jpg",
    "/images/fallback/memory-care-2.jpg",
    "/images/fallback/memory-care-3.jpg",
  ],
  "Independent Living": [
    "/images/fallback/independent-living-1.jpg",
    "/images/fallback/independent-living-2.jpg",
    "/images/fallback/independent-living-3.jpg",
  ],
  "Nursing Home": [
    "/images/fallback/nursing-home-1.jpg",
    "/images/fallback/nursing-home-2.jpg",
    "/images/fallback/nursing-home-3.jpg",
  ],
  "Hospice": [
    "/images/fallback/home-care-1.jpg",
    "/images/fallback/home-care-2.jpg",
    "/images/fallback/home-care-3.jpg",
  ],
  "Assisted Living | Independent Living": [
    "/images/fallback/assisted-living-1.jpg",
    "/images/fallback/assisted-living-2.jpg",
    "/images/fallback/assisted-living-3.jpg",
  ],
  "Memory Care | Assisted Living": [
    "/images/fallback/memory-care-1.jpg",
    "/images/fallback/memory-care-2.jpg",
    "/images/fallback/memory-care-3.jpg",
  ],
};

const DEFAULT_FALLBACK_POOL = [
  "/images/fallback/home-care-1.jpg",
  "/images/fallback/home-care-2.jpg",
  "/images/fallback/home-care-3.jpg",
];

/**
 * Simple deterministic hash of a string → number.
 * Used to pick a stable fallback image per provider so the same provider
 * always shows the same stock photo (avoids hydration mismatches and
 * layout shift), but different providers get different images.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getCategoryFallbackImage(category: string, providerId: string): string {
  const pool = CATEGORY_FALLBACK_POOLS[category] || DEFAULT_FALLBACK_POOL;
  const index = hashString(providerId) % pool.length;
  return pool[index];
}

/**
 * Determine the best card hero image.
 *
 * Strategy: filter out images we KNOW are logos (exact match with
 * provider_logo field + URL pattern heuristics), use whatever remains.
 * This works across all categories — Comfort Keepers' caregiver portrait
 * passes through, while a home care agency whose only image is their
 * logo gets stock instead.
 *
 * Priority:
 *  1. hero_image_url (classified by script + vision AI) — always trust
 *  2. First non-logo image from provider_images — real photo regardless
 *     of category (facilities, home care, hospice all benefit)
 *  3. No non-logo images — category stock fallback
 */
function resolveCardImage(provider: Provider): { image: string; imageType: CardImageType } {
  if (provider.hero_image_url) {
    return { image: provider.hero_image_url, imageType: "photo" };
  }

  // Filter out known logos, use the first real photo
  const images = parseProviderImages(provider.provider_images);
  const nonLogoImages = images.filter((url) => !isLikelyLogo(url, provider));
  if (nonLogoImages.length > 0) {
    return { image: nonLogoImages[0], imageType: "photo" };
  }

  return {
    image: getCategoryFallbackImage(provider.provider_category, provider.provider_id),
    imageType: "photo",
  };
}

/**
 * Convert iOS Provider to the format expected by ProviderCard component
 */
export function toCardFormat(provider: Provider): ProviderCardData {
  const images = parseProviderImages(provider.provider_images);
  const { image: cardImage, imageType } = resolveCardImage(provider);

  return {
    id: provider.provider_id,
    slug: provider.slug || generateProviderSlug(provider.provider_name, provider.state),
    name: provider.provider_name,
    image: cardImage,
    imageType,
    images: images.length > 0 ? images : [],
    address: formatLocation(provider),
    rating: provider.google_rating || 0,
    reviewCount: undefined,
    priceRange: formatPriceRange(provider) || "Contact for pricing",
    primaryCategory: getCategoryDisplayName(provider.provider_category),
    careTypes: [provider.provider_category],
    highlights: getHighlightsForCategory(provider.provider_category),
    acceptedPayments: [],
    verified: false,
    description: provider.provider_description?.slice(0, 200) || undefined,
    lat: provider.lat,
    lon: provider.lon,
  };
}

/**
 * Convert mock provider data to ProviderCardData
 * Uses a flexible type to work with various mock data shapes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockToCardFormat(p: any): ProviderCardData {
  return {
    id: String(p.id || ""),
    slug: String(p.slug || p.id || ""),
    name: String(p.name || ""),
    image: String(p.image || "/placeholder-provider.jpg"),
    imageType: (p.imageType as CardImageType) || "photo",
    images: Array.isArray(p.images) ? p.images : [],
    address: String(p.address || ""),
    rating: Number(p.rating) || 0,
    reviewCount: p.reviewCount as number | undefined,
    priceRange: String(p.priceRange || "Contact for pricing"),
    primaryCategory: String(p.primaryCategory || "Senior Care"),
    careTypes: Array.isArray(p.careTypes) ? p.careTypes : [],
    highlights: Array.isArray(p.highlights) ? p.highlights : [],
    acceptedPayments: Array.isArray(p.acceptedPayments) ? p.acceptedPayments : [],
    verified: Boolean(p.verified),
    description: p.description as string | undefined,
  };
}

