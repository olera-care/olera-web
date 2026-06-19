import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * weekly-provider-digest data access — behind the front door.
 *
 * The digest cron reads the two tables in many lean, purpose-specific shapes:
 * a market-prewarm scan, a rank-eligible batch, the active-seeker set + nearby
 * claimed providers (Find Families), and a BP↔directory resolution dance. These
 * are thin query wrappers — all orchestration, chunking, and the bpByKey
 * synthesis stay in the cron; only the raw `.from(...)` calls (and their exact
 * error-logging) move here so the cron touches neither table directly.
 *
 * Note: two readers hit `business_profiles` FAMILY/seeker rows, not providers.
 * They live here because the eslint guard bans the table regardless of row type
 * — `lib/providers` is the access layer for both physical tables.
 *
 * Relocated parity-first from `app/api/cron/weekly-provider-digest/route.ts`.
 */

const LOG = "[weekly-provider-digest]";

export interface PrewarmCandidate {
  provider_id: string;
  city: string | null;
  state: string | null;
  provider_category: string | null;
}

/**
 * Paginated scan of email- and place_id-reachable active providers (one daily
 * page) to proactively warm their city×care markets. Logs + degrades to [].
 */
export async function scanProvidersForPrewarm(
  db: SupabaseClient,
  from: number,
  limit: number,
): Promise<PrewarmCandidate[]> {
  const { data, error } = await db
    .from("olera-providers")
    .select("provider_id, city, state, provider_category")
    .not("email", "is", null)
    .not("place_id", "is", null)
    .not("city", "is", null)
    .not("state", "is", null)
    .or("deleted.is.null,deleted.eq.false")
    .order("provider_id", { ascending: true })
    .range(from, from + limit - 1);
  if (error) {
    console.error(`${LOG} market prewarm candidate query failed:`, error);
  }
  return (data ?? []) as PrewarmCandidate[];
}

export interface RankEligibleProvider {
  provider_id: string;
  slug: string | null;
  place_id: string | null;
  email: string | null;
}

/** Active providers for a chunk of place_ids (rank-eligible enrollment). Logs + degrades to []. */
export async function getProvidersByPlaceIds(
  db: SupabaseClient,
  placeIds: string[],
): Promise<RankEligibleProvider[]> {
  const { data, error } = await db
    .from("olera-providers")
    .select("provider_id, slug, place_id, email")
    .in("place_id", placeIds)
    .not("deleted", "is", true);
  if (error) {
    console.error(`${LOG} rank-eligible provider query failed:`, error);
  }
  return (data ?? []) as RankEligibleProvider[];
}

export interface FamilySeekerRow {
  city: string | null;
  lat: number | null;
  lng: number | null;
  care_types: string[] | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Active published family care-posts (the Find Families seeker set). Reads
 * `business_profiles` FAMILY rows. Logs + degrades to [].
 */
export async function getActiveFamilySeekers(
  db: SupabaseClient,
): Promise<FamilySeekerRow[]> {
  const { data, error } = await db
    .from("business_profiles")
    .select("city, lat, lng, care_types, metadata")
    .eq("type", "family")
    .eq("is_active", true)
    .not("metadata->care_post", "is", null);
  if (error) console.error(`${LOG} seeker query failed:`, error);
  return (data ?? []) as FamilySeekerRow[];
}

export interface NearbyClaimedRow {
  slug: string | null;
  lat: number | null;
  lng: number | null;
}

/**
 * Claimed (account_id non-null) active org/caregiver providers within a lat/lng
 * box — the Find Families nearby-seeker enrollment. Caller haversine-refines to
 * 50mi. Silent on error (matches the original), degrades to [].
 */
export async function getClaimedProvidersInBox(
  db: SupabaseClient,
  bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number },
): Promise<NearbyClaimedRow[]> {
  const { data } = await db
    .from("business_profiles")
    .select("slug, lat, lng")
    .in("type", ["organization", "caregiver"])
    .eq("is_active", true)
    .not("account_id", "is", null)
    .gte("lat", bounds.latMin)
    .lte("lat", bounds.latMax)
    .gte("lng", bounds.lngMin)
    .lte("lng", bounds.lngMax);
  return (data ?? []) as NearbyClaimedRow[];
}

export interface DigestBusinessProfile {
  id: string;
  slug: string | null;
  source_provider_id: string | null;
  display_name: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  category: string | null;
  metadata: Record<string, unknown> | null;
  account_id: string | null;
  claim_state: string | null;
}

const DIGEST_BP_COLUMNS =
  "id, slug, source_provider_id, display_name, email, city, state, lat, lng, category, metadata, account_id, claim_state";

/** Claimed org/caregiver business_profiles for a chunk of slugs. Silent on error, degrades to []. */
export async function getBusinessProfilesBySlugs(
  db: SupabaseClient,
  slugs: string[],
): Promise<DigestBusinessProfile[]> {
  const { data } = await db
    .from("business_profiles")
    .select(DIGEST_BP_COLUMNS)
    .in("slug", slugs)
    .in("type", ["organization", "caregiver"]);
  return (data ?? []) as DigestBusinessProfile[];
}

/** Claimed org/caregiver business_profiles for a chunk of source_provider_ids. Silent on error, degrades to []. */
export async function getBusinessProfilesBySourceIds(
  db: SupabaseClient,
  sourceIds: string[],
): Promise<DigestBusinessProfile[]> {
  const { data } = await db
    .from("business_profiles")
    .select(DIGEST_BP_COLUMNS)
    .in("source_provider_id", sourceIds)
    .in("type", ["organization", "caregiver"]);
  return (data ?? []) as DigestBusinessProfile[];
}

export interface DigestIosProvider {
  provider_id: string;
  slug: string | null;
  email: string | null;
  provider_name: string | null;
  city: string | null;
  state: string | null;
}

const DIGEST_IOS_COLUMNS = "provider_id, slug, email, provider_name, city, state";

/** Directory rows for a chunk of slugs (unclaimed-provider synthesis). Logs + degrades to []. */
export async function getIosProvidersBySlugs(
  db: SupabaseClient,
  slugs: string[],
): Promise<DigestIosProvider[]> {
  const { data, error } = await db
    .from("olera-providers")
    .select(DIGEST_IOS_COLUMNS)
    .in("slug", slugs)
    .not("deleted", "is", true);
  if (error) {
    console.error(`${LOG} olera-providers by-slug query failed:`, error);
  }
  return (data ?? []) as DigestIosProvider[];
}

/** Directory rows for a chunk of provider_ids (legacy-id synthesis). Logs + degrades to []. */
export async function getIosProvidersByIds(
  db: SupabaseClient,
  ids: string[],
): Promise<DigestIosProvider[]> {
  const { data, error } = await db
    .from("olera-providers")
    .select(DIGEST_IOS_COLUMNS)
    .in("provider_id", ids)
    .not("deleted", "is", true);
  if (error) {
    console.error(`${LOG} olera-providers by-id query failed:`, error);
  }
  return (data ?? []) as DigestIosProvider[];
}

/**
 * Single directory `place_id` lookup by `provider_id` — used by the market-rank
 * resolver when a BP has no place_id of its own. Silent on error, degrades to null.
 */
export async function getProviderPlaceIdBySourceId(
  db: SupabaseClient,
  sourceProviderId: string,
): Promise<string | null> {
  const { data } = await db
    .from("olera-providers")
    .select("place_id")
    .eq("provider_id", sourceProviderId)
    .maybeSingle();
  return (data as { place_id?: string | null } | null)?.place_id ?? null;
}
