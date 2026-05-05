"use client";

/**
 * Admin Student Outreach Funnel — main page (v8).
 *
 * Six tabs in workflow order:
 *   🔍 Research → 📞 Calls → 📬 Replies → 📅 Meetings → ⭐ Active Partners → 🔎 All
 *
 * v8 changes vs v7:
 *   - Calls tab: row click opens LogCallOutcomeModal (6 outcomes routing the row)
 *   - Replies tab: top "Open Gmail" banner + 7 state cards
 *     (mid_cadence | engaged | wants_meeting | booked | needs_followup |
 *      awaiting_callback | stale). Each state has its own primary action.
 *   - Meetings tab: top "Open Calendar" banner + 2 state cards
 *     (in_flight = "Finding a time" | scheduled = "Booked")
 *   - Reply-classifier mini-modal shared between "They replied" and "Got a callback"
 *   - All state derivation is server-side in queue/route.ts; the UI is dumb
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Drawer } from "./Drawer";
import { AddStakeholderModal } from "./AddStakeholderModal";
import { AddCustomTaskModal } from "./AddCustomTaskModal";
import { LogCallOutcomeModal } from "./LogCallOutcomeModal";
import { ReplyClassifierModal } from "./ReplyClassifierModal";
import { MarkPartnerModal } from "./MarkPartnerModal";
import {
  STAKEHOLDER_TYPE_LABELS,
  type Campus,
  type DistributionEvidence,
  type DrawerContext,
  type RepliesState,
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
  { key: "calls",     emoji: "📞", label: "Calls",           tooltip: "Phone calls due today. Tap to dial; log the outcome from the row." },
  { key: "replies",   emoji: "📬", label: "Replies",         tooltip: "Email replies, callbacks, voicemails. Triage what they said and pick the next step." },
  { key: "meetings",  emoji: "📅", label: "Meetings",        tooltip: "Stakeholders coordinating a time, or with a meeting on the calendar." },
  { key: "partners",  emoji: "⭐", label: "Active Partners", tooltip: "Stakeholders sharing with students. Mostly automated seasonal emails." },
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

  // v8: per-row action modals (driven by row buttons, not the drawer).
  const [callOutcomeRow, setCallOutcomeRow] = useState<TabRow | null>(null);
  const [classifierRow, setClassifierRow] = useState<{
    row: TabRow;
    source: "email_reply" | "callback";
  } | null>(null);
  const [partnerRow, setPartnerRow] = useState<TabRow | null>(null);

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

  // Direct-API helper for row-driven actions (no drawer round-trip).
  const callAction = useCallback(
    async (outreachId: string, action: string, payload: Record<string, unknown> = {}) => {
      const res = await fetch(`/api/admin/student-outreach/${outreachId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({ error: "Action failed" }));
        throw new Error(e || "Action failed");
      }
      await refetch();
    },
    [refetch],
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

      {/* v8: top banners for tabs that anchor on inbox/calendar */}
      {tab === "replies" && <RepliesTabBanner />}
      {tab === "meetings" && <MeetingsTabBanner />}
      {tab === "calls" && <CallsTabBanner />}

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
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <RowCard
                tab={tab}
                row={row}
                onOpenDrawer={() => setOpenOutreachId(row.id)}
                onLogCallOutcome={() => setCallOutcomeRow(row)}
                onClassifyReply={(source) => setClassifierRow({ row, source })}
                onMarkPartner={() => setPartnerRow(row)}
                onResumeOutreach={async () => {
                  if (!window.confirm("Resume outreach? Re-queues a follow-up call in 3 days.")) return;
                  try { await callAction(row.id, "resume_outreach"); }
                  catch (e) { setError(e instanceof Error ? e.message : "Action failed"); }
                }}
                onCloseAsNoResponse={async () => {
                  if (!window.confirm("Close as No Response? Re-opens automatically in 90 days.")) return;
                  try { await callAction(row.id, "mark_no_response_closed"); }
                  catch (e) { setError(e instanceof Error ? e.message : "Action failed"); }
                }}
                onMarkScheduledFromInFlight={() => setClassifierRow({ row, source: "email_reply" })}
                onSendFollowupEmail={() => {
                  const subject = encodeURIComponent(
                    `Following up — ${row.organization_name}`,
                  );
                  const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              />
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

      {/* Modals driven by row buttons */}
      {callOutcomeRow && (
        <LogCallOutcomeModal
          organizationName={callOutcomeRow.organization_name}
          contactName={callOutcomeRow.primary_contact_name}
          contactPhone={callOutcomeRow.primary_contact_phone}
          onCancel={() => setCallOutcomeRow(null)}
          onSubmit={async (outcome, notes) => {
            await callAction(callOutcomeRow.id, "log_call", {
              outcome,
              notes,
            });
            setCallOutcomeRow(null);
          }}
        />
      )}
      {classifierRow && (
        <ReplyClassifierModal
          organizationName={classifierRow.row.organization_name}
          source={classifierRow.source}
          onCancel={() => setClassifierRow(null)}
          onSubmit={async (classification, payload) => {
            await callAction(classifierRow.row.id, "classify_reply", {
              classification,
              notes: payload.notes,
              meeting_at: payload.meeting_at,
            });
            setClassifierRow(null);
          }}
          onChooseCommitted={() => {
            const r = classifierRow.row;
            setClassifierRow(null);
            setPartnerRow(r);
          }}
        />
      )}
      {partnerRow && (
        <MarkPartnerModal
          organizationName={partnerRow.organization_name}
          onCancel={() => setPartnerRow(null)}
          onConfirm={async (payload: { evidence: DistributionEvidence; evidence_notes: string }) => {
            try {
              await callAction(partnerRow.id, "mark_partner", payload);
              setPartnerRow(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            }
          }}
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

// ── Top banners (Gmail / Calendar / Calls) ──────────────────────────────

function RepliesTabBanner() {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-blue-900">📬 Inbox triage</p>
        <p className="text-xs text-blue-800/80">
          Replies, callbacks, and voicemail notifications all land in the <strong>outreach@olera.care</strong> inbox.
          Open Gmail, then come back here to triage each row.
        </p>
      </div>
      <a
        href="https://mail.google.com/mail/u/0/#inbox"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Open Gmail ↗
      </a>
    </div>
  );
}

function MeetingsTabBanner() {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-indigo-900">📅 Meeting status</p>
        <p className="text-xs text-indigo-800/80">
          Coordinate times in email, then mark scheduled here. Booked meetings live on Google Calendar.
        </p>
      </div>
      <a
        href="https://calendar.google.com/calendar/u/0/r"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Open Calendar ↗
      </a>
    </div>
  );
}

function CallsTabBanner() {
  return (
    <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
      <p className="text-sm font-medium text-emerald-900">📞 Calls due now</p>
      <p className="text-xs text-emerald-800/80">
        Tap the green dial button on a row, then click anywhere on the row to log the outcome. Voicemails
        and &ldquo;they&rsquo;ll call back&rdquo; promises move the row to Replies until they reach out.
      </p>
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
    replies: "No inbox triage right now. The cadence is humming along.",
    meetings: "No meetings in flight or booked.",
    partners: "No active partners yet. Mark a stakeholder as Active Partner when they commit to sharing.",
    all: "No matches.",
  };
  return <p className="py-12 text-center text-sm text-gray-400">{blurbs[tab]}</p>;
}

// ── Row rendering ───────────────────────────────────────────────────────

interface RowCardCallbacks {
  onOpenDrawer: () => void;
  onLogCallOutcome: () => void;
  onClassifyReply: (source: "email_reply" | "callback") => void;
  onMarkPartner: () => void;
  onResumeOutreach: () => Promise<void>;
  onCloseAsNoResponse: () => Promise<void>;
  onMarkScheduledFromInFlight: () => void;
  onSendFollowupEmail: () => void;
}

function RowCard({
  tab,
  row,
  ...cb
}: { tab: TabKey; row: TabRow } & RowCardCallbacks) {
  // v8: Replies tab uses state-card layout. Other tabs use compact list rows.
  if (tab === "replies") {
    return <RepliesRowCard row={row} {...cb} />;
  }
  if (tab === "meetings") {
    return <MeetingsRowCard row={row} {...cb} />;
  }
  if (tab === "calls") {
    return <CallsRowCard row={row} {...cb} />;
  }
  return <CompactRow tab={tab} row={row} onClick={cb.onOpenDrawer} />;
}

function CompactRow({
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
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <RowHeader row={row} />
        <RowSubLine row={row} tab={tab} />
      </div>
    </button>
  );
}

function RowHeader({ row }: { row: TabRow }) {
  return (
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
  );
}

function RowSubLine({ row, tab }: { row: TabRow; tab: TabKey }) {
  return (
    <p className="mt-0.5 truncate text-xs text-gray-500">
      {row.campus_name} · {STAKEHOLDER_TYPE_LABELS[row.stakeholder_type]}
      {row.primary_contact_name && ` · ${row.primary_contact_name}`}
      {tab === "all" && ` · ${row.status}`}
      {(tab === "partners" || tab === "all") && row.last_activity_at && (
        <> · last activity {formatRelative(row.last_activity_at)}</>
      )}
    </p>
  );
}

// ── Calls tab row card ──────────────────────────────────────────────────

function CallsRowCard({
  row,
  onOpenDrawer,
  onLogCallOutcome,
}: { row: TabRow } & RowCardCallbacks) {
  return (
    <div
      className="rounded-lg border border-emerald-200 bg-white px-4 py-3 hover:border-emerald-300 hover:bg-emerald-50/30"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={onOpenDrawer}
          className="min-w-0 flex-1 text-left"
          title="Open the drawer for full context, script, and history."
        >
          <RowHeader row={row} />
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {row.campus_name} · {STAKEHOLDER_TYPE_LABELS[row.stakeholder_type]}
            {row.primary_contact_name && ` · ${row.primary_contact_name}`}
          </p>
          {row.due_call_task && (
            <p className="mt-0.5 text-[11px] text-gray-400">
              {formatDueDate(row.due_call_task.due_at)}
            </p>
          )}
        </button>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {row.primary_contact_phone && (
            <a
              href={`tel:${row.primary_contact_phone}`}
              onClick={(e) => e.stopPropagation()}
              title="Tap to dial (mobile) — opens the default phone app."
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              📞 {row.primary_contact_phone}
            </a>
          )}
          <button
            onClick={onLogCallOutcome}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Log outcome →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Meetings tab row card ───────────────────────────────────────────────

function MeetingsRowCard({
  row,
  onOpenDrawer,
  onMarkScheduledFromInFlight,
  onMarkPartner,
}: { row: TabRow } & RowCardCallbacks) {
  if (row.meeting_state === "scheduled") {
    return (
      <div className="rounded-lg border border-indigo-200 bg-indigo-50/30 px-4 py-3 hover:bg-indigo-50/60">
        <div className="flex items-start justify-between gap-3">
          <button onClick={onOpenDrawer} className="min-w-0 flex-1 text-left">
            <RowHeader row={row} />
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {row.campus_name} · {STAKEHOLDER_TYPE_LABELS[row.stakeholder_type]}
              {row.primary_contact_name && ` · ${row.primary_contact_name}`}
            </p>
            <p className="mt-1 text-xs font-medium text-indigo-900">
              📅 Booked {row.meeting_at ? formatLongDate(row.meeting_at) : "(time TBD)"}
            </p>
          </button>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={onMarkPartner}
              title="Meeting happened and they committed to sharing — graduate them to Active Partner."
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Mark Partner ★
            </button>
          </div>
        </div>
      </div>
    );
  }
  // in_flight
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/30 px-4 py-3 hover:bg-amber-50/60">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onOpenDrawer} className="min-w-0 flex-1 text-left">
          <RowHeader row={row} />
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {row.campus_name} · {STAKEHOLDER_TYPE_LABELS[row.stakeholder_type]}
            {row.primary_contact_name && ` · ${row.primary_contact_name}`}
          </p>
          <p className="mt-1 text-xs font-medium text-amber-900">
            🤝 Finding a time — coordinate over email, then mark scheduled
          </p>
        </button>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={onMarkScheduledFromInFlight}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Mark scheduled →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Replies tab row card (v8 — 7 states) ────────────────────────────────

function RepliesRowCard({
  row,
  onOpenDrawer,
  onClassifyReply,
  onMarkPartner,
  onResumeOutreach,
  onCloseAsNoResponse,
  onSendFollowupEmail,
}: { row: TabRow } & RowCardCallbacks) {
  const state: RepliesState = row.replies_state ?? "mid_cadence";

  // Color tone per state.
  const tone: Record<RepliesState, string> = {
    mid_cadence: "border-gray-200 bg-white",
    engaged: "border-blue-200 bg-blue-50/40",
    wants_meeting: "border-amber-200 bg-amber-50/40",
    booked: "border-indigo-200 bg-indigo-50/40",
    needs_followup: "border-blue-200 bg-blue-50/40",
    awaiting_callback: "border-purple-200 bg-purple-50/40",
    stale: "border-gray-300 bg-gray-50",
  };

  return (
    <div className={`rounded-lg border px-4 py-3 hover:opacity-100 ${tone[state]}`}>
      <button onClick={onOpenDrawer} className="block w-full text-left">
        <RowHeader row={row} />
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {row.campus_name} · {STAKEHOLDER_TYPE_LABELS[row.stakeholder_type]}
          {row.primary_contact_name && ` · ${row.primary_contact_name}`}
        </p>
        <RepliesStateLine row={row} state={state} />
      </button>
      <div className="mt-2 flex flex-wrap gap-2">
        <RepliesStateActions
          state={state}
          onClassifyReply={onClassifyReply}
          onMarkPartner={onMarkPartner}
          onResumeOutreach={onResumeOutreach}
          onCloseAsNoResponse={onCloseAsNoResponse}
          onSendFollowupEmail={onSendFollowupEmail}
        />
      </div>
    </div>
  );
}

function RepliesStateLine({ row, state }: { row: TabRow; state: RepliesState }) {
  switch (state) {
    case "mid_cadence":
      return (
        <p className="mt-1 text-xs text-gray-500">
          Mid-cadence{row.last_activity_at ? ` · last activity ${formatRelative(row.last_activity_at)}` : ""}{" "}
          · keep waiting for a reply
        </p>
      );
    case "engaged":
      return (
        <p className="mt-1 text-xs font-medium text-blue-900">
          📬 They replied{row.last_activity_at ? ` · ${formatRelative(row.last_activity_at)}` : ""}
        </p>
      );
    case "wants_meeting":
      return (
        <p className="mt-1 text-xs font-medium text-amber-900">
          🤝 Wants a meeting · coordinate the time
        </p>
      );
    case "booked":
      return (
        <p className="mt-1 text-xs font-medium text-indigo-900">
          📅 Booked {row.meeting_at ? formatLongDate(row.meeting_at) : "(time TBD)"}
        </p>
      );
    case "needs_followup":
      return (
        <div className="mt-1">
          <p className="text-xs font-medium text-blue-900">🔄 Met — needs follow-up</p>
          {row.followup_notes && (
            <p className="mt-0.5 text-[11px] italic text-gray-700">
              &quot;{row.followup_notes.slice(0, 160)}
              {row.followup_notes.length > 160 ? "…" : ""}&quot;
            </p>
          )}
        </div>
      );
    case "awaiting_callback":
      return (
        <p className="mt-1 text-xs font-medium text-purple-900">
          📞 {row.awaiting_callback_kind === "promised" ? "Promised callback" : "Voicemail left"}
          {row.awaiting_callback_at && ` · ${formatRelative(row.awaiting_callback_at)}`}
          {" — check inbox / voicemail"}
        </p>
      );
    case "stale":
      return (
        <p className="mt-1 text-xs font-medium text-gray-700">
          💤 No reply{row.stale_days != null ? ` in ${row.stale_days} days` : ""} · cadence ended
        </p>
      );
  }
}

function RepliesStateActions({
  state,
  onClassifyReply,
  onMarkPartner,
  onResumeOutreach,
  onCloseAsNoResponse,
  onSendFollowupEmail,
}: {
  state: RepliesState;
  onClassifyReply: (source: "email_reply" | "callback") => void;
  onMarkPartner: () => void;
  onResumeOutreach: () => Promise<void>;
  onCloseAsNoResponse: () => Promise<void>;
  onSendFollowupEmail: () => void;
}) {
  switch (state) {
    case "mid_cadence":
      return (
        <button
          onClick={() => onClassifyReply("email_reply")}
          title="Saw a reply in Gmail? Click to triage what they said."
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          📬 They replied
        </button>
      );
    case "engaged":
      return (
        <>
          <button
            onClick={() => onClassifyReply("email_reply")}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Triage their reply
          </button>
          <button
            onClick={onMarkPartner}
            title="They committed to sharing with students."
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Mark Partner ★
          </button>
        </>
      );
    case "wants_meeting":
      return (
        <button
          onClick={() => onClassifyReply("email_reply")}
          title="Got a time? Open the classifier and pick 'Already booked' to schedule."
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Mark scheduled →
        </button>
      );
    case "booked":
      // Informational — no row buttons. Drawer opens for editing.
      return (
        <span className="text-[11px] italic text-gray-500">
          Tap the row to view meeting details.
        </span>
      );
    case "needs_followup":
      return (
        <>
          <button
            onClick={onSendFollowupEmail}
            title="Open Gmail composer with a follow-up subject pre-filled."
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Send follow-up email ↗
          </button>
          <button
            onClick={onMarkPartner}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Mark Partner ★
          </button>
        </>
      );
    case "awaiting_callback":
      return (
        <>
          <button
            onClick={() => onClassifyReply("callback")}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Got a callback
          </button>
          <button
            onClick={() => onResumeOutreach()}
            title="Still nothing — re-queue a call in 3 days and resume cadence."
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Resume outreach
          </button>
        </>
      );
    case "stale":
      return (
        <>
          <button
            onClick={onSendFollowupEmail}
            title="Open Gmail with a custom re-engage subject pre-filled."
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Custom re-engage ↗
          </button>
          <button
            onClick={() => onCloseAsNoResponse()}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Close as no response
          </button>
        </>
      );
  }
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

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
