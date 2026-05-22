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
    .select("id, display_name, city, state, metadata, is_active, created_at")
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

  // Query olera-providers (the 75K+ provider directory)
  const { data, error } = await db
    .from("olera-providers")
    .select("provider_id, provider_name, city, state, email, website, phone, slug, created_at")
    .in("state", states)
    .or("deleted.is.null,deleted.eq.false");

  if (error) {
    console.error("[catchment] olera-providers query error:", error);
    return [];
  }

  const cityKeys = new Set(
    uni.catchment.map((c) => `${c.city.toLowerCase()}|${c.state}`),
  );

  type Row = {
    provider_id: string;
    provider_name: string | null;
    city: string | null;
    state: string | null;
    email: string | null;
    website: string | null;
    phone: string | null;
    slug: string | null;
    created_at: string | null;
  };

  // Map to the shape expected by provider-prospects endpoint
  return ((data ?? []) as Row[])
    .filter((p) => {
      if (!p.city || !p.state) return false;
      return cityKeys.has(`${p.city.toLowerCase()}|${p.state}`);
    })
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
      created_at: p.created_at ?? new Date().toISOString(),
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
