/**
 * Standardized provider tag system.
 *
 * Each category has a controlled vocabulary of tags that serve triple duty:
 * 1. Display chips on hero and browse cards
 * 2. Filterable search facets
 * 3. SEO keywords (tag + location = rankable query)
 *
 * Tags are a fixed set per category — not free text — so filtering and
 * indexing stay clean across the platform.
 */

import type { ProfileCategory } from "@/lib/types";

// ============================================================
// Types
// ============================================================

export interface TagDefinition {
  /** Machine-readable slug used in URLs, filters, and DB storage */
  id: string;
  /** Human-readable display label */
  label: string;
  /** SEO-optimized phrase fragment (appended to category + location) */
  seoPhrase: string;
}

export interface CategoryTagConfig {
  /** Ordered list of all valid tags for this category */
  tags: TagDefinition[];
  /** How many featured tags to show on hero/card */
  featuredCount: number;
}

export interface ResolvedProviderTags {
  /** The 1-2 tags shown on hero and browse cards */
  featured: TagDefinition[];
  /** All tags that apply to this provider (powers filtering) */
  all: TagDefinition[];
}

// ============================================================
// Tag Registry — one entry per category
// ============================================================

const TAG_REGISTRY: Partial<Record<ProfileCategory, CategoryTagConfig>> = {
  independent_living: {
    featuredCount: 2,
    tags: [
      { id: "pet-friendly",              label: "Pet-friendly",                seoPhrase: "pet-friendly" },
      { id: "restaurant-style-dining",   label: "Restaurant-style dining",     seoPhrase: "restaurant-style dining" },
      { id: "fitness-center-pool",       label: "Fitness center and pool",     seoPhrase: "with fitness center and pool" },
      { id: "movie-theater",             label: "Movie theater",               seoPhrase: "with movie theater" },
      { id: "transportation-provided",   label: "Transportation provided",     seoPhrase: "with transportation" },
      { id: "on-site-salon-spa",         label: "On-site salon and spa",       seoPhrase: "with salon and spa" },
      { id: "walkable-area",             label: "Walkable area",               seoPhrase: "in walkable area" },
      { id: "maintenance-free-living",   label: "Maintenance-free living",     seoPhrase: "maintenance-free" },
      { id: "social-activity-calendar",  label: "Social and activity calendar", seoPhrase: "with social activities" },
      { id: "guest-suites",             label: "Guest suites",                seoPhrase: "with guest suites" },
    ],
  },
};

// ============================================================
// Public API
// ============================================================

/** Get the full tag config for a category, or null if none defined. */
export function getTagConfig(category: ProfileCategory | string): CategoryTagConfig | null {
  return TAG_REGISTRY[category as ProfileCategory] ?? null;
}

/** Get a single tag definition by category + tag id. */
export function getTagById(category: ProfileCategory | string, tagId: string): TagDefinition | null {
  const config = getTagConfig(category);
  if (!config) return null;
  return config.tags.find((t) => t.id === tagId) ?? null;
}

/**
 * Resolve which tags to show for a provider.
 *
 * @param category      - Provider's category
 * @param providerTagIds - Tag IDs the provider has (from metadata/DB)
 * @param featuredTagIds - The 1-2 tag IDs the provider chose to feature (optional)
 *
 * Returns featured tags (for hero/card display) and all applicable tags (for filtering).
 * If the provider hasn't selected featured tags, defaults to the first two from their tag list.
 */
export function resolveProviderTags(
  category: ProfileCategory | string,
  providerTagIds: string[],
  featuredTagIds?: string[],
): ResolvedProviderTags {
  const config = getTagConfig(category);
  if (!config) return { featured: [], all: [] };

  // Resolve all applicable tags, preserving registry order
  const all = config.tags.filter((t) => providerTagIds.includes(t.id));

  // Resolve featured: provider-selected if valid, else first N from their tags
  let featured: TagDefinition[] = [];
  if (featuredTagIds && featuredTagIds.length > 0) {
    featured = featuredTagIds
      .map((id) => all.find((t) => t.id === id))
      .filter((t): t is TagDefinition => t != null)
      .slice(0, config.featuredCount);
  }

  // Fallback: default to first N confirmed tags so the hero is never empty
  if (featured.length < config.featuredCount) {
    const remaining = all.filter((t) => !featured.some((f) => f.id === t.id));
    featured = [...featured, ...remaining].slice(0, config.featuredCount);
  }

  return { featured, all };
}

/** All tag IDs for a category — useful for validation. */
export function getValidTagIds(category: ProfileCategory | string): string[] {
  const config = getTagConfig(category);
  return config ? config.tags.map((t) => t.id) : [];
}
