import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/claims-dashboard
 *
 * Returns claims-based metrics for the Email Performance section.
 * All data sourced from provider_outreach_tracking (100% accurate).
 *
 * Data flow:
 * 1. Provider enters sequence → sequence_started_at is set
 * 2. Provider clicks magic link → business_profiles.account_id is set
 * 3. Database trigger sets provider_outreach_tracking.claimed_at = now()
 *
 * Returns:
 *   - totals: { sequenced, claimed, conversion_rate, avg_time_to_claim_days }
 *   - sequence_day_breakdown: Claims bucketed by email day (Day 0, 3, 5, 7+)
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

    // Query provider_outreach_tracking for both sequenced and claimed data
    // - sequence_started_at: when they entered the email sequence
    // - claimed_at: when they clicked magic link and claimed (set by database trigger)
    const { data: trackingRows, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, sequence_started_at, claimed_at")
      .not("sequence_started_at", "is", null);

    if (trackingError) {
      console.error("[claims-dashboard] Tracking query error:", trackingError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Calculate metrics from tracking data
    const claimsFromSequence: Array<{ daysSinceSequence: number }> = [];
    let sequencedCount = 0;

    for (const row of trackingRows || []) {
      sequencedCount++;

      // Only count as claimed if claimed_at is set (trigger sets this on claim)
      if (row.claimed_at) {
        const sequenceStartedAt = new Date(row.sequence_started_at);
        const claimedAt = new Date(row.claimed_at);
        const daysSinceSequence = Math.floor(
          (claimedAt.getTime() - sequenceStartedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        claimsFromSequence.push({
          daysSinceSequence: Math.max(0, daysSinceSequence), // Ensure non-negative
        });
      }
    }

    const claimedCount = claimsFromSequence.length;

    // Calculate conversion rate
    const conversionRate = sequencedCount > 0
      ? Math.round((claimedCount / sequencedCount) * 1000) / 10
      : 0;

    // Calculate average time to claim
    let avgTimeToClaimDays: number | null = null;
    if (claimsFromSequence.length > 0) {
      const totalDays = claimsFromSequence.reduce((sum, c) => sum + c.daysSinceSequence, 0);
      avgTimeToClaimDays = Math.round((totalDays / claimsFromSequence.length) * 10) / 10;
    }

    // Calculate sequence day breakdown
    // Buckets: Day 0-2 (before Day 3 email), Day 3-4, Day 5-6, Day 7+
    const dayBuckets = [
      { label: "Day 0", day_min: 0, day_max: 2 },
      { label: "Day 3", day_min: 3, day_max: 4 },
      { label: "Day 5", day_min: 5, day_max: 6 },
      { label: "Day 7+", day_min: 7, day_max: null },
    ];

    const sequenceDayBreakdown = dayBuckets.map((bucket) => {
      const count = claimsFromSequence.filter((c) => {
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
        percentage: claimedCount > 0 ? Math.round((count / claimedCount) * 100) : 0,
      };
    });

    const response: ClaimsDashboardResponse = {
      totals: {
        sequenced: sequencedCount,
        claimed: claimedCount,
        conversion_rate: conversionRate,
        avg_time_to_claim_days: avgTimeToClaimDays,
      },
      sequence_day_breakdown: sequenceDayBreakdown,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[claims-dashboard] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
