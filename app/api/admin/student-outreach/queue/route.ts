/**
 * GET /api/admin/student-outreach/queue
 *
 * v7: tab-driven query. Returns rows for the requested tab plus counts
 * for ALL tabs (so the UI can show accurate badges in one round-trip).
 *
 * Tabs (workflow order):
 *   research   — status IN (prospect, researched)
 *   calls      — pending outreach_followup_call task with due_at <= now
 *   replies    — outreach_sent + engaged (excludes active_partner); enriched
 *                with stale flag, meeting flag, post-meeting follow-up notes
 *   meetings   — most-recent meeting touchpoint is in_flight or scheduled
 *   partners   — status = active_partner
 *   all        — everything (with show_closed toggle)
 *
 * Active Partners are excluded from research / calls / replies / meetings.
 * Closed rows only appear in `all` (and only when show_closed=true).
 *
 * Per-row indicators (across tabs where applicable):
 *   has_custom_task      — pending manual_followup with payload.reason='custom'
 *   stale_days           — only for replies; days since last email_sent (if >4)
 *   meeting_state        — none | in_flight | scheduled
 *   meeting_at           — when meeting_state=scheduled
 *   followup_notes       — when row has recent post_meeting_followup
 *   followup_author_id   — admin user_id who logged the followup
 *   followup_at          — when the followup was logged
 *   primary_contact_*    — name + phone (calls tab needs phone prominent)
 *   last_activity_at     — most recent touchpoint (replaces 4-hour timer)
 *   custom_task_summary  — first description of pending custom tasks
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type {
  Campus,
  OutreachRow,
  StakeholderType,
  Status,
} from "@/lib/student-outreach/types";

const PAGE_SIZE_DEFAULT = 50;
const STALE_DAYS = 4;

const RESEARCH_STATUSES: Status[] = ["prospect", "researched"];
const REPLIES_STATUSES: Status[] = ["outreach_sent", "engaged"];
const PARTNER_STATUSES: Status[] = ["active_partner"];
const CLOSED_STATUSES: Status[] = [
  "not_interested",
  "no_response_closed",
  "do_not_contact",
  "wrong_contact",
  "redirected",
];
// Legacy active-partner values (pre-migration 065); still surface in Partners.
const PARTNER_ALL: string[] = [...PARTNER_STATUSES, "agreed", "distributed"];

type DB = ReturnType<typeof getServiceClient>;

export interface TabCounts {
  research: number;
  calls: number;
  replies: number;
  meetings: number;
  partners: number;
  all: number;
}

export interface TabRow extends OutreachRow {
  campus_name: string;
  campus_slug: string;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  has_custom_task: boolean;
  custom_task_summary: string | null;
  stale_days: number | null;
  meeting_state: "none" | "in_flight" | "scheduled";
  meeting_at: string | null;
  followup_notes: string | null;
  followup_author: string | null;
  followup_at: string | null;
  last_activity_at: string | null;
  /** Calls tab only: the due call task. */
  due_call_task: { id: string; due_at: string } | null;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();
  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") ?? "research";
  const campusSlug = url.searchParams.get("campus");
  const typeFilter = url.searchParams.get("type") as StakeholderType | null;
  const search = (url.searchParams.get("search") ?? "").trim();
  const showClosed = url.searchParams.get("show_closed") === "true";
  const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0", 10));
  const pageSize = Math.min(
    200,
    Math.max(1, parseInt(url.searchParams.get("pageSize") ?? String(PAGE_SIZE_DEFAULT), 10)),
  );

  // Active campuses (dropdown).
  const { data: campuses } = await db
    .from("student_outreach_campuses")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
  const campusList = (campuses ?? []) as Campus[];
  const campusMap = new Map(campusList.map((c) => [c.id, c]));
  const selectedCampus = campusSlug
    ? campusList.find((c) => c.slug === campusSlug) ?? null
    : null;

  // Counts for all tabs (one efficient pass + a few small queries).
  const tabCounts = await computeTabCounts(db, {
    campusId: selectedCampus?.id ?? null,
    type: typeFilter,
  });

  // Per-tab base row IDs.
  const rowIds = await fetchRowIdsForTab(db, {
    tab,
    campusId: selectedCampus?.id ?? null,
    type: typeFilter,
    search,
    showClosed,
    page,
    pageSize,
  });
  if (rowIds.length === 0) {
    return NextResponse.json({
      campuses: campusList,
      rows: [],
      total: 0,
      tab_counts: tabCounts,
    });
  }

  // Hydrate the row objects + indicator data.
  const rows = await hydrateRows(db, rowIds, tab, campusMap);

  return NextResponse.json({
    campuses: campusList,
    rows,
    total: rows.length,
    tab_counts: tabCounts,
  });
}

