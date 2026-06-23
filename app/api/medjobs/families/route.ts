/**
 * GET /api/medjobs/families?campus=<slug>&sort=<newest|oldest>&page=<n>
 *
 * The catchment-scoped feed behind the public student families board. Returns
 * real providers (non-medical home-care directory rows + claimed program
 * agencies) in a campus's catchment, as ProviderCardData for BrowseCard's
 * student variant. Scoped to the campus catchment via lib/medjobs/catchment.ts.
 *
 * The full catchment card list is built once per campus and cached (5 min) so
 * pagination and sort changes slice the cached list instead of re-scanning the
 * whole state's non-medical directory on every request.
 *
 * `campus` is a PARTNER_UNIVERSITY slug. No campus → empty feed (page shows
 * demo cards). `isProgram` marks claimed program agencies.
 */

import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getServiceClient } from "@/lib/admin";
import { getPartnerUniversity, fetchNonMedicalProviders } from "@/lib/medjobs/catchment";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";
import {
  toCardFormat,
  businessProfileToCardFormat,
  type ProviderCardData,
  type Provider,
} from "@/lib/types/provider";
import type { BusinessProfile } from "@/lib/types";
import { readOpportunityProfile, type OpportunityProfile } from "@/lib/medjobs/opportunity";

export type FamilyCard = ProviderCardData & {
  isProgram: boolean;
  createdAt?: string | null;
  /** Persisted "Your ideal caregiver" fields, when the claimed provider set them. */
  opportunity?: OpportunityProfile;
};

const PAGE_SIZE = 12;

/**
 * Build the full (unsorted) catchment card list for a campus — the expensive
 * part (a full-state non-medical scan + dedupe). Cached per campus so it runs
 * at most once per window regardless of page/sort.
 */
function getCatchmentCards(campus: string): Promise<FamilyCard[]> {
  return unstable_cache(
    async (): Promise<FamilyCard[]> => {
      // No campus → ALL: the union of every partner-university catchment.
      const single = campus ? getPartnerUniversity(campus) : null;
      const unis = campus ? (single ? [single] : []) : PARTNER_UNIVERSITIES;
      if (unis.length === 0) return [];
      const catchment = unis.flatMap((u) => u.catchment);

      const db = getServiceClient();
      const states = Array.from(new Set(catchment.map((c) => c.state)));
      const cityKeys = new Set(catchment.map((c) => `${c.city.toLowerCase()}|${c.state}`));
      const inCatchment = (city: string | null, state: string | null) =>
        !!city && !!state && cityKeys.has(`${city.toLowerCase()}|${state}`);

      // Program agencies (claimed business_profiles) in catchment.
      const { data: bpRows } = await db
        .from("business_profiles")
        .select(
          "id, slug, display_name, city, state, category, image_url, description, care_types, metadata, claim_state, lat, lng, created_at",
        )
        .in("type", ["organization", "caregiver"])
        .eq("is_active", true)
        .in("state", states);

      const programCards: FamilyCard[] = [];
      const programSlugs = new Set<string>();
      const programSourceIds = new Set<string>();
      for (const row of (bpRows ?? []) as unknown as (BusinessProfile & { created_at?: string })[]) {
        if (!inCatchment(row.city, row.state)) continue;
        const card = businessProfileToCardFormat(row) as FamilyCard;
        card.isProgram = true;
        card.createdAt = row.created_at ?? null;
        card.opportunity = readOpportunityProfile(row.metadata as unknown as Record<string, unknown> | null);
        programCards.push(card);
        if (card.slug) programSlugs.add(card.slug);
        const src = (row.metadata as Record<string, unknown> | null)?.source_provider_id;
        if (typeof src === "string") programSourceIds.add(src);
      }

      // Directory providers (non-medical home care) in catchment.
      const dirRows = await fetchNonMedicalProviders<Provider & { created_at?: string }>(db, "*", states);
      const directoryCards: FamilyCard[] = [];
      for (const row of dirRows) {
        if (!inCatchment(row.city, row.state)) continue;
        // A claimed program agency overrides its directory row — match by
        // source_provider_id first, then by slug.
        if (programSourceIds.has((row as { provider_id: string }).provider_id)) continue;
        const card = toCardFormat(row) as FamilyCard;
        if (programSlugs.has(card.slug)) continue;
        card.isProgram = false;
        card.createdAt = row.created_at ?? null;
        directoryCards.push(card);
      }

      return [...programCards, ...directoryCards];
    },
    [`medjobs-families-${campus || "all"}`],
    { revalidate: 300 },
  )();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus")?.trim() || "";
    const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";

    // Invalid campus → empty; empty campus → all providers (union of catchments).
    if (campus && !getPartnerUniversity(campus)) {
      return NextResponse.json({ cards: [], total: 0, pageSize: PAGE_SIZE });
    }

    const unsorted = await getCatchmentCards(campus);
    const all = [...unsorted].sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return sort === "oldest" ? ta - tb : tb - ta;
    });

    // Return the full catchment (capped) so the board can Top-sort, care-filter,
    // and paginate client-side.
    const cards = all.slice(0, 200);

    return NextResponse.json({ cards, total: all.length, pageSize: PAGE_SIZE });
  } catch (err) {
    console.error("[medjobs/families] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
