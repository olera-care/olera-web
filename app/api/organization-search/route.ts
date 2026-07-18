import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { searchProviders } from "@/lib/providers";

/**
 * GET /api/organization-search
 *
 * Union search across `olera-providers` (scraped/seeded) and `business_profiles`
 * (user accounts/claims), deduplicated by canonical identity (source_provider_id).
 * The search itself lives behind the provider front door (`lib/providers`); this
 * route is a thin HTTP wrapper.
 *
 * Query params:
 *   - q: search query (required, min 2 chars)
 *   - limit: max final results (default 100, max 200)
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
    const { results, total } = await searchProviders(query, { limit }, db);

    return NextResponse.json({ results, total });
  } catch (err) {
    console.error("[organization-search] Error:", err);
    return NextResponse.json(
      { error: "Failed to search organizations" },
      { status: 500 }
    );
  }
}
