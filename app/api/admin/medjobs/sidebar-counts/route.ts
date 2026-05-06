import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * v9.0 Phase 7 Commit L: sidebar fraction counts.
 *
 * Returns per-entity { unread, total } powering the MedJobs sidebar
 * fractions. One endpoint, one round-trip, fired on sidebar mount +
 * every refreshMedJobs() invalidation.
 *
 * Counting model — universal across entities:
 *   numerator   (unread)  = active operational rows for this entity
 *                            with viewed_at IS NULL
 *   denominator (total)   = active operational rows for this entity
 *                            (read + unread)
 *
 * Per-entity definitions of "active operational rows":
 *   in_basket   active student_outreach (not closed) + pending entity
 *               tasks. Denominator matches the In Basket hero
 *               "Queued" tile.
 *   sites       active student_outreach_campuses. No notification
 *               model — unread is always 0.
 *   prospects   student_outreach in RESEARCH_STATUSES.
 *   clients     business_profiles in pilot or subscribed. No
 *               notification model.
 *   partners    student_outreach in active_partner status, kind !=
 *               'provider'.
 *   candidates  live student profiles. No notification model.
 *   replies     student_outreach in REPLIES_STATUSES.
 *   meetings    student_outreach with a meeting_scheduled touchpoint
 *               that hasn't been superseded by a later meeting_held.
 *   calls       distinct student_outreach with a pending phone task
 *               due now.
 *
 * Note on entity-only surfaces (sites / clients / candidates):
 * these don't have a viewed_at notification stream the way
 * student_outreach does, so unread is always 0 and the sidebar
 * renders the plain count (no fraction). The fraction only pops
 * when an entity has a real unread/read split.
 */

const CLOSED_STATUSES = [
  "no_response_closed",
  "not_interested",
  "do_not_contact",
  "wrong_contact",
];

const REPLIES_STATUSES = [
  "engaged",
  "wants_meeting",
  "needs_followup",
  "awaiting_callback",
];

const RESEARCH_STATUSES = ["prospect", "researched"];

const PARTNER_STATUSES = ["active_partner"];

interface CountEntry {
  unread: number;
  total: number;
}

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();

  // Single-pass scan of all active student_outreach rows with their
  // viewed_at + status. Everything else is computed against this set
  // in JS, plus a few small auxiliary queries.
  const [
    { data: outreachRows },
    { data: callTasks },
    { data: meetingTouchpoints },
    { count: pendingBpTasks },
    { count: pendingSiteTasks },
    { count: sitesCount },
    { count: clientsCount },
    { count: candidatesCount },
  ] = await Promise.all([
    db.from("student_outreach").select("id, status, viewed_at, kind"),
    // Pending phone tasks due now → distinct outreach_ids = Calls
    // active set.
    db
      .from("student_outreach_tasks")
      .select("outreach_id")
      .eq("status", "pending")
      .eq("task_type", "outreach_followup_call")
      .lte("due_at", new Date().toISOString()),
    // Meeting touchpoints in a recent window so we can derive which
    // rows have an active meeting (scheduled but not yet held). 90
    // days is generous; meetings older than that are stale.
    db
      .from("student_outreach_touchpoints")
      .select("outreach_id, touchpoint_type, created_at")
      .in("touchpoint_type", ["meeting_scheduled", "meeting_held"])
      .gte(
        "created_at",
        new Date(Date.now() - 90 * 86400_000).toISOString(),
      )
      .order("created_at", { ascending: false })
      .limit(5000),
    db
      .from("business_profile_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("site_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("student_outreach_campuses")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    db
      .from("business_profiles")
      .select("id", { count: "exact", head: true })
      .in("type", ["organization", "caregiver"])
      .not("metadata->>interview_terms_accepted_at", "is", null),
    db
      .from("business_profiles")
      .select("id", { count: "exact", head: true })
      .eq("type", "student")
      .eq("is_active", true)
      .contains("metadata", { application_completed: true }),
  ]);

  const rows = (outreachRows ?? []) as Array<{
    id: string;
    status: string;
    viewed_at: string | null;
    kind: string | null;
  }>;
  const rowMap = new Map(rows.map((r) => [r.id, r]));
  const isUnread = (r: { viewed_at: string | null }) => r.viewed_at == null;
  const isClosed = (s: string) => CLOSED_STATUSES.includes(s);

  // Meetings: scheduled but not yet held. Walk the recent meeting
  // touchpoints; remember the last touchpoint per outreach_id; if it's
  // meeting_scheduled (not meeting_held), that row has an active
  // meeting. Touchpoints come back created_at desc so the first hit
  // per outreach_id is the latest.
  const latestMeetingTouchpoint = new Map<string, string>();
  for (const t of (meetingTouchpoints ?? []) as Array<{
    outreach_id: string;
    touchpoint_type: string;
  }>) {
    if (!latestMeetingTouchpoint.has(t.outreach_id)) {
      latestMeetingTouchpoint.set(t.outreach_id, t.touchpoint_type);
    }
  }
  const meetingActiveIds = new Set<string>();
  for (const [id, type] of latestMeetingTouchpoint.entries()) {
    if (type === "meeting_scheduled") meetingActiveIds.add(id);
  }

  // Calls: distinct outreach_ids from pending phone tasks.
  const callActiveIds = new Set<string>();
  for (const t of (callTasks ?? []) as Array<{ outreach_id: string }>) {
    callActiveIds.add(t.outreach_id);
  }

  const counts: Record<string, CountEntry> = {
    in_basket: { unread: 0, total: 0 },
    sites: { unread: 0, total: sitesCount ?? 0 },
    prospects: { unread: 0, total: 0 },
    clients: { unread: 0, total: clientsCount ?? 0 },
    partners: { unread: 0, total: 0 },
    candidates: { unread: 0, total: candidatesCount ?? 0 },
    replies: { unread: 0, total: 0 },
    meetings: { unread: 0, total: 0 },
    calls: { unread: 0, total: 0 },
  };

  // Walk active student_outreach rows once and bucket per entity.
  for (const r of rows) {
    if (isClosed(r.status)) continue;
    counts.in_basket.total += 1;
    if (isUnread(r)) counts.in_basket.unread += 1;

    if (RESEARCH_STATUSES.includes(r.status)) {
      counts.prospects.total += 1;
      if (isUnread(r)) counts.prospects.unread += 1;
    } else if (PARTNER_STATUSES.includes(r.status) && r.kind !== "provider") {
      counts.partners.total += 1;
      if (isUnread(r)) counts.partners.unread += 1;
    } else if (REPLIES_STATUSES.includes(r.status)) {
      counts.replies.total += 1;
      if (isUnread(r)) counts.replies.unread += 1;
    }
  }

  // Meetings + Calls: derived sets join back to the active row map for
  // viewed_at. Rows that have closed since the touchpoint/task fell
  // into the set are excluded so closed rows don't pollute counts.
  for (const id of meetingActiveIds) {
    const r = rowMap.get(id);
    if (!r || isClosed(r.status)) continue;
    counts.meetings.total += 1;
    if (isUnread(r)) counts.meetings.unread += 1;
  }
  for (const id of callActiveIds) {
    const r = rowMap.get(id);
    if (!r || isClosed(r.status)) continue;
    counts.calls.total += 1;
    if (isUnread(r)) counts.calls.unread += 1;
  }

  // In Basket includes pending entity tasks in its denominator (matches
  // the hero's "Queued" semantics).
  counts.in_basket.total += (pendingBpTasks ?? 0) + (pendingSiteTasks ?? 0);

  return NextResponse.json({ counts });
}
