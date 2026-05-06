import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";

/**
 * GET /api/admin/student-outreach/stats
 *
 * Returns time-series data for the PulseHeader on the Student Outreach
 * page. The `metric` query param picks which dataset to count; each tab
 * passes its own metric so the top-of-page chart updates as admin
 * navigates.
 *
 * Supported metrics (`metric` query param, default `signups`):
 *
 *   signups          — student business_profiles (created_at)
 *   prospects_added  — stage_changed touchpoints whose new_status =
 *                      researched (qualified prospects)
 *   partners_added   — distribution_confirmed touchpoints (graduations)
 *   meetings_held    — meeting_held touchpoints
 *   replies          — email_replied + ig_dm_replied touchpoints
 *   calls_made       — call_no_answer + call_voicemail + call_connected
 *                      + call_wrong_number touchpoints
 *   emails_sent      — email_sent touchpoints
 *   outbound         — emails_sent + ig_dm_sent + contact_form_submitted
 *   activity         — every touchpoint type (broad funnel — the All tab)
 *
 * Common shape:
 *   - `total` / `delta`: count in range, vs prior window of equal length.
 *   - `series`: per-bucket count for the chart.
 *   - `bucket`: hour | day | week | month (auto-resolved).
 *
 * Query params:
 *   - `metric`    string (see above; default "signups")
 *   - `date_from` ISO, inclusive. Omit for all-time.
 *   - `date_to`   ISO, exclusive.
 *   - `campus`    optional campus slug. For signups, narrows by
 *                 metadata.university match. For all touchpoint
 *                 metrics, narrows by the underlying outreach row's
 *                 campus_id.
 */

type DB = ReturnType<typeof getServiceClient>;