// ── Counts ──────────────────────────────────────────────────────────────

async function computeTabCounts(
  db: DB,
  filters: { campusId: string | null; type: StakeholderType | null },
): Promise<TabCounts> {
  const counts: TabCounts = { research: 0, calls: 0, replies: 0, meetings: 0, partners: 0, all: 0 };

  // Single status scan in scope.
  let q = db.from("student_outreach").select("id, status");
  if (filters.campusId) q = q.eq("campus_id", filters.campusId);
  if (filters.type) q = q.eq("stakeholder_type", filters.type);
  const { data: scan } = await q;

  const research = new Set<string>(RESEARCH_STATUSES);
  const replies = new Set<string>(REPLIES_STATUSES);
  const partner = new Set<string>(PARTNER_ALL);

  let inProgressIds: string[] = [];
  for (const row of (scan ?? []) as Array<{ id: string; status: string }>) {
    counts.all++;
    if (research.has(row.status)) counts.research++;
    else if (partner.has(row.status)) counts.partners++;
    else if (replies.has(row.status)) {
      counts.replies++;
      inProgressIds.push(row.id);
    }
  }

  // Calls count: distinct outreach_id with a pending call task due now.
  // Scope to current filters.
  // We filter out partner statuses at the SQL level so the join shape
  // doesn't need a runtime status check (and avoids supabase-js's array
  // typing on inner joins from leaking into our consumer code).
  let callQ = db
    .from("student_outreach_tasks")
    .select("outreach_id, student_outreach!inner(campus_id, stakeholder_type)")
    .eq("status", "pending")
    .eq("task_type", "outreach_followup_call")
    .lte("due_at", new Date().toISOString())
    .not("student_outreach.status", "in", `(${PARTNER_ALL.map((s) => `"${s}"`).join(",")})`);
  if (filters.campusId) callQ = callQ.eq("student_outreach.campus_id", filters.campusId);
  if (filters.type) callQ = callQ.eq("student_outreach.stakeholder_type", filters.type);
  const { data: callTasks } = await callQ;
  const callSet = new Set<string>();
  for (const t of (callTasks ?? []) as Array<{ outreach_id: string }>) {
    callSet.add(t.outreach_id);
  }
  counts.calls = callSet.size;

  // Meetings count: among in-progress rows, those whose most-recent
  // meeting-related touchpoint is in_flight or scheduled.
  if (inProgressIds.length > 0) {
    counts.meetings = await countMeetingsAmongRows(db, inProgressIds);
  }

  return counts;
}

/**
 * For each row, find the most-recent meeting-related touchpoint and
 * count those whose state is in_flight or scheduled.
 */
async function countMeetingsAmongRows(db: DB, ids: string[]): Promise<number> {
  // We query touchpoints in the relevant scope ordered by created_at DESC
  // and tally the first match per outreach_id.
  const { data } = await db
    .from("student_outreach_touchpoints")
    .select("outreach_id, touchpoint_type, payload, created_at")
    .in("outreach_id", ids)
    .or(
      "touchpoint_type.eq.meeting_scheduled," +
      "touchpoint_type.eq.meeting_held," +
      "touchpoint_type.eq.meeting_no_show," +
      "touchpoint_type.eq.meeting_rescheduled," +
      "touchpoint_type.eq.note_added",
    )
    .order("created_at", { ascending: false });

  const seen = new Set<string>();
  let count = 0;
  for (const tp of (data ?? []) as Array<{
    outreach_id: string;
    touchpoint_type: string;
    payload: Record<string, unknown> | null;
  }>) {
    if (seen.has(tp.outreach_id)) continue;
    const reason = tp.payload?.reason;
    if (tp.touchpoint_type === "note_added" && reason !== "meeting_in_flight") continue;
    seen.add(tp.outreach_id);
    if (tp.touchpoint_type === "meeting_scheduled") count++;
    else if (tp.touchpoint_type === "note_added" && reason === "meeting_in_flight") count++;
    // meeting_held / no_show / rescheduled = not currently in meetings tab
  }
  return count;
}

// ── Per-tab row ID fetchers ─────────────────────────────────────────────

