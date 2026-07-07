/**
 * Photo category system for grouped provider photo tours.
 *
 * Each provider category has its own set of photo slots — labeled spaces
 * that organize photos for display (grouped gallery) and upload (provider
 * edit prompts). Configurable per category so assisted living, memory care,
 * etc. can define their own relevant spaces.
 */

import type { ProfileCategory } from "@/lib/types";

// ============================================================
// Types
// ============================================================

export interface PhotoCategory {
  /** Machine-readable slug */
  id: string;
  /** Human-readable label shown in the tour nav and upload UI */
  label: string;
  /** Short label for thumbnail nav when space is tight */
  shortLabel?: string;
}

export interface PhotoCategoryConfig {
  /** Ordered list of photo categories for this provider type */
  categories: PhotoCategory[];
  /** Which category IDs to prefer for hero lead images, in priority order */
  heroPriority: string[];
}

export interface GroupedPhoto {
  /** URL of the photo */
  src: string;
  /** Which photo category this belongs to */
  categoryId: string;
  /** Optional alt text override */
  alt?: string;
}

export interface PhotoGroup {
  category: PhotoCategory;
  photos: GroupedPhoto[];
}

// ============================================================
// Photo Category Registry
// ============================================================

const PHOTO_CATEGORY_REGISTRY: Partial<Record<ProfileCategory, PhotoCategoryConfig>> = {
  independent_living: {
    heroPriority: ["exterior", "common-areas", "full-kitchen"],
    categories: [
      { id: "exterior",       label: "Exterior",                shortLabel: "Exterior" },
      { id: "common-areas",   label: "Common Areas",            shortLabel: "Common" },
      { id: "full-kitchen",   label: "Full Kitchen",            shortLabel: "Kitchen" },
      { id: "bedroom",        label: "Bedroom",                 shortLabel: "Bedroom" },
      { id: "bathroom",       label: "Bathroom",                shortLabel: "Bath" },
      { id: "dining",         label: "Dining",                  shortLabel: "Dining" },
      { id: "amenities",      label: "Amenities",               shortLabel: "Amenities" },
      { id: "outdoor-patio",  label: "Outdoor & Patio",         shortLabel: "Outdoor" },
    ],
  },
  memory_care: {
    heroPriority: ["community", "accommodation", "lifestyle"],
    categories: [
      { id: "community",      label: "Residence",               shortLabel: "Residence" },
      { id: "accommodation",  label: "Accommodation",           shortLabel: "Accommodation" },
      { id: "lifestyle",      label: "Lifestyle",               shortLabel: "Lifestyle" },
    ],
  },
  home_health_agency: {
    heroPriority: ["team", "patient-care", "office"],
    categories: [
      { id: "team",           label: "Care Team",               shortLabel: "Team" },
      { id: "patient-care",   label: "Patient Care",            shortLabel: "Care" },
      { id: "office",         label: "Office",                  shortLabel: "Office" },
      { id: "equipment",      label: "Equipment",               shortLabel: "Equipment" },
      { id: "community",      label: "Community",               shortLabel: "Community" },
    ],
  },
};

// ============================================================
// Public API
// ============================================================

/** Get photo category config for a provider category. */
export function getPhotoCategoryConfig(category: ProfileCategory | string): PhotoCategoryConfig | null {
  return PHOTO_CATEGORY_REGISTRY[category as ProfileCategory] ?? null;
}

/**
 * Group photos into their categories, dropping empty groups.
 * Returns only groups that have at least one photo.
 */
export function groupPhotos(
  category: ProfileCategory | string,
  photos: GroupedPhoto[],
): PhotoGroup[] {
  const config = getPhotoCategoryConfig(category);
  if (!config) return [];

  const groups: PhotoGroup[] = [];
  for (const cat of config.categories) {
    const matched = photos.filter((p) => p.categoryId === cat.id);
    if (matched.length > 0) {
      groups.push({ category: cat, photos: matched });
    }
  }
  return groups;
}

/**
 * Pick hero images from grouped photos, prioritizing the config's heroPriority order.
 * Returns up to `count` image URLs.
 */
export function pickHeroImages(
  category: ProfileCategory | string,
  photos: GroupedPhoto[],
  count = 5,
): string[] {
  const config = getPhotoCategoryConfig(category);
  if (!config) return photos.slice(0, count).map((p) => p.src);

  const picked: string[] = [];
  const used = new Set<string>();

  // Lead with hero-priority categories
  for (const catId of config.heroPriority) {
    const group = photos.filter((p) => p.categoryId === catId);
    if (group.length > 0 && !used.has(group[0].src)) {
      picked.push(group[0].src);
      used.add(group[0].src);
    }
    if (picked.length >= count) break;
  }

  // Fill remaining from other photos
  for (const p of photos) {
    if (picked.length >= count) break;
    if (!used.has(p.src)) {
      picked.push(p.src);
      used.add(p.src);
    }
  }

  return picked;
}
