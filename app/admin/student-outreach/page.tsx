"use client";

/**
 * Admin Student Outreach Funnel — main page (v2).
 *
 * Tabs collapsed to 4: Queued · In Progress · Partnered · Closed.
 * Approvals surface as a header pill (clicking filters In Progress to
 * rows with open approvals). Search + campus + type filters above tabs.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Drawer } from "./Drawer";
import { AddStakeholderModal } from "./AddStakeholderModal";
import { InboxCheckPanel, type InboxCheckRow } from "./InboxCheckPanel";
import {
  STAKEHOLDER_TYPE_LABELS,
  STATUS_LABELS,
  type Campus,
  type DrawerContext,
  type QueueRow,
  type StakeholderType,
  type Status,
  type TabCounts,
} from "@/lib/student-outreach/types";

const TABS: Array<{ key: string; label: string }> = [
  { key: "queued", label: "Queued" },
  { key: "in_progress", label: "In Progress" },
  { key: "partnered", label: "Partnered" },
  { key: "closed", label: "Closed" },
];

const TYPE_FILTERS: Array<{ key: StakeholderType | "all"; label: string }> = [
  { key: "all", label: "All types" },
  { key: "student_org", label: "Student Orgs" },
  { key: "advisor", label: "Advisors" },
  { key: "dept_head", label: "Dept Heads" },
  { key: "professor", label: "Professors" },
];

export default function StudentOutreachPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusSlug, setCampusSlug] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<StakeholderType | "all">("all");
  const [tab, setTab] = useState("queued");
  const [approvalsFilter, setApprovalsFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [tabCounts, setTabCounts] = useState<TabCounts | null>(null);
  const [inboxCheck, setInboxCheck] = useState<{ count: number; rows: InboxCheckRow[] }>({ count: 0, rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (campusSlug) params.set("campus", campusSlug);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (tab) params.set("tab", tab);
      if (approvalsFilter) params.set("approvals", "open");
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/student-outreach/queue?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setCampuses(data.campuses ?? []);
      setRows(data.rows ?? []);
      setTabCounts(data.tabCounts ?? null);
      setInboxCheck(data.inbox_check ?? { count: 0, rows: [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [campusSlug, typeFilter, tab, approvalsFilter, debouncedSearch]);

  useEffect(() => { refetch(); }, [refetch]);

  const handleDrawerAction = useCallback(
    async (_refreshed: DrawerContext | null) => { await refetch(); },
    [refetch],
  );

  const currentCampus = useMemo(
    () => campuses.find((c) => c.slug === campusSlug) ?? null,
    [campuses, campusSlug],
  );

  const onApprovalsPillClick = () => {
    // Clicking jumps to In Progress + filtered to open-approval rows.
    setTab("in_progress");
    setApprovalsFilter(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Student Outreach</h1>
          <p className="mt-1 text-sm text-gray-500">
            Build relationships with student orgs, advisors, dept heads, and (with
            permission) professors to channel pre-health students into Olera.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/admin/student-outreach/campuses"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Campuses
          </Link>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            + Add Stakeholder
          </button>
        </div>
      </div>

      {/* Approvals header pill */}
      {tabCounts && tabCounts.open_approvals > 0 && !approvalsFilter && (
        <button
          onClick={onApprovalsPillClick}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
        >
          <span>⚠</span>
          {tabCounts.open_approvals} pending approval{tabCounts.open_approvals === 1 ? "" : "s"} — click to filter
        </button>
      )}
      {approvalsFilter && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900">
          <span>⚠</span>
          Filtered: rows with open approvals
          <button onClick={() => setApprovalsFilter(false)} className="ml-1 rounded-full bg-amber-200 px-1.5 hover:bg-amber-300">
            clear
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={campusSlug}
          onChange={(e) => setCampusSlug(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none"
        >
          <option value="">All campuses</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as StakeholderType | "all")}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none"
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
        {currentCampus && (
          <Link
            href={`/admin/student-outreach/campus/${currentCampus.slug}`}
            className="text-sm text-blue-600 hover:underline"
          >
            View {currentCampus.name} →
          </Link>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by organization name..."
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
        />
      </div>

      {/* Inbox check (synthetic, top-of-Queued) */}
      {tab === "queued" && (
        <InboxCheckPanel
          rows={inboxCheck.rows}
          onAfterMark={refetch}
          onError={setError}
        />
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-100">
        {TABS.map((t) => {
          const count = tabCounts ? tabCounts[t.key as keyof TabCounts] : undefined;
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {typeof count === "number" && (
                <span className={`ml-1.5 text-xs ${active ? "text-gray-500" : "text-gray-400"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <EmptyState campusFiltered={Boolean(campusSlug)} tab={tab} />
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                onClick={() => setOpenOutreachId(row.id)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {row.organization_name}
                    {row.department && (
                      <span className="ml-1 text-gray-500">· {row.department}</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {row.campus_name} · {STAKEHOLDER_TYPE_LABELS[row.stakeholder_type]}
                    {row.primary_contact_name && ` · ${row.primary_contact_name}`}
                    {row.open_approvals > 0 && (
                      <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        {row.open_approvals} approval
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={row.status} />
                  {row.next_task && (
                    <span className="hidden text-xs text-gray-400 sm:inline">
                      {formatDueDate(row.next_task.due_at)}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {openOutreachId && (
        <Drawer
          outreachId={openOutreachId}
          onClose={() => setOpenOutreachId(null)}
          onAction={handleDrawerAction}
        />
      )}
      {showAdd && (
        <AddStakeholderModal
          campuses={campuses}
          defaultCampusSlug={campusSlug || undefined}
          onClose={() => setShowAdd(false)}
          onCreated={(id) => {
            setShowAdd(false);
            refetch();
            setOpenOutreachId(id);
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ campusFiltered, tab }: { campusFiltered: boolean; tab: string }) {
  let msg = "Nothing in this tab.";
  if (tab === "queued") msg = "No tasks due right now. 🎉";
  else if (tab === "in_progress") msg = "No stakeholders being actively worked.";
  else if (tab === "partnered") msg = "No active partners yet.";
  else if (tab === "closed" && !campusFiltered) {
    msg = "No closed-out stakeholders.";
  }
  return <p className="py-12 text-center text-sm text-gray-400">{msg}</p>;
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    prospect: "bg-gray-100 text-gray-700",
    researched: "bg-gray-100 text-gray-700",
    outreach_sent: "bg-blue-50 text-blue-700",
    engaged: "bg-blue-100 text-blue-800",
    meeting_scheduled: "bg-indigo-50 text-indigo-700",
    active_partner: "bg-emerald-100 text-emerald-800",
    not_interested: "bg-gray-100 text-gray-500",
    no_response_closed: "bg-gray-100 text-gray-500",
    do_not_contact: "bg-red-50 text-red-700",
    wrong_contact: "bg-gray-100 text-gray-500",
    redirected: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatDueDate(iso: string): string {
  const due = new Date(iso);
  const now = new Date();
  const diffMin = Math.round((due.getTime() - now.getTime()) / 60_000);
  if (diffMin < -60 * 24) return `${Math.round(-diffMin / (60 * 24))}d overdue`;
  if (diffMin < 0) return "due now";
  if (diffMin < 60) return `in ${diffMin}m`;
  if (diffMin < 60 * 24) return `in ${Math.round(diffMin / 60)}h`;
  return `in ${Math.round(diffMin / (60 * 24))}d`;
}
