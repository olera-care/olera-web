import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { getCampaignLeadStatistics, isSmartleadConfigured } from "@/lib/smartlead";

/**
 * GET /api/admin/provider-outreach/claims-dashboard
 *
 * Returns claims-based metrics for the Email Performance section.
 *
 * Data sources:
 * - Claimed count: business_profiles.account_id (source of truth, matches header stat)
 * - Sequenced count: provider_outreach_tracking.sequence_started_at
 * - Timing data: provider_outreach_tracking.claimed_at (where available)
 * - Engagement: SmartLead API (cached 5 min)
 *
 * Note: The "When Providers Claim" breakdown only includes claims where we have
 * timing data (claimed_at is set). Older claims may lack this timestamp.
 *
 * Returns:
 *   - totals: { sequenced, claimed, conversion_rate, avg_time_to_claim_days }
 *   - sequence_day_breakdown: Claims bucketed by email day (Day 0, 3, 5, 7+)
 *   - engagement: Aggregate open/click stats from SmartLead (null if unavailable)
 */

interface ClaimsDashboardResponse {
  totals: {
    sequenced: number;
    claimed: number;
    conversion_rate: number;
    avg_time_to_claim_days: number | null;
  };
  sequence_day_breakdown: Array<{
    label: string;
    day_min: number;
    day_max: number | null;
    count: number;
    percentage: number;
  }>;
  engagement: {
    contacted: number;
    opened: number;
    open_rate: number;
    clicked: number;
    click_rate: number;
  } | null;
}

// In-memory cache for SmartLead engagement stats (expensive to fetch)
// TTL: 5 minutes - stats don't change frequently
const ENGAGEMENT_CACHE_TTL_MS = 5 * 60 * 1000;
let engagementCache: {
  data: ClaimsDashboardResponse["engagement"];
  timestamp: number;
} | null = null;

/**
 * Fetch and aggregate engagement stats from SmartLead API.
 * Uses parallel requests and caching for performance.
 */
