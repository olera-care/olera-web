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
  /** business_profiles.id (UUID) if the provider has been claimed / has a profile row. Null otherwise. */
  businessProfileId: string | null;
  /** Union of every variant to match against. Use this in `.in("provider_id", allVariants)`. */
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
    const { data, error } = await db
      .from("business_profiles")
      .select("id")
      .eq("source_provider_id", slug)
      .limit(1)
      .maybeSingle();

    if (!error && data?.id) {
      businessProfileId = data.id;
      variants.push(data.id);
    }
  } catch (err) {
    // Best-effort — fall back to slug-only matching. Surfaces using this
    // helper will undercount rows written under the UUID, which is the
    // same failure mode as the pre-helper baseline.
    console.error("[provider-id-variants] lookup failed:", err);
  }

  return { slug, businessProfileId, allVariants: variants };
}
