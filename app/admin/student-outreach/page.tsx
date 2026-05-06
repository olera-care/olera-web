"use client";

/**
 * Admin Student Outreach Funnel — main page (v8).
 *
 * Six tabs in workflow order:
 *   Research → Calls → Replies → Meetings → Partners → Archive → All
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

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import PulseHeader from "@/components/admin/PulseHeader";
import type { DateRangeValue } from "@/components/admin/DateRangePopover";
import { Drawer } from "./Drawer";
import { AddStakeholderModal } from "./AddStakeholderModal";
import { BulkResearchModal } from "./BulkResearchModal";
import { LogCallOutcomeModal } from "./LogCallOutcomeModal";
import { ReplyClassifierModal } from "./ReplyClassifierModal";
import { MarkPartnerModal } from "./MarkPartnerModal";
import { LogMeetingModal, type MeetingStatus } from "./LogMeetingModal";
import {
  STAKEHOLDER_TYPE_LABELS,
  STATUS_LABELS,
  type Campus,
  type DistributionEvidence,
  type DrawerContext,
  type RepliesState,
  type ResearchCampusCard,
  type StakeholderType,
  type TabCounts,
  type TabRow,
} from "@/lib/student-outreach/types";
import { OUTREACH_DAYS_BY_TYPE } from "@/lib/student-outreach/cadence";
import { getTemplate } from "@/lib/student-outreach/templates";
import type { EmailSnapshot } from "@/lib/student-outreach/sequencer";

type TabKey = "research" | "calls" | "replies" | "meetings" | "partners" | "archive" | "all";

// v8.10.9: emojis dropped — tab styling matches the Questions page
// (plain label + count, gray text, gray underline on active).
interface TabDef {
  key: TabKey;
  label: string;
  tooltip: string;
}

const TABS: TabDef[] = [
  { key: "research",  label: "Research",        tooltip: "New stakeholders that still need research before email outreach starts." },
  { key: "calls",     label: "Calls",           tooltip: "Phone calls due today. Tap to dial; log the outcome from the row." },
  { key: "replies",   label: "Replies",         tooltip: "Email replies, callbacks, voicemails. Triage what they said and pick the next step." },
  { key: "meetings",  label: "Meetings",        tooltip: "Stakeholders coordinating a time, or with a meeting on the calendar." },
  { key: "partners",  label: "Partners",        tooltip: "Stakeholders sharing with students. Click Engage to work pending partner tasks (task board posting, materials, follow-ups)." },
  { key: "archive",   label: "Archive",         tooltip: "Stale and no-response outreach. Cadence ran out without engagement. They auto-rejoin Replies if they reply or call back later." },
  { key: "all",       label: "All",             tooltip: "Search and filter every stakeholder across all stages." },
];

const TYPE_FILTERS: Array<{ key: StakeholderType | "all"; label: string }> = [
  { key: "all", label: "All types" },
  { key: "student_org", label: "Student Orgs" },
  { key: "advisor", label: "Advisors" },
  { key: "dept_head", label: "Dept Heads" },
  { key: "professor", label: "Professors" },
];

// "Stop outreach" reason → action name map (declared near the type constants
// so the renderRow callback can resolve it without re-importing).
const STOP_OUTREACH_ACTIONS: Record<
  "not_interested" | "no_response_closed" | "wrong_contact" | "do_not_contact",
  string
> = {
  not_interested: "mark_not_interested",
  no_response_closed: "mark_no_response_closed",
  wrong_contact: "mark_wrong_contact",
  do_not_contact: "mark_dnc",
};

const STOP_OUTREACH_LABELS: Record<keyof typeof STOP_OUTREACH_ACTIONS, string> = {
  not_interested: "Not interested",
  no_response_closed: "No response",
  wrong_contact: "Wrong contact",
  do_not_contact: "Do not contact",
};

export default function StudentOutreachPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusSlug, setCampusSlug] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<StakeholderType | "all">("all");
  const [tab, setTab] = useState<TabKey>("research");
  // v8.10.9: PulseHeader date range. KPI = student signups in range.
  const [range, setRange] = useState<DateRangeValue>({ preset: "30d", customFrom: "", customTo: "" });
  const [showClosed, setShowClosed] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<TabRow[]>([]);
  const [researchCampuses, setResearchCampuses] = useState<ResearchCampusCard[]>([]);
  const [tabCounts, setTabCounts] = useState<TabCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [bulkResearchCampus, setBulkResearchCampus] = useState<ResearchCampusCard | null>(null);

  // v8: per-row action modals (driven by row buttons, not the drawer).
  const [callOutcomeRow, setCallOutcomeRow] = useState<TabRow | null>(null);
  const [classifierRow, setClassifierRow] = useState<{
    row: TabRow;
    source: "email_reply" | "callback";
  } | null>(null);
  const [partnerRow, setPartnerRow] = useState<TabRow | null>(null);
  // v8.10.19: universal Meetings-tab modal. Replaces the previous
  // state-specific "Booked it" + "Make Partner ★" CTAs with a single
  // "Log Meeting" entry point.
  const [logMeetingRow, setLogMeetingRow] = useState<TabRow | null>(null);

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
      setResearchCampuses(data.research_campuses ?? []);
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

  // Per-row render — used by both the flat list and the Replies grouped list.
  const renderRow = useCallback(
    (row: TabRow) => (
      <RowCard
        tab={tab}
        row={row}
        onOpenDrawer={() => setOpenOutreachId(row.id)}
        onLogCallOutcome={() => setCallOutcomeRow(row)}
        onClassifyReply={(source) => setClassifierRow({ row, source })}
        onMarkPartner={() => setPartnerRow(row)}
        onStopOutreach={async (reason) => {
          const action = STOP_OUTREACH_ACTIONS[reason];
          const label = STOP_OUTREACH_LABELS[reason];
          if (!window.confirm(`Stop outreach: ${label}?`)) return;
          try { await callAction(row.id, action); }
          catch (e) { setError(e instanceof Error ? e.message : "Action failed"); }
        }}
        onLogMeeting={() => setLogMeetingRow(row)}
        onSendFollowupEmail={() => {
          const subject = encodeURIComponent(`Following up — ${row.organization_name}`);
          const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}`;
          window.open(url, "_blank", "noopener,noreferrer");
        }}
      />
    ),
    [tab, callAction],
  );

  // v8.10.9: PulseHeader stats are scoped to the active campus filter
  // — when admin selects "Texas A&M University", the KPI + chart
  // narrow to signups whose metadata.university matches that campus.
  const statsPath = useMemo(() => {
    const base = "/api/admin/student-outreach/stats";
    return campusSlug ? `${base}?campus=${encodeURIComponent(campusSlug)}` : base;
  }, [campusSlug]);

  return (
    <div>
      <PulseHeader
        title="Student Outreach"
        kpiSuffix="student signups"
        statsPath={statsPath}
        range={range}
        onRangeChange={setRange}
        actions={
          <>
            <a
              href="https://mail.google.com/mail/u/0/#inbox"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Gmail in a new tab to triage replies, callbacks, and voicemails."
              className="text-sm font-medium text-emerald-700 underline hover:no-underline"
            >
              Open Gmail ↗
            </a>
            <button
              onClick={() => setShowAdd(true)}
              title="Add a new advisor, dept head, or student org for a campus."
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              + Add Stakeholder
            </button>
          </>
        }
      />

      {/* v8.10.8: search + filters condensed into one horizontal row above
          the tabs. Search takes the available flex; campus + type are
          shrink-0 dropdowns on the right. Reduces page header height. */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by organization name…"
          className="min-w-[220px] flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
        />
        <select
          value={campusSlug}
          onChange={(e) => setCampusSlug(e.target.value)}
          title="Filter to one campus, or 'All campuses' to see everything."
          className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none"
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
          className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none"
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
        {/* v8.10.21: dropped the "View <campus> →" inline link. The
            dropdown selection itself is enough indicator that the page
            is filtered to one campus; the deep-link to the dedicated
            campus page is reachable from the Campuses sidebar item. */}
      </div>

      {/* v8.10.9: tab styling matches the Questions page — plain label
          + small gray count, gray underline on active. No emojis. */}
      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-gray-100">
        {TABS.map((t) => {
          const count = tabCounts?.[t.key];
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              title={t.tooltip}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.label}
              {typeof count === "number" && count > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* v8.10.8: per-tab banners removed entirely. Calls + Meetings
          nudges ("Calls due. Tap the number…" / "Meetings to book or
          run…") were redundant with the tab name + card affordances.
          Replies tab uses the section subtitle for its Gmail nudge.
          Open Gmail moved to the top-right header (v8.10.5). */}

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
      ) : tab === "research" ? (
        <ResearchTabContent
          rows={rows}
          researchCampuses={researchCampuses}
          renderRow={renderRow}
          onContinueCampus={(c) => setBulkResearchCampus(c)}
          onMarkResearchComplete={async (slug, name) => {
            if (!window.confirm(`Mark research complete for ${name}? You can reopen later from the Campuses page.`)) return;
            try {
              const res = await fetch(`/api/admin/student-outreach/campuses/${slug}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ research_complete: true }),
              });
              if (!res.ok) throw new Error((await res.json()).error || "Failed to mark complete");
              await refetch();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Action failed");
            }
          }}
          onBulkStartOutreach={async (selectedRows) => {
            // v8.10.31: bulk fire schedule_sequence with the default
            // template snapshots for each row's stakeholder type +
            // organization + campus. No per-email review — the admin
            // already opted into bulk by selecting multiple rows.
            const errors: string[] = [];
            for (const row of selectedRows) {
              try {
                const snapshots = buildDefaultEmailSnapshots({
                  stakeholder_type: row.stakeholder_type,
                  organization_name: row.organization_name,
                  campus_name: row.campus_name,
                });
                await callAction(row.id, "schedule_sequence", { email_snapshots: snapshots });
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Failed";
                errors.push(`${row.organization_name}: ${msg}`);
              }
            }
            if (errors.length > 0) {
              setError(`${errors.length} of ${selectedRows.length} failed. ${errors.slice(0, 3).join("; ")}`);
            }
          }}
          tabCountsAll={tabCounts?.all ?? 0}
        />
      ) : rows.length === 0 ? (
        <EmptyState tab={tab} tabCounts={tabCounts} onAdd={() => setShowAdd(true)} />
      ) : tab === "replies" ? (
        <RepliesGroupedList rows={rows} renderRow={(row) => renderRow(row)} />
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>{renderRow(row)}</li>
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
          onChooseConvert={async (notes) => {
            // v8.8: log the call FIRST (server marks current call task
            // complete + writes call_connected touchpoint w/o transitioning
            // stage), then chain into MarkPartnerModal which captures
            // evidence and runs the active_partner transition.
            try {
              await callAction(callOutcomeRow.id, "log_call", {
                outcome: "convert_to_partner",
                notes,
              });
              const r = callOutcomeRow;
              setCallOutcomeRow(null);
              setPartnerRow(r);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            }
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
      {logMeetingRow && (
        <LogMeetingModal
          organizationName={logMeetingRow.organization_name}
          contactName={logMeetingRow.primary_contact_name}
          initialStatus={
            logMeetingRow.meeting_state === "scheduled" ? "booked" : "finding_time"
          }
          initialMeetingAt={
            // datetime-local expects YYYY-MM-DDTHH:mm in LOCAL time. The
            // server stores ISO UTC, so trim the seconds + Z and feed
            // the rest. The browser interprets this as local time —
            // matches the picker's display format.
            logMeetingRow.meeting_at
              ? logMeetingRow.meeting_at.slice(0, 16)
              : undefined
          }
          onCancel={() => setLogMeetingRow(null)}
          onSubmit={async (status: MeetingStatus, payload) => {
            try {
              if (status === "booked") {
                await callAction(logMeetingRow.id, "mark_meeting_scheduled", {
                  meeting_at: payload.meeting_at,
                  notes: payload.notes,
                });
                setLogMeetingRow(null);
              } else if (status === "finding_time") {
                await callAction(logMeetingRow.id, "flag_wants_meeting", {
                  notes: payload.notes,
                });
                setLogMeetingRow(null);
              } else if (status === "done_followup") {
                // v8.10.28: meeting happened, but more email is needed.
                // mark_meeting_followup writes meeting_held + post_meeting_followup
                // note → row leaves Meetings, lands in Replies as needs_followup.
                await callAction(logMeetingRow.id, "mark_meeting_followup", {
                  notes: payload.notes,
                });
                setLogMeetingRow(null);
              } else if (status === "done_partner") {
                // v8.10.28: meeting happened and they're sharing it.
                // Close this modal and open MarkPartnerModal so the admin
                // can pick evidence type (verbal, observed, etc.) and
                // graduate the row to active_partner.
                const r = logMeetingRow;
                setLogMeetingRow(null);
                setPartnerRow(r);
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
              throw e;
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
      {bulkResearchCampus && (
        <BulkResearchModal
          campus={bulkResearchCampus}
          onClose={() => setBulkResearchCampus(null)}
          onSaved={async () => {
            setBulkResearchCampus(null);
            await refetch();
          }}
        />
      )}
    </div>
  );
}

// ── Top banners ──────────────────────────────────────────────────────────
//
// v8.2: one short line + (optional) link button. Subtle gray chrome.
// No emoji, no onboarding paragraphs.

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
          className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
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
    partners: "No partners yet. Mark a stakeholder as Partner when they commit to sharing.",
    archive: "Archive is empty — no stale or no-response outreach yet.",
    all: "No matches.",
  };
  return <p className="py-12 text-center text-sm text-gray-400">{blurbs[tab]}</p>;
}

// ── Row rendering ───────────────────────────────────────────────────────
//
// v8.2: every tab uses one shell (`StakeholderCard`) with one border
// tone (gray-200), three pill tones (neutral / attention / partner), and
// two button tones (primary gray-900 / celebration emerald-600). Per-tab
// content lives in three slots: pills (inline with org name), footnote
// (small text below sub-line), and a right-side button stack.

type StopOutreachReason =
  | "not_interested"
  | "no_response_closed"
  | "wrong_contact"
  | "do_not_contact";

interface RowCardCallbacks {
  onOpenDrawer: () => void;
  onLogCallOutcome: () => void;
  onClassifyReply: (source: "email_reply" | "callback") => void;
  onMarkPartner: () => void;
  onStopOutreach: (reason: StopOutreachReason) => Promise<void>;
  onLogMeeting: () => void;
  onSendFollowupEmail: () => void;
}

function RowCard({
  tab,
  row,
  ...cb
}: { tab: TabKey; row: TabRow } & RowCardCallbacks) {
  const slots = buildRowSlots(tab, row, cb);
  return (
    <StakeholderCard
      row={row}
      pill={slots.pill}
      footnote={slots.footnote}
      headlineAccessory={slots.headlineAccessory}
      cta={slots.cta}
      overflowMenu={slots.overflowMenu}
      onOpenDrawer={cb.onOpenDrawer}
    />
  );
}

/**
 * Unified row shell — v8.10.12 layout.
 *
 *   [Contact name + headlineAccessory]                     [⋯ overflow]
 *   [org · campus · type · role]
 *   [footnote — last activity, overdue, etc.]
 *   [status pill]
 *   [notes (optional)]
 *                                                         [Primary CTA]
 *
 * Three regions: descriptive content (left column, top-down), overflow
 * menu (top-right), primary CTA (bottom-right). Each per-tab slots
 * function returns whichever pieces apply; missing pieces don't render.
 */
function StakeholderCard({
  row,
  pill,
  footnote,
  headlineAccessory,
  cta,
  overflowMenu,
  onOpenDrawer,
}: {
  row: TabRow;
  pill?: ReactNode;
  footnote?: ReactNode;
  headlineAccessory?: ReactNode;
  cta?: ReactNode;
  overflowMenu?: ReactNode;
  onOpenDrawer: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDrawer}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDrawer();
        }
      }}
      title="Open the drawer for full context and history."
      className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="flex items-stretch justify-between gap-3">
        {/* LEFT: descriptive content stacked top-down */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-gray-900">
              {row.primary_contact_name || row.organization_name}
            </p>
            {headlineAccessory}
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {row.primary_contact_name &&
              row.primary_contact_name !== row.organization_name && (
              <>
                {row.organization_name}
                {row.department && row.department !== row.organization_name && ` · ${row.department}`}
                {" · "}
              </>
            )}
            {row.campus_name} · {STAKEHOLDER_TYPE_LABELS[row.stakeholder_type]}
            {row.primary_contact_role && ` · ${row.primary_contact_role}`}
          </p>
          {footnote}
          {/* Pill (status) sits below the footnote — matches the
              v8.10.12 spec: status tag stacked under the last-activity
              line, not competing with the CTA on the right. */}
          {(pill || row.has_pending_job_board_task) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {row.has_pending_job_board_task && (
                <span
                  title="Pending: post Olera's listing to the campus task board."
                  className="shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-900"
                >
                  Task board: post pending
                </span>
              )}
              {pill}
            </div>
          )}
        </div>

        {/* RIGHT: ellipsis at top, CTA at bottom. justify-between pushes
            them apart so the CTA always anchors to the bottom edge of
            the card no matter how tall the left content grows. */}
        {(cta || overflowMenu) && (
          <div className="flex shrink-0 flex-col items-end justify-between gap-2">
            <div className="flex items-center">{overflowMenu}</div>
            <div className="flex items-center">{cta}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pills (single tone — soft slate, easy on the eyes) ──────────────────

function Pill({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className="shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700"
    >
      {children}
    </span>
  );
}

/**
 * v8.10.23: long notes on cards truncate to a character limit and
 * expose a "See more" toggle — clicking inline-expands the full text
 * without opening the drawer. Keeps card heights consistent and
 * scannable while preserving access to the full quote.
 *
 * The toggle uses stopPropagation so clicking it doesn't bubble to
 * the card's drawer-open handler.
 */
function ExpandableNote({ text, limit = 100 }: { text: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > limit;
  const display = expanded || !needsTruncation ? text : text.slice(0, limit).trimEnd();
  return (
    <p className="mt-0.5 text-[11px] italic text-gray-700">
      &quot;{display}
      {!expanded && needsTruncation && "…"}&quot;
      {needsTruncation && (
        <>
          {" "}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((s) => !s);
            }}
            className="not-italic text-emerald-700 underline hover:no-underline"
          >
            {expanded ? "See less" : "See more"}
          </button>
        </>
      )}
    </p>
  );
}

// ── Buttons (single tone — emerald primary) ──────────────────────────────

function PrimaryAction({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
    >
      {children}
    </button>
  );
}

// ── Overflow ⋯ menu (with two-step Stop outreach picker) ─────────────────

interface OverflowItem {
  label: string;
  onClick: () => void;
  tone?: "default" | "celebration";
}

function OverflowMenu({
  items,
  onStopOutreach,
}: {
  items: OverflowItem[];
  onStopOutreach: (reason: StopOutreachReason) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowReasons(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setShowReasons(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const close = () => { setOpen(false); setShowReasons(false); };
  const stop = (reason: StopOutreachReason) => {
    void onStopOutreach(reason);
    close();
  };

  return (
    <div ref={ref} className="relative self-end">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((s) => !s); setShowReasons(false); }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        title="More actions"
        aria-label="More actions"
      >
        <span aria-hidden>⋯</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {showReasons ? (
            <>
              <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Stop outreach — why?
              </p>
              <MenuItem onClick={() => stop("no_response_closed")}>No response</MenuItem>
              <MenuItem onClick={() => stop("not_interested")}>Not interested</MenuItem>
              <MenuItem onClick={() => stop("wrong_contact")}>Wrong contact</MenuItem>
              <MenuItem onClick={() => stop("do_not_contact")} danger>Do not contact</MenuItem>
              <div className="my-1 border-t border-gray-100" />
              <MenuItem onClick={() => setShowReasons(false)}>← Back</MenuItem>
            </>
          ) : (
            <>
              {items.map((item, i) => (
                <MenuItem
                  key={i}
                  onClick={() => { item.onClick(); close(); }}
                  celebration={item.tone === "celebration"}
                >
                  {item.label}
                </MenuItem>
              ))}
              {items.length > 0 && <div className="my-1 border-t border-gray-100" />}
              <MenuItem onClick={() => setShowReasons(true)} danger>
                Stop outreach…
              </MenuItem>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
  celebration,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
  celebration?: boolean;
}) {
  const colorClass = danger
    ? "text-red-700 hover:bg-red-50"
    : celebration
    ? "text-emerald-700 hover:bg-emerald-50"
    : "text-gray-700 hover:bg-gray-50";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`block w-full px-3 py-1.5 text-left text-xs font-medium ${colorClass}`}
    >
      {children}
    </button>
  );
}

// ── Per-tab slot builders ────────────────────────────────────────────────

// v8.10.12: standardized card geometry across every tab.
//   - pill         → status tag, stacked on the LEFT below "footnote".
//                    Was previously on the right competing with the CTA.
//   - footnote     → informational line under the subline (last-activity,
//                    overdue indicator, followup-notes quote, etc.).
//   - cta          → primary action, anchored BOTTOM-RIGHT of the card.
//   - overflowMenu → ellipsis stack, anchored TOP-RIGHT of the card.
//   - headlineAccessory → inline next to the contact name (e.g. tel: link
//                    on Calls tab cards).
// Each per-tab slots function returns whichever subset applies; missing
// pieces just don't render.
interface RowSlots {
  pill?: ReactNode;
  footnote?: ReactNode;
  cta?: ReactNode;
  overflowMenu?: ReactNode;
  headlineAccessory?: ReactNode;
}

/**
 * v8.10.15: every card across every tab gets the same overflow menu —
 * Make Partner + Stop Outreach are universally accessible from the ⋯
 * top-right of any card. Per-tab additions go via `extraItems`; per-row
 * exclusions (e.g. Make Partner on already-active partners) via
 * `excludeMakePartner`.
 *
 * Stop Outreach is wired through the OverflowMenu component itself
 * (it owns the reason-picker submenu); Make Partner is a top-level
 * item that fires `cb.onMarkPartner`.
 */
function buildUniversalOverflow(
  cb: RowCardCallbacks,
  options: {
    excludeMakePartner?: boolean;
    extraItems?: OverflowItem[];
  } = {},
): ReactNode {
  const items: OverflowItem[] = [];
  if (!options.excludeMakePartner) {
    items.push({ label: "Make Partner ★", onClick: cb.onMarkPartner, tone: "celebration" });
  }
  if (options.extraItems) items.push(...options.extraItems);
  return <OverflowMenu items={items} onStopOutreach={cb.onStopOutreach} />;
}

function buildRowSlots(tab: TabKey, row: TabRow, cb: RowCardCallbacks): RowSlots {
  if (tab === "research") return researchSlots(row, cb);
  if (tab === "calls") return callsSlots(row, cb);
  if (tab === "replies") return repliesSlots(row, cb);
  if (tab === "meetings") return meetingsSlots(row, cb);
  if (tab === "partners") return partnersSlots(row, cb);
  if (tab === "archive") return archiveSlots(row, cb);
  return allSlots(row, cb);
}

function researchSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  const pill =
    row.status === "researched"
      ? <Pill title="Has contact + programs — ready to start the email sequence.">Ready to email</Pill>
      : <Pill title="Add a contact and programs in the drawer, then start outreach.">Needs contact</Pill>;
  return {
    pill,
    cta: (
      <PrimaryAction
        onClick={cb.onOpenDrawer}
        title="Open the drawer to review research + email cadence, then start outreach."
      >
        Start Outreach
      </PrimaryAction>
    ),
    overflowMenu: buildUniversalOverflow(cb),
  };
}

function callsSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  return {
    footnote: row.due_call_task ? (
      <p className="mt-0.5 text-[11px] text-gray-400">
        {formatDueDate(row.due_call_task.due_at)}
      </p>
    ) : null,
    headlineAccessory: row.primary_contact_phone ? (
      <a
        href={`tel:${row.primary_contact_phone}`}
        onClick={(e) => e.stopPropagation()}
        title="Tap to dial (mobile) — opens the default phone app."
        className="shrink-0 text-xs text-emerald-700 underline hover:no-underline"
      >
        📞 {row.primary_contact_phone}
      </a>
    ) : null,
    cta: <PrimaryAction onClick={cb.onLogCallOutcome}>Log call</PrimaryAction>,
    overflowMenu: buildUniversalOverflow(cb),
  };
}

function repliesSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  // v8.10.12: standardized layout. Pill stacks under the footnote (last
  // activity / followup-notes quote). CTA is bottom-right. Overflow is
  // top-right. Instructional nudges ("Coordinate the time, then log
  // the booking", etc.) removed — the UI hierarchy itself teaches the
  // workflow.
  const lastActivityFootnote = row.last_activity_at ? (
    <p className="mt-0.5 text-[11px] text-gray-400">
      Last activity {formatRelative(row.last_activity_at)}
    </p>
  ) : null;
  const state: RepliesState = row.replies_state ?? "mid_cadence";
  switch (state) {
    case "mid_cadence":
      return {
        footnote: lastActivityFootnote,
        cta: (
          <PrimaryAction
            onClick={() => cb.onClassifyReply("email_reply")}
            title="Saw a reply in Gmail? Click to record what they said."
          >
            Log reply
          </PrimaryAction>
        ),
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "engaged":
      return {
        footnote: lastActivityFootnote,
        pill: <Pill>Replied</Pill>,
        cta: <PrimaryAction onClick={() => cb.onClassifyReply("email_reply")}>Log reply</PrimaryAction>,
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "wants_meeting":
      return {
        footnote: lastActivityFootnote,
        pill: <Pill>Wants to meet</Pill>,
        cta: <PrimaryAction onClick={() => cb.onClassifyReply("email_reply")}>Log reply</PrimaryAction>,
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "booked":
      // Filtered out of Replies server-side in v8.2. Kept here for type-completeness only.
      return {
        pill: <Pill>{row.meeting_at ? `Booked · ${formatLongDate(row.meeting_at)}` : "Booked"}</Pill>,
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "needs_followup":
      // v8.10.17: unified CTA. v8.10.23: notes truncate at 100 chars
      // with a "See more" inline expander so card heights stay
      // consistent.
      return {
        footnote: row.followup_notes ? (
          <ExpandableNote text={row.followup_notes} />
        ) : lastActivityFootnote,
        pill: <Pill>Met — needs follow-up</Pill>,
        cta: <PrimaryAction onClick={() => cb.onClassifyReply("email_reply")}>Log reply</PrimaryAction>,
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "awaiting_callback":
      return {
        footnote: lastActivityFootnote,
        pill: (
          <Pill>
            {row.awaiting_callback_kind === "promised" ? "Promised callback" : "Voicemail"}
            {row.awaiting_callback_at ? ` · ${formatShortRelative(row.awaiting_callback_at)}` : ""}
          </Pill>
        ),
        cta: <PrimaryAction onClick={() => cb.onClassifyReply("callback")}>Log reply</PrimaryAction>,
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "stale":
      // v8.10.6: stale rows live in Archive — server filters them out
      // of Replies. Kept here for type-completeness only.
      return {
        pill: <Pill>Stale{row.stale_days != null ? ` · ${row.stale_days}d` : ""}</Pill>,
        overflowMenu: buildUniversalOverflow(cb),
      };
  }
}

function meetingsSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  // v8.10.28: CTA label flips based on lifecycle stage. Same modal
  // handles every state — finding_time, booked, and the two "done"
  // outcomes (sharing → Partner / needs more email → Replies) — but
  // the button text matches the natural next move:
  //   - finding_time row → "Log Meeting" (admin is still setting it up)
  //   - booked row       → "Complete" (next move is to mark it done)
  // The modal still lets admin pick any of the four options, so a
  // booked row can be edited and a finding_time row can jump straight
  // to "done" if the meeting somehow already happened.
  const lastActivityFootnote = row.last_activity_at ? (
    <p className="mt-0.5 text-[11px] text-gray-400">
      Last activity {formatRelative(row.last_activity_at)}
    </p>
  ) : null;
  const pill =
    row.meeting_state === "scheduled" ? (
      <Pill title="Meeting is on the calendar.">
        {row.meeting_at ? `Booked · ${formatLongDate(row.meeting_at)}` : "Booked"}
      </Pill>
    ) : (
      <Pill>Finding a time</Pill>
    );
  const ctaLabel = row.meeting_state === "scheduled" ? "Complete" : "Log Meeting";
  return {
    footnote: lastActivityFootnote,
    pill,
    cta: <PrimaryAction onClick={cb.onLogMeeting}>{ctaLabel}</PrimaryAction>,
    overflowMenu: buildUniversalOverflow(cb),
  };
}

function partnersSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  // v8.10.20: universal "Engage" CTA on every partner card. Click →
  // opens the drawer where ongoing partner-management lives (job board
  // task section, seasonal email schedule, history, contacts). Single
  // mental model: "These people already support the program. Engage =
  // maintain and activate the relationship."
  // Pill is the "Next: <task>" descriptor when there's an upcoming
  // automated action; otherwise no pill (tab name carries meaning).
  // Make Partner is excluded from overflow — they already are one.
  return {
    footnote: row.last_activity_at ? (
      <p className="mt-0.5 text-[11px] text-gray-400">
        Last activity {formatRelative(row.last_activity_at)}
      </p>
    ) : null,
    pill: row.next_step_label ? (
      <Pill title="Earliest scheduled action for this partner.">
        {row.next_step_label}
      </Pill>
    ) : undefined,
    cta: (
      <PrimaryAction
        onClick={cb.onOpenDrawer}
        title="Open the drawer to work pending partner tasks (task board posting, materials, follow-ups)."
      >
        Engage
      </PrimaryAction>
    ),
    overflowMenu: buildUniversalOverflow(cb, { excludeMakePartner: true }),
  };
}

function archiveSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  // v8.10.6: Archive holds two kinds of rows:
  //   - status=no_response_closed: cron's end-of-cadence sweep flipped them.
  //     Pill: "No response · Xd cold".
  //   - status=outreach_sent + replies_state=stale: cadence still running
  //     but past STALE_DAYS without a reply. Pill: "Stale · Xd cold".
  // CTA: "Log reply" — handleLogReply flips no_response_closed back to
  // engaged + clears reopen_at, so the row jumps to Replies on the next
  // refresh. Admin uses this when an unprompted email or late callback
  // lands. "Log callback" is in the overflow for voicemail-style updates.
  const isClosed = row.status === "no_response_closed";
  const pillLabel = isClosed
    ? `No response${row.stale_days != null ? ` · ${row.stale_days}d cold` : ""}`
    : `Stale${row.stale_days != null ? ` · ${row.stale_days}d cold` : ""}`;
  return {
    footnote: row.last_activity_at ? (
      <p className="mt-0.5 text-[11px] text-gray-400">
        Last activity {formatRelative(row.last_activity_at)}
      </p>
    ) : null,
    pill: (
      <Pill title="Cadence ran without engagement. Logging a reply or callback re-routes them to Replies.">
        {pillLabel}
      </Pill>
    ),
    cta: (
      <PrimaryAction
        onClick={() => cb.onClassifyReply("email_reply")}
        title="They replied or called back. Log it to re-route this row to Replies."
      >
        Log reply
      </PrimaryAction>
    ),
    overflowMenu: buildUniversalOverflow(cb, {
      extraItems: [{ label: "Log reply (callback)", onClick: () => cb.onClassifyReply("callback") }],
    }),
  };
}

function allSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  // Already-partner rows skip Make Partner in the overflow (no-op for
  // them); everything else gets the universal action menu.
  const isAlreadyPartner = row.status === "active_partner";
  return {
    footnote: row.last_activity_at ? (
      <p className="mt-0.5 text-[11px] text-gray-400">
        Last activity {formatRelative(row.last_activity_at)}
      </p>
    ) : null,
    pill: <Pill title="Stage in the funnel.">{STATUS_LABELS[row.status] ?? row.status}</Pill>,
    overflowMenu: buildUniversalOverflow(cb, { excludeMakePartner: isAlreadyPartner }),
  };
}

// ── Replies list (v8.10.24) ─────────────────────────────────────────────
//
// One unified inbox. Section headers + section subtitle dropped. All
// rows render in a single flat list, sorted by priority so high-touch
// items naturally surface to the top:
//   1. Met — needs follow-up   (warmest, met in person)
//   2. Wants to meet            (high intent, awaiting scheduling)
//   3. Replied                  (responded to email, lower urgency)
//   4. Awaiting callback        (voicemail / promised callback)
//   5. Mid-cadence              (passive monitoring, no event yet)
// Within each tier, the underlying queue order (last_edited_at desc)
// is preserved.
//
// Open Gmail still lives in the page-level top-right header — the
// previous "Check inbox for updates" subtitle was redundant with it.

const REPLIES_PRIORITY: Record<string, number> = {
  needs_followup: 0,
  wants_meeting: 1,
  engaged: 2,
  awaiting_callback: 3,
  mid_cadence: 4,
};

function sortRepliesRows(rows: TabRow[]): TabRow[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    const pa = REPLIES_PRIORITY[a.replies_state ?? ""] ?? 99;
    const pb = REPLIES_PRIORITY[b.replies_state ?? ""] ?? 99;
    return pa - pb;
  });
  return sorted;
}

function RepliesGroupedList({
  rows,
  renderRow,
}: {
  rows: TabRow[];
  renderRow: (row: TabRow) => ReactNode;
}) {
  const sorted = useMemo(() => sortRepliesRows(rows), [rows]);
  if (sorted.length === 0) return null;
  return (
    <ul className="space-y-2">
      {sorted.map((row) => (
        <li key={row.id}>{renderRow(row)}</li>
      ))}
    </ul>
  );
}

// ── Research tab content (v8.4) ─────────────────────────────────────────
//
// Research tab has two sections, top to bottom:
//   1. Campus cards — one per campus where research_complete=false. Each
//      is an entry point into the BulkResearchModal for that campus.
//   2. Stakeholder rows — same row cards as today, one per row in
//      prospect/researched status.
// Inline + Add campus form sits between the two when needed.

// ── Research tab content (v8.10.18) ─────────────────────────────────────
//
// Two sections, top to bottom:
//   1. Campus cards — one per campus where research_complete=false. Each
//      is an entry point into the BulkResearchModal for that campus.
//   2. Stakeholder rows — same row cards as today, one per row in
//      prospect/researched status.
//
// v8.10.18: dropped the inline "+ Add campus" affordance entirely.
// Campuses enter Student Outreach only via the Staffing Outreach
// workflow (a provider becomes an Active Partner → their linked
// university auto-flows in here). This keeps the workflow clean and
// prevents accidental duplicate campus creation. The dedicated
// /admin/student-outreach/campuses page also no longer offers manual
// campus creation.

/**
 * v8.10.31: build the default email-template snapshots for one stakeholder.
 * Mirrors the initialization logic in PreFlightReviewModal — same templates,
 * same days. Used by the Research-tab bulk-start flow when admin doesn't
 * want to review each email individually before firing.
 */
function buildDefaultEmailSnapshots(args: {
  stakeholder_type: StakeholderType;
  organization_name: string;
  campus_name: string;
}): EmailSnapshot[] {
  const days = OUTREACH_DAYS_BY_TYPE[args.stakeholder_type] ?? [];
  const out: EmailSnapshot[] = [];
  for (const d of days) {
    for (const step of d.steps) {
      if (step.channel !== "email" || !step.template) continue;
      const tpl = getTemplate(step.template, {
        stakeholder_type: args.stakeholder_type,
        organization_name: args.organization_name,
        campus_name: args.campus_name,
      });
      out.push({ day: d.day, template: step.template, subject: tpl.subject, body: tpl.body });
    }
  }
  return out;
}

function ResearchTabContent({
  rows,
  researchCampuses,
  renderRow,
  onContinueCampus,
  onMarkResearchComplete,
  onBulkStartOutreach,
  tabCountsAll,
}: {
  rows: TabRow[];
  researchCampuses: ResearchCampusCard[];
  renderRow: (row: TabRow) => ReactNode;
  onContinueCampus: (campus: ResearchCampusCard) => void;
  onMarkResearchComplete: (slug: string, name: string) => Promise<void>;
  onBulkStartOutreach: (selectedRows: TabRow[]) => Promise<void>;
  tabCountsAll: number;
}) {
  const [filter, setFilter] = useState<"all" | "ready">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);

  const readyRows = useMemo(() => rows.filter((r) => r.status === "researched"), [rows]);
  const visibleRows = filter === "ready" ? readyRows : rows;

  // Drop selections that no longer match (eg. after refetch a row left the tab).
  const visibleIds = useMemo(() => new Set(visibleRows.map((r) => r.id)), [visibleRows]);
  const effectiveSelected = useMemo(
    () => new Set(Array.from(selectedIds).filter((id) => visibleIds.has(id))),
    [selectedIds, visibleIds],
  );

  const toggleRow = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allReadySelected =
    readyRows.length > 0 && readyRows.every((r) => effectiveSelected.has(r.id));
  const toggleSelectAllReady = () => {
    if (allReadySelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(readyRows.map((r) => r.id)));
  };

  const runBulk = async () => {
    const selected = readyRows.filter((r) => effectiveSelected.has(r.id));
    if (selected.length === 0) return;
    if (!window.confirm(
      `Start outreach for ${selected.length} stakeholder${selected.length === 1 ? "" : "s"}? Day-0 emails fire immediately; later days auto-send on schedule.`,
    )) return;
    setBulkRunning(true);
    try {
      await onBulkStartOutreach(selected);
      setSelectedIds(new Set());
    } finally {
      setBulkRunning(false);
    }
  };

  const showCampusSection = researchCampuses.length > 0;
  const showStakeholderSection = rows.length > 0;

  // v8.10.22: empty-state CTA points at Staffing Outreach. Campuses
  // enter Student Outreach only when a provider partner there is
  // linked to a university. Manual campus creation isn't offered
  // anywhere; admins onboard a provider first and the campus follows.
  if (!showCampusSection && !showStakeholderSection) {
    const headline = tabCountsAll === 0 ? "Nothing here yet." : "✓ All caught up.";
    const headlineColor = tabCountsAll === 0 ? "text-gray-700" : "text-emerald-700";
    return (
      <div className="py-12 text-center">
        <p className={`text-sm font-medium ${headlineColor}`}>{headline}</p>
        <p className="mt-1 text-xs text-gray-500">
          Add a provider partner near a school to start student outreach.
        </p>
        <a
          href="/admin/staffing-outreach"
          className="mt-4 inline-block rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Open Staffing Outreach →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showCampusSection && (
        <div>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Campuses in research
          </h3>
          <ul className="space-y-2">
            {researchCampuses.map((c) => (
              <li key={c.id}>
                <ResearchCampusCardView
                  campus={c}
                  onContinue={() => onContinueCampus(c)}
                  onMarkComplete={() => onMarkResearchComplete(c.slug, c.name)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {showStakeholderSection && (
        <div>
          {/* v8.10.18: only render the "Stakeholders in research" h3 when
              there's also a campus section above. With campus cards
              hidden, the header is redundant — the tab name + filter
              row already describe what's listed. */}
          {showCampusSection && (
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Stakeholders in research ({rows.length})
            </h3>
          )}

          {/* v8.10.31: filter pills + bulk-action toolbar. Toggling
              "Ready to email" scopes the list to researched stakeholders
              who already have a contact + programs; checkboxes appear so
              admin can fire schedule_sequence on N rows at once with the
              default template snapshots. */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <FilterPill
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="All"
              count={rows.length}
            />
            <FilterPill
              active={filter === "ready"}
              onClick={() => setFilter("ready")}
              label="Ready to email"
              count={readyRows.length}
            />
            {filter === "ready" && readyRows.length > 0 && (
              <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={allReadySelected}
                  onChange={toggleSelectAllReady}
                  className="rounded border-gray-300"
                />
                Select all ({readyRows.length})
              </label>
            )}
          </div>

          {effectiveSelected.size > 0 && (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
              <span className="text-sm font-medium text-emerald-900">
                {effectiveSelected.size} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  disabled={bulkRunning}
                  className="text-xs font-medium text-emerald-900 underline hover:no-underline disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  onClick={runBulk}
                  disabled={bulkRunning}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {bulkRunning
                    ? `Starting outreach for ${effectiveSelected.size}…`
                    : `Start outreach for ${effectiveSelected.size}`}
                </button>
              </div>
            </div>
          )}

          {visibleRows.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
              {filter === "ready"
                ? "No stakeholders are ready to email yet."
                : "No stakeholders in research."}
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleRows.map((row) => {
                const isReady = row.status === "researched";
                return (
                  <li key={row.id} className="flex items-start gap-2">
                    {isReady && (
                      <input
                        type="checkbox"
                        checked={effectiveSelected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="mt-4 shrink-0 rounded border-gray-300"
                        title="Select for bulk Start outreach"
                      />
                    )}
                    {!isReady && <span className="w-4 shrink-0" aria-hidden />}
                    <div className="flex-1">{renderRow(row)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
      <span className={`ml-1.5 ${active ? "text-white/70" : "text-gray-400"}`}>{count}</span>
    </button>
  );
}

function ResearchCampusCardView({
  campus,
  onContinue,
  onMarkComplete,
}: {
  campus: ResearchCampusCard;
  onContinue: () => void;
  onMarkComplete: () => void;
}) {
  const hasStakeholders = campus.research_stakeholder_count > 0;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onContinue} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {campus.name}
            </p>
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {[campus.city, campus.state].filter(Boolean).join(", ")}
            {hasStakeholders && ` · ${campus.research_stakeholder_count} ${campus.research_stakeholder_count === 1 ? "stakeholder" : "stakeholders"}`}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {campus.last_added_at ? `Last added ${formatRelative(campus.last_added_at)}` : "Just added"}
          </p>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            Research ongoing
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onContinue(); }}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            {hasStakeholders ? "Continue →" : "Start research →"}
          </button>
          <CampusOverflowMenu onMarkComplete={onMarkComplete} />
        </div>
      </div>
    </div>
  );
}

function CampusOverflowMenu({ onMarkComplete }: { onMarkComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative self-end">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((s) => !s); }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        title="More actions"
        aria-label="More actions"
      >
        <span aria-hidden>⋯</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <MenuItem onClick={() => { onMarkComplete(); setOpen(false); }}>
            Mark research complete
          </MenuItem>
        </div>
      )}
    </div>
  );
}

// v8.10.18: AddCampusInline + the OTHER_PRESET_VALUE sentinel removed.
// Manual campus creation is no longer offered from the Student Outreach
// page — campuses flow in via the Staffing Outreach workflow when a
// provider becomes an Active Partner. The /admin/student-outreach/
// campuses page also dropped its + Add campus button. Keeping the
// orphaned component here just makes the file longer; deleted.

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

/** Compact form with no "ago" suffix — used inside pills. */
function formatShortRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
