import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sitemap provider reads — the SEO enumeration of the directory behind the
 * front door. `app/sitemap.ts` reads `olera-providers` (and claimed
 * `business_profiles`) in several lean, purpose-specific shapes: an active
 * count for sharding, per-category geo combos for power pages, a paginated
 * slug/freshness scan for provider pages, and claimed-account slugs. These
 * don't map to `ProviderView` (they're SEO projections, not provider objects),
 * so they live here as named readers rather than going through `resolveProvider`.
 *
 * Relocated parity-first from `app/sitemap.ts`. Every function degrades to
 * empty/zero on error — the sitemap swallows per-query failures and continues
 * (one bad category skips only its geo, not the whole loop), so these must NOT
 * throw. Takes the caller's (anon) client so RLS visibility is unchanged.
 */

/** Count active (non-deleted) directory providers — used to shard the sitemap. */
export async function countActiveProviders(db: SupabaseClient): Promise<number> {
  try {
    const { count } = await db
      .from("olera-providers")
      .select("provider_id", { count: "exact", head: true })
      .or("deleted.is.null,deleted.eq.false");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export interface ProviderGeoCombo {
  state: string;
  city: string;
}

/**
 * Active providers' (state, city) pairs for one category — feeds the power-page
 * state/city URL generation. Caller dedups into state/city sets.
 */
export async function getActiveProviderGeoByCategory(
  db: SupabaseClient,
  categoryDbValue: string,
): Promise<ProviderGeoCombo[]> {
  try {
    const { data } = await db
      .from("olera-providers")
      .select("state, city")
      .eq("provider_category", categoryDbValue)
      .or("deleted.is.null,deleted.eq.false")
      .not("state", "is", null)
      .not("city", "is", null);
    return (data ?? []) as ProviderGeoCombo[];
  } catch {
    return [];
  }
}

export interface SitemapProviderRow {
  provider_id: string;
  slug: string | null;
  description_updated_at?: string | null;
  cleansed_at?: string | null;
  created_at?: string | null;
}

/**
 * Active providers for one sitemap shard: `[shardStart, shardStart + batchSize)`,
 * paginated internally in 1000-row pages. Probes once for the freshness columns
 * (migration 082's `description_updated_at` etc. may not be applied everywhere —
 * the DB has no migration tracker) and degrades to the minimal `provider_id,
 * slug` projection if they're absent. Caller derives `<lastmod>` and URLs.
 */
export async function getActiveProvidersForSitemapShard(
  db: SupabaseClient,
  shardStart: number,
  batchSize: number,
): Promise<SitemapProviderRow[]> {
  let providerSelect = "provider_id, slug, description_updated_at, cleansed_at, created_at";
  try {
    const probe = await db.from("olera-providers").select(providerSelect).limit(1);
    if (probe.error) providerSelect = "provider_id, slug";
  } catch {
    providerSelect = "provider_id, slug";
  }

  const PAGE_SIZE = 1_000;
  const rows: SitemapProviderRow[] = [];
  let fetched = 0;
  while (fetched < batchSize) {
    const from = shardStart + fetched;
    const to = from + PAGE_SIZE - 1;
    let providers: SitemapProviderRow[] | null = null;
    try {
      const { data } = await db
        .from("olera-providers")
        .select(providerSelect)
        .or("deleted.is.null,deleted.eq.false")
        .range(from, to);
      providers = data as SitemapProviderRow[] | null;
    } catch {
      break;
    }
    if (!providers || providers.length === 0) break;
    rows.push(...providers);
    if (providers.length < PAGE_SIZE) break;
    fetched += providers.length;
  }
  return rows;
}

/**
 * Slugs of active claimed accounts (`business_profiles`, org/caregiver). The
 * sitemap appends these in the first provider shard, skipping any already
 * emitted from the directory.
 */
export async function getActiveClaimedProviderSlugs(
  db: SupabaseClient,
): Promise<(string | null)[]> {
  try {
    const { data } = await db
      .from("business_profiles")
      .select("slug")
      .in("type", ["organization", "caregiver"])
      .eq("is_active", true);
    return (data ?? []).map((r) => (r as { slug: string | null }).slug);
  } catch {
    return [];
  }
}
