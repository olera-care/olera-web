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
import {
  computeStaleDays,
  deriveRepliesState,
  deriveStateFromTouchpoints,
  type DerivedState,
  type TouchpointRow,
} from "@/lib/student-outreach/state-derivation";
import type {
  AwaitingCallbackKind,
  Campus,
  OutreachRow,
  RepliesState,
  StakeholderType,
  Status,
} from "@/lib/student-outreach/types";

const PAGE_SIZE_DEFAULT = 50;

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
  /** v8 Replies tab only: which state card to render. */
  replies_state: RepliesState | null;
  awaiting_callback_at: string | null;
  awaiting_callback_kind: AwaitingCallbackKind | null;
  /** v8 humanized next-scheduled-action label (Partners tab today). */
  next_step_label: string | null;
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

  // v8.4: Research tab gets an additional `research_campuses` array — one
  // card per campus where research_complete=false, surfaced above the
  // stakeholder rows as an entry-point/acceleration tool. Per-stakeholder
  // rows are unchanged.
  let researchCampuses: Awaited<ReturnType<typeof fetchResearchCampuses>> | null = null;
  if (tab === "research") {
    try {
      researchCampuses = await fetchResearchCampuses(db, selectedCampus?.id ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load campuses-in-research";
      console.error("[student-outreach/queue]", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  if (rowIds.length === 0) {
    return NextResponse.json({
      campuses: campusList,
      rows: [],
      total: 0,
      tab_counts: tabCounts,
      research_campuses: researchCampuses,
    });
  }

  // Hydrate the row objects + indicator data.
  let rows = await hydrateRows(db, rowIds, tab, campusMap);

  // v8.2: booked rows live only in Meetings tab. Filter out of Replies.
  if (tab === "replies") {
    rows = rows.filter((r) => r.replies_state !== "booked");
  }

  return NextResponse.json({
    campuses: campusList,
    rows,
    total: rows.length,
    tab_counts: tabCounts,
    research_campuses: researchCampuses,
  });
}

/**
 * v8.4: campuses with research_complete=false. Returns id, slug, name,
 * city, state, count of stakeholders still in research stage, and the
 * most recent stakeholder created_at across all statuses (for the
 * "Last added Xh ago" copy on the card).
 */
async function fetchResearchCampuses(
  db: DB,
  filterCampusId: string | null,
): Promise<Array<{
  id: string;
  slug: string;
  name: string;
  state: string | null;
  city: string | null;
  research_stakeholder_count: number;
  last_added_at: string | null;
}>> {
  let q = db
    .from("student_outreach_campuses")
    .select("id, slug, name, state, city")
    .eq("is_active", true)
    .eq("research_complete", false);
  if (filterCampusId) q = q.eq("id", filterCampusId);
  const { data: rows, error } = await q;
  if (error) {
    // Most likely cause: migration 069 (research_complete column) has not
    // been applied to this database yet. Throw so the GET handler can
    // surface the message to the UI instead of returning an empty list
    // and leaving the admin staring at a blank Research tab.
    throw new Error(
      `Failed to load campuses-in-research: ${error.message}. ` +
        `If this references "research_complete", run migration 069_campus_research_complete.sql in Supabase.`,
    );
  }
  const campusRows = (rows ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    state: string | null;
    city: string | null;
  }>;
  if (campusRows.length === 0) return [];

  const campusIds = campusRows.map((c) => c.id);

  // Single sweep: pull (campus_id, status, created_at) for all stakeholders
  // in scope, then aggregate per campus in JS.
  const { data: stakeholders } = await db
    .from("student_outreach")
    .select("campus_id, status, created_at")
    .in("campus_id", campusIds);

  const RESEARCH_STAGE = new Set<string>(["prospect", "researched"]);
  const counts = new Map<string, number>();
  const lastAddedAt = new Map<string, string>();
  for (const s of (stakeholders ?? []) as Array<{
    campus_id: string;
    status: string;
    created_at: string;
  }>) {
    if (RESEARCH_STAGE.has(s.status)) {
      counts.set(s.campus_id, (counts.get(s.campus_id) ?? 0) + 1);
    }
    const cur = lastAddedAt.get(s.campus_id);
    if (!cur || s.created_at > cur) lastAddedAt.set(s.campus_id, s.created_at);
  }

  return campusRows
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      state: c.state,
      city: c.city,
      research_stakeholder_count: counts.get(c.id) ?? 0,
      last_added_at: lastAddedAt.get(c.id) ?? null,
    }))
    .sort((a, b) => {
      // Most recently active first; null last_added_at sinks to the bottom.
      const aTime = a.last_added_at ? new Date(a.last_added_at).getTime() : 0;
      const bTime = b.last_added_at ? new Date(b.last_added_at).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.name.localeCompare(b.name);
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
  // meeting-related touchpoint is in_flight or scheduled. Also: rows
  // with state=scheduled are dropped from the Replies tab in v8.2, so
  // we subtract them from the replies count here.
  if (inProgressIds.length > 0) {
    const { meetings, scheduled } = await countMeetingsAmongRows(db, inProgressIds);
    counts.meetings = meetings;
    counts.replies = Math.max(0, counts.replies - scheduled);
  }

  return counts;
}

/**
 * For each row, derive meeting state and return:
 *   - meetings: in_flight + scheduled (Meetings-tab membership count)
 *   - scheduled: scheduled-only (subtracted from Replies count, since
 *                booked rows live only in Meetings now)
 */
async function countMeetingsAmongRows(
  db: DB,
  ids: string[],
): Promise<{ meetings: number; scheduled: number }> {
  const tpsByRow = await fetchTouchpointsByRow(db, ids);
  let meetings = 0;
  let scheduled = 0;
  for (const id of ids) {
    const state = deriveStateFromTouchpoints(tpsByRow.get(id) ?? []);
    if (state.meeting_state === "scheduled") {
      meetings++;
      scheduled++;
    } else if (state.meeting_state === "in_flight") {
      meetings++;
    }
  }
  return { meetings, scheduled };
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

  // Determine meeting state per row using the shared v8 derivation.
  const tpsByRow = await fetchTouchpointsByRow(db, candidateIds);
  const filtered: string[] = [];
  for (const id of candidateIds) {
    const state = deriveStateFromTouchpoints(tpsByRow.get(id) ?? []);
    if (state.meeting_state === "in_flight" || state.meeting_state === "scheduled") filtered.push(id);
    if (filtered.length >= opts.pageSize) break;
  }
  return filtered;
}

async function fetchTouchpointsByRow(db: DB, ids: string[]): Promise<Map<string, TouchpointRow[]>> {
  const { data } = await db
    .from("student_outreach_touchpoints")
    .select("outreach_id, touchpoint_type, payload, notes, created_at, created_by")
    .in("outreach_id", ids)
    .order("created_at", { ascending: false });
  const out = new Map<string, TouchpointRow[]>();
  for (const tp of (data ?? []) as TouchpointRow[]) {
    let list = out.get(tp.outreach_id);
    if (!list) {
      list = [];
      out.set(tp.outreach_id, list);
    }
    list.push(tp);
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

  // Custom-task indicator + due-call task + pending-email-task indicator (for stale derivation)
  // + earliest pending task per row (for the Partners-tab "Next step" pill).
  const customTaskByOutreach = new Map<string, string>();
  const dueCallTaskByOutreach = new Map<string, { id: string; due_at: string }>();
  const hasPendingEmail = new Set<string>();
  const earliestTaskByOutreach = new Map<string, { task_type: string; due_at: string; payload: Record<string, unknown> | null }>();
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
    if (t.task_type === "outreach_email_send") {
      hasPendingEmail.add(t.outreach_id);
    }
    const cur = earliestTaskByOutreach.get(t.outreach_id);
    if (!cur || t.due_at < cur.due_at) {
      earliestTaskByOutreach.set(t.outreach_id, {
        task_type: t.task_type,
        due_at: t.due_at,
        payload: t.payload,
      });
    }
  }

  // Group touchpoints per outreach (already DESC from query).
  const tpsByOutreach = new Map<string, TouchpointRow[]>();
  for (const tp of (touchpointsRes.data ?? []) as TouchpointRow[]) {
    let list = tpsByOutreach.get(tp.outreach_id);
    if (!list) {
      list = [];
      tpsByOutreach.set(tp.outreach_id, list);
    }
    list.push(tp);
  }

  // Derive state per row.
  const stateByOutreach = new Map<string, DerivedState>();
  for (const id of ids) {
    stateByOutreach.set(id, deriveStateFromTouchpoints(tpsByOutreach.get(id) ?? []));
  }

  // Build TabRow output.
  const tabRows: TabRow[] = orderedRows.map((row) => {
    const primary = primaryByOutreach.get(row.id) ?? null;
    const state = stateByOutreach.get(row.id)!;
    const camp = campusMap.get(row.campus_id);
    const repliesState =
      tab === "replies"
        ? deriveRepliesState(state, hasPendingEmail.has(row.id))
        : null;
    const earliestTask = earliestTaskByOutreach.get(row.id) ?? null;
    return {
      ...row,
      campus_name: camp?.name ?? "(unknown campus)",
      campus_slug: camp?.slug ?? "",
      primary_contact_name: primary?.name ?? null,
      primary_contact_phone: primary?.phone ?? null,
      has_custom_task: customTaskByOutreach.has(row.id),
      custom_task_summary: customTaskByOutreach.get(row.id) ?? null,
      stale_days:
        tab === "replies"
          ? computeStaleDays(state.last_email_sent_at, state.last_reply_at)
          : null,
      meeting_state: state.meeting_state,
      meeting_at: state.meeting_at,
      followup_notes: state.followup_notes,
      followup_author: state.followup_author,
      followup_at: state.followup_at,
      last_activity_at: state.last_activity_at,
      due_call_task: tab === "calls" ? dueCallTaskByOutreach.get(row.id) ?? null : null,
      replies_state: repliesState,
      awaiting_callback_at: state.awaiting_callback_at,
      awaiting_callback_kind: state.awaiting_callback_kind,
      next_step_label: deriveNextStepLabel(row.status, earliestTask),
    };
  });

  return tabRows;
}

/**
 * Humanize the earliest pending task into a "Next: …" label. Used by the
 * Partners-tab pill but tab-agnostic — any caller can render it.
 * Returns null when there's no useful next step (e.g. mid-cadence rows
 * already surface their state via the cadence step list).
 */
function deriveNextStepLabel(
  status: string,
  task: { task_type: string; due_at: string; payload: Record<string, unknown> | null } | null,
): string | null {
  if (!task) {
    return status === "active_partner" ? "No upcoming tasks" : null;
  }
  const when = formatRelativeFuture(task.due_at);
  switch (task.task_type) {
    case "outreach_email_send": {
      const season = task.payload?.season as string | undefined;
      if (status === "active_partner" && season) {
        return `Next: ${formatSeason(season)} email · ${when}`;
      }
      const day = task.payload?.day as number | undefined;
      return typeof day === "number" && day >= 0
        ? `Next: Day ${day} email · ${when}`
        : `Next: email · ${when}`;
    }
    case "outreach_followup_call":
      return `Next: follow-up call · ${when}`;
    case "outreach_followup_email":
      return `Next: follow-up email · ${when}`;
    case "yearly_leadership_recheck":
      return `Next: leadership recheck · ${when}`;
    case "partner_seasonal_checkin":
      return `Next: seasonal check-in · ${when}`;
    case "partner_share_update":
      return `Next: share update · ${when}`;
    case "approval_request_followup":
      return `Next: approval check-in · ${when}`;
    case "manual_followup":
      // Custom tasks already surface as the ⭐ pill — don't double up.
      if (task.payload?.reason === "custom") return null;
      return `Next: manual follow-up · ${when}`;
    default:
      return `Next: ${task.task_type.replace(/_/g, " ")} · ${when}`;
  }
}

function formatSeason(season: string): string {
  // "fall_kickoff" → "fall kickoff"
  return season.replace(/_/g, " ");
}

function formatRelativeFuture(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) {
    const days = Math.round(-ms / 86_400_000);
    return days >= 1 ? `${days}d overdue` : "due now";
  }
  const min = Math.round(ms / 60_000);
  if (min < 60) return `in ${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `in ${hr}h`;
  const d = Math.round(hr / 24);
  if (d < 60) return `in ${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

