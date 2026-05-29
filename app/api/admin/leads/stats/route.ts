import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";

/**
 * GET /api/admin/leads/stats — same shape as questions/stats.
 *
 * - `total` / `delta`: needs-email backlog in the range (KPI)
 * - `series`: ALL lead creations per bucket (platform pulse chart)
 *
 * Chart excludes archived leads (matches list endpoint behavior).
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

    // Pull all non-archived leads in range+prior WITH provider profile data
    // so we can check live email status (matches Analytics approach exactly)
    // Filter to inquiry/request types only (same as Analytics) for consistent counts
    let q = db
      .from("connections")
      .select("created_at, metadata, to_profile_id, to_profile:business_profiles!connections_to_profile_id_fkey(email, is_active)")
      .in("type", ["inquiry", "request"])
      .order("created_at", { ascending: true })
      .limit(50000)
      .not("metadata", "cs", JSON.stringify({ archived: true }));
    if (queryStart) q = q.gte("created_at", queryStart.toISOString());
    if (dateTo) q = q.lt("created_at", dateTo);

    const { data: rows, error } = await q;
    if (error) {
      console.error("Admin leads stats error:", error);
      return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
    }

    const allRows = rows ?? [];

    // Check live provider email status (matches Analytics approach exactly):
    // - Provider must be active
    // - Provider must have no email
    // - Provider must NOT have responded (goal already achieved if responded)
    type ThreadMessage = { from_profile_id: string; is_auto_reply?: boolean };
    const isNeedsEmail = (r: (typeof allRows)[number]) => {
      // Supabase may return to_profile as array or single object depending on join
      const toProfile = r.to_profile as { email?: string | null; is_active?: boolean }[] | { email?: string | null; is_active?: boolean } | null;
      const provider = Array.isArray(toProfile) ? toProfile[0] : toProfile;
      // Skip if no provider profile (deleted) or inactive
      if (!provider || provider.is_active === false) return false;
      // Skip if provider already responded (goal achieved)
      const meta = (r.metadata as Record<string, unknown>) ?? {};
      const thread = (meta.thread as ThreadMessage[]) || [];
      const hasResponded = thread.some(
        (m) => m.from_profile_id === r.to_profile_id && m.is_auto_reply !== true
      );
      if (hasResponded) return false;
      // Provider needs email if email is null or empty
      return !provider.email;
    };

    const inRange = (t: Date) => (from ? t >= from : true) && (dateTo ? t < to : true);
    const inPrior = (t: Date) => !!priorFrom && !!from && t >= priorFrom && t < from;

    let kpiCurrent = 0;
    let kpiPrior = 0;
    for (const r of allRows) {
      if (!isNeedsEmail(r)) continue;
      const t = new Date(r.created_at);
      if (inRange(t)) kpiCurrent++;
      else if (inPrior(t)) kpiPrior++;
    }

    let delta: number | null = null;
    if (from) {
      if (kpiPrior === 0) delta = kpiCurrent > 0 ? 100 : 0;
      else delta = Math.round(((kpiCurrent - kpiPrior) / kpiPrior) * 100);
    }

    const seriesTimestamps = allRows.map((r) => new Date(r.created_at)).filter(inRange);
    const bucket: Bucket = from
      ? resolveBucket(from, to)
      : resolveBucket(seriesTimestamps[0] ?? now, now);
    const seriesStart = from ?? seriesTimestamps[0] ?? now;
    const series = buildSeries(seriesTimestamps, seriesStart, to, bucket);

    return NextResponse.json({ total: kpiCurrent, delta, series, bucket });
  } catch (err) {
    console.error("Admin leads stats fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
