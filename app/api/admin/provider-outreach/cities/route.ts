import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/cities
 *
 * Returns cities with unclaimed provider counts for a given state.
 * A provider is "unclaimed" if:
 *   - Not deleted
 *   - Not linked to a business_profile with account_id
 *   - Not in provider_outreach_tracking OR stage = 'not_contacted'
 *
 * Query params:
 *   - state (required): State to filter by (e.g., "TX", "CA")
 *
 * Returns:
 *   - cities: Array of { city, total, has_email, needs_email, in_sequence, claimed_from_sequence }
 *   - in_sequence: Providers with sequence_started_at IS NOT NULL (ever entered sequence)
 *   - claimed_from_sequence: Providers that claimed AND were in sequence
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    if (!state) {
      return NextResponse.json({ error: "State parameter is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Get all providers in this state that are not deleted
    const { data: providers, error: provError } = await db
      .from("olera-providers")
      .select("provider_id, city, email")
      .eq("state", state)
      .or("deleted.is.null,deleted.eq.false");

    if (provError) {
      console.error("[provider-outreach/cities] Provider query error:", provError);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    if (!providers || providers.length === 0) {
      return NextResponse.json({ cities: [] });
    }

    const providerIds = providers.map((p) => p.provider_id);

    // Get providers that are already claimed (have business_profile with account_id)
    const { data: claimedBps } = await db
      .from("business_profiles")
      .select("source_provider_id")
      .in("source_provider_id", providerIds)
      .not("account_id", "is", null);

    const claimedProviderIds = new Set((claimedBps || []).map((bp) => bp.source_provider_id));

    // Get providers already in tracking table with non-not_contacted stage
    const { data: trackedProviders } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, stage")
      .in("provider_id", providerIds)
      .neq("stage", "not_contacted");

    const trackedProviderIds = new Set((trackedProviders || []).map((t) => t.provider_id));

    // Get all providers that have ever been in sequence (sequence_started_at IS NOT NULL)
    // This is cumulative - once a provider enters sequence, they count forever
    const { data: sequencedProviders } = await db
      .from("provider_outreach_tracking")
      .select("provider_id")
      .in("provider_id", providerIds)
      .not("sequence_started_at", "is", null);

    const sequencedProviderIds = new Set((sequencedProviders || []).map((t) => t.provider_id));

    // Find which sequenced providers have claimed (business_profile with account_id)
    const claimedFromSequenceIds = new Set(
      Array.from(sequencedProviderIds).filter((id) => claimedProviderIds.has(id))
    );

    // Filter to unclaimed, not-tracked providers
    const unclaimedProviders = providers.filter(
      (p) => !claimedProviderIds.has(p.provider_id) && !trackedProviderIds.has(p.provider_id)
    );

    // Group by city (for unclaimed providers)
    const cityMap = new Map<string, { total: number; has_email: number; needs_email: number }>();

    for (const p of unclaimedProviders) {
      const city = p.city || "(No City)";
      const stats = cityMap.get(city) || { total: 0, has_email: 0, needs_email: 0 };
      stats.total++;
      if (p.email && p.email.trim()) {
        stats.has_email++;
      } else {
        stats.needs_email++;
      }
      cityMap.set(city, stats);
    }

    // Compute in_sequence and claimed_from_sequence per city
    // This uses ALL providers (not just unclaimed) to show cumulative conversion
    const sequenceStatsMap = new Map<string, { in_sequence: number; claimed_from_sequence: number }>();

    for (const p of providers) {
      const city = p.city || "(No City)";
      const stats = sequenceStatsMap.get(city) || { in_sequence: 0, claimed_from_sequence: 0 };

      if (sequencedProviderIds.has(p.provider_id)) {
        stats.in_sequence++;
        if (claimedFromSequenceIds.has(p.provider_id)) {
          stats.claimed_from_sequence++;
        }
      }

      sequenceStatsMap.set(city, stats);
    }

    // Convert to array and merge sequence stats, sort by total descending
    const cities = Array.from(cityMap.entries())
      .map(([city, stats]) => {
        const seqStats = sequenceStatsMap.get(city) || { in_sequence: 0, claimed_from_sequence: 0 };
        return {
          city,
          ...stats,
          in_sequence: seqStats.in_sequence,
          claimed_from_sequence: seqStats.claimed_from_sequence,
        };
      })
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({ cities, total_unclaimed: unclaimedProviders.length });
  } catch (err) {
    console.error("[provider-outreach/cities] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
