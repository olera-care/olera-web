/**
 * v9.0 Phase 2: Campus catchment lookups.
 *
 * A campus is a university; its catchment is the surrounding cities
 * defined manually in `lib/staffing-outreach/partner-universities.ts`.
 * Providers in those cities are part of the campus's catchment.
 *
 * The catchment join is slug-keyed: `student_outreach_campuses.slug`
 * matches `PartnerUniversity.slug` by construction (migration 064 seeds
 * campuses with the same slugs). Verified during planning.
 *
 * Computation is at-query-time, not stored — provider counts are small
 * (hundreds per campus) and the catchment rarely changes.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PARTNER_UNIVERSITIES,
  type PartnerUniversity,
} from "@/lib/staffing-outreach/partner-universities";
import { getServiceClient } from "@/lib/admin";
import { getClientStatus, type ProviderMetadata } from "@/lib/medjobs/clients";

// Stable sort sentinel for providers whose olera-providers.created_at is
// null (common for bulk-imported directory rows). A wall-clock fallback
// (new Date()) is recomputed on every request, so those prospects
// re-timestamp on each silent refresh and shuffle to the top of the
// created_at-desc Prospects sort — opening any card triggers a refresh,
// which made the whole list reorder in the background. The epoch sentinel
// is deterministic: unknown-age providers sort to the bottom in a stable
// order and never churn.
const UNKNOWN_CREATED_AT = new Date(0).toISOString();

export type CampusStage =
  | "provider_prospecting"   // no client in catchment yet — work providers
  | "stakeholder_prospecting" // ≥1 client in catchment, but research_complete=false
  | "active";                 // research_complete=true (full pipeline)

export interface CampusStageInfo {
  slug: string;
  stage: CampusStage;
  client_count: number;
  research_complete: boolean;
}

export function getPartnerUniversity(slug: string): PartnerUniversity | null {
  return PARTNER_UNIVERSITIES.find((u) => u.slug === slug) ?? null;
}

/**
 * MedJobs targets non-medical home care employers only (students fill
 * caregiver / PRN roles). The canonical directory category is
 * "Home Care (Non-medical)"; this is the single source of truth for the
 * predicate so the prospect LIST, the sidebar/tab COUNTS, and the
 * Catchment AUDIT all agree on what counts.
 *
 * `NON_MEDICAL_ILIKE` is the Postgres ILIKE pattern for the same rule —
 * use it to filter at query time and avoid pulling every category over
 * the wire from the 75K-row directory.
 */
export const NON_MEDICAL_ILIKE = "%non-medical%";
export function isNonMedicalCategory(category: string | null | undefined): boolean {
  return !!category && category.toLowerCase().includes("non-medical");
}

/**
 * Page through the olera-providers directory for non-medical home care
 * rows, defeating PostgREST's max-rows cap (10k on this project). A
 * single un-ranged select silently truncates — nationwide non-medical
 * is ~12.7k — so every catchment/count/audit read MUST page.
 *
 * `states` scopes the fetch (pass the active campuses' states). `columns`
 * lets each caller select only what it needs. `provider_id` is always
 * selected (and `columns` must include it) so paging has a stable sort.
 *
 * NOTE: the `.order("provider_id")` is load-bearing — range pagination
 * without a stable ORDER BY lets Postgres skip/duplicate rows across
 * pages, producing counts that drift run-to-run.
 */
/**
 * How far a student will drive for a shift. 40 miles, chosen by measuring:
 * across the six live campuses the hand-written city lists find 165
 * non-medical providers, 40 miles finds 289, and 60 miles starts pulling
 * Indianapolis into Bloomington's list and Milwaukee's suburbs into
 * Madison's — other metros, not commutable suburbs.
 */
export const DEFAULT_RADIUS_MILES = 40;

const EARTH_MILES = 3959;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in miles. */
export function milesBetween(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const c =
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.cos(rad(bLon) - rad(aLon)) +
    Math.sin(rad(aLat)) * Math.sin(rad(bLat));
  // Guard acos against floating-point drift just past 1.0.
  return EARTH_MILES * Math.acos(Math.min(1, c));
}

