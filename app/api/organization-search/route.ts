import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * GET /api/organization-search
 *
 * Search organizations across business_profiles and olera-providers tables.
 * Used by OrganizationSearch component for provider onboarding, claiming, etc.
 *
 * Query params:
 *   - q: search query (required, min 2 chars)
 *   - limit: max results per table (default 100, max 200)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));

    if (query.length < 2) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const db = getServiceClient();
    // Use * for wildcards in PostgREST .or() string syntax (not % which is literal)
    const searchPattern = `*${query}*`;

    // Search both tables in parallel
    const [bpResult, opResult] = await Promise.all([
      // Search business_profiles (organizations and caregivers)
      db
        .from("business_profiles")
        .select("id, display_name, slug, city, state, email, claim_state, source_provider_id, image_url")
        .in("type", ["organization", "caregiver"])
        .or(`display_name.ilike.${searchPattern},city.ilike.${searchPattern}`)
        .order("display_name", { ascending: true })
        .limit(limit),

      // Search olera-providers
      db
        .from("olera-providers")
        .select("provider_id, provider_name, slug, city, state, email, hero_image_url, provider_images")
        .not("deleted", "is", true)
        .or(`provider_name.ilike.${searchPattern},city.ilike.${searchPattern}`)
        .order("provider_name", { ascending: true })
        .limit(limit),
    ]);

    if (bpResult.error) {
      console.error("[organization-search] business_profiles error:", bpResult.error);
    }
    if (opResult.error) {
      console.error("[organization-search] olera-providers error:", opResult.error);
    }

    const bpResults = bpResult.data || [];
    const opResults = opResult.data || [];

    // Get claim states for olera-providers by checking linked business_profiles
    const opProviderIds = opResults.map((op) => op.provider_id);
    let claimStatesMap: Record<string, string | null> = {};

    if (opProviderIds.length > 0) {
      const { data: linkedBps } = await db
        .from("business_profiles")
        .select("source_provider_id, claim_state")
        .in("source_provider_id", opProviderIds);

      if (linkedBps) {
        claimStatesMap = linkedBps.reduce(
          (acc, bp) => {
            if (bp.source_provider_id) {
              acc[bp.source_provider_id] = bp.claim_state;
            }
            return acc;
          },
          {} as Record<string, string | null>
        );
      }
    }

    // Merge and deduplicate results
    interface SearchResult {
      id: string;
      name: string;
      slug: string;
      city: string | null;
      state: string | null;
      email: string | null;
      claimState: "unclaimed" | "pending" | "claimed" | null;
      source: "business_profiles" | "olera-providers";
      providerId: string;
      imageUrl: string | null;
    }

    const merged: SearchResult[] = [];
    const seenIds = new Set<string>();

    // Add business_profiles results first (they may be more authoritative)
    for (const bp of bpResults) {
      const slug = bp.slug || bp.id;
      if (!seenIds.has(bp.id)) {
        seenIds.add(bp.id);
        merged.push({
          id: bp.id,
          name: bp.display_name,
          slug,
          city: bp.city,
          state: bp.state,
          email: bp.email,
          claimState: bp.claim_state as SearchResult["claimState"],
          source: "business_profiles",
          providerId: bp.source_provider_id || bp.id,
          imageUrl: bp.image_url || null,
        });
      }
    }

    // Add olera-providers results (skip if already have BP with same source_provider_id)
    for (const op of opResults) {
      const slug = op.slug || op.provider_id;
      // Skip if we already have a business_profile linked to this provider
      const alreadyHasBp = bpResults.some(
        (bp) => bp.source_provider_id === op.provider_id
      );
      if (!alreadyHasBp && !seenIds.has(op.provider_id)) {
        seenIds.add(op.provider_id);
        // Get first image from pipe-separated list
        const firstImage = op.provider_images?.split("|")[0]?.trim() || null;
        merged.push({
          id: op.provider_id,
          name: op.provider_name,
          slug,
          city: op.city,
          state: op.state,
          email: op.email,
          claimState: (claimStatesMap[op.provider_id] as SearchResult["claimState"]) || null,
          source: "olera-providers",
          providerId: op.provider_id,
          imageUrl: op.hero_image_url || firstImage,
        });
      }
    }

    // Sort merged results alphabetically by name
    merged.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      results: merged,
      total: merged.length,
    });
  } catch (err) {
    console.error("[organization-search] Error:", err);
    return NextResponse.json(
      { error: "Failed to search organizations" },
      { status: 500 }
    );
  }
}
