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

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import PulseHeader from "@/components/admin/PulseHeader";
import type { DateRangeValue } from "@/components/admin/DateRangePopover";
import { Drawer } from "./Drawer";
import { AddStakeholderModal } from "./AddStakeholderModal";
import { BulkResearchModal } from "./BulkResearchModal";
import { LogCallOutcomeModal } from "./LogCallOutcomeModal";
import { ReplyClassifierModal } from "./ReplyClassifierModal";
import { MarkPartnerModal } from "./MarkPartnerModal";
import { PRESET_UNIVERSITIES } from "@/lib/student-outreach/universities";
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
  { key: "partners",  label: "Active Partners", tooltip: "Stakeholders sharing with students. Mostly automated seasonal emails." },
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
        onMarkScheduledFromInFlight={() => setClassifierRow({ row, source: "email_reply" })}
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
        {currentCampus && (
          <Link
            href={`/admin/student-outreach/campus/${currentCampus.slug}`}
            className="shrink-0 text-sm text-blue-600 hover:underline"
          >
            View {currentCampus.name} →
          </Link>
        )}
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
          existingCampuses={campuses}
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
          onAddCampus={async (input) => {
            const res = await fetch(`/api/admin/student-outreach/campuses`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add campus");
            await refetch();
            // v8.5: a brand-new campus has 0 stakeholders, so it won't
            // appear as a card in the Research tab on its own. Auto-open
            // the bulk modal so the admin can immediately add stakeholders
            // — that's what "Add campus" implies as the next step.
            setBulkResearchCampus({
              id: data.campus.id,
              slug: data.campus.slug,
              name: data.campus.name,
              state: data.campus.state,
              city: data.campus.city,
              research_stakeholder_count: 0,
              last_added_at: null,
            });
          }}
          onAddStakeholder={() => setShowAdd(true)}
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
    partners: "No active partners yet. Mark a stakeholder as Active Partner when they commit to sharing.",
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
  onMarkScheduledFromInFlight: () => void;
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
                  title="Pending: post Olera's listing to the campus job board."
                  className="shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-900"
                >
                  Job board: post pending
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
        Review &amp; Start Outreach
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
      return {
        // followup notes quote stays — informational context, not a nudge.
        footnote: row.followup_notes ? (
          <p className="mt-0.5 text-[11px] italic text-gray-700">
            &quot;{row.followup_notes.slice(0, 160)}
            {row.followup_notes.length > 160 ? "…" : ""}&quot;
          </p>
        ) : lastActivityFootnote,
        pill: <Pill>Met — needs follow-up</Pill>,
        cta: <PrimaryAction onClick={cb.onSendFollowupEmail}>Send follow-up</PrimaryAction>,
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
  // v8.10.12: instructional nudge "Coordinate over email, then mark
  // booked" removed from in_flight cards. The pill ("Finding a time")
  // + the "Booked it" CTA already convey the workflow.
  const lastActivityFootnote = row.last_activity_at ? (
    <p className="mt-0.5 text-[11px] text-gray-400">
      Last activity {formatRelative(row.last_activity_at)}
    </p>
  ) : null;
  if (row.meeting_state === "scheduled") {
    return {
      footnote: lastActivityFootnote,
      pill: (
        <Pill title="Meeting is on the calendar.">
          {row.meeting_at ? `Booked · ${formatLongDate(row.meeting_at)}` : "Booked"}
        </Pill>
      ),
      cta: (
        <PrimaryAction
          onClick={cb.onMarkPartner}
          title="Meeting happened and they committed — graduate to Active Partner."
        >
          Make Partner ★
        </PrimaryAction>
      ),
      // Make Partner is the primary CTA here; don't duplicate it in the
      // overflow. Stop Outreach + any future extras still appear.
      overflowMenu: buildUniversalOverflow(cb, { excludeMakePartner: true }),
    };
  }
  // in_flight
  return {
    footnote: lastActivityFootnote,
    pill: <Pill>Finding a time</Pill>,
    cta: <PrimaryAction onClick={cb.onMarkScheduledFromInFlight}>Booked it</PrimaryAction>,
    overflowMenu: buildUniversalOverflow(cb),
  };
}

function partnersSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  // No "Active Partner" pill — the tab name carries the meaning. Just the
  // Next: … pill (when there's an upcoming task). Already-active partners
  // skip Make Partner in the overflow but keep Stop Outreach (for the
  // rare close-out case).
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

// ── Replies grouping (v8.10.6) ──────────────────────────────────────────
//
// Two soft sections: "Needs attention" (admin must act on a logged
// event) and "Check inbox for updates" (next event likely arrives in
// Gmail/voicemail — admin should monitor outside the panel and come
// back to log). Both default-open. Stale rows now live in Archive
// (filtered server-side).

interface RepliesGroups {
  needsAttention: TabRow[];
  checkInbox: TabRow[];
}

// v8.10.14: Needs Attention is sorted by conversion urgency.
//   1. needs_followup — warmest relationship, met in person, most
//      likely to convert. Human continuity matters most.
//   2. wants_meeting — high intent, awaiting scheduling.
//   3. engaged       — replied, but lower urgency / may just want info.
// Within each priority bucket, rows stay in their original order
// (which is last_edited_at desc from the queue route).
const NEEDS_ATTENTION_PRIORITY: Record<string, number> = {
  needs_followup: 0,
  wants_meeting: 1,
  engaged: 2,
};

function groupRepliesRows(rows: TabRow[]): RepliesGroups {
  const needsAttention: TabRow[] = [];
  const checkInbox: TabRow[] = [];
  for (const row of rows) {
    const s = row.replies_state;
    if (s === "engaged" || s === "wants_meeting" || s === "needs_followup") {
      needsAttention.push(row);
    } else {
      // mid_cadence + awaiting_callback. Next event is external (Gmail
      // or voicemail). Admin monitors and logs when something arrives.
      // (booked filtered server-side; stale lives in Archive.)
      checkInbox.push(row);
    }
  }
  // Stable sort by priority. Default to a number larger than any known
  // priority so unknown states sort to the bottom rather than crashing.
  needsAttention.sort((a, b) => {
    const pa = NEEDS_ATTENTION_PRIORITY[a.replies_state ?? ""] ?? 99;
    const pb = NEEDS_ATTENTION_PRIORITY[b.replies_state ?? ""] ?? 99;
    return pa - pb;
  });
  return { needsAttention, checkInbox };
}

function RepliesGroupedList({
  rows,
  renderRow,
}: {
  rows: TabRow[];
  renderRow: (row: TabRow) => ReactNode;
}) {
  const groups = useMemo(() => groupRepliesRows(rows), [rows]);
  return (
    <div className="space-y-4">
      <RepliesSection
        title="Needs attention"
        rows={groups.needsAttention}
        renderRow={renderRow}
        defaultOpen
        showWhenEmpty
      />
      <RepliesSection
        title="Check inbox for updates"
        subtitle={
          <>
            They might have written back or left a voicemail.{" "}
            <a
              href="https://mail.google.com/mail/u/0/#inbox"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:no-underline"
            >
              Open Gmail
            </a>
            , then come back to log it.
          </>
        }
        rows={groups.checkInbox}
        renderRow={renderRow}
        defaultOpen
        showWhenEmpty={false}
      />
    </div>
  );
}

function RepliesSection({
  title,
  subtitle,
  rows,
  renderRow,
  defaultOpen,
  showWhenEmpty,
}: {
  title: string;
  /** v8.10.6: optional helper line under the section header. Used by
   *  "Check inbox for updates" to remind admins to monitor Gmail.
   *  v8.10.7: accepts ReactNode so we can inline a live Open Gmail link. */
  subtitle?: ReactNode;
  rows: TabRow[];
  renderRow: (row: TabRow) => ReactNode;
  defaultOpen: boolean;
  showWhenEmpty: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const count = rows.length;
  if (count === 0 && !showWhenEmpty) return null;
  return (
    <div>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <span className="w-3 text-gray-400" aria-hidden>{count === 0 ? "" : open ? "▾" : "▸"}</span>
        <span>{title}</span>
        <span className="text-gray-400">({count})</span>
        {count === 0 && (
          <span className="ml-2 text-xs font-medium text-emerald-700">✓ All caught up.</span>
        )}
      </button>
      {subtitle && open && count > 0 && (
        <p className="mt-0.5 px-4 text-xs text-gray-500">{subtitle}</p>
      )}
      {open && count > 0 && (
        <ul className="mt-2 space-y-2">
          {rows.map((row) => (
            <li key={row.id}>{renderRow(row)}</li>
          ))}
        </ul>
      )}
    </div>
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

function ResearchTabContent({
  rows,
  researchCampuses,
  existingCampuses,
  renderRow,
  onContinueCampus,
  onMarkResearchComplete,
  onAddCampus,
  onAddStakeholder,
  tabCountsAll,
}: {
  rows: TabRow[];
  researchCampuses: ResearchCampusCard[];
  existingCampuses: Campus[];
  renderRow: (row: TabRow) => ReactNode;
  onContinueCampus: (campus: ResearchCampusCard) => void;
  onMarkResearchComplete: (slug: string, name: string) => Promise<void>;
  onAddCampus: (input: { name: string; slug: string; city: string; state: string }) => Promise<void>;
  onAddStakeholder: () => void;
  tabCountsAll: number;
}) {
  const showCampusSection = researchCampuses.length > 0;
  const showStakeholderSection = rows.length > 0;

  if (!showCampusSection && !showStakeholderSection) {
    if (tabCountsAll === 0) {
      return (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-gray-700">No stakeholders yet.</p>
          <p className="mt-1 text-xs text-gray-500">
            Add a campus below or click + Add Stakeholder to start.
          </p>
          <div className="mt-4 flex justify-center">
            <AddCampusInline onSubmit={onAddCampus} existingCampuses={existingCampuses} />
          </div>
          <button
            onClick={onAddStakeholder}
            className="mt-3 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Add Stakeholder
          </button>
        </div>
      );
    }
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-medium text-emerald-700">✓ All caught up.</p>
        <p className="mt-1 text-xs text-gray-500">
          No campuses in research and no stakeholders waiting. Add a new campus below to start more research.
        </p>
        <div className="mt-4 flex justify-center">
          <AddCampusInline onSubmit={onAddCampus} existingCampuses={existingCampuses} />
        </div>
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
          <div className="mt-3">
            <AddCampusInline onSubmit={onAddCampus} existingCampuses={existingCampuses} />
          </div>
        </div>
      )}

      {showStakeholderSection && (
        <div>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Stakeholders in research ({rows.length})
          </h3>
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id}>{renderRow(row)}</li>
            ))}
          </ul>
        </div>
      )}

      {!showCampusSection && (
        <div className="px-1">
          <AddCampusInline onSubmit={onAddCampus} existingCampuses={existingCampuses} />
        </div>
      )}
    </div>
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