/**
 * Is this row in the campus's catchment?
 *
 * A union, deliberately: inside the radius OR on the hand-written city
 * list. Radius alone would be cleaner, but a row whose coordinates are
 * missing or wrong would silently drop out of a catchment it has been in
 * for months, and a provider an admin has already worked is not something
 * to lose to a geocoding error. The list can only add, never subtract.
 */
export function matchesCatchment(
  uni: PartnerUniversity,
  row: { city?: string | null; state?: string | null; lat?: number | null; lon?: number | null },
): boolean {
  if (
    uni.lat != null &&
    uni.lon != null &&
    row.lat != null &&
    row.lon != null &&
    milesBetween(uni.lat, uni.lon, row.lat, row.lon) <=
      (uni.radiusMiles ?? DEFAULT_RADIUS_MILES)
  ) {
    return true;
  }
  if (!row.city || !row.state) return false;
  const key = `${row.city.toLowerCase()}|${row.state}`;
  return uni.catchment.some((c) => `${c.city.toLowerCase()}|${c.state}` === key);
}

/**
 * A latitude/longitude box that contains the campus radius.
 *
 * Needed because the directory queries filter by state, and a radius does
 * not respect state lines — Florida State sits about twenty miles from
 * Georgia, so a state-filtered query cannot see providers a student would
 * happily drive to. Padded by a mile to keep the box outside the circle.
 */
export function catchmentBounds(
  uni: PartnerUniversity,
): { latMin: number; latMax: number; lonMin: number; lonMax: number } | null {
  if (uni.lat == null || uni.lon == null) return null;
  const miles = (uni.radiusMiles ?? DEFAULT_RADIUS_MILES) + 1;
  const dLat = miles / 69;
  // Longitude degrees shrink toward the poles; floor the cosine so the box
  // never collapses at extreme latitudes.
  const dLon = miles / (69 * Math.max(0.1, Math.cos(rad(uni.lat))));
  return {
    latMin: uni.lat - dLat,
    latMax: uni.lat + dLat,
    lonMin: uni.lon - dLon,
    lonMax: uni.lon + dLon,
  };
}

const OLERA_PAGE = 1000;
export async function fetchNonMedicalProviders<T = Record<string, unknown>>(
  db: SupabaseClient,
  columns: string,
  states?: string[],
  /**
   * Restrict to a lat/lon box instead of a state list. Rows with no
   * coordinates cannot satisfy a box, so callers that still want the
   * city-list fallback must fetch by state as well and merge.
   */
  bounds?: { latMin: number; latMax: number; lonMin: number; lonMax: number },
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += OLERA_PAGE) {
    let q = db
      .from("olera-providers")
      .select(columns)
      .ilike("provider_category", NON_MEDICAL_ILIKE)
      .or("deleted.is.null,deleted.eq.false")
      .order("provider_id", { ascending: true });
    if (bounds) {
      q = q
        .gte("lat", bounds.latMin)
        .lte("lat", bounds.latMax)
        .gte("lon", bounds.lonMin)
        .lte("lon", bounds.lonMax);
    } else if (states && states.length) {
      q = q.in("state", states);
    }
    const { data, error } = await q.range(from, from + OLERA_PAGE - 1);
    if (error) {
      console.error("[catchment] non-medical fetch error:", error);
      break;
    }
    const batch = (data ?? []) as T[];
    out.push(...batch);
    if (batch.length < OLERA_PAGE) break;
  }
  return out;
}

/**
 * All providers (organization or caregiver) in this campus's catchment
 * from business_profiles. Used for client status checks and stage derivation.
 *
 * Note: matching is done by case-insensitive city + exact state.
 */
