import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getServiceClient, isAdmin } from "@/lib/admin";
import { mostRecentCompleteWeek } from "@/lib/growth/dates";
import { collectGrowthSnapshot } from "@/lib/growth/collector.server";
import { saveGrowthSnapshot } from "@/lib/growth/store.server";
import { withCronRun } from "@/lib/crons/run";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const isCron = Boolean(process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`);
  let triggeredBy = "cron";

  if (!isCron) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (!(await isAdmin(user.id))) return NextResponse.json({ error: "Access denied" }, { status: 403 });
    triggeredBy = `admin:${user.email || user.id}`;
  }

  return withCronRun("growth-metrics-weekly", async () => {
    const db = getServiceClient();
    const { weekStart, weekEnd } = mostRecentCompleteWeek();
    const { data: existing, error: existingError } = await db
      .from("growth_metric_snapshots")
      .select("week_start, collected_at")
      .eq("week_start", weekStart)
      .maybeSingle();
    if (existingError) throw new Error(`Could not check growth history: ${existingError.message}`);
    if (existing) {
      return { ok: true, skipped: "already_collected", week_start: weekStart, collected_at: existing.collected_at };
    }
    const snapshot = await collectGrowthSnapshot({ weekStart, weekEnd, db });
    const saved = await saveGrowthSnapshot(db, snapshot);
    return {
      ok: true,
      week_start: saved.week_start,
      week_end: saved.week_end,
      total_users: saved.ga4.overview.total_users,
      organic_users: saved.ga4.channels["Organic Search"] || 0,
      search_clicks: saved.gsc?.performance.clicks ?? null,
      inquiries: saved.marketplace.inquiries,
      anomalies: saved.anomalies,
    };
  }, { triggeredBy });
}
