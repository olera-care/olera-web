/**
 * GET /api/admin/student-outreach/queue
 *
 * Returns campuses (for the dropdown) + paginated outreach rows + tab counts.
 *
 * Query params:
 *   campus      campus slug (optional filter)
 *   type        stakeholder type filter (optional)
 *   tab         today|upcoming|active|agreed|distributed|partners|approvals|blocked|reengage|closed|all
 *   search      substring on organization_name (optional)
 *   page        0-indexed page, default 0
 *   pageSize    default 50
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type { Campus, OutreachRow, QueueRow, StakeholderType, Status, TabCounts } from "@/lib/student-outreach/types";

const PAGE_SIZE_DEFAULT = 50;

const ACTIVE_STATUSES: Status[] = ["outreach_sent", "engaged", "meeting_scheduled"];
const CLOSED_STATUSES: Status[] = ["not_interested", "do_not_contact", "wrong_contact", "redirected"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();
  const url = new URL(req.url);
  const campusSlug = url.searchParams.get("campus");
  const typeFilter = url.searchParams.get("type") as StakeholderType | null;
  const tab = url.searchParams.get("tab") ?? "today";
  const search = (url.searchParams.get("search") ?? "").trim();
  const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0", 10));
  const pageSize = Math.min(
    200,
    Math.max(1, parseInt(url.searchParams.get("pageSize") ?? String(PAGE_SIZE_DEFAULT), 10)),
  );

  // ── Active campuses (dropdown) ─────────────────────────────────────────
  const { data: campuses, error: campusesErr } = await db
    .from("student_outreach_campuses")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (campusesErr) {
    return NextResponse.json({ error: campusesErr.message }, { status: 500 });
  }

  const campusList = (campuses ?? []) as Campus[];
  const campusMap = new Map(campusList.map((c) => [c.id, c]));
  const selectedCampus = campusSlug
    ? campusList.find((c) => c.slug === campusSlug) ?? null
    : null;

  // ── Tab counts (single grouped scan + auxiliary counts) ────────────────
  const tabCounts = await computeTabCounts(db, {
    campusId: selectedCampus?.id ?? null,
    type: typeFilter,
  });

  // ── Build the filtered query for the chosen tab ────────────────────────
  let query = db.from("student_outreach").select("*", { count: "exact" });

  if (selectedCampus) query = query.eq("campus_id", selectedCampus.id);
  if (typeFilter) query = query.eq("stakeholder_type", typeFilter);

  switch (tab) {
    case "active":
      query = query.in("status", ACTIVE_STATUSES);
      break;
    case "agreed":
      query = query.eq("status", "agreed");
      break;
    case "distributed":
      query = query.eq("status", "distributed");
      break;
    case "partners":
      query = query.eq("status", "active_partner");
      break;
    case "blocked":
      query = query.eq("stakeholder_type", "professor").eq("contact_permission", "not_yet");
      break;
    case "reengage":
      query = query
        .eq("status", "no_response_closed")
        .lte("reopen_at", new Date().toISOString().slice(0, 10));
      break;
    case "closed":
      query = query.in("status", CLOSED_STATUSES);
      break;
    case "today":
    case "upcoming":
    case "approvals":
    case "all":
    default:
      // Filtering for today/upcoming/approvals happens by joining with
      // tasks/approvals below; the base query stays unfiltered on status.
      break;
  }

  if (search) {
    query = query.ilike("organization_name", `%${search}%`);
  }

  query = query
    .order("last_edited_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  const { data: outreachRows, error: rowsErr, count } = await query;
  if (rowsErr) {
    return NextResponse.json({ error: rowsErr.message }, { status: 500 });
  }

  let rows = (outreachRows ?? []) as OutreachRow[];

  // ── Tab post-filters that depend on tasks/approvals ────────────────────
  if (tab === "today" || tab === "upcoming" || tab === "approvals") {
    const idSet = new Set(rows.map((r) => r.id));
    if (idSet.size > 0) {
      if (tab === "today" || tab === "upcoming") {
        const now = new Date();
        const horizon = new Date(now.getTime() + 7 * 86_400_000);
        const dueLte = (tab === "today" ? now : horizon).toISOString();
        const dueGt = tab === "today" ? null : now.toISOString();

        let taskQuery = db
          .from("student_outreach_tasks")
          .select("outreach_id")
          .in("outreach_id", Array.from(idSet))
          .eq("status", "pending")
          .lte("due_at", dueLte);
        if (dueGt) taskQuery = taskQuery.gt("due_at", dueGt);

        const { data: dueTasks } = await taskQuery;
        const dueOutreachIds = new Set((dueTasks ?? []).map((t) => t.outreach_id));
        rows = rows.filter((r) => dueOutreachIds.has(r.id));
      } else if (tab === "approvals") {
        const { data: openApprovals } = await db
          .from("student_outreach_approvals")
          .select("outreach_id")
          .in("outreach_id", Array.from(idSet))
          .eq("status", "requested");
        const ids = new Set((openApprovals ?? []).map((a) => a.outreach_id));
        rows = rows.filter((r) => ids.has(r.id));
      }
    } else {
      rows = [];
    }
  }

  // ── Hydrate with campus + next-task + primary-contact + open-approvals ──
  const ids = rows.map((r) => r.id);

  const [tasksRes, contactsRes, approvalsRes] = await Promise.all([
    ids.length === 0
      ? Promise.resolve({ data: [] })
      : db
          .from("student_outreach_tasks")
          .select("id, outreach_id, task_type, due_at")
          .in("outreach_id", ids)
          .eq("status", "pending")
          .order("due_at", { ascending: true }),
    ids.length === 0
      ? Promise.resolve({ data: [] })
      : db
          .from("student_outreach_contacts")
          .select("outreach_id, name, is_primary, status, created_at")
          .in("outreach_id", ids)
          .eq("status", "active")
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true }),
    ids.length === 0
      ? Promise.resolve({ data: [] })
      : db
          .from("student_outreach_approvals")
          .select("outreach_id")
          .in("outreach_id", ids)
          .eq("status", "requested"),
  ]);

  const nextTaskByOutreach = new Map<string, { id: string; task_type: string; due_at: string }>();
  for (const t of (tasksRes.data ?? []) as Array<{ id: string; outreach_id: string; task_type: string; due_at: string }>) {
    if (!nextTaskByOutreach.has(t.outreach_id)) {
      nextTaskByOutreach.set(t.outreach_id, { id: t.id, task_type: t.task_type, due_at: t.due_at });
    }
  }

  const primaryContactByOutreach = new Map<string, string>();
  for (const c of (contactsRes.data ?? []) as Array<{ outreach_id: string; name: string }>) {
    if (!primaryContactByOutreach.has(c.outreach_id)) {
      primaryContactByOutreach.set(c.outreach_id, c.name);
    }
  }

  const openApprovalCount = new Map<string, number>();
  for (const a of (approvalsRes.data ?? []) as Array<{ outreach_id: string }>) {
    openApprovalCount.set(a.outreach_id, (openApprovalCount.get(a.outreach_id) ?? 0) + 1);
  }

  const queueRows: QueueRow[] = rows.map((r) => {
    const c = campusMap.get(r.campus_id);
    const nextTask = nextTaskByOutreach.get(r.id) ?? null;
    return {
      ...r,
      campus_name: c?.name ?? "(unknown campus)",
      campus_slug: c?.slug ?? "",
      next_task: nextTask
        ? { id: nextTask.id, task_type: nextTask.task_type as QueueRow["next_task"] extends { task_type: infer T } ? T : never, due_at: nextTask.due_at }
        : null,
      primary_contact_name: primaryContactByOutreach.get(r.id) ?? null,
      open_approvals: openApprovalCount.get(r.id) ?? 0,
    };
  });

  return NextResponse.json({
    campuses: campusList,
    rows: queueRows,
    total: count ?? queueRows.length,
    tabCounts,
  });
}

// ── Tab-count computation (single scan + 3 small aux queries) ────────────

type DB = ReturnType<typeof getServiceClient>;

async function computeTabCounts(
  db: DB,
  filters: { campusId: string | null; type: StakeholderType | null },
): Promise<TabCounts> {
  const counts: TabCounts = {
    today: 0,
    upcoming: 0,
    active: 0,
    agreed: 0,
    distributed: 0,
    partners: 0,
    approvals: 0,
    blocked: 0,
    reengage: 0,
    closed: 0,
    all: 0,
  };

  // Single scan: status + reopen + permission per row.
  let q = db.from("student_outreach").select("id, status, stakeholder_type, contact_permission, reopen_at");
  if (filters.campusId) q = q.eq("campus_id", filters.campusId);
  if (filters.type) q = q.eq("stakeholder_type", filters.type);

  const { data: scan, error } = await q;
  if (error || !scan) return counts;

  const todayIso = new Date().toISOString().slice(0, 10);

  for (const row of scan as Array<{
    id: string;
    status: Status;
    stakeholder_type: StakeholderType;
    contact_permission: string;
    reopen_at: string | null;
  }>) {
    counts.all++;
    if (ACTIVE_STATUSES.includes(row.status)) counts.active++;
    if (row.status === "agreed") counts.agreed++;
    if (row.status === "distributed") counts.distributed++;
    if (row.status === "active_partner") counts.partners++;
    if (CLOSED_STATUSES.includes(row.status)) counts.closed++;
    if (
      row.status === "no_response_closed" &&
      row.reopen_at !== null &&
      row.reopen_at <= todayIso
    ) {
      counts.reengage++;
    }
    if (row.stakeholder_type === "professor" && row.contact_permission === "not_yet") {
      counts.blocked++;
    }
  }

  // Tasks scan for today/upcoming.
  let taskQ = db
    .from("student_outreach_tasks")
    .select("outreach_id, due_at, student_outreach!inner(campus_id, stakeholder_type)")
    .eq("status", "pending");

  if (filters.campusId) taskQ = taskQ.eq("student_outreach.campus_id", filters.campusId);
  if (filters.type) taskQ = taskQ.eq("student_outreach.stakeholder_type", filters.type);

  const { data: tasks } = await taskQ;
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 86_400_000);
  const todaySet = new Set<string>();
  const upcomingSet = new Set<string>();
  for (const t of (tasks ?? []) as Array<{ outreach_id: string; due_at: string }>) {
    const due = new Date(t.due_at);
    if (due <= now) todaySet.add(t.outreach_id);
    else if (due <= horizon) upcomingSet.add(t.outreach_id);
  }
  counts.today = todaySet.size;
  counts.upcoming = upcomingSet.size;

  // Approvals scan.
  let apprQ = db
    .from("student_outreach_approvals")
    .select("outreach_id, student_outreach!inner(campus_id, stakeholder_type)")
    .eq("status", "requested");
  if (filters.campusId) apprQ = apprQ.eq("student_outreach.campus_id", filters.campusId);
  if (filters.type) apprQ = apprQ.eq("student_outreach.stakeholder_type", filters.type);
  const { data: appr } = await apprQ;
  const apprSet = new Set<string>();
  for (const a of (appr ?? []) as Array<{ outreach_id: string }>) apprSet.add(a.outreach_id);
  counts.approvals = apprSet.size;

  return counts;
}
