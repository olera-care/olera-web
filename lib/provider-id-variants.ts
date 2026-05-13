/**
 * Resolve a provider's set of known ID variants.
 *
 * The URL `[providerId]` segment on /admin/directory/[providerId] and friends
 * is always the `olera-providers.provider_id` slug (e.g. "kindred-of-clearwater-fl-1234").
 * But `email_log.provider_id` and `provider_activity.provider_id` are both
 * `TEXT` columns whose callers can — and do — write either:
 *
 *   - the slug (most provider-bound sends from the city pipeline / Q&A / digest)
 *   - the `business_profiles.id` UUID (claim flow + some lead emails store the
 *     business profile primary key when one exists)
 *
 * Querying by a single variant silently drops rows written under the other.
 * This helper does one lookup against `business_profiles` (via the slug FK,
 * `source_provider_id`) and returns every variant we should match on.
 *
 * Usage in queries:
 *
 *     const { allVariants } = await resolveProviderIdVariants(db, slug);
 *     const { data } = await db
 *       .from("email_log")
 *       .select("...")
 *       .in("provider_id", allVariants);
 *
 * The helper is cheap (one indexed lookup) and idempotent — safe to call per
 * request from admin surfaces. Don't bother caching unless we see it hot.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProviderIdVariants {
  /** The canonical slug — what the URL carries. Always present. */
  slug: string;
  /** First business_profiles.id (UUID) found for this slug, if any. The historical "primary" business profile. Null if no profile rows. */
  businessProfileId: string | null;
  /** Union of every variant to match against. Use this in `.in("provider_id", allVariants)`. Includes the slug + every business_profiles.id pointing to it (no UNIQUE constraint on source_provider_id — multiple rows can share a slug). */
  allVariants: string[];
}

export async function resolveProviderIdVariants(
  db: SupabaseClient,
  slug: string,
): Promise<ProviderIdVariants> {
  // Slug is the source of truth from the URL — always include it.
  const variants: string[] = [slug];
  let businessProfileId: string | null = null;

  try {
    // No UNIQUE constraint on business_profiles.source_provider_id — collect
    // every matching row, not just the first. Cap at 10 (defensive against
    // accidental fan-out; real providers should have 1 row, possibly 2 if
    // a manual data fix happened).
    const { data, error } = await db
      .from("business_profiles")
      .select("id")
      .eq("source_provider_id", slug)
      .limit(10);

    if (!error && Array.isArray(data)) {
      for (const row of data as Array<{ id: string | null }>) {
        if (row.id && !variants.includes(row.id)) {
          variants.push(row.id);
          if (businessProfileId === null) businessProfileId = row.id;
        }
      }
    }
  } catch (err) {
    // Best-effort — fall back to slug-only matching. Surfaces using this
    // helper will undercount rows written under a UUID, which is the same
    // failure mode as the pre-helper baseline.
    console.error("[provider-id-variants] lookup failed:", err);
  }

  return { slug, businessProfileId, allVariants: variants };
}
