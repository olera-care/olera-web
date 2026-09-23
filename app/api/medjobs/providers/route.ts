/**
 * GET /api/medjobs/providers?campus=<slug>&scope=<near|all>
 *
 * Returns MedJobs-interested providers for the student Find Jobs board.
 * Unlike the families endpoint (which shows all non-medical providers),
 * this returns only providers who have explicitly indicated MedJobs interest:
 *
 * 1. Accepted interview terms (interview_terms_accepted_at in metadata)
 * 2. Completed MedJobs eligibility (medjobs_eligibility_completed_at in metadata)
 * 3. Enrolled/activated via staffing outreach
 *
 * Parameters:
 * - `campus` — Student's campus slug (for "Near You" catchment scoping)
 * - `scope` — `near` (default) = catchment only, `all` = nationwide
 *
 * Response: { cards: ProviderCard[], total: number, pageSize: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getServiceClient } from "@/lib/admin";
import { getPartnerUniversity } from "@/lib/medjobs/catchment";
import { LIVE_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";
import {
  businessProfileToCardFormat,
  type ProviderCardData,
} from "@/lib/types/provider";
import type { BusinessProfile } from "@/lib/types";
import { readOpportunityProfile, type OpportunityProfile } from "@/lib/medjobs/opportunity";

export type ProviderCard = ProviderCardData & {
  isProgram: boolean;
  createdAt?: string | null;
  opportunity?: OpportunityProfile;
};

const PAGE_SIZE = 12;

/**
 * Build the list of MedJobs-interested providers.
 * Cached per campus+scope for 5 minutes.
 */
function getMedjobsProviders(campus: string, scope: "near" | "all"): Promise<ProviderCard[]> {
  return unstable_cache(
    async (): Promise<ProviderCard[]> => {
      const db = getServiceClient();

      // Determine catchment filter
      let catchmentFilter: { cities: Set<string>; states: string[] } | null = null;

      if (scope === "near") {
        const single = campus ? getPartnerUniversity(campus) : null;
        const unis = campus ? (single ? [single] : []) : LIVE_UNIVERSITIES;
        if (unis.length === 0) return [];

        const catchment = unis.flatMap((u) => u.catchment);
        const states = Array.from(new Set(catchment.map((c) => c.state)));
        const cityKeys = new Set(catchment.map((c) => `${c.city.toLowerCase()}|${c.state}`));

        catchmentFilter = { cities: cityKeys, states };
      }

      // First, get providers enrolled/activated via staffing_outreach
      const { data: outreachRows } = await db
        .from("staffing_outreach")
        .select("provider_id")
        .in("status", ["enrolled", "activated"]);

      const outreachProviderIds = new Set<string>(
        (outreachRows ?? []).map((r) => r.provider_id as string)
      );

      // Query business_profiles for MedJobs-interested providers
      let query = db
        .from("business_profiles")
        .select(
          "id, slug, display_name, city, state, category, image_url, description, care_types, metadata, claim_state, lat, lng, created_at"
        )
        .in("type", ["organization", "caregiver"])
        .eq("is_active", true);

      // Apply state filter if scoped to catchment
      if (catchmentFilter) {
        query = query.in("state", catchmentFilter.states);
      }

      const { data: bpRows } = await query;

      const inCatchment = (city: string | null, state: string | null) => {
        if (!catchmentFilter) return true; // "all" scope
        return !!city && !!state && catchmentFilter.cities.has(`${city.toLowerCase()}|${state}`);
      };

      const cards: ProviderCard[] = [];

      for (const row of (bpRows ?? []) as unknown as (BusinessProfile & { created_at?: string })[]) {
        // Check catchment filter
        if (!inCatchment(row.city, row.state)) continue;

        const meta = (row.metadata ?? {}) as Record<string, unknown>;

        // Check MedJobs interest indicators
        const hasAcceptedTerms = typeof meta.interview_terms_accepted_at === "string";
        const hasCompletedEligibility = typeof meta.medjobs_eligibility_completed_at === "string";
        const sourceProviderId = typeof meta.source_provider_id === "string" ? meta.source_provider_id : null;

        // Check if enrolled via staffing outreach (match by source_provider_id only)
        // Note: staffing_outreach.provider_id references olera-providers.provider_id,
        // NOT business_profiles.id. The link is via metadata.source_provider_id.
        const isEnrolledViaOutreach = !!sourceProviderId && outreachProviderIds.has(sourceProviderId);

        // Skip if no MedJobs interest
        if (!hasAcceptedTerms && !hasCompletedEligibility && !isEnrolledViaOutreach) {
          continue;
        }

        const card = businessProfileToCardFormat(row) as ProviderCard;
        card.isProgram = row.claim_state === "claimed";
        card.createdAt = row.created_at ?? null;
        card.opportunity = readOpportunityProfile(meta);
        cards.push(card);
      }

      return cards;
    },
    [`medjobs-providers-${campus || "all"}-${scope}`],
    { revalidate: 300 }
  )();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus")?.trim() || "";
    const scope = searchParams.get("scope") === "all" ? "all" : "near";

    // Validate campus if provided and scope is "near"
    if (campus && scope === "near" && !getPartnerUniversity(campus)) {
      return NextResponse.json({ cards: [], total: 0, pageSize: PAGE_SIZE });
    }

    const unsorted = await getMedjobsProviders(campus, scope);

    // Sort by newest first
    const all = [...unsorted].sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });

    // Cap at 200 results
    const cards = all.slice(0, 200);

    return NextResponse.json({ cards, total: all.length, pageSize: PAGE_SIZE });
  } catch (err) {
    console.error("[medjobs/providers] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
