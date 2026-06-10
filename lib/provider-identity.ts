import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The system-wide canonical provider identifier for `email_log.provider_id`: **`olera-providers.slug`**.
 *
 * This is the same identifier space `provider_activity`, the weekly digest, and the conversion
 * dashboard already key on — it is NOT a new mapping, it's the spine that already exists. It's the
 * only id that exists for EVERY provider we email:
 *   - The `business_profiles.id` UUID does NOT exist for UNCLAIMED providers (they have no
 *     business_profiles row — the digest synthesizes them from olera-providers).
 *   - `business_profiles.slug` is unreliable: for ~16% of claimed providers it holds a stale legacy
 *     id (e.g. "xXXblpO") instead of the real slug.
 *
 * So every provider-email sender resolves to `olera-providers.slug` through the
 * `business_profiles.source_provider_id` link. ONE resolver, used by all senders, so the per-sender
 * keys that fragmented `email_log` (UUID vs slug vs source_provider_id) can't drift apart again.
 * See plans/provider-comms-gate.md.
 *
 * Pass what you have from the provider's `business_profiles` row. Returns the canonical slug, or the
 * best stable fallback when the olera-providers lookup misses (source_provider_id, then profileSlug)
 * — fallbacks are deterministic, so a given provider still resolves consistently across senders.
 */
export async function resolveCanonicalProviderId(
  db: SupabaseClient,
  opts: { sourceProviderId?: string | null; profileSlug?: string | null },
): Promise<string | null> {
  const { sourceProviderId, profileSlug } = opts;
  if (sourceProviderId) {
    const { data } = await db
      .from("olera-providers")
      .select("slug")
      .eq("provider_id", sourceProviderId)
      .maybeSingle();
    if (data?.slug) return data.slug as string;
    // No olera-providers row / no slug → fall back to the legacy id itself. Consistent per provider.
    return sourceProviderId;
  }
  return profileSlug ?? null;
}
