import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * v9.0 Phase 7 Commit O: sidebar fraction counts.
 *
 * Returns per-entity { unread, total } powering the MedJobs sidebar
 * fractions. One endpoint, one round-trip, fired on sidebar mount +
 * every refreshMedJobs() invalidation.
 *
 * Counting model — one universal rule across every entity:
 *   numerator   (unread)  = active rows for this entity that have a
 *                            pending operational signal (task /
 *                            touchpoint / state) created after the
 *                            entity's last viewed_at — OR the entity
 *                            was never viewed and has any signal at all
 *   denominator (total)   = active rows for this entity (inventory
 *                            scope on the sidebar; task-driven scope
 *                            inside the In Basket horizontal tabs)
 *
 * Storage:
 *   stakeholder  student_outreach.viewed_at column
 *   site         student_outreach_campuses.viewed_at column (mig 076)
 *   client /
 *   candidate    business_profiles.metadata.admin_viewed_at
 *
 * The mark-entity-read endpoint hides the storage difference.
 */

const CLOSED_STATUSES = [
  "no_response_closed",
  "not_interested",
  "do_not_contact",
  "wrong_contact",
];

const REPLIES_STATUSES = ["outreach_sent", "engaged"];
const RESEARCH_STATUSES = ["prospect", "researched"];
const PARTNER_STATUSES = ["active_partner"];

interface CountEntry {
  unread: number;
  total: number;
}

/**
 * v9.0 Phase 7 Commit O: shared unread predicate for entity-task
 * entities. An entity is unread when it has any pending task created
 * after its viewed_at — OR was never viewed and has a pending task.
 */
function isEntityUnread(
  viewedAt: string | null,
  latestTaskCreatedAt: string | null,
): boolean {
  if (!latestTaskCreatedAt) return false;
  if (!viewedAt) return true;
  return latestTaskCreatedAt > viewedAt;
}

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();

  const [
    { data: outreachRows },
    { data: callTasks },
    { data: meetingTouchpoints },
    { data: pendingBpTasks },
    { data: pendingSiteTasks },
    { data: campusRows },
    { data: clientProfiles },
    { data: candidateProfiles },
  ] = await Promise.all([
    db.from("student_outreach").select("id, status, viewed_at, kind"),
    db
      .from("student_outreach_tasks")
      .select("outreach_id")
      .eq("status", "pending")
      .eq("task_type", "outreach_followup_call")
      .lte("due_at", new Date().toISOString()),
    db
      .from("student_outreach_touchpoints")
      .select("outreach_id, touchpoint_type, created_at")
      .in("touchpoint_type", ["meeting_scheduled", "meeting_held"])
      .gte("created_at", new Date(Date.now() - 90 * 86400_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
    // v9.0 Phase 7 Commit O: pull task data (not just count) so we
    // can compute unread per entity by comparing task.created_at to
    // entity.viewed_at.
    db
      .from("business_profile_tasks")
      .select("business_profile_id, kind, created_at")
      .eq("status", "pending"),
    db
      .from("site_tasks")
      .select("campus_id, created_at")
      .eq("status", "pending"),
    db
      .from("student_outreach_campuses")
      .select("id, viewed_at, is_active")
      .eq("is_active", true),
    // Active clients (T&C-accepted providers) with metadata so we
    // can read admin_viewed_at.
    db
      .from("business_profiles")
      .select("id, metadata")
      .in("type", ["organization", "caregiver"])
      .not("metadata->>interview_terms_accepted_at", "is", null),
    db
      .from("business_profiles")
      .select("id, metadata")
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

  // ── Stakeholder-side derived sets (Meetings / Calls) ──
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
  const callActiveIds = new Set<string>();
  for (const t of (callTasks ?? []) as Array<{ outreach_id: string }>) {
    callActiveIds.add(t.outreach_id);
  }

  // ── Entity-task unread maps (per-entity latest pending task) ──
  const latestClientTaskByProfile = new Map<string, string>();
  const latestCandidateTaskByProfile = new Map<string, string>();
  for (const t of (pendingBpTasks ?? []) as Array<{
    business_profile_id: string;
    kind: string;
    created_at: string;
  }>) {
    const map =
      t.kind === "client" ? latestClientTaskByProfile : latestCandidateTaskByProfile;
    const cur = map.get(t.business_profile_id);
    if (!cur || t.created_at > cur) map.set(t.business_profile_id, t.created_at);
  }

  const latestSiteTaskByCampus = new Map<string, string>();
  for (const t of (pendingSiteTasks ?? []) as Array<{
    campus_id: string;
    created_at: string;
  }>) {
    const cur = latestSiteTaskByCampus.get(t.campus_id);
    if (!cur || t.created_at > cur) latestSiteTaskByCampus.set(t.campus_id, t.created_at);
  }

  const counts: Record<string, CountEntry> = {
    in_basket: { unread: 0, total: 0 },
    sites: { unread: 0, total: 0 },
    prospects: { unread: 0, total: 0 },
    clients: { unread: 0, total: 0 },
    partners: { unread: 0, total: 0 },
    candidates: { unread: 0, total: 0 },
    replies: { unread: 0, total: 0 },
    meetings: { unread: 0, total: 0 },
    calls: { unread: 0, total: 0 },
  };

  // Stakeholder buckets (existing logic).
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

  // ── Sites (inventory + per-site unread) ──
  for (const c of (campusRows ?? []) as Array<{
    id: string;
    viewed_at: string | null;
    is_active: boolean;
  }>) {
    counts.sites.total += 1;
    const latestTaskCreated = latestSiteTaskByCampus.get(c.id) ?? null;
    if (isEntityUnread(c.viewed_at, latestTaskCreated)) {
      counts.sites.unread += 1;
    }
  }

  // ── Clients (inventory + per-profile unread via metadata.admin_viewed_at) ──
  for (const p of (clientProfiles ?? []) as Array<{
    id: string;
    metadata: Record<string, unknown> | null;
  }>) {
    counts.clients.total += 1;
    const adminViewedAt =
      typeof p.metadata?.admin_viewed_at === "string"
        ? (p.metadata.admin_viewed_at as string)
        : null;
    const latestTaskCreated = latestClientTaskByProfile.get(p.id) ?? null;
    if (isEntityUnread(adminViewedAt, latestTaskCreated)) {
      counts.clients.unread += 1;
    }
  }

  // ── Candidates (inventory + per-profile unread) ──
  for (const p of (candidateProfiles ?? []) as Array<{
    id: string;
    metadata: Record<string, unknown> | null;
  }>) {
    counts.candidates.total += 1;
    const adminViewedAt =
      typeof p.metadata?.admin_viewed_at === "string"
        ? (p.metadata.admin_viewed_at as string)
        : null;
    const latestTaskCreated = latestCandidateTaskByProfile.get(p.id) ?? null;
    if (isEntityUnread(adminViewedAt, latestTaskCreated)) {
      counts.candidates.unread += 1;
    }
  }

  // In Basket includes pending entity tasks in its denominator (matches
  // the hero's "Queued" semantics).
  counts.in_basket.total +=
    (pendingBpTasks?.length ?? 0) + (pendingSiteTasks?.length ?? 0);

  return NextResponse.json({ counts });
}
