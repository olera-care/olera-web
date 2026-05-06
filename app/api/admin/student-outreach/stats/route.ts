import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";

/**
 * GET /api/admin/student-outreach/stats
 *
 * Returns stats for the PulseHeader on the Student Outreach page. Same
 * shape as /api/admin/questions/stats but the metric is incoming
 * student signups (not an action queue).
 *
 *   - `total` / `delta`: count of student signups in range, vs prior
 *     window of equal length.
 *   - `series`: signups per bucket (day / week / month) for the chart.
 *
 * Source: `business_profiles` rows where `type='student'`. Each student
 * record carries `metadata.university` (text) — when admin filters the
 * Student Outreach page to a specific campus, the stats query narrows
 * to signups whose university name matches the campus's name.
 *
 * Query params:
 *   - `date_from` (ISO, inclusive). Omit for all-time.
 *   - `date_to`   (ISO, exclusive).
 *   - `campus`    optional campus slug — narrows to students at that
 *                 university (matched by case-insensitive name).
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
    const campusSlug = searchParams.get("campus");

    const db = getServiceClient();

    const now = new Date();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : now;
    const priorFrom = from ? new Date(from.getTime() - (to.getTime() - from.getTime())) : null;
    const queryStart = priorFrom ?? from ?? null;

    // Resolve campus slug → name for the metadata.university match.
    let campusName: string | null = null;
    if (campusSlug) {
      const { data: campus } = await db
        .from("student_outreach_campuses")
        .select("name")
        .eq("slug", campusSlug)
        .single();
      campusName = (campus as { name: string } | null)?.name ?? null;
      // Unknown slug → return zero counts. Don't pretend the filter
      // matched everything.
      if (!campusName) {
        return NextResponse.json({ total: 0, delta: 0, series: [], bucket: "day" });
      }
    }

    let q = db
      .from("business_profiles")
      .select("created_at, metadata")
      .eq("type", "student")
      .order("created_at", { ascending: true })
      .limit(50000);
    if (queryStart) q = q.gte("created_at", queryStart.toISOString());
    if (dateTo) q = q.lt("created_at", dateTo);

    const { data: rows, error } = await q;
    if (error) {
      console.error("Admin student-outreach stats error:", error);
      return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
    }

    const allRows = rows ?? [];

    // Filter by university name (case-insensitive) when a campus is set.
    // Doing this in JS keeps the SQL simple — the metadata->>'university'
    // ilike pattern is harder to express portably, and the student table
    // is small (50k cap above).
    const lowerName = campusName?.toLowerCase() ?? null;
    const matchesCampus = (r: (typeof allRows)[number]) => {
      if (!lowerName) return true;
      const meta = r.metadata as Record<string, unknown> | null | undefined;
      const u = typeof meta?.university === "string" ? meta.university : null;
      return u !== null && u.toLowerCase() === lowerName;
    };

    const inRange = (t: Date) => (from ? t >= from : true) && (dateTo ? t < to : true);
    const inPrior = (t: Date) => !!priorFrom && !!from && t >= priorFrom && t < from;

    let kpiCurrent = 0;
    let kpiPrior = 0;
    for (const r of allRows) {
      if (!matchesCampus(r)) continue;
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
      .filter(matchesCampus)
      .map((r) => new Date(r.created_at))
      .filter(inRange);
    const bucket: Bucket = from
      ? resolveBucket(from, to)
      : resolveBucket(seriesTimestamps[0] ?? now, now);
    const seriesStart = from ?? seriesTimestamps[0] ?? now;
    const series = buildSeries(seriesTimestamps, seriesStart, to, bucket);

    return NextResponse.json({ total: kpiCurrent, delta, series, bucket });
  } catch (err) {
    console.error("Admin student-outreach stats fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
