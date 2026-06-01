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

    // Pull non-archived inquiry/request connections in range+prior. We only
    // need status + metadata.thread + to_profile_id to decide "successful".
    let q = db
      .from("connections")
      .select("created_at, status, metadata, to_profile_id")
      .in("type", ["inquiry", "request"])
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

    return NextResponse.json({ total: kpiCurrent, delta, series, bucket });
  } catch (err) {
    console.error("[connections/pulse] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
