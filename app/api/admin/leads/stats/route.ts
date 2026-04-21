import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";

/**
 * GET /api/admin/leads/stats — see questions/stats for shape.
 *
 * Query params:
 *  - `date_from`, `date_to` (same as list endpoint)
 *  - `scope` "needs_email" | "all" (default: needs_email)
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
    const scope = searchParams.get("scope") === "all" ? "all" : "needs_email";

    const db = getServiceClient();

    const now = new Date();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : now;
    const priorFrom = from ? new Date(from.getTime() - (to.getTime() - from.getTime())) : null;

    const queryStart = priorFrom ?? from ?? null;

    let rowsQuery = db
      .from("connections")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(50000)
      .not("metadata", "cs", JSON.stringify({ archived: true }));

    if (scope === "needs_email") {
      rowsQuery = rowsQuery.contains("metadata", { needs_provider_email: true });
    }
    if (queryStart) rowsQuery = rowsQuery.gte("created_at", queryStart.toISOString());
    if (dateTo) rowsQuery = rowsQuery.lt("created_at", dateTo);

    const { data: rows, error } = await rowsQuery;
    if (error) {
      console.error("Admin leads stats error:", error);
      return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
    }

    const timestamps = (rows ?? []).map((r) => new Date(r.created_at));

    const inRange = (t: Date) => (from ? t >= from : true) && (dateTo ? t < to : true);
    const inPrior = (t: Date) => !!priorFrom && !!from && t >= priorFrom && t < from;

    const current = timestamps.filter(inRange);
    const prior = timestamps.filter(inPrior);

    const total = current.length;

    let delta: number | null = null;
    if (from) {
      if (prior.length === 0) delta = current.length > 0 ? 100 : 0;
      else delta = Math.round(((current.length - prior.length) / prior.length) * 100);
    }

    const bucket: Bucket = from ? resolveBucket(from, to) : resolveBucket(timestamps[0] ?? now, now);
    const seriesStart = from ?? timestamps[0] ?? now;
    const series = buildSeries(current, seriesStart, to, bucket);

    return NextResponse.json({ total, delta, series, bucket });
  } catch (err) {
    console.error("Admin leads stats fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
