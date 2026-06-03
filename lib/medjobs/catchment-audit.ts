/**
 * Catchment audit — per-university provider density.
 *
 * Answers "if I activate this Site, how many Provider Prospects will it
 * actually generate?" before the admin commits. Catches the
 * Michigan-State case (10 catchment cities, only 1 matching provider)
 * up-front so TJ + the team can prioritize Sites where enrichment
 * has paid off and defer the ones still data-starved.
 *
 * Mirrors the rules used by getProviderProspectsInCatchment + the
 * Provider Prospect virtual-row computation so the predicted count
 * matches what the In Basket would actually surface: it reads the
 * olera-providers directory (NOT business_profiles) and restricts to
 * non-medical home care — the only employer type MedJobs targets.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PARTNER_UNIVERSITIES,
  type PartnerUniversity,
} from "@/lib/staffing-outreach/partner-universities";
import { fetchNonMedicalProviders } from "@/lib/medjobs/catchment";

export interface CatchmentAuditRow {
  slug: string;
  name: string;
  city: string;
  state: string;
  /** Number of {city,state} pairs in the catchment definition. */
  catchment_cities: number;
  /** Non-medical home care providers (olera-providers directory) in
   *  catchment that are NOT yet materialized — these become Provider
   *  Prospects on activation. */
  providers_in_catchment: number;
  /** Account-holders (business_profiles) in catchment already converted
   *  to clients (interview T&C accepted in last 90d OR active
   *  subscription). Sourced from business_profiles because clients are
   *  account-holders, not directory rows. Informational. */
  providers_already_clients: number;
  /** Directory providers in catchment already materialized as
   *  student_outreach rows (kind='provider'), keyed by olera_provider_id
   *  (new) or provider_business_profile_id (legacy). Excluded from the
   *  prospect count. */
  providers_already_materialized: number;
  /** Per-state total of non-medical home care providers — informational.
   *  Shows the gap between "non-medical providers in any of this Site's
   *  states" and "non-medical providers actually in catchment cities." A
   *  wide gap suggests either the catchment list is too narrow OR
   *  providers are clustered elsewhere in the state. */
  providers_in_states: number;
  /** Catchment cities that have ZERO matching non-medical providers —
   *  the worklist for /city-pipeline enrichment. */
  empty_cities: Array<{ city: string; state: string }>;
  /** True when student_outreach_campuses has an is_active row with
   *  this slug — i.e. the Site is already activated. */
  is_active_site: boolean;
}

const PILOT_MS = 90 * 24 * 60 * 60 * 1000;
function isClientMeta(m: Record<string, unknown> | null, now: number): boolean {
  if (!m) return false;
  if (m.medjobs_subscription_active === true) return true;
  const accepted = m.interview_terms_accepted_at;
  if (typeof accepted !== "string") return false;
  const t = new Date(accepted).getTime();
  return !isNaN(t) && now - t < PILOT_MS;
}

