import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";
import { isSuccessfulConnection } from "@/lib/connection-temperature";

/**
 * GET /api/admin/connections/pulse — hero KPI for the connections tracker.
 *
 * The canonical KPI: SUCCESSFUL connections = the provider replied OR the
 * connection was accepted (see lib/connection-temperature). Counted by the
 * connection's `created_at` in the selected range, so it answers "how many
 * connections created in this window have actually connected."
 *
 * Same `{ total, delta, series, bucket }` contract as /api/admin/leads/stats
 * so it drops straight into <PulseHeader />.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const db = getServiceClient();

    const now = new Date();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : now;
    const priorFrom = from ? new Date(from.getTime() - (to.getTime() - from.getTime())) : null;
    const queryStart = priorFrom ?? from ?? null;

    // Pull non-archived inquiry connections in range+prior. We only
    // need status + metadata.thread + to_profile_id to decide "successful".
    // Only inquiry connections (family→provider) are tracked here.
    // Matches (provider→family) are tracked on the Outreach page.
    let q = db
      .from("connections")
      .select("created_at, status, metadata, to_profile_id")
      .eq("type", "inquiry")
      .order("created_at", { ascending: true })
      .limit(50000)
      .not("metadata", "cs", JSON.stringify({ archived: true }));
    if (queryStart) q = q.gte("created_at", queryStart.toISOString());
    if (dateTo) q = q.lte("created_at", dateTo);

    const { data: rows, error } = await q;
    if (error) {
      console.error("[connections/pulse] query error:", error);
      return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
    }

    const allRows = rows ?? [];

    const inRange = (t: Date) => (from ? t >= from : true) && (dateTo ? t <= to : true);
    const inPrior = (t: Date) => !!priorFrom && !!from && t >= priorFrom && t < from;

    let kpiCurrent = 0;
    let kpiPrior = 0;
    const successTimestamps: Date[] = [];
    for (const r of allRows) {
      if (!isSuccessfulConnection(r)) continue;
      const t = new Date(r.created_at);
      if (inRange(t)) {
        kpiCurrent++;
        successTimestamps.push(t);
      } else if (inPrior(t)) {
        kpiPrior++;
      }
    }

    let delta: number | null = null;
    if (from) {
      if (kpiPrior === 0) delta = kpiCurrent > 0 ? 100 : 0;
      else delta = Math.round(((kpiCurrent - kpiPrior) / kpiPrior) * 100);
    }

    const bucket: Bucket = from
      ? resolveBucket(from, to)
      : resolveBucket(successTimestamps[0] ?? now, now);
    const seriesStart = from ?? successTimestamps[0] ?? now;
    const series = buildSeries(successTimestamps, seriesStart, to, bucket);

    // Calculate response metrics from all rows in range
    type ThreadMsg = { from_profile_id: string; text?: string; created_at?: string; is_auto_reply?: boolean; type?: string };
    let respondedCount = 0;
    let awaitingCount = 0;
    const responseTimes: number[] = [];

    for (const r of allRows) {
      const t = new Date(r.created_at);
      if (!inRange(t)) continue;

      const meta = (r.metadata as Record<string, unknown>) ?? {};
      const thread = (meta.thread as ThreadMsg[]) || [];
      // Find REAL provider response (non-auto, non-system, with actual text)
      const providerMsg = thread.find(
        (m) =>
          m.from_profile_id === r.to_profile_id &&
          m.is_auto_reply !== true &&
          m.type !== "system" &&
          m.from_profile_id !== "system" &&
          !!m.text?.trim()
      );

      if (providerMsg) {
        respondedCount++;
        if (providerMsg.created_at) {
          const responseTimeHours =
            (new Date(providerMsg.created_at).getTime() - new Date(r.created_at).getTime()) /
            (1000 * 60 * 60);
          if (responseTimeHours > 0) responseTimes.push(responseTimeHours);
        }
      } else {
        awaitingCount++;
      }
    }

    const totalInRange = respondedCount + awaitingCount;
    const responseRate = totalInRange > 0 ? Math.round((respondedCount / totalInRange) * 100) : 0;

    let medianResponseTime: number | null = null;
    if (responseTimes.length > 0) {
      responseTimes.sort((a, b) => a - b);
      const mid = Math.floor(responseTimes.length / 2);
      medianResponseTime =
        responseTimes.length % 2 === 0
          ? Math.round(((responseTimes[mid - 1] + responseTimes[mid]) / 2) * 10) / 10
          : Math.round(responseTimes[mid] * 10) / 10;
    }

    return NextResponse.json({
      total: kpiCurrent,
      delta,
      series,
      bucket,
      // Response metrics
      responseRate,
      medianResponseTime,
      awaitingCount,
    });
  } catch (err) {
    console.error("[connections/pulse] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
