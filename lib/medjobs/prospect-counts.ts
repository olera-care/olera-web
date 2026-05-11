/**
 * Per-campus prospect generation counts. Mirrors the UI semantics:
 *   - Provider Prospects sub-section = catchment providers that are
 *     not yet clients and not yet materialized as kind='provider'
 *     stakeholder rows in student_outreach.
 *   - Partner Prospects research card  = each active campus where
 *     research_complete=false (one research operational card).
 *
 * Both buckets contribute to `counts.prospects` in the sidebar and the
 * In Basket tab bar. Centralizing the math here keeps the two surfaces
 * in lock-step: whatever shows up in the Prospects tab content also
 * lands in the fraction.
 *
 * Unread semantics:
 *   - Research card unread when the campus has never been viewed
 *     (viewed_at=null).
 *   - Virtual provider prospect rows have no viewed_at — they're
 *     always counted as unread until the admin materializes them
 *     (clicks "Start Outreach"), at which point they leave the
 *     prospect list and become a regular stakeholder row.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";

interface CampusLite {
  id: string;
  slug: string;
  viewed_at: string | null;
  research_complete: boolean;
}

interface ProviderLite {
  id: string;
  city: string | null;
  state: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ProspectGeneration {
  total: number;
  unread: number;
  researchCards: { total: number; unread: number };
  providerProspects: { total: number; unread: number };
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

export async function countProspectGeneration(
  db: SupabaseClient,
  options: { campusId?: string | null } = {},
): Promise<ProspectGeneration> {
  let campusQuery = db
    .from("student_outreach_campuses")
    .select("id, slug, viewed_at, research_complete")
    .eq("is_active", true);
  if (options.campusId) campusQuery = campusQuery.eq("id", options.campusId);
  const { data: campusData } = await campusQuery;
  const campuses = (campusData ?? []) as CampusLite[];

  if (campuses.length === 0) {
    return {
      total: 0,
      unread: 0,
      researchCards: { total: 0, unread: 0 },
      providerProspects: { total: 0, unread: 0 },
    };
  }

  const [{ data: providerData }, { data: materializedData }] = await Promise.all([
    db
      .from("business_profiles")
      .select("id, city, state, metadata")
      .in("type", ["organization", "caregiver"]),
    db
      .from("student_outreach")
      .select("provider_business_profile_id, campus_id")
      .eq("kind", "provider"),
  ]);

  const providerByCityState = new Map<string, ProviderLite[]>();
  for (const p of (providerData ?? []) as ProviderLite[]) {
    if (!p.city || !p.state) continue;
    const key = `${p.city.toLowerCase()}|${p.state}`;
    if (!providerByCityState.has(key)) providerByCityState.set(key, []);
    providerByCityState.get(key)!.push(p);
  }

  const materializedPairs = new Set<string>();
  for (const r of (materializedData ?? []) as Array<{
    provider_business_profile_id: string | null;
    campus_id: string;
  }>) {
    if (r.provider_business_profile_id) {
      materializedPairs.add(`${r.provider_business_profile_id}|${r.campus_id}`);
    }
  }

  const now = Date.now();
  let researchCardsTotal = 0;
  let researchCardsUnread = 0;
  let providerProspectsTotal = 0;
  let providerProspectsUnread = 0;

  for (const c of campuses) {
    if (!c.research_complete) {
      researchCardsTotal += 1;
      if (c.viewed_at == null) researchCardsUnread += 1;
    }
    const uni = PARTNER_UNIVERSITIES.find((u) => u.slug === c.slug);
    if (!uni) continue;
    for (const cc of uni.catchment) {
      const key = `${cc.city.toLowerCase()}|${cc.state}`;
      const list = providerByCityState.get(key) ?? [];
      for (const p of list) {
        if (isClientMeta(p.metadata, now)) continue;
        if (materializedPairs.has(`${p.id}|${c.id}`)) continue;
        providerProspectsTotal += 1;
        providerProspectsUnread += 1;
      }
    }
  }

  return {
    total: researchCardsTotal + providerProspectsTotal,
    unread: researchCardsUnread + providerProspectsUnread,
    researchCards: { total: researchCardsTotal, unread: researchCardsUnread },
    providerProspects: {
      total: providerProspectsTotal,
      unread: providerProspectsUnread,
    },
  };
}
