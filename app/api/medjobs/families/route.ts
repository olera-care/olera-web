/**
 * GET /api/medjobs/families?campus=<slug>&city=<name>&page=<n>
 *
 * The catchment-scoped feed behind the public student families board. Returns
 * real providers (non-medical home-care directory rows + claimed program
 * agencies) in a campus's catchment, as ProviderCardData for BrowseCard's
 * student variant. Mirrors how the directory builds cards (toCardFormat +
 * businessProfileToCardFormat + dedupe), scoped to the campus catchment via
 * lib/medjobs/catchment.ts.
 *
 * `campus` is a PARTNER_UNIVERSITY slug (the catchment key). No campus → empty
 * feed (the page shows demo cards). `isProgram` marks claimed program agencies.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { getPartnerUniversity, fetchNonMedicalProviders } from "@/lib/medjobs/catchment";
import {
  toCardFormat,
  businessProfileToCardFormat,
  type ProviderCardData,
  type Provider,
} from "@/lib/types/provider";
import type { BusinessProfile } from "@/lib/types";

export type FamilyCard = ProviderCardData & { isProgram: boolean };

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus")?.trim() || "";
    const cityFilter = searchParams.get("city")?.trim().toLowerCase() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const uni = campus ? getPartnerUniversity(campus) : null;
    if (!uni) {
      return NextResponse.json({ cards: [], total: 0, page, pageSize: PAGE_SIZE, cities: [] });
    }

    const db = getServiceClient();
    const states = Array.from(new Set(uni.catchment.map((c) => c.state)));

    // City keys for catchment membership (city|state), optionally narrowed to
    // the selected city filter.
    const catchmentCities = uni.catchment.filter(
      (c) => !cityFilter || c.city.toLowerCase() === cityFilter,
    );
    const cityKeys = new Set(catchmentCities.map((c) => `${c.city.toLowerCase()}|${c.state}`));
    const inCatchment = (city: string | null, state: string | null) =>
      !!city && !!state && cityKeys.has(`${city.toLowerCase()}|${state}`);

    // ── Program agencies (claimed business_profiles) in catchment ──
    const { data: bpRows } = await db
      .from("business_profiles")
      .select(
        "id, slug, display_name, city, state, category, image_url, description, care_types, metadata, claim_state, lat, lng",
      )
      .in("type", ["organization", "caregiver"])
      .eq("is_active", true)
      .in("state", states);

    const programCards: FamilyCard[] = [];
    const programSlugs = new Set<string>();
    for (const row of (bpRows ?? []) as unknown as BusinessProfile[]) {
      if (!inCatchment(row.city, row.state)) continue;
      const card = businessProfileToCardFormat(row) as FamilyCard;
      card.isProgram = true;
      programCards.push(card);
      if (card.slug) programSlugs.add(card.slug);
    }

    // ── Directory providers (non-medical home care) in catchment ──
    const dirRows = await fetchNonMedicalProviders<Provider>(db, "*", states);
    const directoryCards: FamilyCard[] = [];
    for (const row of dirRows) {
      if (!inCatchment(row.city, row.state)) continue;
      const card = toCardFormat(row) as FamilyCard;
      card.isProgram = false;
      // Claimed program agency overrides its directory row.
      if (programSlugs.has(card.slug)) continue;
      directoryCards.push(card);
    }

    // Program agencies first, then the rest of the directory.
    const all = [...programCards, ...directoryCards];
    const total = all.length;
    const from = (page - 1) * PAGE_SIZE;
    const cards = all.slice(from, from + PAGE_SIZE);

    // Distinct catchment cities for the city filter.
    const cities = Array.from(new Set(uni.catchment.map((c) => c.city))).sort();

    return NextResponse.json({ cards, total, page, pageSize: PAGE_SIZE, cities });
  } catch (err) {
    console.error("[medjobs/families] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
