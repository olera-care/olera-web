import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/claims-dashboard
 *
 * Returns claims-based metrics for the Email Performance section.
 * All data sourced from our database (100% accurate, no SmartLead dependency).
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

    // 1. Get all providers who entered the sequence (sequence_started_at is set)
    const { data: sequencedRows, error: seqError } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, sequence_started_at")
      .not("sequence_started_at", "is", null);

    if (seqError) {
      console.error("[claims-dashboard] Sequenced query error:", seqError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const sequencedMap = new Map<string, Date>();
    for (const row of sequencedRows || []) {
      sequencedMap.set(row.provider_id, new Date(row.sequence_started_at));
    }

    const sequencedCount = sequencedMap.size;

    // 2. Get claimed providers (have account_id in business_profiles)
    const { data: claimedBps, error: claimedError } = await db
      .from("business_profiles")
      .select("source_provider_id, created_at")
      .not("source_provider_id", "is", null)
      .not("account_id", "is", null);

    if (claimedError) {
      console.error("[claims-dashboard] Claimed query error:", claimedError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 3. Calculate claims from sequence and time to claim
    const claimsFromSequence: Array<{ providerId: string; claimedAt: Date; daysSinceSequence: number }> = [];

    for (const bp of claimedBps || []) {
      const sequenceStartedAt = sequencedMap.get(bp.source_provider_id);
      if (sequenceStartedAt) {
        const claimedAt = new Date(bp.created_at);
        const daysSinceSequence = Math.floor(
          (claimedAt.getTime() - sequenceStartedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        claimsFromSequence.push({
          providerId: bp.source_provider_id,
          claimedAt,
          daysSinceSequence: Math.max(0, daysSinceSequence), // Ensure non-negative
        });
      }
    }

    const claimedCount = claimsFromSequence.length;

    // 4. Calculate conversion rate
    const conversionRate = sequencedCount > 0
      ? Math.round((claimedCount / sequencedCount) * 1000) / 10
      : 0;

    // 5. Calculate average time to claim
    let avgTimeToClaimDays: number | null = null;
    if (claimsFromSequence.length > 0) {
      const totalDays = claimsFromSequence.reduce((sum, c) => sum + c.daysSinceSequence, 0);
      avgTimeToClaimDays = Math.round((totalDays / claimsFromSequence.length) * 10) / 10;
    }

    // 6. Calculate sequence day breakdown
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
