import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";

/**
 * GET /api/admin/provider-outreach/stats
 *
 * Returns stats for the PulseHeader on the Provider Outreach page.
 *
 * Default metric: "claimed" — providers who claimed their account in the period.
 * This is the success metric for the outreach funnel.
 *
 * Query params:
 *   - state (required): State to filter by
 *   - metric (optional): "claimed" | "in_sequence" | "funnel" (default: "claimed")
 *   - date_from (ISO, inclusive). Omit for all-time.
 *   - date_to (ISO, exclusive).
 *
 * Returns:
 *   - total: count in range
 *   - delta: percentage change vs prior period
 *   - series: time-series data for the chart
 *   - bucket: hour | day | week | month
 *   - breakdown: (for metric=funnel) multi-line funnel data
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const metric = searchParams.get("metric") ?? "claimed";
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    if (!state) {
      return NextResponse.json({ error: "State parameter is required" }, { status: 400 });
    }

    const db = getServiceClient();

    const now = new Date();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : now;
    const priorFrom = from ? new Date(from.getTime() - (to.getTime() - from.getTime())) : null;
    const queryStart = priorFrom ?? from ?? null;

    if (metric === "funnel") {
      // Multi-series funnel breakdown
      return await buildFunnelResponse(db, state, { from, to, priorFrom, queryStart });
    }

    // Single metric response
    let timestamps: Date[];

    if (metric === "claimed") {
      timestamps = await fetchClaimedTimestamps(db, state, queryStart, to);
    } else if (metric === "in_sequence") {
      timestamps = await fetchStageTimestamps(db, state, "in_sequence", queryStart, to);
    } else if (metric === "needs_call") {
      timestamps = await fetchStageTimestamps(db, state, "needs_call", queryStart, to);
    } else if (metric === "called") {
      timestamps = await fetchStageTimestamps(db, state, "called", queryStart, to);
    } else {
      return NextResponse.json({ error: `Unknown metric: ${metric}` }, { status: 400 });
    }

    // KPI counts
    const inRange = (t: Date) => (from ? t >= from : true) && (to ? t < to : true);
    const inPrior = (t: Date) => !!priorFrom && !!from && t >= priorFrom && t < from;

    let kpiCurrent = 0;
    let kpiPrior = 0;
    for (const t of timestamps) {
      if (inRange(t)) kpiCurrent++;
      else if (inPrior(t)) kpiPrior++;
    }

    let delta: number | null = null;
    if (from) {
      if (kpiPrior === 0) delta = kpiCurrent > 0 ? 100 : 0;
      else delta = Math.round(((kpiCurrent - kpiPrior) / kpiPrior) * 100);
    }

    const seriesTimestamps = timestamps.filter(inRange);
    const bucket: Bucket = from
      ? resolveBucket(from, to)
      : resolveBucket(seriesTimestamps[0] ?? now, now);
    const seriesStart = from ?? seriesTimestamps[0] ?? now;
    const series = buildSeries(seriesTimestamps, seriesStart, to, bucket);

    return NextResponse.json({ total: kpiCurrent, delta, series, bucket });
  } catch (err) {
    console.error("Admin provider-outreach stats fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

type DB = ReturnType<typeof getServiceClient>;

/**
 * Fetch claimed timestamps for providers in a state.
 * Uses claimed_at from provider_outreach_tracking (accurate) with fallback
 * to business_profiles timestamps (less accurate but covers older claims).
 */
