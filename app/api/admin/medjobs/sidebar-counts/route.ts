import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * v9.0 Phase 7 Commit K: sidebar fraction counts.
 *
 * Returns per-entity unread + total active counts powering the
 * MedJobs left-sidebar fractions. One endpoint, one round-trip,
 * fired on sidebar mount + every refreshMedJobs() invalidation.
 *
 * Counts:
 *   in_basket   total active operational workload (student_outreach
 *               not in closed states + pending entity tasks). Same
 *               denominator the In Basket hero "Queued" tile uses.
 *   sites       active sites (research_complete OR territories with
 *               clients/research in flight) — denominator for the
 *               Sites entity page.
 *   prospects   active research-stage student_outreach + virtual
 *               provider prospects in catchments.
 *   clients     active client business_profiles (T&C accepted in
 *               last 90d OR active subscription).
 *   partners    student_outreach in active_partner status (excluding
 *               kind=provider, which lives on Clients).
 *   candidates  live student profiles (type=student, is_active,
 *               metadata.application_completed=true).
 *   replies     student_outreach in REPLIES_STATUSES.
 *   meetings    student_outreach with meeting_in_flight or
 *               meeting_scheduled state.
 *   calls       student_outreach with a pending phone task due now.
 *
 * Each entry returns { unread, total }. For surfaces without a
 * notification model (sites, candidates), unread = 0 and total = the
 * inventory count.
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

  // Single status scan over student_outreach — pulls every active
  // row's status + viewed_at + meeting state once, then we slice
  // per entity in JS. Cheaper than nine separate counts.
  const [
    { data: outreachRows },
    { count: pendingBpTasks },
    { count: pendingSiteTasks },
    { count: pendingCallTasks },
    { count: meetingScheduledTasks },
    { count: sitesCount },
    { count: clientsCount },
    { count: candidatesCount },
  ] = await Promise.all([
    db.from("student_outreach").select("id, status, viewed_at, kind"),
    db
      .from("business_profile_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("site_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("student_outreach_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("task_type", "outreach_followup_call")
      .lte("due_at", new Date().toISOString()),
    // Meetings: rows with a pending meeting-related task (loose
    // proxy — the queue endpoint computes this more precisely).
    db
      .from("student_outreach_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .in("task_type", ["meeting_held_logging"]),
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

  const isUnread = (r: { viewed_at: string | null }) => r.viewed_at == null;
  const isClosed = (s: string) => CLOSED_STATUSES.includes(s);

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

  // In Basket includes pending entity tasks in its denominator (matches
  // the hero's "Queued" semantics).
  counts.in_basket.total += (pendingBpTasks ?? 0) + (pendingSiteTasks ?? 0);

  // Meetings + Calls: task-driven counts. Unread is 0 because these
  // are surfaced by the row's task state, not by viewed_at. Once a
  // dedicated entity page wires its own unread model we can refine.
  counts.calls.total = pendingCallTasks ?? 0;
  counts.meetings.total = meetingScheduledTasks ?? 0;

  return NextResponse.json({ counts });
}
