/**
 * Category-specific provider tag system.
 *
 * Tags do double duty:
 *  1. Display as chips on the hero and browse cards (featured subset)
 *  2. Function as search filters + SEO facets (full set)
 *
 * Each category has its own controlled vocabulary. Tags are NOT free text —
 * filtering and indexing stay clean because every tag is a known enum value.
 *
 * A tag + location should produce and rank a matching results page,
 * e.g. "secured memory care in Fort Worth, TX".
 */

// ============================================================
// Types
// ============================================================

export interface CategoryTag {
  /** Stable slug used for filtering and URL params (e.g. "secured-community") */
  id: string;
  /** Human-readable label shown on chips (e.g. "Secured community") */
  label: string;
  /** Icon key for chip rendering */
  icon: "shield" | "medical" | "people" | "house" | "star" | "sparkle" | "check" | "clock";
  /** SEO facet phrase — combined with location for search ranking
   *  e.g. "secured memory care" → "secured memory care in Fort Worth, TX" */
  seoFacet: string;
}

export interface CategoryTagSet {
  /** All possible tags for this category (controlled vocabulary) */
  tags: CategoryTag[];
  /** Default tag IDs to feature when provider hasn't chosen — weighted toward
   *  what families search for first in this category */
  defaultFeatured: [string, string];
}

export interface ResolvedProviderTags {
  /** Up to 2 tags shown on the hero/card */
  featured: CategoryTag[];
  /** All tags that apply (powers filtering) */
  all: CategoryTag[];
}

// ============================================================
// Category tag definitions
// ============================================================

const MEMORY_CARE_TAGS: CategoryTagSet = {
  tags: [
    { id: "secured-community", label: "Secured community", icon: "shield", seoFacet: "secured memory care" },
    { id: "24-7-nursing", label: "24/7 nursing", icon: "medical", seoFacet: "memory care with 24/7 nursing" },
    { id: "dementia-trained-staff", label: "Dementia-trained staff", icon: "people", seoFacet: "dementia-trained memory care" },
    { id: "wandering-prevention", label: "Wandering prevention", icon: "shield", seoFacet: "memory care with wandering prevention" },
    { id: "secured-outdoor-courtyard", label: "Secured outdoor courtyard", icon: "house", seoFacet: "memory care with secured courtyard" },
    { id: "life-enrichment-programs", label: "Life enrichment programs", icon: "sparkle", seoFacet: "memory care with life enrichment" },
    { id: "behavior-crisis-support", label: "Behavior and crisis support", icon: "medical", seoFacet: "memory care with behavior support" },
    { id: "respite-short-term", label: "Respite or short-term stays", icon: "clock", seoFacet: "short-term memory care" },
  ],
  defaultFeatured: ["secured-community", "24-7-nursing"],
};

// Registry — add new categories here as their tag sets are defined.
const CATEGORY_TAG_REGISTRY: Record<string, CategoryTagSet> = {
  // Category enum values
  memory_care: MEMORY_CARE_TAGS,
  // Supabase provider_category strings
  "Memory Care": MEMORY_CARE_TAGS,
};

// ============================================================
// Public API
// ============================================================

/**
 * Get the full tag set for a category, or null if no tags are defined.
 */
export function getCategoryTagSet(category: string): CategoryTagSet | null {
  return CATEGORY_TAG_REGISTRY[category] ?? null;
}

/**
 * Resolve which tags apply to a provider and which are featured.
 *
 * @param category     - Provider's category (enum or display string)
 * @param tagIds       - Tag IDs the provider has (from DB). null = use defaults.
 * @param featuredIds  - Tag IDs to feature on hero. null = use category defaults.
 */
export function resolveProviderCategoryTags(
  category: string,
  tagIds?: string[] | null,
  featuredIds?: string[] | null,
): ResolvedProviderTags | null {
  const tagSet = CATEGORY_TAG_REGISTRY[category];
  if (!tagSet) return null;

  // Which tags apply to this provider
  const applicableIds = tagIds ?? tagSet.tags.map((t) => t.id);
  const all = tagSet.tags.filter((t) => applicableIds.includes(t.id));

  // Which tags to feature (up to 2)
  const featIds = featuredIds ?? tagSet.defaultFeatured;
  const featured = featIds
    .map((id) => all.find((t) => t.id === id))
    .filter((t): t is CategoryTag => t != null)
    .slice(0, 2);

  // If featured is empty (bad IDs), fall back to first 2 from all
  if (featured.length === 0 && all.length > 0) {
    featured.push(...all.slice(0, 2));
  }

  return { featured, all };
}

/**
 * Get all tag IDs for a category (for building filter UIs).
 */
export function getAllCategoryTagIds(category: string): string[] {
  const tagSet = CATEGORY_TAG_REGISTRY[category];
  if (!tagSet) return [];
  return tagSet.tags.map((t) => t.id);
}