export async function getProvidersInCatchment(slug: string) {
  const uni = getPartnerUniversity(slug);
  if (!uni) return [];

  const db = getServiceClient();
  const states = Array.from(new Set(uni.catchment.map((c) => c.state)));
  const { data, error } = await db
    .from("business_profiles")
    .select("id, display_name, city, state, lat, lng, metadata, is_active, created_at")
    .in("type", ["organization", "caregiver"])
    .in("state", states);

  if (error) {
    console.error("[catchment] query error:", error);
    return [];
  }

  type Row = {
    id: string;
    display_name: string | null;
    city: string | null;
    state: string | null;
    lat: number | null;
    // business_profiles spells it lng; olera-providers spells it lon.
    lng: number | null;
    metadata: ProviderMetadata | null;
    is_active: boolean;
    created_at: string;
  };
  return ((data ?? []) as Row[]).filter((p) =>
    matchesCatchment(uni, { city: p.city, state: p.state, lat: p.lat, lon: p.lng }),
  );
}

/**
 * Provider prospects from the olera-providers directory table.
 * This is the main source for MedJobs prospecting (75K+ providers).
 *
 * Returns providers in the catchment who haven't been deleted.
 * These are external providers who may not have Olera accounts yet.
 */
export async function getProviderProspectsInCatchment(slug: string) {
  const uni = getPartnerUniversity(slug);
  if (!uni) return [];

  const db = getServiceClient();
  const states = Array.from(new Set(uni.catchment.map((c) => c.state)));

  type Row = {
    provider_id: string;
    provider_name: string | null;
    city: string | null;
    state: string | null;
    lat: number | null;
    lon: number | null;
    email: string | null;
    website: string | null;
    phone: string | null;
    slug: string | null;
    created_at: string | null;
  };

  const columns =
    "provider_id, provider_name, city, state, lat, lon, email, website, phone, slug, created_at";

  // Query olera-providers (the 75K+ provider directory), restricted to
  // non-medical home care — the only employer type MedJobs targets.
  // Paginated to defeat the PostgREST max-rows cap.
  //
  // Two fetches when the campus has coordinates. The box catches providers
  // the state filter cannot — Florida State is about twenty miles from
  // Georgia — and the state fetch keeps rows whose coordinates are missing
  // but whose city is on the list. Merged by provider_id; matchesCatchment
  // decides. One fetch, by state, when there are no coordinates.
  const bounds = catchmentBounds(uni);
  const pages = await Promise.all([
    fetchNonMedicalProviders<Row>(db, columns, states),
    bounds
      ? fetchNonMedicalProviders<Row>(db, columns, undefined, bounds)
      : Promise.resolve([] as Row[]),
  ]);
  const byId = new Map<string, Row>();
  for (const row of pages.flat()) byId.set(row.provider_id, row);
  const data = Array.from(byId.values());

  // Map to the shape expected by provider-prospects endpoint
  return data
    .filter((p) => matchesCatchment(uni, p))
    .map((p) => ({
      id: p.provider_id,
      display_name: p.provider_name,
      city: p.city,
      state: p.state,
      email: p.email,
      website: p.website,
      phone: p.phone,
      slug: p.slug,
      // Providers from olera-providers are not clients (no metadata)
      metadata: null as ProviderMetadata | null,
      is_active: true,
      created_at: p.created_at ?? UNKNOWN_CREATED_AT,
    }));
}

/**
 * Derive a campus's stage from its catchment + research_complete flag.
 * Stage is monotonic in this implementation: once a campus has reached
 * stakeholder_prospecting it stays there even if all clients later
 * churn (matches the v9.0 product decision — campuses don't revert).
 */
export async function getCampusStage(args: {
  slug: string;
  research_complete: boolean;
}): Promise<CampusStageInfo> {
  const providers = await getProvidersInCatchment(args.slug);
  const clients = providers.filter((p) => getClientStatus(p.metadata).isClient);
  const clientCount = clients.length;

  let stage: CampusStage;
  if (args.research_complete) {
    stage = "active";
  } else if (clientCount > 0) {
    stage = "stakeholder_prospecting";
  } else {
    stage = "provider_prospecting";
  }

  return {
    slug: args.slug,
    stage,
    client_count: clientCount,
    research_complete: args.research_complete,
  };
}

export const CAMPUS_STAGE_LABELS: Record<CampusStage, string> = {
  provider_prospecting: "Provider prospecting",
  stakeholder_prospecting: "Research stakeholders",
  active: "Active partnership",
};
