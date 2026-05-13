/**
 * Resolve a provider's set of known ID variants.
 *
 * `email_log.provider_id` and `provider_activity.provider_id` are both TEXT
 * columns whose callers write either `olera-providers.provider_id` (e.g.
 * "north-lauderdale-fl-0040", "QX76ebM") OR `business_profiles.id` (UUID)
 * depending on which the call site has handy. Empirically (sampled 20 rows
 * of email_log) ~80% are BP UUIDs, ~20% are OP provider_ids. Never the slug.
 *
 * Meanwhile, admin pages link to /admin/directory/[providerId] with FOUR
 * possible input shapes:
 *
 *   - `olera-providers.provider_id` — directory list of scraped rows
 *   - `olera-providers.slug` — analytics top-providers + latest-events tables
 *   - `business_profiles.id` (UUID) — directory list of user-created rows
 *   - `business_profiles.slug` — analytics leads table for BP-anchored providers
 *
 * Querying email_log/provider_activity with just the URL input silently drops
 * rows when the input shape doesn't match the storage shape. This helper does
 * up to three lookups to expand any input into the union of variants written
 * under that provider, so `.in("provider_id", allVariants)` matches everything.
 *
 * Usage:
 *
 *     const { allVariants } = await resolveProviderIdVariants(db, urlParam);
 *     const { data } = await db
 *       .from("email_log")
 *       .select("...")
 *       .in("provider_id", allVariants);
 *
 * Cost: 3 indexed lookups per call. Cheap enough for admin endpoints; don't
 * bother caching unless we see it hot.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProviderIdVariants {
  /** Canonical identifier — `olera-providers.provider_id` when resolvable, otherwise the raw input. */
  slug: string;
  /** First business_profiles.id (UUID) found, if any. Null if no BP rows link to this provider. */
  businessProfileId: string | null;
  /** Union of every variant to match against. Use in `.in("provider_id", allVariants)`. */
  allVariants: string[];
}

export async function resolveProviderIdVariants(
  db: SupabaseClient,
  input: string,
): Promise<ProviderIdVariants> {
  // Always include the raw input — covers the case where it already matches
  // the storage shape (op.provider_id or bp.id).
  const variants = new Set<string>([input]);
  let canonical = input;
  let businessProfileId: string | null = null;

  try {
    // (a) If input is an olera-providers.slug, resolve the canonical provider_id.
    {
      const { data, error } = await db
        .from("olera-providers")
        .select("provider_id")
        .eq("slug", input)
        .maybeSingle();
      if (!error && data?.provider_id) {
        canonical = data.provider_id;
        variants.add(canonical);
      }
    }

    // (b) If input is a business_profiles.slug, find the BP UUID and any linked OP.
    {
      const { data, error } = await db
        .from("business_profiles")
        .select("id, source_provider_id")
        .eq("slug", input)
        .maybeSingle();
      if (!error && data?.id) {
        variants.add(data.id);
        businessProfileId = data.id;
        if (data.source_provider_id) {
          canonical = data.source_provider_id;
          variants.add(canonical);
        }
      }
    }

    // (c) Every BP whose source_provider_id matches the canonical OP id — picks
    //     up UUIDs of all claim-linked BPs (no UNIQUE on source_provider_id, so
    //     multiple rows can share). Cap at 10 defensively.
    {
      const { data, error } = await db
        .from("business_profiles")
        .select("id")
        .eq("source_provider_id", canonical)
        .limit(10);
      if (!error && Array.isArray(data)) {
        for (const row of data as Array<{ id: string | null }>) {
          if (row.id && !variants.has(row.id)) {
            variants.add(row.id);
            if (businessProfileId === null) businessProfileId = row.id;
          }
        }
      }
    }
  } catch (err) {
    // Best-effort — fall back to whatever we accumulated. Worst case is the
    // raw input only, which is the same failure mode as the pre-helper baseline.
    console.error("[provider-id-variants] lookup failed:", err);
  }

  return { slug: canonical, businessProfileId, allVariants: Array.from(variants) };
}
