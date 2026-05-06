"use client";

/**
 * Admin Student Outreach Funnel — In Basket workflow page.
 *
 * v9.0 (MedJobs reorg, Phase 0): refactor only — the body is unchanged
 * from v8.10.X. Card primitives, slot builders, specialty cards,
 * Prospects + Replies tab content, TabOverflowMenu, formatters, and
 * tab/metric configuration moved to:
 *   - components/admin/medjobs/cards/StakeholderCard.tsx
 *   - components/admin/medjobs/cards/SpecialtyCards.tsx
 *   - components/admin/medjobs/lists/{ResearchTabContent,RepliesGroupedList,EmptyState}.tsx
 *   - components/admin/medjobs/TabOverflowMenu.tsx
 *   - lib/student-outreach/{tab-config,formatters,email-snapshot}.ts
 *
 * This page now hosts orchestration only: state, fetching, modal
 * dispatch, and tab-conditional list mounting. Phase 1 will move it to
 * /admin/medjobs/in-basket and add Clients + Campuses as primary tabs.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import PulseHeader from "@/components/admin/PulseHeader";
import type { DateRangeValue } from "@/components/admin/DateRangePopover";
import { Drawer } from "./Drawer";
import { AddStakeholderModal } from "./AddStakeholderModal";
import { BulkResearchModal } from "./BulkResearchModal";
import { LogCallOutcomeModal } from "./LogCallOutcomeModal";
import { ReplyClassifierModal } from "./ReplyClassifierModal";
import { MarkPartnerModal } from "./MarkPartnerModal";
import { LogMeetingModal, type MeetingStatus } from "./LogMeetingModal";
import type {
  Campus,
  DistributionEvidence,
  DrawerContext,
  ResearchCampusCard,
  StakeholderType,
  TabCounts,
  TabRow,
} from "@/lib/student-outreach/types";
import {
  CHART_SERIES_OPTIONS,
  MENU_TABS,
  STOP_OUTREACH_ACTIONS,
  STOP_OUTREACH_LABELS,
  TAB_STATS,
  TABS,
  TYPE_FILTERS,
  type CandidateRow,
  type EmailSentRow,
  type OutboundRow,
  type SignupRow,
  type TabKey,
} from "@/lib/student-outreach/tab-config";
import { buildDefaultEmailSnapshots } from "@/lib/student-outreach/email-snapshot";
import { RowCard } from "@/components/admin/medjobs/cards/StakeholderCard";
import {
  CandidateCard,
  EmailSentCard,
  OutboundCard,
  SignupCard,
} from "@/components/admin/medjobs/cards/SpecialtyCards";
import { EmptyState } from "@/components/admin/medjobs/lists/EmptyState";
import { RepliesGroupedList } from "@/components/admin/medjobs/lists/RepliesGroupedList";
import { ResearchTabContent } from "@/components/admin/medjobs/lists/ResearchTabContent";
import { TabOverflowMenu } from "@/components/admin/medjobs/TabOverflowMenu";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

export default function StudentOutreachPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusSlug, setCampusSlug] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<StakeholderType | "all">("all");
  // v8.10.33: default to Prospects since Candidates is still a
  // "Coming soon" placeholder (student-applicant pipeline isn't wired
  // up yet). Switch the default once the candidates dataset lands.
  const [tab, setTab] = useState<TabKey>("prospects");
  // v8.10.47: when admin checks boxes in the ⋯ chart-series picker, the
  // chart switches to a custom multi-line view of the selected metrics.
  // Empty set = chart shows the active tab's default metric (existing
  // per-tab telemetry).
  const [chartSeries, setChartSeries] = useState<Set<string>>(new Set());
  // v8.10.9: PulseHeader date range. KPI = student signups in range.
  const [range, setRange] = useState<DateRangeValue>({ preset: "30d", customFrom: "", customTo: "" });
  const [showClosed, setShowClosed] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<TabRow[]>([]);
  const [researchCampuses, setResearchCampuses] = useState<ResearchCampusCard[]>([]);
  const [tabCounts, setTabCounts] = useState<TabCounts | null>(null);
  // v8.10.39: dedicated row sets for the menu views that don't share the
  // stakeholder shape. Populated by tab-specific endpoints.
  const [emailsSentRows, setEmailsSentRows] = useState<EmailSentRow[]>([]);
  const [signupRows, setSignupRows] = useState<SignupRow[]>([]);
  const [outboundRows, setOutboundRows] = useState<OutboundRow[]>([]);
  const [candidateRows, setCandidateRows] = useState<CandidateRow[]>([]);
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
      // v8.10.39: emails_sent + signups are dedicated views — they don't
      // share the stakeholder row shape, so they hit dedicated endpoints
      // and populate their own row sets. The queue is still fetched for
      // tabCounts so the tab-row counts stay accurate while the menu
      // views are open.
      const queueParams = new URLSearchParams();
      if (campusSlug) queueParams.set("campus", campusSlug);
      if (typeFilter !== "all") queueParams.set("type", typeFilter);
      // For dedicated-view tabs, don't filter the queue — we just want
      // its tabCounts. Pass tab=prospects (default) so the queue does
      // sensible work; the rows result is ignored for those tabs.
      const queueTab =
        tab === "emails_sent" ||
        tab === "signups" ||
        tab === "outbound" ||
        tab === "candidates"
          ? "prospects"
          : tab;
      queueParams.set("tab", queueTab);
      if (debouncedSearch) queueParams.set("search", debouncedSearch);
      if (tab === "all" && showClosed) queueParams.set("show_closed", "true");

      const fetches: Array<Promise<void>> = [
        (async () => {
          const res = await fetch(`/api/admin/student-outreach/queue?${queueParams}`);
          if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
          const data = await res.json();
          setCampuses(data.campuses ?? []);
          if (
            tab !== "emails_sent" &&
            tab !== "signups" &&
            tab !== "outbound" &&
            tab !== "candidates"
          ) {
            setRows(data.rows ?? []);
            setResearchCampuses(data.research_campuses ?? []);
          }
          setTabCounts(data.tab_counts ?? null);
        })(),
      ];

      if (tab === "emails_sent") {
        fetches.push((async () => {
          const p = new URLSearchParams();
          if (campusSlug) p.set("campus", campusSlug);
          if (typeFilter !== "all") p.set("type", typeFilter);
          const r = await fetch(`/api/admin/student-outreach/emails-sent?${p}`);
          if (!r.ok) throw new Error((await r.json()).error || "Failed to load emails");
          const d = await r.json();
          setEmailsSentRows(d.rows ?? []);
        })());
      } else if (tab === "signups") {
        fetches.push((async () => {
          const p = new URLSearchParams();
          if (campusSlug) p.set("campus", campusSlug);
          const r = await fetch(`/api/admin/student-outreach/signups?${p}`);
          if (!r.ok) throw new Error((await r.json()).error || "Failed to load signups");
          const d = await r.json();
          setSignupRows(d.rows ?? []);
        })());
      } else if (tab === "outbound") {
        fetches.push((async () => {
          const p = new URLSearchParams();
          if (campusSlug) p.set("campus", campusSlug);
          if (typeFilter !== "all") p.set("type", typeFilter);
          const r = await fetch(`/api/admin/student-outreach/outbound?${p}`);
          if (!r.ok) throw new Error((await r.json()).error || "Failed to load outbound");
          const d = await r.json();
          setOutboundRows(d.rows ?? []);
        })());
      } else if (tab === "candidates") {
        fetches.push((async () => {
          const p = new URLSearchParams();
          if (campusSlug) p.set("campus", campusSlug);
          const r = await fetch(`/api/admin/student-outreach/candidates?${p}`);
          if (!r.ok) throw new Error((await r.json()).error || "Failed to load candidates");
          const d = await r.json();
          setCandidateRows(d.rows ?? []);
        })());
      }

      await Promise.all(fetches);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [campusSlug, typeFilter, tab, debouncedSearch, showClosed]);

  useEffect(() => { refetch(); }, [refetch]);

  // v9.0 Phase 0: register this page's refetch with the shared MedJobs
  // refresh contract so that mutations triggered from dedicated
  // left-menu pages (Phase 1+) propagate here without prop-drilling.
  useMedJobsRefresh(refetch);

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

  // v8.10.38: PulseHeader stats are now per-tab.
  const tabStats = TAB_STATS[tab];
  const customSeries = useMemo(
    () => Array.from(chartSeries).join(","),
    [chartSeries],
  );
  const statsPath = useMemo(() => {
    const base = "/api/admin/student-outreach/stats";
    const params = new URLSearchParams();
    if (chartSeries.size > 0) {
      params.set("metric", "custom");
      params.set("series", customSeries);
    } else {
      params.set("metric", tabStats.metric);
    }
    if (campusSlug) params.set("campus", campusSlug);
    return `${base}?${params.toString()}`;
  }, [tabStats.metric, campusSlug, chartSeries, customSeries]);

  const kpiSuffix = useMemo(() => {
    if (chartSeries.size === 0) return tabStats.label;
    if (chartSeries.size === 1) {
      const k = Array.from(chartSeries)[0];
      return CHART_SERIES_OPTIONS.find((o) => o.metric === k)?.label ?? "events";
    }
    return `events across ${chartSeries.size} metrics`;
  }, [chartSeries, tabStats.label]);

  return (
    <div>
      <PulseHeader
        title="Student Outreach"
        kpiSuffix={kpiSuffix}
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

      {/* v8.10.8: search + filters condensed into one horizontal row above the tabs. */}
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
      </div>

      {/* v8.10.33: primary tabs in workflow order; secondary surfaces in ⋯ menu. */}
      <div className="mb-8 flex items-center border-b border-gray-100">
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const count = tabCounts?.[
              t.key as Exclude<TabKey, "outbound" | "emails_sent" | "signups">
            ];
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
        <TabOverflowMenu
          tabs={MENU_TABS}
          activeTab={tab}
          onSelect={setTab}
          tabCounts={tabCounts}
          chartSeries={chartSeries}
          onToggleChartSeries={(metric) => {
            setChartSeries((prev) => {
              const next = new Set(prev);
              if (next.has(metric)) next.delete(metric);
              else next.add(metric);
              return next;
            });
          }}
          onClearChartSeries={() => setChartSeries(new Set())}
        />
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
      ) : tab === "prospects" ? (
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
            // organization + campus.
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
      ) : tab === "emails_sent" ? (
        emailsSentRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No emails sent yet — check back once outreach kicks off.
          </p>
        ) : (
          <ul className="space-y-2">
            {emailsSentRows.map((r) => (
              <li key={r.id}>
                <EmailSentCard
                  row={r}
                  onOpenDrawer={() => setOpenOutreachId(r.outreach_id)}
                />
              </li>
            ))}
          </ul>
        )
      ) : tab === "signups" ? (
        signupRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No student signups in this range.
          </p>
        ) : (
          <ul className="space-y-2">
            {signupRows.map((r) => (
              <li key={r.id}>
                <SignupCard row={r} />
              </li>
            ))}
          </ul>
        )
      ) : tab === "outbound" ? (
        outboundRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No outbound activity yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {outboundRows.map((r) => (
              <li key={r.outreach_id}>
                <OutboundCard
                  row={r}
                  onOpenDrawer={() => setOpenOutreachId(r.outreach_id)}
                />
              </li>
            ))}
          </ul>
        )
      ) : tab === "candidates" ? (
        candidateRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No live candidates in this range yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {candidateRows.map((r) => (
              <li key={r.id}>
                <CandidateCard row={r} />
              </li>
            ))}
          </ul>
        )
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
            // datetime-local expects YYYY-MM-DDTHH:mm in LOCAL time.
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
                await callAction(logMeetingRow.id, "mark_meeting_followup", {
                  notes: payload.notes,
                });
                setLogMeetingRow(null);
              } else if (status === "done_partner") {
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
