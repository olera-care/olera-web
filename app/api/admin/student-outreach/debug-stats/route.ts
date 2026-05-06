import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/student-outreach/debug-stats
 *
 * Diagnostic endpoint. Returns raw counts so admin can verify the
 * stats wiring without trusting the chart. Hit it in the browser:
 *
 *   /api/admin/student-outreach/debug-stats           → all-time
 *   /api/admin/student-outreach/debug-stats?days=30   → last 30 days
 *   /api/admin/student-outreach/debug-stats?days=30&campus=texas-am-university
 *
 * Response shape:
 *   {
 *     window: { days, from, to } | null,
 *     campus: { slug, name, id } | null,
 *     touchpoints: {
 *       total_in_window: number,
 *       by_type: Record<touchpoint_type, count>,    // every type seen
 *       sample:  Array<{ type, created_at, payload }>,  // last 10
 *     },
 *     stage_changes: {
 *       to_researched_in_window: number,             // prospects_added
 *     },
 *     metrics_each_tab_uses: {
 *       prospects_added:    number,
 *       partners_added:     number,
 *       meetings_held:      number,
 *       meetings_activity:  number,    // scheduled + held + no-show + rescheduled
 *       replies:            number,
 *       calls_made:         number,
 *       emails_sent:        number,
 *       outbound:           number,
 *       activity:           number,
 *     },
 *     business_profiles: {
 *       students_total:       number,
 *       students_active:      number,                 // is_active=true
 *       students_completed:   number,                 // application_completed=true
 *       candidates_live:      number,                 // both above (= Candidates)
 *       students_in_window:   number,                 // signups in range
 *     },
 *   }
 */

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const daysRaw = parseInt(url.searchParams.get("days") ?? "0", 10);
  const days = isNaN(daysRaw) ? 0 : daysRaw;
  const campusSlug = url.searchParams.get("campus");

  const db = getServiceClient();

  const now = new Date();
  const from = days > 0 ? new Date(now.getTime() - days * 86_400_000) : null;
  const window =
    from !== null
      ? { days, from: from.toISOString(), to: now.toISOString() }
      : null;

  // Resolve campus.
  let campus: { slug: string; name: string; id: string } | null = null;
  let outreachIds: string[] | null = null; // null = all
  if (campusSlug) {
    const { data: c } = await db
      .from("student_outreach_campuses")
      .select("id, name, slug")
      .eq("slug", campusSlug)
      .single();
    if (c) {
      const cc = c as { id: string; name: string; slug: string };
      campus = { slug: cc.slug, name: cc.name, id: cc.id };
      const { data: rows } = await db
        .from("student_outreach")
        .select("id")
        .eq("campus_id", cc.id);
      outreachIds = ((rows ?? []) as Array<{ id: string }>).map((r) => r.id);
    }
  }

  // ── Touchpoints in window: count by type ─────────────────────────
  let tpQ = db
    .from("student_outreach_touchpoints")
    .select("touchpoint_type, created_at, payload, outreach_id")
    .order("created_at", { ascending: false })
    .limit(50000);
  if (from) tpQ = tpQ.gte("created_at", from.toISOString());
  if (outreachIds) tpQ = tpQ.in("outreach_id", outreachIds);
  const { data: tps, error: tpErr } = await tpQ;
  if (tpErr) {
    return NextResponse.json({ error: tpErr.message }, { status: 500 });
  }

  type TpRow = {
    touchpoint_type: string;
    created_at: string;
    payload: Record<string, unknown> | null;
    outreach_id: string;
  };
  const tpRows = (tps ?? []) as TpRow[];

  const byType: Record<string, number> = {};
  let toResearched = 0;
  for (const t of tpRows) {
    byType[t.touchpoint_type] = (byType[t.touchpoint_type] ?? 0) + 1;
    if (t.touchpoint_type === "stage_change") {
      const to = (t.payload as { to?: string } | null)?.to;
      if (to === "researched") toResearched++;
    }
  }
  const sample = tpRows.slice(0, 10).map((t) => ({
    type: t.touchpoint_type,
    created_at: t.created_at,
    payload: t.payload,
  }));

  // What each tab's metric resolves to from this window:
  const sumOf = (types: string[]) =>
    types.reduce((s, k) => s + (byType[k] ?? 0), 0);

  const metricsEachTabUses = {
    prospects_added: toResearched,
    partners_added: sumOf(["distribution_confirmed"]),
    meetings_held: sumOf(["meeting_held"]),
    meetings_activity: sumOf([
      "meeting_scheduled",
      "meeting_held",
      "meeting_no_show",
      "meeting_rescheduled",
    ]),
    replies: sumOf(["email_replied", "ig_dm_replied"]),
    calls_made: sumOf(["call_no_answer", "call_voicemail", "call_connected", "call_wrong_number"]),
    emails_sent: sumOf(["email_sent"]),
    outbound: sumOf(["email_sent", "ig_dm_sent", "contact_form_submitted"]),
    activity: sumOf([
      "email_sent", "email_replied", "email_bounced",
      "call_no_answer", "call_voicemail", "call_connected", "call_wrong_number",
      "ig_dm_sent", "ig_dm_replied", "contact_form_submitted",
      "meeting_scheduled", "meeting_held", "meeting_no_show", "meeting_rescheduled",
      "distribution_confirmed",
      "approval_requested", "approval_granted", "approval_denied", "approval_expired",
      "stage_change", "note_added",
    ]),
  };

  // ── business_profiles students ──────────────────────────────────
  const [
    { count: studentsTotal },
    { count: studentsActive },
  ] = await Promise.all([
    db.from("business_profiles").select("id", { count: "exact", head: true }).eq("type", "student"),
    db
      .from("business_profiles")
      .select("id", { count: "exact", head: true })
      .eq("type", "student")
      .eq("is_active", true),
  ]);

  // application_completed lives in metadata — count by fetching minimal
  // metadata columns (no head:true with .contains JSONB filter).
  const { data: completedRows } = await db
    .from("business_profiles")
    .select("id")
    .eq("type", "student")
    .contains("metadata", { application_completed: true });
  const studentsCompleted = (completedRows ?? []).length;

  const { data: candidatesLiveRows } = await db
    .from("business_profiles")
    .select("id")
    .eq("type", "student")
    .eq("is_active", true)
    .contains("metadata", { application_completed: true });
  const candidatesLive = (candidatesLiveRows ?? []).length;

  // Students signed up in window (campus-aware filter via metadata.university)
  let studentsInWindow = 0;
  if (from) {
    let sQ = db
      .from("business_profiles")
      .select("metadata")
      .eq("type", "student")
      .gte("created_at", from.toISOString());
    const { data: sRows } = await sQ;
    const candidate = (sRows ?? []) as Array<{ metadata: Record<string, unknown> | null }>;
    if (campus) {
      const lower = campus.name.toLowerCase();
      studentsInWindow = candidate.filter((p) => {
        const u = typeof p.metadata?.university === "string" ? p.metadata.university : null;
        return u !== null && u.toLowerCase() === lower;
      }).length;
    } else {
      studentsInWindow = candidate.length;
    }
  }

  return NextResponse.json({
    window,
    campus,
    touchpoints: {
      total_in_window: tpRows.length,
      by_type: byType,
      sample,
    },
    stage_changes: {
      to_researched_in_window: toResearched,
    },
    metrics_each_tab_uses: metricsEachTabUses,
    business_profiles: {
      students_total: studentsTotal ?? 0,
      students_active: studentsActive ?? 0,
      students_completed: studentsCompleted,
      candidates_live: candidatesLive,
      students_in_window: studentsInWindow,
    },
  });
}
