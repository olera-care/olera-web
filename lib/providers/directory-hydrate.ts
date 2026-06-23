import { SUPABASE_CAT_TO_PROFILE_CATEGORY } from "@/lib/types/provider";

/**
 * One provider, one record. When a directory (`olera-providers`) listing is
 * claimed or materialized into a `business_profiles` row, we copy the directory's
 * full DISPLAY data into that row so the claimed profile is a complete, editable
 * record from the start — identical in shape to a normally-claimed provider's
 * profile. The portal reads it directly (no client-side overlay), edits persist
 * normally, and the public page renders the same record.
 *
 * This is the deliberate model decision: the business_profile is hydrated at
 * claim time rather than kept thin and projected from the directory at render.
 */

export interface DirectoryRowForHydration {
  provider_description?: string | null;
  provider_category?: string | null;
  main_category?: string | null;
  provider_images?: string | null;
  provider_logo?: string | null;
}

export interface DirectoryHydration {
  /** business_profiles top-level columns */
  description: string | null;
  care_types: string[];
  category: string | null;
  image_url: string | null;
  /** parsed gallery — caller merges into business_profiles.metadata.images */
  images: string[];
}

/** Parse olera-providers' pipe-joined `provider_images` into a clean array. */
export function parseDirectoryImages(provider_images: string | null | undefined): string[] {
  return provider_images
    ? provider_images.split(" | ").map((s) => s.trim()).filter(Boolean)
    : [];
}

/**
 * Build the display fields to copy from an `olera-providers` row into a claimed
 * `business_profiles` row. care_types mirrors the public page (category +
 * main_category); the gallery is returned separately for the caller to fold into
 * `metadata.images` alongside any other metadata it sets.
 */
export function directoryHydrationFields(row: DirectoryRowForHydration): DirectoryHydration {
  const careTypes = [row.provider_category, row.main_category]
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .filter((v, i, arr) => arr.indexOf(v) === i);
  const category = row.provider_category
    ? SUPABASE_CAT_TO_PROFILE_CATEGORY[row.provider_category] ?? null
    : null;
  return {
    description: row.provider_description ?? null,
    care_types: careTypes,
    category,
    image_url: row.provider_logo ?? null,
    images: parseDirectoryImages(row.provider_images),
  };
}

/** Columns to SELECT from olera-providers to feed directoryHydrationFields. */
export const DIRECTORY_HYDRATION_COLUMNS =
  "provider_description, provider_category, main_category, provider_images, provider_logo";