// Sentinel value used by the preset <select> for the "Other (type
// manually)" escape hatch. Any non-empty string that's not a real slug
// works; we picked one prefixed to avoid collision risk.
const OTHER_PRESET_VALUE = "__other__";

function AddCampusInline({
  onSubmit,
  existingCampuses,
}: {
  onSubmit: (input: { name: string; slug: string; city: string; state: string }) => Promise<void>;
  existingCampuses: Campus[];
}) {
  const [open, setOpen] = useState(false);
  const [presetSlug, setPresetSlug] = useState<string>("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Filter the preset list down to universities NOT already in the
  // database so admins can't accidentally re-add a campus.
  const availablePresets = useMemo(() => {
    const taken = new Set(existingCampuses.map((c) => c.slug));
    return PRESET_UNIVERSITIES.filter((u) => !taken.has(u.slug));
  }, [existingCampuses]);

  const isOther = presetSlug === OTHER_PRESET_VALUE;

  const reset = () => {
    setPresetSlug("");
    setName("");
    setCity("");
    setState("");
    setErr(null);
  };

  // When admin picks a preset, auto-fill name/city/state. "Other" clears
  // them so the admin can type freely.
  const onPickPreset = (slug: string) => {
    setPresetSlug(slug);
    if (slug === OTHER_PRESET_VALUE || slug === "") {
      setName("");
      setCity("");
      setState("");
    } else {
      const preset = PRESET_UNIVERSITIES.find((u) => u.slug === slug);
      if (preset) {
        setName(preset.name);
        setCity(preset.city);
        setState(preset.state);
      }
    }
  };

  const submit = async () => {
    if (!name.trim()) {
      setErr("Campus name required");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      // Use the preset's curated slug when one is picked; otherwise
      // derive from the (manually-typed) name.
      const slug = isOther || presetSlug === ""
        ? slugify(name)
        : presetSlug;
      await onSubmit({
        name: name.trim(),
        slug,
        city: city.trim(),
        state: state.trim(),
      });
      reset();
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add campus");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        + Add campus
      </button>
    );
  }

  // When a preset is picked we hide the city/state inputs (already
  // filled). When admin chose "Other" we show the manual-entry inputs.
  const showManualFields = isOther;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Add a campus
      </p>
      {err && <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-1 flex-col" style={{ minWidth: 280 }}>
          <span className="mb-1 text-[11px] font-medium text-gray-600">University</span>
          <select
            value={presetSlug}
            onChange={(e) => onPickPreset(e.target.value)}
            autoFocus
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
          >
            <option value="">— pick a university —</option>
            {availablePresets.map((u) => (
              <option key={u.slug} value={u.slug}>
                {u.name} ({u.state})
              </option>
            ))}
            <option value={OTHER_PRESET_VALUE}>Other (type manually)</option>
          </select>
        </label>

        {showManualFields && (
          <>
            <label className="flex flex-col">
              <span className="mb-1 text-[11px] font-medium text-gray-600">Campus name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Campus name"
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col">
              <span className="mb-1 text-[11px] font-medium text-gray-600">City</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col">
              <span className="mb-1 text-[11px] font-medium text-gray-600">State</span>
              <input
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                maxLength={2}
                placeholder="TX"
                className="w-16 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
              />
            </label>
          </>
        )}

        <div className="ml-auto flex gap-2">
          <button
            onClick={submit}
            disabled={submitting || !presetSlug}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add"}
          </button>
          <button
            onClick={() => { setOpen(false); reset(); }}
            disabled={submitting}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
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
