/**
 * GET /api/admin/student-outreach/queue
 *
 * Returns campuses (for the dropdown) + paginated outreach rows + tab counts
 * + an `open_approval_total` for the header pill.
 *
 * Query params:
 *   campus      campus slug (optional filter)
 *   type        stakeholder type filter (optional)
 *   tab         queued|in_progress|partnered|closed|all
 *   approvals   "open" → restrict to rows with at least one open approval
 *   search      substring on organization_name (optional)
 *   page        0-indexed page, default 0
 *   pageSize    default 50
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  IN_PROGRESS_STATUSES,
  PARTNERED_STATUSES,
  CLOSED_STATUSES,
  type Campus,
  type OutreachRow,
  type QueueRow,
  type StakeholderType,
  type TabCounts,
} from "@/lib/student-outreach/types";

const PAGE_SIZE_DEFAULT = 50;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();
  const url = new URL(req.url);
  const campusSlug = url.searchParams.get("campus");
  const typeFilter = url.searchParams.get("type") as StakeholderType | null;
  const tab = url.searchParams.get("tab") ?? "queued";
  const approvalsFilter = url.searchParams.get("approvals");
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

  // ── Tab counts (single grouped scan + open-approval count for pill) ────
  const tabCounts = await computeTabCounts(db, {
    campusId: selectedCampus?.id ?? null,
    type: typeFilter,
  });

  // ── Filtered query ─────────────────────────────────────────────────────
  let query = db.from("student_outreach").select("*", { count: "exact" });
  if (selectedCampus) query = query.eq("campus_id", selectedCampus.id);
  if (typeFilter) query = query.eq("stakeholder_type", typeFilter);
  if (search) query = query.ilike("organization_name", `%${search}%`);

  switch (tab) {
    case "in_progress":
      query = query.in("status", IN_PROGRESS_STATUSES);
      break;
    case "partnered":
      // Include un-migrated legacy rows so they don't disappear before
      // migration 065 runs. Post-migration this is just active_partner.
      query = query.in("status", [...PARTNERED_STATUSES, "agreed", "distributed"]);
      break;
    case "closed":
      query = query.in("status", CLOSED_STATUSES);
      break;
    case "queued":
    case "all":
    default:
      // Filtering for queued happens via tasks below; "all" needs no extra filter.
      break;
  }

  query = query
    .order("last_edited_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  const { data: outreachRows, error: rowsErr, count } = await query;
  if (rowsErr) {
    return NextResponse.json({ error: rowsErr.message }, { status: 500 });
  }

  let rows = (outreachRows ?? []) as OutreachRow[];

  // Queued tab: keep only rows with at least one due-now task.
  if (tab === "queued" && rows.length > 0) {
    const idSet = new Set(rows.map((r) => r.id));
    const { data: dueTasks } = await db
      .from("student_outreach_tasks")
      .select("outreach_id")
      .in("outreach_id", Array.from(idSet))
      .eq("status", "pending")
      .lte("due_at", new Date().toISOString());
    const dueIds = new Set((dueTasks ?? []).map((t) => t.outreach_id));
    rows = rows.filter((r) => dueIds.has(r.id));
  }

  // Approvals filter (header pill click-through).
  if (approvalsFilter === "open" && rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const { data: open } = await db
      .from("student_outreach_approvals")
      .select("outreach_id")
      .in("outreach_id", ids)
      .eq("status", "requested");
    const ok = new Set((open ?? []).map((a) => a.outreach_id));
    rows = rows.filter((r) => ok.has(r.id));
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

  // ── Synthetic inbox-check task: list outreach_sent rows that may have
  // received replies the admin needs to triage. Always returned (the
  // page renders it above the regular list).
  const inboxCheck = await computeInboxCheck(db, {
    campusId: selectedCampus?.id ?? null,
    type: typeFilter,
    campusMap,
  });

  return NextResponse.json({
    campuses: campusList,
    rows: queueRows,
    total: count ?? queueRows.length,
    tabCounts,
    inbox_check: inboxCheck,
  });
}

interface InboxCheckRow {
  outreach_id: string;
  organization_name: string;
  campus_name: string;
  stakeholder_type: StakeholderType;
  last_email_sent_at: string | null;
  last_email_subject: string | null;
}

async function computeInboxCheck(
  db: DB,
  filters: { campusId: string | null; type: StakeholderType | null; campusMap: Map<string, Campus> },
): Promise<{ count: number; rows: InboxCheckRow[] }> {
  let q = db
    .from("student_outreach")
    .select("id, organization_name, stakeholder_type, campus_id")
    .eq("status", "outreach_sent")
    .order("last_edited_at", { ascending: false })
    .limit(50);
  if (filters.campusId) q = q.eq("campus_id", filters.campusId);
  if (filters.type) q = q.eq("stakeholder_type", filters.type);

  const { data: rows } = await q;
  const list = ((rows ?? []) as Array<{
    id: string;
    organization_name: string;
    stakeholder_type: StakeholderType;
    campus_id: string;
  }>);
  if (list.length === 0) return { count: 0, rows: [] };

  const ids = list.map((r) => r.id);
  const { data: tps } = await db
    .from("student_outreach_touchpoints")
    .select("outreach_id, payload, created_at")
    .in("outreach_id", ids)
    .eq("touchpoint_type", "email_sent")
    .order("created_at", { ascending: false });

  const lastByOutreach = new Map<string, { at: string; subject: string | null }>();
  for (const tp of (tps ?? []) as Array<{ outreach_id: string; payload: Record<string, unknown>; created_at: string }>) {
    if (!lastByOutreach.has(tp.outreach_id)) {
      // Subject isn't stored on email_sent touchpoint payload (the
      // task's payload had it). For MVP we just show "—" rather than
      // back-resolve the task. Drawer shows full content on click.
      lastByOutreach.set(tp.outreach_id, { at: tp.created_at, subject: null });
    }
  }

  const out: InboxCheckRow[] = list.map((r) => {
    const last = lastByOutreach.get(r.id) ?? null;
    return {
      outreach_id: r.id,
      organization_name: r.organization_name,
      campus_name: filters.campusMap.get(r.campus_id)?.name ?? "(unknown campus)",
      stakeholder_type: r.stakeholder_type,
      last_email_sent_at: last?.at ?? null,
      last_email_subject: last?.subject ?? null,
    };
  });

  return { count: out.length, rows: out };
}

// ── Tab-count computation ────────────────────────────────────────────────

type DB = ReturnType<typeof getServiceClient>;

async function computeTabCounts(
  db: DB,
  filters: { campusId: string | null; type: StakeholderType | null },
): Promise<TabCounts> {
  const counts: TabCounts = {
    queued: 0,
    in_progress: 0,
    partnered: 0,
    closed: 0,
    all: 0,
    open_approvals: 0,
  };

  // Single scan: status of every row in scope.
  let q = db.from("student_outreach").select("id, status");
  if (filters.campusId) q = q.eq("campus_id", filters.campusId);
  if (filters.type) q = q.eq("stakeholder_type", filters.type);

  const { data: scan, error } = await q;
  if (error || !scan) return counts;

  const inProgress = new Set<string>(IN_PROGRESS_STATUSES);
  // Include legacy values that haven't been migrated.
  const partnered = new Set<string>([...PARTNERED_STATUSES, "agreed", "distributed"]);
  const closed = new Set<string>(CLOSED_STATUSES);

  const inProgressIds = new Set<string>();
  for (const row of scan as Array<{ id: string; status: string }>) {
    counts.all++;
    if (inProgress.has(row.status)) {
      counts.in_progress++;
      inProgressIds.add(row.id);
    } else if (partnered.has(row.status)) {
      counts.partnered++;
    } else if (closed.has(row.status)) {
      counts.closed++;
    }
  }

  // Tasks scan: queued = distinct outreach_ids with a pending task due ≤ now.
  let taskQ = db
    .from("student_outreach_tasks")
    .select("outreach_id, due_at, student_outreach!inner(campus_id, stakeholder_type)")
    .eq("status", "pending")
    .lte("due_at", new Date().toISOString());
  if (filters.campusId) taskQ = taskQ.eq("student_outreach.campus_id", filters.campusId);
  if (filters.type) taskQ = taskQ.eq("student_outreach.stakeholder_type", filters.type);
  const { data: tasks } = await taskQ;
  const queuedSet = new Set<string>();
  for (const t of (tasks ?? []) as Array<{ outreach_id: string }>) {
    queuedSet.add(t.outreach_id);
  }
  counts.queued = queuedSet.size;

  // Approvals scan for header pill.
  let apprQ = db
    .from("student_outreach_approvals")
    .select("outreach_id, student_outreach!inner(campus_id, stakeholder_type)")
    .eq("status", "requested");
  if (filters.campusId) apprQ = apprQ.eq("student_outreach.campus_id", filters.campusId);
  if (filters.type) apprQ = apprQ.eq("student_outreach.stakeholder_type", filters.type);
  const { data: appr } = await apprQ;
  const apprSet = new Set<string>();
  for (const a of (appr ?? []) as Array<{ outreach_id: string }>) apprSet.add(a.outreach_id);
  counts.open_approvals = apprSet.size;

  return counts;
}
