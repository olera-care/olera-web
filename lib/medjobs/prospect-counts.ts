/**
 * Per-campus prospect generation counts. Mirrors the UI semantics:
 *   - Provider Prospects sub-section = non-medical home care providers
 *     (olera-providers directory — the SAME source as the prospect list
 *     endpoint) in catchment that are not yet materialized as
 *     kind='provider' rows in student_outreach.
 *   - Partner Prospects research card = each active campus where
 *     research_complete=false AND the Partner Prospect gate is
 *     unlocked (≥1 client provider in catchment, sticky once set).
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
 *
 * v9.0 Phase 8: the research-card count is gated by
 * resolvePartnerProspectUnlocks so badges match the queue endpoint's
 * fetchResearchCampuses. Sites with research_complete=false but
 * partner_prospect_unlocked_at IS NULL contribute zero research cards
 * to the count.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";
import { resolvePartnerProspectUnlocks } from "@/lib/medjobs/partner-prospect-gate";
import { fetchNonMedicalProviders } from "@/lib/medjobs/catchment";

interface CampusLite {
  id: string;
  slug: string;
  viewed_at: string | null;
  research_complete: boolean;
  partner_prospect_unlocked_at: string | null;
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

export async function countProspectGeneration(
  db: SupabaseClient,
  options: { campusId?: string | null } = {},
): Promise<ProspectGeneration> {
  let campusQuery = db
    .from("student_outreach_campuses")
    .select("id, slug, viewed_at, research_complete, partner_prospect_unlocked_at")
    .eq("is_active", true);
  if (options.campusId) campusQuery = (campusQuery as any).eq("id", options.campusId);
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

  // Two data sources, two jobs:
  //   - business_profiles (account-holders) → the client-unlock gate
  //     for research cards. Clients are account-holders, not directory
  //     rows, so this MUST stay on business_profiles.
  //   - olera-providers (the 75K directory, non-medical only) → the
  //     Provider Prospect count. This is the SAME source the prospect
  //     LIST endpoint uses (getProviderProspectsInCatchment), so the
  //     count and the list finally agree.
  // States to scope the directory fetch — only the active campuses'
  // catchment states. Keeps the read small and below the row cap.
  const neededStates = Array.from(
    new Set(
      campuses.flatMap((c) => {
        const uni = PARTNER_UNIVERSITIES.find((u) => u.slug === c.slug);
        return uni ? uni.catchment.map((cc) => cc.state) : [];
      }),
    ),
  );

  const [{ data: clientData }, oleraData, { data: materializedData }] =
    await Promise.all([
      db
        .from("business_profiles")
        .select("id, city, state, metadata")
        .in("type", ["organization", "caregiver"]),
      fetchNonMedicalProviders<{
        provider_id: string;
        city: string | null;
        state: string | null;
      }>(db, "provider_id, city, state", neededStates),
      db
        .from("student_outreach")
        .select("provider_business_profile_id, campus_id, research_data")
        .eq("kind", "provider"),
    ]);

  // Index the directory by city|state for the prospect count.
  const oleraByCityState = new Map<string, Array<{ id: string }>>();
  for (const p of oleraData) {
    if (!p.city || !p.state) continue;
    const key = `${p.city.toLowerCase()}|${p.state}`;
    if (!oleraByCityState.has(key)) oleraByCityState.set(key, []);
    oleraByCityState.get(key)!.push({ id: p.provider_id });
  }

  // Resolve unlock state for the research-card gate. Side effect:
  // persists newly-unlocked timestamps. Shared with queue/route.ts.
  const { unlockedCampusIds } = await resolvePartnerProspectUnlocks(
    db,
    campuses,
    (clientData ?? []) as ProviderLite[],
  );

  const materializedPairs = new Set<string>();
  for (const r of (materializedData ?? []) as Array<{
    provider_business_profile_id: string | null;
    campus_id: string;
    research_data: { olera_provider_id?: string } | null;
  }>) {
    // Support both legacy (provider_business_profile_id) and new (olera_provider_id)
    if (r.provider_business_profile_id) {
      materializedPairs.add(`${r.provider_business_profile_id}|${r.campus_id}`);
    }
    if (r.research_data?.olera_provider_id) {
      materializedPairs.add(`${r.research_data.olera_provider_id}|${r.campus_id}`);
    }
  }

  let researchCardsTotal = 0;
  let researchCardsUnread = 0;
  let providerProspectsTotal = 0;
  let providerProspectsUnread = 0;

  for (const c of campuses) {
    // Research card contributes only when unlocked AND not dismissed.
    // Gating here keeps the badge in lock-step with the queue
    // endpoint's fetchResearchCampuses output.
    if (!c.research_complete && unlockedCampusIds.has(c.id)) {
      researchCardsTotal += 1;
      if (c.viewed_at == null) researchCardsUnread += 1;
    }
    const uni = PARTNER_UNIVERSITIES.find((u) => u.slug === c.slug);
    if (!uni) continue;
    for (const cc of uni.catchment) {
      const key = `${cc.city.toLowerCase()}|${cc.state}`;
      const list = oleraByCityState.get(key) ?? [];
      for (const p of list) {
        // Mirror the LIST endpoint: exclude only already-materialized
        // rows. Directory rows carry no client metadata, so there's no
        // client exclusion here (clients are gated separately above).
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
