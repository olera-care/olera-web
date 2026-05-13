/**
 * Catchment audit — per-university provider density.
 *
 * Answers "if I activate this Site, how many Provider Prospects will it
 * actually generate?" before the admin commits. Catches the
 * Michigan-State case (10 catchment cities, only 1 matching provider)
 * up-front so TJ + the team can prioritize Sites where enrichment
 * has paid off and defer the ones still data-starved.
 *
 * Mirrors the rules used by getProvidersInCatchment + the Provider
 * Prospect virtual-row computation so the predicted count matches
 * what the In Basket would actually surface.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PARTNER_UNIVERSITIES,
  type PartnerUniversity,
} from "@/lib/staffing-outreach/partner-universities";

export interface CatchmentAuditRow {
  slug: string;
  name: string;
  city: string;
  state: string;
  /** Number of {city,state} pairs in the catchment definition. */
  catchment_cities: number;
  /** Active provider organizations in catchment that are NOT yet
   *  clients — these become Provider Prospects on activation. */
  providers_in_catchment: number;
  /** Providers in catchment already converted to clients (interview
   *  T&C accepted in last 90d OR active subscription). Counted
   *  separately so admin sees both numerator and denominator. */
  providers_already_clients: number;
  /** Providers in catchment already materialized as student_outreach
   *  rows (kind='provider'). Subtracted from the prospect count. */
  providers_already_materialized: number;
  /** Per-state total of provider organizations — informational. Shows
   *  the gap between "providers in any of this Site's states" and
   *  "providers actually in catchment cities." A wide gap suggests
   *  either the catchment list is too narrow OR providers are
   *  clustered elsewhere in the state. */
  providers_in_states: number;
  /** Catchment cities that have ZERO matching providers — useful
   *  hint for where enrichment should focus. */
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
    { data: providerData },
    { data: materializedData },
    { data: activeSiteData },
  ] = await Promise.all([
    db
      .from("business_profiles")
      .select("id, city, state, metadata")
      .in("type", ["organization", "caregiver"])
      .in("state", allStates),
    db
      .from("student_outreach")
      .select("provider_business_profile_id, campus_id, student_outreach_campuses(slug)")
      .eq("kind", "provider"),
    db
      .from("student_outreach_campuses")
      .select("slug")
      .eq("is_active", true),
  ]);

  type ProviderLite = {
    id: string;
    city: string | null;
    state: string | null;
    metadata: Record<string, unknown> | null;
  };
  const providerByCityState = new Map<string, ProviderLite[]>();
  const providersByState = new Map<string, number>();
  for (const p of (providerData ?? []) as ProviderLite[]) {
    if (p.state) {
      providersByState.set(p.state, (providersByState.get(p.state) ?? 0) + 1);
    }
    if (!p.city || !p.state) continue;
    const key = `${p.city.toLowerCase()}|${p.state}`;
    if (!providerByCityState.has(key)) providerByCityState.set(key, []);
    providerByCityState.get(key)!.push(p);
  }

  // Materialized provider rows keyed by slug (so we can subtract per-
  // university). Fall back to provider_id|<any> if the join failed.
  const materializedBySlug = new Map<string, Set<string>>();
  for (const r of (materializedData ?? []) as Array<{
    provider_business_profile_id: string | null;
    student_outreach_campuses: { slug: string } | { slug: string }[] | null;
  }>) {
    if (!r.provider_business_profile_id) continue;
    const slug = Array.isArray(r.student_outreach_campuses)
      ? r.student_outreach_campuses[0]?.slug
      : r.student_outreach_campuses?.slug;
    if (!slug) continue;
    if (!materializedBySlug.has(slug)) materializedBySlug.set(slug, new Set());
    materializedBySlug.get(slug)!.add(r.provider_business_profile_id);
  }

  const activeSlugs = new Set(
    ((activeSiteData ?? []) as Array<{ slug: string }>).map((c) => c.slug),
  );

  const now = Date.now();
  const rows: CatchmentAuditRow[] = PARTNER_UNIVERSITIES.map((uni) => {
    const matCount = materializedBySlug.get(uni.slug)?.size ?? 0;
    const emptyCities: Array<{ city: string; state: string }> = [];
    let inCatchment = 0;
    let asClient = 0;
    const stateSet = new Set<string>();
    for (const cc of uni.catchment) {
      stateSet.add(cc.state);
      const key = `${cc.city.toLowerCase()}|${cc.state}`;
      const list = providerByCityState.get(key) ?? [];
      if (list.length === 0) emptyCities.push({ city: cc.city, state: cc.state });
      for (const p of list) {
        if (isClientMeta(p.metadata, now)) {
          asClient += 1;
          continue;
        }
        inCatchment += 1;
      }
    }
    let inStates = 0;
    for (const s of stateSet) inStates += providersByState.get(s) ?? 0;

    return {
      slug: uni.slug,
      name: uni.name,
      city: uni.city,
      state: uni.state,
      catchment_cities: uni.catchment.length,
      providers_in_catchment: Math.max(0, inCatchment - matCount),
      providers_already_clients: asClient,
      providers_already_materialized: matCount,
      providers_in_states: inStates,
      empty_cities: emptyCities,
      is_active_site: activeSlugs.has(uni.slug),
    };
  });

  return rows;
}
