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
 *   - limit: max results per table (default 200, max 500)
 *
 * Search logic:
 *   - Single word: matches name OR city containing that word
 *   - Multi-word (e.g., "Home Instead Houston"): matches name containing first words
 *     AND city containing last word (for franchise + city searches)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "200", 10)));

    if (query.length < 2) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const db = getServiceClient();

    // Split query into words for smarter matching
    const words = query.split(/\s+/).filter(w => w.length > 0);

    // Build search patterns
    // For multi-word queries like "Home Instead Houston":
    // - Try to match name containing the business name portion
    // - AND city containing the location portion (last word)
    const isMultiWord = words.length > 1;
    const lastWord = words[words.length - 1];
    const nameWords = isMultiWord ? words.slice(0, -1).join(" ") : query;

    // Use * for wildcards in PostgREST .or() string syntax
    const fullPattern = `*${query}*`;
    const namePattern = `*${nameWords}*`;
    const cityPattern = `*${lastWord}*`;

    // Search both tables in parallel
    const [bpResult, opResult, bpCityResult, opCityResult] = await Promise.all([
      // Search 1: Full phrase match in name OR city (original behavior)
      db
        .from("business_profiles")
        .select("id, display_name, slug, city, state, email, claim_state, source_provider_id, image_url")
        .in("type", ["organization", "caregiver"])
        .or(`display_name.ilike.${fullPattern},city.ilike.${fullPattern}`)
        .order("display_name", { ascending: true })
        .limit(limit),

      db
        .from("olera-providers")
        .select("provider_id, provider_name, slug, city, state, email, hero_image_url, provider_images")
        .not("deleted", "is", true)
        .or(`provider_name.ilike.${fullPattern},city.ilike.${fullPattern}`)
        .order("provider_name", { ascending: true })
        .limit(limit),

      // Search 2: For multi-word queries, also try name + city combination
      // e.g., "Home Instead Houston" → name LIKE '%Home Instead%' AND city LIKE '%Houston%'
      isMultiWord
        ? db
            .from("business_profiles")
            .select("id, display_name, slug, city, state, email, claim_state, source_provider_id, image_url")
            .in("type", ["organization", "caregiver"])
            .ilike("display_name", `%${nameWords}%`)
            .ilike("city", `%${lastWord}%`)
            .order("display_name", { ascending: true })
            .limit(limit)
        : Promise.resolve({ data: [], error: null }),

      isMultiWord
        ? db
            .from("olera-providers")
            .select("provider_id, provider_name, slug, city, state, email, hero_image_url, provider_images")
            .not("deleted", "is", true)
            .ilike("provider_name", `%${nameWords}%`)
            .ilike("city", `%${lastWord}%`)
            .order("provider_name", { ascending: true })
            .limit(limit)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (bpResult.error) {
      console.error("[organization-search] business_profiles error:", bpResult.error);
    }
    if (opResult.error) {
      console.error("[organization-search] olera-providers error:", opResult.error);
    }
    if (bpCityResult.error) {
      console.error("[organization-search] business_profiles city error:", bpCityResult.error);
    }
    if (opCityResult.error) {
      console.error("[organization-search] olera-providers city error:", opCityResult.error);
    }

    // Combine results from both search strategies
    const bpResults = [...(bpResult.data || []), ...(bpCityResult.data || [])];
    const opResults = [...(opResult.data || []), ...(opCityResult.data || [])];

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
