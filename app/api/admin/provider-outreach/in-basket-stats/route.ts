import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/in-basket-stats
 *
 * In Basket hero stats for the Provider Outreach pipeline.
 * Same shape as MedJobs in-basket-stats.
 *
 * Stub: returns zeroes until the provider outreach pipeline tables exist.
 */

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    queued_unread: 0,
    queued_read: 0,
    logs_today: 0,
    logs_today_breakdown: { calls: 0, emails: 0, meetings: 0, replies: 0, other: 0 },
    streak_days: 0,
    streak_target: 50,
    daily_logs: [],
  });
}
