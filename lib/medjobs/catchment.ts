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

import {
  PARTNER_UNIVERSITIES,
  type PartnerUniversity,
} from "@/lib/staffing-outreach/partner-universities";
import { getServiceClient } from "@/lib/admin";
import { getClientStatus, type ProviderMetadata } from "@/lib/medjobs/clients";

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
 * All providers (organization or caregiver) in this campus's catchment.
 * Returns the raw business_profiles columns useful for both list views
 * and stage derivation.
 *
 * Note: matching is done by case-insensitive city + exact state. If
 * the markdown catchment file diverges from how providers store their
 * city/state, this is the seam to fix.
 */
export async function getProvidersInCatchment(slug: string) {
  const uni = getPartnerUniversity(slug);
  if (!uni) return [];

  const db = getServiceClient();
  // PostgREST .in() doesn't allow case-insensitive matching, so we
  // pull all providers in the catchment states and filter cities in JS.
  // For ~27 universities × hundreds of providers per state, this is
  // fine. Optimize when it bites.
  const states = Array.from(new Set(uni.catchment.map((c) => c.state)));
  const { data, error } = await db
    .from("business_profiles")
    .select("id, display_name, business_name, city, state, metadata, is_active, created_at")
    .in("type", ["organization", "caregiver"])
    .in("state", states);

  if (error) {
    console.error("[catchment] query error:", error);
    return [];
  }

  const cityKeys = new Set(
    uni.catchment.map((c) => `${c.city.toLowerCase()}|${c.state}`),
  );

  type Row = {
    id: string;
    display_name: string | null;
    business_name: string | null;
    city: string | null;
    state: string | null;
    metadata: ProviderMetadata | null;
    is_active: boolean;
    created_at: string;
  };
  return ((data ?? []) as Row[]).filter((p) => {
    if (!p.city || !p.state) return false;
    return cityKeys.has(`${p.city.toLowerCase()}|${p.state}`);
  });
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