async function fetchRowIdsForTab(
  db: DB,
  opts: {
    tab: string;
    campusId: string | null;
    type: StakeholderType | null;
    search: string;
    showClosed: boolean;
    page: number;
    pageSize: number;
  },
): Promise<string[]> {
  const { tab, campusId, type, search, showClosed, page, pageSize } = opts;

  switch (tab) {
    case "research":
      return await idsByStatus(db, RESEARCH_STATUSES, { campusId, type, search, page, pageSize });
    case "partners":
      return await idsByStatus(db, PARTNER_ALL as Status[], { campusId, type, search, page, pageSize });
    case "all": {
      const inc = showClosed
        ? [...RESEARCH_STATUSES, ...REPLIES_STATUSES, ...PARTNER_ALL, ...CLOSED_STATUSES]
        : [...RESEARCH_STATUSES, ...REPLIES_STATUSES, ...PARTNER_ALL];
      return await idsByStatus(db, inc as Status[], { campusId, type, search, page, pageSize });
    }
    case "replies":
      return await idsByStatus(db, REPLIES_STATUSES, { campusId, type, search, page, pageSize });
    case "calls":
      return await idsByCallsDue(db, { campusId, type, search, page, pageSize });
    case "meetings":
      return await idsByMeetings(db, { campusId, type, search, page, pageSize });
    default:
      return [];
  }
}

interface QueryOpts {
  campusId: string | null;
  type: StakeholderType | null;
  search: string;
  page: number;
  pageSize: number;
}

async function idsByStatus(
  db: DB,
  statuses: Status[],
  opts: QueryOpts,
): Promise<string[]> {
  let q = db
    .from("student_outreach")
    .select("id")
    .in("status", statuses)
    .order("last_edited_at", { ascending: false })
    .range(opts.page * opts.pageSize, opts.page * opts.pageSize + opts.pageSize - 1);
  if (opts.campusId) q = q.eq("campus_id", opts.campusId);
  if (opts.type) q = q.eq("stakeholder_type", opts.type);
  if (opts.search) q = q.ilike("organization_name", `%${opts.search}%`);
  const { data } = await q;
  return ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
}

async function idsByCallsDue(db: DB, opts: QueryOpts): Promise<string[]> {
  let q = db
    .from("student_outreach_tasks")
    .select("outreach_id, due_at, student_outreach!inner(campus_id, stakeholder_type, organization_name)")
    .eq("status", "pending")
    .eq("task_type", "outreach_followup_call")
    .lte("due_at", new Date().toISOString())
    .not("student_outreach.status", "in", `(${PARTNER_ALL.map((s) => `"${s}"`).join(",")})`)
    .order("due_at", { ascending: true });
  if (opts.campusId) q = q.eq("student_outreach.campus_id", opts.campusId);
  if (opts.type) q = q.eq("student_outreach.stakeholder_type", opts.type);
  if (opts.search) q = q.ilike("student_outreach.organization_name", `%${opts.search}%`);
  const { data } = await q;
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const t of (data ?? []) as Array<{ outreach_id: string }>) {
    if (seen.has(t.outreach_id)) continue;
    seen.add(t.outreach_id);
    ids.push(t.outreach_id);
    if (ids.length >= opts.pageSize) break;
  }
  return ids;
}