export async function auditCatchments(
  db: SupabaseClient,
): Promise<CatchmentAuditRow[]> {
  // Pull every provider organization in any state that any university
  // catchment references. One query keeps it cheap regardless of how
  // many universities we audit.
  const allStates = Array.from(
    new Set(
      PARTNER_UNIVERSITIES.flatMap((u: PartnerUniversity) =>
        u.catchment.map((c) => c.state),
      ),
    ),
  );

  const [
    oleraData,
    { data: clientData },
    { data: materializedData },
    { data: activeSiteData },
  ] = await Promise.all([
    // Prospect universe: non-medical home care directory rows.
    // Paginated to defeat the PostgREST max-rows cap.
    fetchNonMedicalProviders<{
      provider_id: string;
      city: string | null;
      state: string | null;
    }>(db, "provider_id, city, state", allStates),
    // Clients are account-holders, so the clients column reads
    // business_profiles, not the directory.
    db
      .from("business_profiles")
      .select("id, city, state, metadata")
      .in("type", ["organization", "caregiver"])
      .in("state", allStates),
    db
      .from("student_outreach")
      .select(
        "provider_business_profile_id, research_data, student_outreach_campuses(slug)",
      )
      .eq("kind", "provider"),
    db
      .from("student_outreach_campuses")
      .select("slug")
      .eq("is_active", true),
  ]);

  // Index the non-medical directory by city|state (prospect universe).
  const oleraByCityState = new Map<string, Array<{ id: string }>>();
  const oleraByState = new Map<string, number>();
  for (const p of oleraData) {
    if (p.state) {
      oleraByState.set(p.state, (oleraByState.get(p.state) ?? 0) + 1);
    }
    if (!p.city || !p.state) continue;
    const key = `${p.city.toLowerCase()}|${p.state}`;
    if (!oleraByCityState.has(key)) oleraByCityState.set(key, []);
    oleraByCityState.get(key)!.push({ id: p.provider_id });
  }

  // Index account-holder clients by city|state.
  type ClientLite = {
    city: string | null;
    state: string | null;
    metadata: Record<string, unknown> | null;
  };
  const clientByCityState = new Map<string, ClientLite[]>();
  for (const p of (clientData ?? []) as ClientLite[]) {
    if (!p.city || !p.state) continue;
    const key = `${p.city.toLowerCase()}|${p.state}`;
    if (!clientByCityState.has(key)) clientByCityState.set(key, []);
    clientByCityState.get(key)!.push(p);
  }

  // Materialized provider ids per slug. Honors BOTH the legacy
  // provider_business_profile_id and the new research_data.olera_provider_id
  // so directory-sourced materializations are correctly excluded.
  const materializedBySlug = new Map<string, Set<string>>();
  for (const r of (materializedData ?? []) as Array<{
    provider_business_profile_id: string | null;
    research_data: { olera_provider_id?: string } | null;
    student_outreach_campuses: { slug: string } | { slug: string }[] | null;
  }>) {
    const slug = Array.isArray(r.student_outreach_campuses)
      ? r.student_outreach_campuses[0]?.slug
      : r.student_outreach_campuses?.slug;
    if (!slug) continue;
    if (!materializedBySlug.has(slug)) materializedBySlug.set(slug, new Set());
    const set = materializedBySlug.get(slug)!;
    if (r.provider_business_profile_id) set.add(r.provider_business_profile_id);
    if (r.research_data?.olera_provider_id) set.add(r.research_data.olera_provider_id);
  }

  const activeSlugs = new Set(
    ((activeSiteData ?? []) as Array<{ slug: string }>).map((c) => c.slug),
  );

  const now = Date.now();
  const rows: CatchmentAuditRow[] = PARTNER_UNIVERSITIES.map((uni) => {
    const matSet = materializedBySlug.get(uni.slug) ?? new Set<string>();
    const emptyCities: Array<{ city: string; state: string }> = [];
    let inCatchment = 0;
    let asClient = 0;
    const stateSet = new Set<string>();
    for (const cc of uni.catchment) {
      stateSet.add(cc.state);
      const key = `${cc.city.toLowerCase()}|${cc.state}`;
      const oleraList = oleraByCityState.get(key) ?? [];
      if (oleraList.length === 0) emptyCities.push({ city: cc.city, state: cc.state });
      for (const p of oleraList) {
        if (matSet.has(p.id)) continue; // already being worked
        inCatchment += 1;
      }
      for (const p of clientByCityState.get(key) ?? []) {
        if (isClientMeta(p.metadata, now)) asClient += 1;
      }
    }
    let inStates = 0;
    for (const s of stateSet) inStates += oleraByState.get(s) ?? 0;

    return {
      slug: uni.slug,
      name: uni.name,
      city: uni.city,
      state: uni.state,
      catchment_cities: uni.catchment.length,
      providers_in_catchment: inCatchment,
      providers_already_clients: asClient,
      providers_already_materialized: matSet.size,
      providers_in_states: inStates,
      empty_cities: emptyCities,
      is_active_site: activeSlugs.has(uni.slug),
    };
  });

  return rows;
}
