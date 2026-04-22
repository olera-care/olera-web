import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";

/**
 * GET /api/admin/analytics/views/stats
 *
 * Powers the PulseHeader on /admin/analytics. Returns the same shape as
 * /api/admin/questions/stats so the existing PulseHeader component can
 * consume it directly:
 *
 *   { total, delta, series, bucket }
 *
 *   total  — anonymous page_view events in the current range
 *   delta  — % change vs. the prior window of equal length (null for "all")
 *   series — bucketed counts (zero-filled) for the chart
 *   bucket — which bucket size we picked for the series
 *
 * Filter: event_type='page_view' AND metadata->>'session_id' IS NOT NULL
 * (the session_id presence is what discriminates anonymous-actor page_views
 * from any future provider-actor self-views written to the same table).
 *
 * Query params:
 *   date_from (ISO, inclusive). Omit for all-time.
 *   date_to   (ISO, exclusive).
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

    let q = db
      .from("provider_activity")
      .select("created_at, metadata")
      .eq("event_type", "page_view")
      .order("created_at", { ascending: true })
      .limit(50000);
    if (queryStart) q = q.gte("created_at", queryStart.toISOString());
    if (dateTo) q = q.lt("created_at", dateTo);

    const { data: rows, error } = await q;
    if (error) {
      console.error("Admin analytics views stats error:", error);
      return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
    }

    const allRows = rows ?? [];

    // Filter to anonymous events only (those carrying a session_id in metadata).
    const isAnonymous = (r: (typeof allRows)[number]) => {
      const meta = r.metadata as Record<string, unknown> | null | undefined;
      return typeof meta?.session_id === "string" && meta.session_id.length > 0;
    };

    const inRange = (t: Date) => (from ? t >= from : true) && (dateTo ? t < to : true);
    const inPrior = (t: Date) => !!priorFrom && !!from && t >= priorFrom && t < from;

    let kpiCurrent = 0;
    let kpiPrior = 0;
    for (const r of allRows) {
      if (!isAnonymous(r)) continue;
      const t = new Date(r.created_at);
      if (inRange(t)) kpiCurrent++;
      else if (inPrior(t)) kpiPrior++;
    }

    let delta: number | null = null;
    if (from) {
      if (kpiPrior === 0) delta = kpiCurrent > 0 ? 100 : 0;
      else delta = Math.round(((kpiCurrent - kpiPrior) / kpiPrior) * 100);
    }

    const seriesTimestamps = allRows
      .filter(isAnonymous)
      .map((r) => new Date(r.created_at))
      .filter(inRange);
    const bucket: Bucket = from
      ? resolveBucket(from, to)
      : resolveBucket(seriesTimestamps[0] ?? now, now);
    const seriesStart = from ?? seriesTimestamps[0] ?? now;
    const series = buildSeries(seriesTimestamps, seriesStart, to, bucket);

    return NextResponse.json({ total: kpiCurrent, delta, series, bucket });
  } catch (err) {
    console.error("Admin analytics views stats fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