const TOUCHPOINT_METRICS: Record<string, string[]> = {
  prospects_added: [], // resolved separately — needs payload filter
  partners_added: ["distribution_confirmed"],
  // v8.10.44: "meetings_held" is the conversion event (used by the
  // funnel chart). The Meetings tab's chart wants broader meeting
  // activity — scheduled, held, no-show, rescheduled — so admins see
  // booked-but-not-yet-held meetings on the chart too. Without this
  // distinction the Meetings chart read empty whenever no meetings
  // had completed yet, even with 4 meetings on the calendar.
  meetings_held: ["meeting_held"],
  meetings_activity: [
    "meeting_scheduled",
    "meeting_held",
    "meeting_no_show",
    "meeting_rescheduled",
  ],
  replies: ["email_replied", "ig_dm_replied"],
  calls_made: ["call_no_answer", "call_voicemail", "call_connected", "call_wrong_number"],
  emails_sent: ["email_sent"],
  outbound: ["email_sent", "ig_dm_sent", "contact_form_submitted"],
  activity: [
    "email_sent",
    "email_replied",
    "email_bounced",
    "call_no_answer",
    "call_voicemail",
    "call_connected",
    "call_wrong_number",
    "ig_dm_sent",
    "ig_dm_replied",
    "contact_form_submitted",
    "meeting_scheduled",
    "meeting_held",
    "meeting_no_show",
    "meeting_rescheduled",
    "distribution_confirmed",
    "approval_requested",
    "approval_granted",
    "approval_denied",
    "approval_expired",
    "stage_change",
    "note_added",
  ],
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get("metric") ?? "signups";
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const campusSlug = searchParams.get("campus");

    const db = getServiceClient();

    const now = new Date();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : now;
    const priorFrom = from ? new Date(from.getTime() - (to.getTime() - from.getTime())) : null;
    const queryStart = priorFrom ?? from ?? null;

    // Resolve campus filter once. For signups: needs the campus name to
    // match metadata.university. For touchpoint metrics: needs the
    // campus_id to filter the joined outreach rows.
    let campusName: string | null = null;
    let campusId: string | null = null;
    if (campusSlug) {
      const { data: campus } = await db
        .from("student_outreach_campuses")
        .select("id, name")
        .eq("slug", campusSlug)
        .single();
      const c = campus as { id: string; name: string } | null;
      if (!c) {
        return NextResponse.json({ total: 0, delta: 0, series: [], bucket: "day" });
      }
      campusName = c.name;
      campusId = c.id;
    }

    let timestamps: Date[];
    if (metric === "funnel") {
      // v8.10.41: multi-series stacked-funnel response. Used by the
      // All tab so admin sees signups → candidates → prospects → replies
      // → meetings → partners on one chart and reads the funnel shape
      // over time.
      // v8.10.42: Candidates added between Signups and Prospects to
      // surface the supply-side narrowing (Candidates ⊂ Signups).
      return await buildFunnelResponse(db, {
        from,
        to,
        priorFrom,
        queryStart,
        campusName,
        campusId,
      });
    }
    if (metric === "signups") {
      // v8.10.42: signups counts every student that entered the funnel
      // — the broader acquisition number, includes incomplete profiles.
      timestamps = await fetchSignupTimestamps(db, queryStart, to, campusName, {
        liveOnly: false,
      });
    } else if (metric === "candidates") {
      // v8.10.42: candidates = signups that are LIVE on the provider-
      // facing job board. Subset filter: is_active=true AND
      // metadata.application_completed=true. Same shape as signups.
      timestamps = await fetchSignupTimestamps(db, queryStart, to, campusName, {
        liveOnly: true,
      });
    } else if (metric === "prospects_added") {
      timestamps = await fetchProspectsAddedTimestamps(db, queryStart, to, campusId);
    } else if (TOUCHPOINT_METRICS[metric]) {
      timestamps = await fetchTouchpointTimestamps(
        db,
        TOUCHPOINT_METRICS[metric],
        queryStart,
        to,
        campusId,
      );
    } else {
      return NextResponse.json({ error: `Unknown metric: ${metric}` }, { status: 400 });
    }

    // KPI counts and series
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
    console.error("Admin student-outreach stats fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function fetchSignupTimestamps(
  db: DB,
  queryStart: Date | null,
  to: Date,
  campusName: string | null,
  opts: { liveOnly?: boolean } = {},
): Promise<Date[]> {
  // v8.10.42: liveOnly = true narrows to "Candidates" — students whose
  // profiles are publicly visible to providers on the job board. The
  // canonical filter matches /api/medjobs/candidates: is_active=true
  // AND metadata.application_completed=true. Without liveOnly, returns
  // the broader signups set (every student who entered the funnel).
  let q = db
    .from("business_profiles")
    .select("created_at, metadata")
    .eq("type", "student")
    .order("created_at", { ascending: true })
    .limit(50000);
  if (queryStart) q = q.gte("created_at", queryStart.toISOString());
  if (to) q = q.lt("created_at", to.toISOString());
  if (opts.liveOnly) {
    q = q.eq("is_active", true).contains("metadata", { application_completed: true });
  }
  const { data: rows } = await q;

  const lowerName = campusName?.toLowerCase() ?? null;
  return ((rows ?? []) as Array<{ created_at: string; metadata: Record<string, unknown> | null }>)
    .filter((r) => {
      if (!lowerName) return true;
      const u =
        typeof r.metadata?.university === "string"
          ? (r.metadata.university as string)
          : null;
      return u !== null && u.toLowerCase() === lowerName;
    })
    .map((r) => new Date(r.created_at));
}

async function fetchTouchpointTimestamps(
  db: DB,
  touchpointTypes: string[],
  queryStart: Date | null,
  to: Date,
  campusId: string | null,
): Promise<Date[]> {
  // v8.10.43: don't use the embedded inner-join (`student_outreach!inner(...)`).
  // PostgREST silently returns no rows when it can't resolve the FK, which is
  // exactly what was happening here — every touchpoint metric returned 0.
  // Match the pattern used everywhere else in this codebase: scope to a
  // pre-fetched outreach_id set when a campus filter is active, otherwise
  // run a flat query on touchpoints alone.
  const outreachIds = await campusOutreachIds(db, campusId);
  if (outreachIds === null) return []; // campus filter active but yielded zero ids

  let q = db
    .from("student_outreach_touchpoints")
    .select("created_at")
    .in("touchpoint_type", touchpointTypes)
    .order("created_at", { ascending: true })
    .limit(50000);
  if (queryStart) q = q.gte("created_at", queryStart.toISOString());
  if (to) q = q.lt("created_at", to.toISOString());
  if (outreachIds) q = q.in("outreach_id", outreachIds);

  const { data: rows, error } = await q;
  if (error) {
    console.error("touchpoint stats fetch failed:", error);
    return [];
  }
  return ((rows ?? []) as Array<{ created_at: string }>).map((r) => new Date(r.created_at));
}

async function fetchProspectsAddedTimestamps(
  db: DB,
  queryStart: Date | null,
  to: Date,
  campusId: string | null,
): Promise<Date[]> {
  // Stage changes have payload { from, to }; we want transitions to
  // "researched" — the moment a prospect is qualified.
  const outreachIds = await campusOutreachIds(db, campusId);
  if (outreachIds === null) return [];

  let q = db
    .from("student_outreach_touchpoints")
    .select("created_at, payload")
    .eq("touchpoint_type", "stage_change")
    .order("created_at", { ascending: true })
    .limit(50000);
  if (queryStart) q = q.gte("created_at", queryStart.toISOString());
  if (to) q = q.lt("created_at", to.toISOString());
  if (outreachIds) q = q.in("outreach_id", outreachIds);

  const { data: rows, error } = await q;
  if (error) {
    console.error("prospects_added stats fetch failed:", error);
    return [];
  }
  return (
    (rows ?? []) as Array<{
      created_at: string;
      payload: Record<string, unknown> | null;
    }>
  )
    .filter((r) => (r.payload as { to?: string } | null)?.to === "researched")
    .map((r) => new Date(r.created_at));
}

/**
 * Resolve a campus filter to a list of outreach_ids. Returns:
 *   - null (filter set but no matching rows — caller returns empty)
 *   - undefined (no filter — caller skips the .in() narrowing)
 *   - string[] (filter set, here are the matching ids)
 */
async function campusOutreachIds(
  db: DB,
  campusId: string | null,
): Promise<string[] | null | undefined> {
  if (!campusId) return undefined;
  const { data, error } = await db
    .from("student_outreach")
    .select("id")
    .eq("campus_id", campusId);
  if (error) {
    console.error("campusOutreachIds:", error);
    return null;
  }
  const ids = ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (ids.length === 0) return null;
  return ids;
}

/**
 * v8.10.41: build the multi-series funnel response. Five series
 * (Signups → Prospects → Replies → Meetings → Partners) so the All
 * tab's chart reads as a funnel-over-time. All five share one bucket
 * grid + one Y-axis so the relative shapes are comparable. Headline
 * total is the sum across all series in range.
 */
async function buildFunnelResponse(
  db: DB,
  opts: {
    from: Date | null;
    to: Date;
    priorFrom: Date | null;
    queryStart: Date | null;
    campusName: string | null;
    campusId: string | null;
  },
): Promise<NextResponse> {
  const { from, to, priorFrom, queryStart, campusName, campusId } = opts;

  // Six series, fired in parallel. v8.10.42: Candidates added as a
  // separate line — Candidates ⊂ Signups (live profiles only). Both
  // shown so admin sees the supply-side conversion (signups → live
  // candidates) alongside the demand-side stakeholder funnel.
  const [signups, candidates, prospects, replies, meetings, partners] = await Promise.all([
    fetchSignupTimestamps(db, queryStart, to, campusName, { liveOnly: false }),
    fetchSignupTimestamps(db, queryStart, to, campusName, { liveOnly: true }),
    fetchProspectsAddedTimestamps(db, queryStart, to, campusId),
    fetchTouchpointTimestamps(db, TOUCHPOINT_METRICS.replies, queryStart, to, campusId),
    fetchTouchpointTimestamps(db, TOUCHPOINT_METRICS.meetings_held, queryStart, to, campusId),
    fetchTouchpointTimestamps(db, TOUCHPOINT_METRICS.partners_added, queryStart, to, campusId),
  ]);

  const inRange = (t: Date) => (from ? t >= from : true) && (to ? t < to : true);
  const inPrior = (t: Date) => !!priorFrom && !!from && t >= priorFrom && t < from;

  const named: Array<{ name: string; color: string; timestamps: Date[] }> = [
    { name: "Signups",    color: "#94a3b8", timestamps: signups    }, // slate-400 (broader funnel — muted)
    { name: "Candidates", color: "#10b981", timestamps: candidates }, // emerald-500 (live supply)
    { name: "Prospects",  color: "#3b82f6", timestamps: prospects  }, // blue-500
    { name: "Replies",    color: "#f59e0b", timestamps: replies    }, // amber-500
    { name: "Meetings",   color: "#8b5cf6", timestamps: meetings   }, // violet-500
    { name: "Partners",   color: "#ef4444", timestamps: partners   }, // red-500
  ];

  // KPI total = sum of all current-range counts. Delta vs prior window
  // computed against the same sum.
  let kpiCurrent = 0;
  let kpiPrior = 0;
  for (const s of named) {
    for (const t of s.timestamps) {
      if (inRange(t)) kpiCurrent++;
      else if (inPrior(t)) kpiPrior++;
    }
  }
  let delta: number | null = null;
  if (from) {
    if (kpiPrior === 0) delta = kpiCurrent > 0 ? 100 : 0;
    else delta = Math.round(((kpiCurrent - kpiPrior) / kpiPrior) * 100);
  }

  // Bucket choice based on the visible window (matches single-metric
  // behavior). Each series shares the same bucket grid for clean axes.
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
    // Empty `series` for backward compat with single-line consumers; the
    // breakdown drives the multi-line chart.
    series: [],
    breakdown,
  });
}
