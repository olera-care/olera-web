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

    // KPI counts use count:exact/head:true. The old approach fetched rows
    // and counted them in JS, but PostgREST's max-rows ceiling (10k on this
    // project) silently overrides even an explicit .limit(50000) — so once
    // anonymous page_views in the window exceeded 10k the headline pinned at
    // exactly 10,000 (real value was ~19k). A head count returns no rows and
    // is not subject to that cap. Anonymous filter (session_id present and
    // non-empty) is pushed server-side so KPI and series stay identical.
    let curCountQ = db
      .from("provider_activity")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .not("metadata->>session_id", "is", null)
      .neq("metadata->>session_id", "");
    if (from) curCountQ = curCountQ.gte("created_at", from.toISOString());
    if (dateTo) curCountQ = curCountQ.lt("created_at", dateTo);
    const { count: curCount, error: curErr } = await curCountQ;
    if (curErr) {
      console.error("Admin analytics views stats (current count) error:", curErr);
      return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
    }
    const kpiCurrent = curCount ?? 0;

    let kpiPrior = 0;
    if (priorFrom && from) {
      const { count: priorCount, error: priorErr } = await db
        .from("provider_activity")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "page_view")
        .not("metadata->>session_id", "is", null)
        .neq("metadata->>session_id", "")
        .gte("created_at", priorFrom.toISOString())
        .lt("created_at", from.toISOString());
      if (priorErr) {
        console.error("Admin analytics views stats (prior count) error:", priorErr);
        return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
      }
      kpiPrior = priorCount ?? 0;
    }

    let delta: number | null = null;
    if (from) {
      if (kpiPrior === 0) delta = kpiCurrent > 0 ? 100 : 0;
      else delta = Math.round(((kpiCurrent - kpiPrior) / kpiPrior) * 100);
    }

    // Series (chart) needs per-event timestamps. Paginate the current-range
    // fetch in max-rows-sized pages so the chart isn't capped either. Bounded
    // at MAX_SERIES_ROWS so a pathological "all time" range can't trigger
    // runaway pagination — the KPI total above stays exact regardless, so a
    // bounded chart at extreme volume is an acceptable tradeoff.
    const PAGE = 10000;
    const MAX_SERIES_ROWS = 100000;
    const seriesTimestamps: Date[] = [];
    for (let offset = 0; offset < MAX_SERIES_ROWS; offset += PAGE) {
      let pq = db
        .from("provider_activity")
        .select("created_at")
        .eq("event_type", "page_view")
        .not("metadata->>session_id", "is", null)
        .neq("metadata->>session_id", "")
        .order("created_at", { ascending: true })
        .range(offset, offset + PAGE - 1);
      if (from) pq = pq.gte("created_at", from.toISOString());
      if (dateTo) pq = pq.lt("created_at", dateTo);
      const { data: page, error: pErr } = await pq;
      if (pErr) {
        console.error("Admin analytics views stats (series) error:", pErr);
        return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
      }
      const batch = page ?? [];
      for (const r of batch) seriesTimestamps.push(new Date(r.created_at));
      if (batch.length < PAGE) break;
    }

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
