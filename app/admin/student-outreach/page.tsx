"use client";

/**
 * Admin Student Outreach Funnel — main page (v7).
 *
 * Six tabs in workflow order:
 *   🔍 Research → 📞 Calls → 📬 Replies → 📅 Meetings → ⭐ Active Partners → 🔎 All
 *
 * No persistent header pills (no approvals, no inbox timer). Just two
 * action buttons (Add Stakeholder, Add Custom Task).
 *
 * Each tab has its own row rendering optimized for the work mode:
 *   - Calls: phone number prominent, Tap to dial
 *   - Replies: stale flag, meeting flag, post-meeting notes inline
 *   - Meetings: in-flight vs scheduled treatment
 *   - Partners: last touch + next seasonal date
 *   - Research / All: standard row
 *
 * A row with a pending custom task gets a ⭐ star icon across all tabs.
 * Active Partners do NOT show in research / calls / replies / meetings.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Drawer } from "./Drawer";
import { AddStakeholderModal } from "./AddStakeholderModal";
import { AddCustomTaskModal } from "./AddCustomTaskModal";
import {
  STAKEHOLDER_TYPE_LABELS,
  type Campus,
  type DrawerContext,
  type StakeholderType,
  type TabCounts,
  type TabRow,
} from "@/lib/student-outreach/types";

type TabKey = "research" | "calls" | "replies" | "meetings" | "partners" | "all";

interface TabDef {
  key: TabKey;
  emoji: string;
  label: string;
  tooltip: string;
}

const TABS: TabDef[] = [
  { key: "research",  emoji: "🔍", label: "Research",        tooltip: "New stakeholders that still need research before email outreach starts." },
  { key: "calls",     emoji: "📞", label: "Calls",           tooltip: "Phone calls due today. Click a row to see the script and tap to dial." },
  { key: "replies",   emoji: "📬", label: "Replies",         tooltip: "Stakeholders mid-outreach or engaged. Check email for replies, mark engaged, decide next step." },
  { key: "meetings",  emoji: "📅", label: "Meetings",        tooltip: "Stakeholders who want a meeting or have one booked. Verify or schedule." },
  { key: "partners",  emoji: "⭐", label: "Active Partners", tooltip: "Stakeholders who are sharing with students. Light-touch, mostly automated seasonal emails." },
  { key: "all",       emoji: "🔎", label: "All",             tooltip: "Search and filter every stakeholder across all stages." },
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
  const [tab, setTab] = useState<TabKey>("research");
  const [showClosed, setShowClosed] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<TabRow[]>([]);
  const [tabCounts, setTabCounts] = useState<TabCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

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
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (tab === "all" && showClosed) params.set("show_closed", "true");
      const res = await fetch(`/api/admin/student-outreach/queue?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setCampuses(data.campuses ?? []);
      setRows(data.rows ?? []);
      setTabCounts(data.tab_counts ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [campusSlug, typeFilter, tab, debouncedSearch, showClosed]);

  useEffect(() => { refetch(); }, [refetch]);

  const handleDrawerAction = useCallback(
    async (_refreshed: DrawerContext | null) => { await refetch(); },
    [refetch],
  );

  const currentCampus = useMemo(
    () => campuses.find((c) => c.slug === campusSlug) ?? null,
    [campuses, campusSlug],
  );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Student Outreach</h1>
          <p className="mt-1 text-sm text-gray-500">
            Bring in pre-health students by working with campus advisors, dept heads, and student
            orgs. Tabs match what you do each day.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            onClick={() => setShowAddTask(true)}
            title="Add a one-off task to a stakeholder's queue (e.g. 'check on listserv access')."
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Add Custom Task
          </button>
          <Link
            href="/admin/student-outreach/campuses"
            title="Browse and manage campuses (universities)."
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Campuses
          </Link>
          <button
            onClick={() => setShowAdd(true)}
            title="Add a new advisor, dept head, or student org for a campus."
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            + Add Stakeholder
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={campusSlug}
          onChange={(e) => setCampusSlug(e.target.value)}
          title="Filter to one campus, or 'All campuses' to see everything."
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
          title="Filter by stakeholder type."
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
          placeholder="Search by organization name…"
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-100">
        {TABS.map((t) => {
          const count = tabCounts?.[t.key];
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              title={t.tooltip}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="mr-1.5" aria-hidden>{t.emoji}</span>
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

      {tab === "all" && (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-600">
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
            />
            Show closed
          </label>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <EmptyState tab={tab} tabCounts={tabCounts} onAdd={() => setShowAdd(true)} />
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <RowCard tab={tab} row={row} onClick={() => setOpenOutreachId(row.id)} />
            </li>
          ))}
        </ul>
      )}

      {openOutreachId && (
        <Drawer
          outreachId={openOutreachId}
          tabContext={tab}
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
      {showAddTask && (
        <AddCustomTaskModal
          campuses={campuses}
          stakeholders={rows.map((r) => ({
            id: r.id,
            organization_name: r.organization_name,
            stakeholder_type: r.stakeholder_type,
            campus_slug: r.campus_slug,
            campus_name: r.campus_name,
          }))}
          onCancel={() => setShowAddTask(false)}
          onCreated={() => {
            setShowAddTask(false);
            refetch();
          }}
          onError={setError}
        />
      )}
    </div>
  );
}

// ── Empty states ────────────────────────────────────────────────────────

function EmptyState({
  tab,
  tabCounts,
  onAdd,
}: {
  tab: TabKey;
  tabCounts: TabCounts | null;
  onAdd: () => void;
}) {
  const totalZero = (tabCounts?.all ?? 0) === 0;
  if (totalZero) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-medium text-gray-700">No stakeholders yet.</p>
        <p className="mt-1 text-xs text-gray-500">
          Pick a campus, find a pre-health advisor or pre-med society, and click below to add them.
        </p>
        <button
          onClick={onAdd}
          className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          + Add Stakeholder
        </button>
      </div>
    );
  }
  const blurbs: Record<TabKey, string> = {
    research: "No stakeholders need research right now.",
    calls: "No phone calls due. 🎉",
    replies: "No mid-outreach stakeholders to triage. Add more or wait for cadences to start.",
    meetings: "No meetings in flight or booked.",
    partners: "No active partners yet. Mark a stakeholder as Active Partner when they commit to sharing.",
    all: "No matches.",
  };
  return <p className="py-12 text-center text-sm text-gray-400">{blurbs[tab]}</p>;
}

// ── Row rendering ───────────────────────────────────────────────────────

function RowCard({
  tab,
  row,
  onClick,
}: {
  tab: TabKey;
  row: TabRow;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {row.has_custom_task && (
            <span
              title={`Custom task: ${row.custom_task_summary ?? "see drawer"}`}
              className="text-amber-500"
              aria-label="custom task pending"
            >
              ★
            </span>
          )}
          <p className="truncate text-sm font-medium text-gray-900">
            {row.organization_name}
            {row.department && (
              <span className="ml-1 text-gray-500">· {row.department}</span>
            )}
          </p>
        </div>
        <p className="truncate text-xs text-gray-500">
          {row.campus_name} · {STAKEHOLDER_TYPE_LABELS[row.stakeholder_type]}
          {row.primary_contact_name && ` · ${row.primary_contact_name}`}
        </p>
        <RowSubInfo tab={tab} row={row} />
      </div>
      <RowRightSide tab={tab} row={row} />
    </button>
  );
}

function RowSubInfo({ tab, row }: { tab: TabKey; row: TabRow }) {
  // Tab-specific inline detail row.
  if (tab === "calls") {
    return null; // phone number rendered on the right side, prominent
  }

  if (tab === "replies") {
    const flags: Array<{ kind: string; label: string; tone: string; tooltip: string }> = [];
    if (row.followup_notes) {
      flags.push({
        kind: "followup",
        label: `📅 Met — needs follow-up`,
        tone: "bg-blue-100 text-blue-900",
        tooltip: row.followup_notes,
      });
    }
    if (row.meeting_state === "scheduled") {
      flags.push({
        kind: "booked",
        label: row.meeting_at ? `📅 Booked ${formatShortDate(row.meeting_at)}` : `📅 Booked`,
        tone: "bg-indigo-100 text-indigo-900",
        tooltip: "Meeting on the calendar.",
      });
    } else if (row.meeting_state === "in_flight") {
      flags.push({
        kind: "in_flight",
        label: "🤝 Wants meeting",
        tone: "bg-amber-100 text-amber-900",
        tooltip: "Replied wanting a meeting; coordinating time.",
      });
    }
    if (row.stale_days != null) {
      flags.push({
        kind: "stale",
        label: `💤 No reply in ${row.stale_days}d`,
        tone: "bg-gray-200 text-gray-700",
        tooltip: "No reply since the last email. Decide: keep waiting, custom email, or close.",
      });
    }
    return (
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {flags.map((f) => (
          <span key={f.kind} title={f.tooltip} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${f.tone}`}>
            {f.label}
          </span>
        ))}
        {row.followup_notes && (
          <span className="block w-full truncate text-[11px] italic text-gray-600 mt-0.5">
            "{row.followup_notes.slice(0, 120)}{row.followup_notes.length > 120 ? "…" : ""}"
          </span>
        )}
        {row.last_activity_at && (
          <span className="block w-full text-[10px] text-gray-400 mt-0.5">
            Last activity {formatRelative(row.last_activity_at)}
          </span>
        )}
      </div>
    );
  }

  if (tab === "meetings") {
    const label = row.meeting_state === "scheduled"
      ? row.meeting_at ? `📅 Booked ${formatShortDate(row.meeting_at)}` : "📅 Booked"
      : "🤝 Finding a time";
    const tone = row.meeting_state === "scheduled" ? "bg-indigo-100 text-indigo-900" : "bg-amber-100 text-amber-900";
    return (
      <div className="mt-1">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${tone}`}>{label}</span>
      </div>
    );
  }

  if (tab === "partners") {
    return (
      <div className="mt-1 text-[10px] text-gray-500">
        Last activity {row.last_activity_at ? formatRelative(row.last_activity_at) : "—"}
      </div>
    );
  }

  if (tab === "all") {
    return (
      <div className="mt-1 text-[10px] text-gray-500">
        Stage: {row.status} · last activity {row.last_activity_at ? formatRelative(row.last_activity_at) : "—"}
      </div>
    );
  }

  // research tab
  return null;
}

function RowRightSide({ tab, row }: { tab: TabKey; row: TabRow }) {
  if (tab === "calls") {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {row.primary_contact_phone && (
          <span title={`Tap the row to dial ${row.primary_contact_phone}`} className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
            📞 {row.primary_contact_phone}
          </span>
        )}
        {row.due_call_task && (
          <span className="hidden text-xs text-gray-400 sm:inline">
            {formatDueDate(row.due_call_task.due_at)}
          </span>
        )}
      </div>
    );
  }
  return null;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDueDate(iso: string): string {
  const due = new Date(iso);
  const diffMin = Math.round((due.getTime() - Date.now()) / 60_000);
  if (diffMin < -60 * 24) return `${Math.round(-diffMin / (60 * 24))}d overdue`;
  if (diffMin < 0) return "due now";
  if (diffMin < 60) return `in ${diffMin}m`;
  if (diffMin < 60 * 24) return `in ${Math.round(diffMin / 60)}h`;
  return `in ${Math.round(diffMin / (60 * 24))}d`;
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
