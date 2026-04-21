import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";

/**
 * GET /api/admin/questions/stats
 *
 * Returns `{ total, delta, series, bucket }` for the PulseHeader sparkline.
 * - `total`: count in the selected range
 * - `delta`: percent change vs. the immediately prior window of equal length
 *            (null when "all time" — no prior window to compare against)
 * - `series`: [{ date, count }] — buckets pre-filled with zeros
 * - `bucket`: the granularity used ("hour" | "day" | "week" | "month")
 *
 * Query params:
 *  - `date_from` (ISO, inclusive). Omit for all-time.
 *  - `date_to`   (ISO, exclusive).
 *  - `scope`     "needs_email" (default) | "all"
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

    let q = db
      .from("provider_questions")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(50000);

    if (scope === "needs_email") {
      q = q
        .contains("metadata", { needs_provider_email: true })
        .neq("status", "archived")
        .neq("status", "rejected");
    }
    if (queryStart) q = q.gte("created_at", queryStart.toISOString());
    if (dateTo) q = q.lt("created_at", dateTo);

    const { data: rows, error } = await q;
    if (error) {
      console.error("Admin questions stats error:", error);
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
    console.error("Admin questions stats fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