async function fetchClaimedTimestamps(
  db: DB,
  state: string,
  queryStart: Date | null,
  to: Date
): Promise<Date[]> {
  // Primary source: provider_outreach_tracking.claimed_at (accurate)
  let trackingQuery = db
    .from("provider_outreach_tracking")
    .select("claimed_at")
    .eq("state", state)
    .eq("stage", "claimed")
    .not("claimed_at", "is", null)
    .order("claimed_at", { ascending: true });

  if (queryStart) trackingQuery = trackingQuery.gte("claimed_at", queryStart.toISOString());
  if (to) trackingQuery = trackingQuery.lt("claimed_at", to.toISOString());

  const { data: trackingRows, error: trackingError } = await trackingQuery;

  if (trackingError) {
    console.error("[provider-outreach/stats] Tracking claimed_at query error:", trackingError);
  }

  const timestamps: Date[] = (trackingRows || [])
    .map((r) => new Date(r.claimed_at))
    .filter((t) => !isNaN(t.getTime()));

  // Fallback: For claimed providers without claimed_at (older records before migration),
  // use stage_changed_at from tracking as approximation
  let fallbackQuery = db
    .from("provider_outreach_tracking")
    .select("stage_changed_at")
    .eq("state", state)
    .eq("stage", "claimed")
    .is("claimed_at", null)
    .order("stage_changed_at", { ascending: true });

  if (queryStart) fallbackQuery = fallbackQuery.gte("stage_changed_at", queryStart.toISOString());
  if (to) fallbackQuery = fallbackQuery.lt("stage_changed_at", to.toISOString());

  const { data: fallbackRows } = await fallbackQuery;

  for (const r of fallbackRows || []) {
    const t = new Date(r.stage_changed_at);
    if (!isNaN(t.getTime())) {
      timestamps.push(t);
    }
  }

  return timestamps.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Fetch timestamps for when providers ENTERED a stage (historical, not current state).
 * For in_sequence: use sequence_started_at (all providers who ever entered sequence)
 * For claimed: use claimed_at via fetchClaimedTimestamps
 * For needs_call/called: LIMITATION - can only show current holders, not historical
 */
async function fetchStageTimestamps(
  db: DB,
  state: string,
  stage: string,
  queryStart: Date | null,
  to: Date
): Promise<Date[]> {
  // For in_sequence, use sequence_started_at to get ALL providers who ever entered sequence
  // (not just those currently in in_sequence stage)
  if (stage === "in_sequence") {
    return fetchSequenceStartTimestamps(db, state, queryStart, to);
  }

  // For needs_call and called, we only have current state (no historical transition tracking)
  // This is a known limitation - these lines will undercount in the funnel
  let q = db
    .from("provider_outreach_tracking")
    .select("stage_changed_at")
    .eq("state", state)
    .eq("stage", stage)
    .order("stage_changed_at", { ascending: true });

  if (queryStart) q = q.gte("stage_changed_at", queryStart.toISOString());
  if (to) q = q.lt("stage_changed_at", to.toISOString());

  const { data: rows, error } = await q;

  if (error) {
    console.error(`[provider-outreach/stats] Stage ${stage} query error:`, error);
    return [];
  }

  return (rows || [])
    .map((r) => new Date(r.stage_changed_at))
    .filter((t) => !isNaN(t.getTime()));
}

/**
 * Fetch sequence_started_at timestamps - when providers entered the outreach sequence.
 * This captures ALL providers who ever entered sequence, even if they've since
 * progressed to needs_call, called, or claimed.
 */
async function fetchSequenceStartTimestamps(
  db: DB,
  state: string,
  queryStart: Date | null,
  to: Date
): Promise<Date[]> {
  // Query all providers with sequence_started_at, regardless of current stage
  let q = db
    .from("provider_outreach_tracking")
    .select("sequence_started_at")
    .eq("state", state)
    .not("sequence_started_at", "is", null)
    .order("sequence_started_at", { ascending: true });

  if (queryStart) q = q.gte("sequence_started_at", queryStart.toISOString());
  if (to) q = q.lt("sequence_started_at", to.toISOString());

  const { data: rows, error } = await q;

  if (error) {
    console.error("[provider-outreach/stats] sequence_started_at query error:", error);
    return [];
  }

  return (rows || [])
    .map((r) => new Date(r.sequence_started_at))
    .filter((t) => !isNaN(t.getTime()));
}

/**
 * Build multi-series funnel response showing stage progression over time.
 * Shows: In Sequence → Needs Call → Called → Claimed
 *
 * Data accuracy notes:
 * - "In Sequence": ACCURATE — uses sequence_started_at, captures all who ever entered
 * - "Claimed": ACCURATE — uses claimed_at, captures all who claimed
 * - "Needs Call": LIMITED — only current holders, misses those who progressed to called/claimed
 * - "Called": LIMITED — only current holders, misses those who progressed to claimed
 *
 * For accurate funnel visualization, focus on "In Sequence" and "Claimed" lines.
 * Needs Call and Called are useful for current workload visibility, not historical trends.
 */
async function buildFunnelResponse(
  db: DB,
  state: string,
  opts: {
    from: Date | null;
    to: Date;
    priorFrom: Date | null;
    queryStart: Date | null;
  }
): Promise<NextResponse> {
  const { from, to, priorFrom, queryStart } = opts;

  // Fetch all stage timestamps in parallel
  const [inSequence, needsCall, called, claimed] = await Promise.all([
    fetchStageTimestamps(db, state, "in_sequence", queryStart, to),
    fetchStageTimestamps(db, state, "needs_call", queryStart, to),
    fetchStageTimestamps(db, state, "called", queryStart, to),
    fetchClaimedTimestamps(db, state, queryStart, to),
  ]);

  const inRange = (t: Date) => (from ? t >= from : true) && (to ? t < to : true);
  const inPrior = (t: Date) => !!priorFrom && !!from && t >= priorFrom && t < from;

  const named: Array<{ name: string; color: string; timestamps: Date[] }> = [
    { name: "In Sequence", color: "#3b82f6", timestamps: inSequence },    // blue-500
    { name: "Needs Call", color: "#f59e0b", timestamps: needsCall },      // amber-500
    { name: "Called", color: "#8b5cf6", timestamps: called },             // violet-500
    { name: "Claimed", color: "#10b981", timestamps: claimed },           // emerald-500
  ];

  // KPI total = claimed count (the success metric)
  let kpiCurrent = 0;
  let kpiPrior = 0;
  for (const t of claimed) {
    if (inRange(t)) kpiCurrent++;
    else if (inPrior(t)) kpiPrior++;
  }

  let delta: number | null = null;
  if (from) {
    if (kpiPrior === 0) delta = kpiCurrent > 0 ? 100 : 0;
    else delta = Math.round(((kpiCurrent - kpiPrior) / kpiPrior) * 100);
  }

  // Bucket choice based on the visible window
  const allInRange = named.flatMap((s) => s.timestamps.filter(inRange));
  const now = to ?? new Date();
  const bucket: Bucket = from
    ? resolveBucket(from, to)
    : resolveBucket(allInRange[0] ?? now, now);
  const seriesStart = from ?? allInRange[0] ?? now;

  const breakdown = named.map((s) => ({
    name: s.name,
    color: s.color,
    series: buildSeries(s.timestamps.filter(inRange), seriesStart, to, bucket),
  }));

  return NextResponse.json({
    total: kpiCurrent,
    delta,
    bucket,
    series: [], // Empty for backward compat; breakdown drives the multi-line chart
    breakdown,
  });
}
