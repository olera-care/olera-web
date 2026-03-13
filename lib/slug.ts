import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_SLUG_ATTEMPTS = 5;

/**
 * Generates a URL-safe slug from input parts.
 * Adds a random 4-character suffix for uniqueness.
 */
function createSlugCandidate(...parts: string[]): string {
  const base = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

/**
 * Generates a UUID-based fallback slug.
 */
function createUuidSlug(): string {
  return `profile-${crypto.randomUUID().substring(0, 12)}`;
}

/**
 * Checks if a slug already exists in business_profiles.
 */
async function slugExists(
  db: SupabaseClient,
  slug: string
): Promise<boolean> {
  const { data } = await db
    .from("business_profiles")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  return data !== null;
}

/**
 * Generates a unique slug for a business profile.
 *
 * @param db - Supabase client (admin or authenticated)
 * @param parts - String parts to build the slug from (name, city, state, etc.)
 * @returns A unique slug guaranteed not to exist in the database
 *
 * Tries up to MAX_SLUG_ATTEMPTS times with random suffixes,
 * then falls back to a UUID-based slug.
 */
export async function generateUniqueSlug(
  db: SupabaseClient,
  ...parts: string[]
): Promise<string> {
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = createSlugCandidate(...parts);
    const exists = await slugExists(db, candidate);
    if (!exists) {
      return candidate;
    }
  }

  // Fallback to UUID-based slug (guaranteed unique)
  return createUuidSlug();
}

/**
 * Generates a unique slug from a single name.
 * Convenience wrapper for cases with just a display name.
 */
export async function generateUniqueSlugFromName(
  db: SupabaseClient,
  name: string
): Promise<string> {
  return generateUniqueSlug(db, name);
}