async function fetchEngagementStats(
  campaignIds: Set<number>
): Promise<ClaimsDashboardResponse["engagement"]> {
  if (campaignIds.size === 0) return null;

  // Check cache first
  if (engagementCache && Date.now() - engagementCache.timestamp < ENGAGEMENT_CACHE_TTL_MS) {
    return engagementCache.data;
  }

  // Fetch all campaigns in parallel (much faster than sequential)
  const results = await Promise.all(
    Array.from(campaignIds).map((id) => getCampaignLeadStatistics(id))
  );

  // Aggregate stats across all campaigns
  let totalContacted = 0;
  let totalOpened = 0;
  let totalClicked = 0;

  for (const statsResult of results) {
    if (statsResult.ok && statsResult.data) {
      for (const lead of statsResult.data) {
        if (lead.sent_time) totalContacted++;
        if ((lead.open_count ?? 0) > 0) totalOpened++;
        if ((lead.click_count ?? 0) > 0) totalClicked++;
      }
    }
  }

  const engagement: ClaimsDashboardResponse["engagement"] =
    totalContacted > 0
      ? {
          contacted: totalContacted,
          opened: totalOpened,
          open_rate: Math.round((totalOpened / totalContacted) * 1000) / 10,
          clicked: totalClicked,
          click_rate: Math.round((totalClicked / totalContacted) * 1000) / 10,
        }
      : null;

  // Update cache
  engagementCache = { data: engagement, timestamp: Date.now() };

  return engagement;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const db = getServiceClient();

    // Query 1: Get all sequenced providers with their tracking data
    const { data: trackingRows, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, sequence_started_at, claimed_at, smartlead_data")
      .not("sequence_started_at", "is", null);

    if (trackingError) {
      console.error("[claims-dashboard] Tracking query error:", trackingError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Query 2: Get claimed providers from business_profiles (source of truth)
    // This matches the logic used by the header "SEQUENCE CONV." stat
    const { data: claimedBps, error: claimedError } = await db
      .from("business_profiles")
      .select("source_provider_id")
      .not("source_provider_id", "is", null)
      .not("account_id", "is", null);

    if (claimedError) {
      console.error("[claims-dashboard] Claimed query error:", claimedError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Build set of claimed provider IDs (from business_profiles)
    const claimedProviderIds = new Set(
      (claimedBps || []).map((bp) => bp.source_provider_id)
    );

    // Build map of sequence start times for claimed providers (for time calculations)
    const sequenceStartMap = new Map<string, Date>();
    for (const row of trackingRows || []) {
      sequenceStartMap.set(row.provider_id, new Date(row.sequence_started_at));
    }

    // Build map of claimed_at times (for time calculations, where available)
    const claimedAtMap = new Map<string, Date>();
    for (const row of trackingRows || []) {
      if (row.claimed_at) {
        claimedAtMap.set(row.provider_id, new Date(row.claimed_at));
      }
    }

    // Process tracking data: calculate metrics AND collect campaign IDs
    const claimsWithTiming: Array<{ daysSinceSequence: number }> = [];
    const campaignIds = new Set<number>();
    let sequencedCount = 0;
    let claimedCount = 0;

    for (const row of trackingRows || []) {
      sequencedCount++;

      // Collect campaign IDs for SmartLead stats
      if (row.smartlead_data) {
        const sd = row.smartlead_data as { campaign_id?: number };
        if (typeof sd.campaign_id === "number") {
          campaignIds.add(sd.campaign_id);
        }
      }

      // Check if this provider claimed (using business_profiles as source of truth)
      if (claimedProviderIds.has(row.provider_id)) {
        claimedCount++;

        // Calculate timing only if we have claimed_at (for day breakdown)
        const claimedAt = claimedAtMap.get(row.provider_id);
        if (claimedAt) {
          const sequenceStartedAt = new Date(row.sequence_started_at);
          const daysSinceSequence = Math.floor(
            (claimedAt.getTime() - sequenceStartedAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          claimsWithTiming.push({
            daysSinceSequence: Math.max(0, daysSinceSequence),
          });
        }
      }
    }

    // Calculate conversion rate
    const conversionRate =
      sequencedCount > 0
        ? Math.round((claimedCount / sequencedCount) * 1000) / 10
        : 0;

    // Calculate average time to claim (only for claims where we have timing data)
    let avgTimeToClaimDays: number | null = null;
    if (claimsWithTiming.length > 0) {
      const totalDays = claimsWithTiming.reduce((sum, c) => sum + c.daysSinceSequence, 0);
      avgTimeToClaimDays = Math.round((totalDays / claimsWithTiming.length) * 10) / 10;
    }

    // Calculate sequence day breakdown (only for claims where we have timing data)
    // Note: This may not sum to claimedCount if some claims lack claimed_at timestamps
    const dayBuckets = [
      { label: "Day 0", day_min: 0, day_max: 2 },
      { label: "Day 3", day_min: 3, day_max: 4 },
      { label: "Day 5", day_min: 5, day_max: 6 },
      { label: "Day 7+", day_min: 7, day_max: null },
    ];

    const claimsWithTimingCount = claimsWithTiming.length;
    const sequenceDayBreakdown = dayBuckets.map((bucket) => {
      const count = claimsWithTiming.filter((c) => {
        if (bucket.day_max === null) {
          return c.daysSinceSequence >= bucket.day_min;
        }
        return c.daysSinceSequence >= bucket.day_min && c.daysSinceSequence <= bucket.day_max;
      }).length;

      return {
        label: bucket.label,
        day_min: bucket.day_min,
        day_max: bucket.day_max,
        count,
        // Percentage is of claims WITH timing data, not total claims
        percentage: claimsWithTimingCount > 0 ? Math.round((count / claimsWithTimingCount) * 100) : 0,
      };
    });

    // Fetch engagement stats from SmartLead (cached + parallel)
    let engagement: ClaimsDashboardResponse["engagement"] = null;

    if (isSmartleadConfigured() && campaignIds.size > 0) {
      try {
        engagement = await fetchEngagementStats(campaignIds);
      } catch (err) {
        console.error("[claims-dashboard] SmartLead stats error:", err);
        // Continue without engagement stats - not a fatal error
      }
    }

    const response: ClaimsDashboardResponse = {
      totals: {
        sequenced: sequencedCount,
        claimed: claimedCount,
        conversion_rate: conversionRate,
        avg_time_to_claim_days: avgTimeToClaimDays,
      },
      sequence_day_breakdown: sequenceDayBreakdown,
      engagement,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[claims-dashboard] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
