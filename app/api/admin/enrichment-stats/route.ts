import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/enrichment-stats
 *
 * Returns aggregated email enrichment usage statistics across all providers.
 *
 * Useful for:
 * - Monitoring enrichment success rate
 * - Tracking Perplexity AI costs (~$0.008 per call)
 * - Understanding cache hit rate
 * - Identifying usage patterns
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const db = getServiceClient();

    // Fetch all providers with enrichment stats
    const { data: providers, error } = await db
      .from("business_profiles")
      .select("id, metadata")
      .not("metadata->email_enrichment_stats", "is", null);

    if (error) {
      console.error("[enrichment-stats] Query error:", error);
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }

    // Aggregate stats across all providers
    const aggregated = {
      total_attempts: 0,
      cache_hits: 0,
      cache_misses: 0,
      successful_finds: 0,
      scrape_count: 0,
      perplexity_count: 0,
      providers_enriched: providers?.length || 0,
    };

    for (const provider of providers || []) {
      const metadata = provider.metadata as Record<string, unknown>;
      const stats = metadata.email_enrichment_stats as Record<string, unknown>;

      if (stats) {
        aggregated.total_attempts += (stats.total_attempts as number) || 0;
        aggregated.cache_hits += (stats.cache_hits as number) || 0;
        aggregated.cache_misses += (stats.cache_misses as number) || 0;
        aggregated.successful_finds += (stats.successful_finds as number) || 0;
        aggregated.scrape_count += (stats.scrape_count as number) || 0;
        aggregated.perplexity_count += (stats.perplexity_count as number) || 0;
      }
    }

    // Calculate derived metrics
    const cache_hit_rate = aggregated.total_attempts > 0
      ? ((aggregated.cache_hits / aggregated.total_attempts) * 100).toFixed(1)
      : "0.0";

    const success_rate = aggregated.cache_misses > 0
      ? ((aggregated.successful_finds / aggregated.cache_misses) * 100).toFixed(1)
      : "0.0";

    const estimated_cost = aggregated.perplexity_count * 0.008;

    return NextResponse.json({
      ...aggregated,
      cache_hit_rate: `${cache_hit_rate}%`,
      success_rate: `${success_rate}%`,
      estimated_cost: `$${estimated_cost.toFixed(2)}`,
      cost_breakdown: {
        perplexity_calls: aggregated.perplexity_count,
        cost_per_call: "$0.008",
        total: `$${estimated_cost.toFixed(2)}`,
      },
    });
  } catch (e) {
    console.error("[enrichment-stats] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