async function idsByMeetings(db: DB, opts: QueryOpts): Promise<string[]> {
  // First, get candidate in-progress rows in scope.
  let baseQ = db
    .from("student_outreach")
    .select("id")
    .in("status", REPLIES_STATUSES);
  if (opts.campusId) baseQ = baseQ.eq("campus_id", opts.campusId);
  if (opts.type) baseQ = baseQ.eq("stakeholder_type", opts.type);
  if (opts.search) baseQ = baseQ.ilike("organization_name", `%${opts.search}%`);
  const { data: candidates } = await baseQ;
  const candidateIds = ((candidates ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (candidateIds.length === 0) return [];

  // Determine meeting state per row from latest meeting-related touchpoint.
  const stateById = await meetingStatePerRow(db, candidateIds);
  const filtered: string[] = [];
  for (const id of candidateIds) {
    const state = stateById.get(id) ?? "none";
    if (state === "in_flight" || state === "scheduled") filtered.push(id);
    if (filtered.length >= opts.pageSize) break;
  }
  return filtered;
}

async function meetingStatePerRow(db: DB, ids: string[]): Promise<Map<string, "none" | "in_flight" | "scheduled">> {
  const { data } = await db
    .from("student_outreach_touchpoints")
    .select("outreach_id, touchpoint_type, payload, created_at")
    .in("outreach_id", ids)
    .or(
      "touchpoint_type.eq.meeting_scheduled," +
      "touchpoint_type.eq.meeting_held," +
      "touchpoint_type.eq.meeting_no_show," +
      "touchpoint_type.eq.meeting_rescheduled," +
      "touchpoint_type.eq.note_added",
    )
    .order("created_at", { ascending: false });

  const out = new Map<string, "none" | "in_flight" | "scheduled">();
  for (const tp of (data ?? []) as Array<{
    outreach_id: string;
    touchpoint_type: string;
    payload: Record<string, unknown> | null;
  }>) {
    if (out.has(tp.outreach_id)) continue;
    const reason = tp.payload?.reason;
    // note_added with reason=meeting_in_flight or scheduled is the signal
    if (tp.touchpoint_type === "note_added") {
      if (reason === "meeting_in_flight") {
        out.set(tp.outreach_id, "in_flight");
      } else if (reason === "post_meeting_followup") {
        out.set(tp.outreach_id, "none"); // had a meeting but is now in followup
      }
      // Other note_added reasons aren't meeting-related → don't decide here, keep looking
      // But out.has is the gate; we need to skip non-meeting note_added
      if (reason !== "meeting_in_flight" && reason !== "post_meeting_followup") {
        out.delete(tp.outreach_id);
        continue;
      }
    } else if (tp.touchpoint_type === "meeting_scheduled") {
      out.set(tp.outreach_id, "scheduled");
    } else if (
      tp.touchpoint_type === "meeting_held" ||
      tp.touchpoint_type === "meeting_no_show" ||
      tp.touchpoint_type === "meeting_rescheduled"
    ) {
      out.set(tp.outreach_id, "none");
    }
  }
  return out;
}

// ── Hydrate rows with all indicators ────────────────────────────────────

async function hydrateRows(
  db: DB,
  ids: string[],
  tab: string,
  campusMap: Map<string, Campus>,
): Promise<TabRow[]> {
  // Fetch outreach rows.
  const { data: rowsRaw } = await db
    .from("student_outreach")
    .select("*")
    .in("id", ids);
  const rowMap = new Map<string, OutreachRow>();
  for (const r of (rowsRaw ?? []) as OutreachRow[]) rowMap.set(r.id, r);
  // Preserve order from ids.
  const orderedRows = ids.map((id) => rowMap.get(id)).filter((r): r is OutreachRow => Boolean(r));

  if (orderedRows.length === 0) return [];

  // Parallel hydration: contacts + tasks + touchpoints.
  const [contactsRes, tasksRes, touchpointsRes] = await Promise.all([
    db
      .from("student_outreach_contacts")
      .select("outreach_id, name, phone, is_primary, status, created_at")
      .in("outreach_id", ids)
      .eq("status", "active")
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true }),
    db
      .from("student_outreach_tasks")
      .select("id, outreach_id, task_type, due_at, payload, status")
      .in("outreach_id", ids)
      .eq("status", "pending"),
    db
      .from("student_outreach_touchpoints")
      .select("outreach_id, touchpoint_type, payload, notes, created_at, created_by")
      .in("outreach_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  // Primary contact per row.
  const primaryByOutreach = new Map<string, { name: string; phone: string | null }>();
  for (const c of (contactsRes.data ?? []) as Array<{ outreach_id: string; name: string; phone: string | null }>) {
    if (!primaryByOutreach.has(c.outreach_id)) primaryByOutreach.set(c.outreach_id, { name: c.name, phone: c.phone });
  }

  // Custom-task indicator + due-call task per row.
  const customTaskByOutreach = new Map<string, string>();
  const dueCallTaskByOutreach = new Map<string, { id: string; due_at: string }>();
  const nowIso = new Date().toISOString();
  for (const t of (tasksRes.data ?? []) as Array<{
    id: string;
    outreach_id: string;
    task_type: string;
    due_at: string;
    payload: Record<string, unknown> | null;
  }>) {
    if (
      t.task_type === "manual_followup" &&
      t.payload?.reason === "custom" &&
      !customTaskByOutreach.has(t.outreach_id)
    ) {
      customTaskByOutreach.set(t.outreach_id, String(t.payload.notes ?? t.payload.description ?? "Custom task"));
    }
    if (
      t.task_type === "outreach_followup_call" &&
      t.due_at <= nowIso &&
      !dueCallTaskByOutreach.has(t.outreach_id)
    ) {
      dueCallTaskByOutreach.set(t.outreach_id, { id: t.id, due_at: t.due_at });
    }
  }

  // Indicators derived from touchpoints (per row).
  const lastEmailSentByOutreach = new Map<string, string>();
  const lastReplyByOutreach = new Map<string, string>();
  const meetingStateByOutreach = new Map<string, { state: "in_flight" | "scheduled" | "none"; meeting_at: string | null }>();
  const followupByOutreach = new Map<string, { notes: string; author: string | null; at: string }>();
  const lastActivityByOutreach = new Map<string, string>();

  for (const tp of (touchpointsRes.data ?? []) as Array<{
    outreach_id: string;
    touchpoint_type: string;
    payload: Record<string, unknown> | null;
    notes: string | null;
    created_at: string;
    created_by: string | null;
  }>) {
    if (!lastActivityByOutreach.has(tp.outreach_id)) {
      lastActivityByOutreach.set(tp.outreach_id, tp.created_at);
    }
    if (tp.touchpoint_type === "email_sent" && !lastEmailSentByOutreach.has(tp.outreach_id)) {
      lastEmailSentByOutreach.set(tp.outreach_id, tp.created_at);
    }
    if (tp.touchpoint_type === "email_replied" && !lastReplyByOutreach.has(tp.outreach_id)) {
      lastReplyByOutreach.set(tp.outreach_id, tp.created_at);
    }
    // Meeting state + post-meeting follow-up: use the FIRST meeting-related
    // touchpoint we encounter (most recent due to DESC ordering). Setting a
    // sentinel "none" entry on meeting_held/no_show/rescheduled blocks older
    // meeting_scheduled touchpoints from incorrectly resurrecting a row in
    // the Meetings tab.
    if (!meetingStateByOutreach.has(tp.outreach_id)) {
      if (tp.touchpoint_type === "meeting_scheduled") {
        meetingStateByOutreach.set(tp.outreach_id, {
          state: "scheduled",
          meeting_at: (tp.payload?.meeting_at as string) ?? null,
        });
      } else if (tp.touchpoint_type === "note_added" && tp.payload?.reason === "meeting_in_flight") {
        meetingStateByOutreach.set(tp.outreach_id, { state: "in_flight", meeting_at: null });
      } else if (
        tp.touchpoint_type === "meeting_held" ||
        tp.touchpoint_type === "meeting_no_show" ||
        tp.touchpoint_type === "meeting_rescheduled"
      ) {
        meetingStateByOutreach.set(tp.outreach_id, { state: "none", meeting_at: null });
      } else if (tp.touchpoint_type === "note_added" && tp.payload?.reason === "post_meeting_followup") {
        // Post-meeting followup is itself a "no current meeting" signal.
        meetingStateByOutreach.set(tp.outreach_id, { state: "none", meeting_at: null });
      }
    }
    if (
      !followupByOutreach.has(tp.outreach_id) &&
      tp.touchpoint_type === "note_added" &&
      tp.payload?.reason === "post_meeting_followup"
    ) {
      followupByOutreach.set(tp.outreach_id, {
        notes: (tp.payload?.notes as string) ?? tp.notes ?? "",
        author: tp.created_by ?? null,
        at: tp.created_at,
      });
    }
  }

  // Build TabRow output.
  const tabRows: TabRow[] = orderedRows.map((row) => {
    const primary = primaryByOutreach.get(row.id) ?? null;
    const ms = meetingStateByOutreach.get(row.id);
    const lastEmail = lastEmailSentByOutreach.get(row.id);
    const reply = lastReplyByOutreach.get(row.id);
    const stale = computeStaleDays(lastEmail, reply);
    const followup = followupByOutreach.get(row.id);
    const camp = campusMap.get(row.campus_id);
    return {
      ...row,
      campus_name: camp?.name ?? "(unknown campus)",
      campus_slug: camp?.slug ?? "",
      primary_contact_name: primary?.name ?? null,
      primary_contact_phone: primary?.phone ?? null,
      has_custom_task: customTaskByOutreach.has(row.id),
      custom_task_summary: customTaskByOutreach.get(row.id) ?? null,
      stale_days: tab === "replies" ? stale : null,
      meeting_state: ms?.state ?? "none",
      meeting_at: ms?.meeting_at ?? null,
      followup_notes: followup?.notes ?? null,
      followup_author: followup?.author ?? null,
      followup_at: followup?.at ?? null,
      last_activity_at: lastActivityByOutreach.get(row.id) ?? null,
      due_call_task: tab === "calls" ? dueCallTaskByOutreach.get(row.id) ?? null : null,
    };
  });

  return tabRows;
}

function computeStaleDays(lastEmailSent: string | undefined, lastReply: string | undefined): number | null {
  if (!lastEmailSent) return null;
  if (lastReply && new Date(lastReply) > new Date(lastEmailSent)) return null;
  const days = Math.floor((Date.now() - new Date(lastEmailSent).getTime()) / 86_400_000);
  return days >= STALE_DAYS ? days : null;
}
