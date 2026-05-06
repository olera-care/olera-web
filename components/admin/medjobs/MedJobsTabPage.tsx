"use client";

/**
 * MedJobsTabPage — the In Basket workflow surface. v9.0 Phase 5: this
 * is now the only stop for active operational work; dedicated per-tab
 * pages were collapsed back into smart horizontal tabs here.
 *
 * Smart inbox behavior:
 *   - Tab visible when (count > 0) OR it's the currently active tab.
 *     This means tabs auto-hide when their queue empties, and the
 *     active tab stays in the bar while admin is on it (so the tab
 *     doesn't disappear under the cursor mid-action).
 *   - Tab labels semibold + render `unread/total` when unread > 0.
 *   - Tab order = the team's response priority (Clients first as
 *     the highest-value relationships, Campuses last as the
 *     territorial primitive).
 *   - When ALL tabs are empty, render a single "all caught up" hero.
 *
 * URL-driven tab state: the active tab is reflected in the `?tab=`
 * search param so old dedicated-page URLs (which redirect through
 * with ?tab=X) land on the right tab, and admins can deep-link to
 * a tab.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PulseHeader from "@/components/admin/PulseHeader";
import type { DateRangeValue } from "@/components/admin/DateRangePopover";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import { AddStakeholderModal } from "@/app/admin/student-outreach/AddStakeholderModal";
import { BulkResearchModal } from "@/app/admin/student-outreach/BulkResearchModal";
import { LogCallOutcomeModal } from "@/app/admin/student-outreach/LogCallOutcomeModal";
import { ReplyClassifierModal } from "@/app/admin/student-outreach/ReplyClassifierModal";
import { MarkPartnerModal } from "@/app/admin/student-outreach/MarkPartnerModal";
import {
  LogMeetingModal,
  type MeetingStatus,
} from "@/app/admin/student-outreach/LogMeetingModal";
import type {
  Campus,
  DistributionEvidence,
  DrawerContext,
  ResearchCampusCard,
  StakeholderType,
  TabCounts,
  TabRow,
  TabUnreadCounts,
} from "@/lib/student-outreach/types";
// ResearchCampusCard is still used for the bulkResearchCampus modal
// payload — Campuses tab CampusCard onAddStakeholders constructs it.
import {
  STOP_OUTREACH_ACTIONS,
  STOP_OUTREACH_LABELS,
  TAB_STATS,
  TABS,
  TYPE_FILTERS,
  type CampusRow,
  type CandidateRow,
  type ClientRow,
  type EmailSentRow,
  type OutboundRow,
  type ProviderProspectRow,
  type SignupRow,
  type TabKey,
} from "@/lib/student-outreach/tab-config";
import { RowCard } from "@/components/admin/medjobs/cards/StakeholderCard";
import { CampusCard } from "@/components/admin/medjobs/cards/CampusCard";
import { ClientCard } from "@/components/admin/medjobs/cards/ClientCard";
import {
  CandidateCard,
} from "@/components/admin/medjobs/cards/SpecialtyCards";
import { RepliesGroupedList } from "@/components/admin/medjobs/lists/RepliesGroupedList";
import { ResearchTabContent } from "@/components/admin/medjobs/lists/ResearchTabContent";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

interface MedJobsTabPageProps {
  initialTab: TabKey;
  title?: string;
}

const VALID_TAB_KEYS: ReadonlySet<TabKey> = new Set(TABS.map((t) => t.key));

export function MedJobsTabPage({
  initialTab,
  title = "Student Outreach",
}: MedJobsTabPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get("tab");
  const tabFromUrl =
    tabParam && VALID_TAB_KEYS.has(tabParam as TabKey)
      ? (tabParam as TabKey)
      : null;
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusSlug, setCampusSlug] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<StakeholderType | "all">("all");
  const [tab, setTab] = useState<TabKey>(tabFromUrl ?? initialTab);
  const [range, setRange] = useState<DateRangeValue>({ preset: "30d", customFrom: "", customTo: "" });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<TabRow[]>([]);
  const [tabCounts, setTabCounts] = useState<TabCounts | null>(null);
  const [tabUnreadCounts, setTabUnreadCounts] = useState<TabUnreadCounts | null>(null);
  const [candidateRows, setCandidateRows] = useState<CandidateRow[]>([]);
  const [clientRows, setClientRows] = useState<ClientRow[]>([]);
  const [providerProspects, setProviderProspects] = useState<ProviderProspectRow[]>([]);
  const [campusRows, setCampusRows] = useState<CampusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);
  // v9.0 Phase 2: when set, the Drawer mounts in provider mode and
  // shows the Manage panel for that client. Mutually exclusive with
  // openOutreachId — only one drawer surface is visible at a time.
  const [openProviderId, setOpenProviderId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [bulkResearchCampus, setBulkResearchCampus] = useState<ResearchCampusCard | null>(null);
  const [callOutcomeRow, setCallOutcomeRow] = useState<TabRow | null>(null);
  const [classifierRow, setClassifierRow] = useState<{
    row: TabRow;
    source: "email_reply" | "callback";
  } | null>(null);
  const [partnerRow, setPartnerRow] = useState<TabRow | null>(null);
  const [logMeetingRow, setLogMeetingRow] = useState<TabRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queueParams = new URLSearchParams();
      if (campusSlug) queueParams.set("campus", campusSlug);
      if (typeFilter !== "all") queueParams.set("type", typeFilter);
      // For inventory-style tabs (Candidates / Clients / Campuses) we
      // don't need queue rows — their data comes from dedicated
      // endpoints. Pass tab=prospects so the queue still computes
      // unified TabCounts; ignore its row payload.
      const queueTab =
        tab === "candidates" ||
        tab === "clients" ||
        tab === "campuses"
          ? "prospects"
          : tab;
      queueParams.set("tab", queueTab);
      if (debouncedSearch) queueParams.set("search", debouncedSearch);

      const fetches: Array<Promise<void>> = [
        (async () => {
          const res = await fetch(`/api/admin/student-outreach/queue?${queueParams}`);
          if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
          const data = await res.json();
          setCampuses(data.campuses ?? []);
          if (
            tab !== "candidates" &&
            tab !== "clients" &&
            tab !== "campuses"
          ) {
            setRows(data.rows ?? []);
          }
          setTabCounts(data.tab_counts ?? null);
          setTabUnreadCounts(data.tab_unread_counts ?? null);
        })(),
      ];

      if (tab === "candidates") {
        fetches.push((async () => {
          const p = new URLSearchParams();
          if (campusSlug) p.set("campus", campusSlug);
          const r = await fetch(`/api/admin/student-outreach/candidates?${p}`);
          if (!r.ok) throw new Error((await r.json()).error || "Failed to load candidates");
          const d = await r.json();
          setCandidateRows(d.rows ?? []);
        })());
      } else if (tab === "clients") {
        // v9.0 Phase 2: Clients = providers in pilot OR with active
        // Stripe subscription. Pilot status derived from
        // metadata.interview_terms_accepted_at (90-day window).
        fetches.push((async () => {
          const p = new URLSearchParams();
          if (debouncedSearch) p.set("search", debouncedSearch);
          const r = await fetch(`/api/admin/medjobs/clients?${p}`);
          if (!r.ok) throw new Error((await r.json()).error || "Failed to load clients");
          const d = await r.json();
          setClientRows(d.rows ?? []);
        })());
      }

      // v9.0 Phase 3: Campuses tab fetches the dedicated campuses
      // endpoint with derived stage + counts. This is now the sole
      // place where campus research/operational state lives — Prospects
      // no longer surfaces campus banners.
      if (tab === "campuses") {
        fetches.push((async () => {
          const r = await fetch("/api/admin/medjobs/campuses");
          if (!r.ok) {
            console.warn("[medjobs] campuses fetch failed", await r.text());
            setCampusRows([]);
            return;
          }
          const d = await r.json();
          setCampusRows(d.rows ?? []);
        })());
      }

      // v9.0 Phase 2 Tier 3: virtual provider prospects for the
      // Prospects tab. Fetched alongside the queue so the filter chips
      // can switch between providers and stakeholders without a
      // refetch round-trip.
      if (tab === "prospects") {
        fetches.push((async () => {
          const p = new URLSearchParams();
          if (campusSlug) p.set("campus", campusSlug);
          const r = await fetch(`/api/admin/medjobs/provider-prospects?${p}`);
          if (!r.ok) {
            // Non-fatal: provider prospects are additive; surface a
            // console warning but don't block the rest of the page.
            console.warn("[medjobs] provider-prospects fetch failed", await r.text());
            setProviderProspects([]);
            return;
          }
          const d = await r.json();
          setProviderProspects(d.rows ?? []);
        })());
      }
      // v9.0 Phase 2 (deferred): campuses tab still uses queue.campuses.
      // Per-campus state and the research-needed banner come in 2.5.

      await Promise.all(fetches);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [campusSlug, typeFilter, tab, debouncedSearch]);

  useEffect(() => { refetch(); }, [refetch]);

  // Register refetch with the shared MedJobs refresh contract so
  // mutations triggered from other surfaces propagate here.
  useMedJobsRefresh(refetch);

  const handleDrawerAction = useCallback(
    async (_refreshed: DrawerContext | null) => { await refetch(); },
    [refetch],
  );

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
        onMarkUnread={async () => {
          try { await callAction(row.id, "mark_unread"); }
          catch (e) { setError(e instanceof Error ? e.message : "Action failed"); }
        }}
      />
    ),
    [tab, callAction],
  );

  const tabStats = TAB_STATS[tab];
  const statsPath = useMemo(() => {
    const params = new URLSearchParams();
    params.set("metric", tabStats.metric);
    if (campusSlug) params.set("campus", campusSlug);
    return `/api/admin/student-outreach/stats?${params.toString()}`;
  }, [tabStats.metric, campusSlug]);

  // v9.0 Phase 5: tab is visible when (count > 0) OR it's the active
  // tab. The active-tab carve-out keeps the bar stable while admin
  // is on a tab whose count drops to 0 mid-action — they see the
  // "all caught up" empty state in the content area; the tab still
  // anchors the bar until they navigate. When ALL tabs would hide,
  // we fall back to showing the active tab so content still renders.
  const visibleTabs = useMemo(() => {
    return TABS.filter((t) => {
      const total = tabCounts?.[t.key] ?? 0;
      return total > 0 || t.key === tab;
    });
  }, [tabCounts, tab]);

  // v9.0 Phase 5: when every primary tab has zero work, the active
  // tab's empty state upgrades to a single celebratory hero pointing
  // admin at Completed Tasks.
  const isInboxEmpty = useMemo(() => {
    if (!tabCounts) return false;
    return TABS.every((t) => (tabCounts[t.key] ?? 0) === 0);
  }, [tabCounts]);

  // v9.0 Phase 5: when admin clicks a tab, mirror it in the URL so
  // bookmarks land back on the right tab and the redirected old
  // dedicated-page URLs (?tab=X) are honored on first paint.
  const setTabAndUrl = useCallback(
    (next: TabKey) => {
      setTab(next);
      const sp = new URLSearchParams(searchParams?.toString() ?? "");
      sp.set("tab", next);
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // v9.0 Phase 5: keep React state in sync if the URL changes from
  // browser navigation (back/forward).
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== tab) setTab(tabFromUrl);
  }, [tabFromUrl, tab]);

  return (
    <div>
      <PulseHeader
        title={title}
        kpiSuffix={tabStats.label}
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

      {/* v9.0 Phase 5: smart inbox tab bar. Tabs auto-hide when their
          queue empties; the active tab stays visible while admin is
          on it. ⋯ overflow menu dropped — Emails Sent / Outbound /
          Signups / Archive moved to All Tasks as quick filters. */}
      <div className="mb-8 flex items-center border-b border-gray-100">
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {visibleTabs.map((t) => {
            const count = tabCounts?.[t.key] ?? 0;
            const unread = tabUnreadCounts?.[t.key] ?? 0;
            const active = t.key === tab;
            const isUnreadTab = unread > 0;
            return (
              <button
                key={t.key}
                onClick={() => setTabAndUrl(t.key)}
                title={t.tooltip}
                className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${
                  isUnreadTab ? "font-semibold" : "font-medium"
                } ${
                  active
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 text-xs ${
                      isUnreadTab ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {isUnreadTab ? `${unread}/${count}` : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : tab === "clients" ? (
        clientRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No clients yet. Providers enter the pilot when they accept T&amp;C at first interview scheduling, or convert via Stripe.
          </p>
        ) : (
          <ul className="space-y-2">
            {clientRows.map((r) => (
              <li key={r.id}>
                <ClientCard row={r} onManage={() => setOpenProviderId(r.id)} />
              </li>
            ))}
          </ul>
        )
      ) : tab === "campuses" ? (
        campusRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No campuses configured yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {campusRows.map((c) => (
              <li key={c.id}>
                <CampusCard
                  row={c}
                  onAddStakeholders={() =>
                    setBulkResearchCampus({
                      id: c.id,
                      slug: c.slug,
                      name: c.name,
                      state: c.state,
                      city: c.city,
                      research_stakeholder_count: c.stakeholder_count,
                      last_added_at: c.last_added_at,
                    })
                  }
                  onViewCampus={() => {
                    window.location.href = `/admin/student-outreach/campus/${c.slug}`;
                  }}
                />
              </li>
            ))}
          </ul>
        )
      ) : tab === "prospects" ? (
        <ResearchTabContent
          rows={rows}
          providerProspects={providerProspects}
          renderRow={renderRow}
          onStartProviderOutreach={async (p) => {
            // v9.0 Phase 2 Tier 3.5: materialize a student_outreach row
            // with kind='provider' and open the workflow drawer for it.
            try {
              const res = await fetch("/api/admin/medjobs/provider-prospects/materialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider_id: p.provider_id, campus_id: p.campus_id }),
              });
              const body = await res.json();
              if (!res.ok) throw new Error(body.error || "Failed to materialize");
              await refetch();
              setOpenOutreachId(body.id);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to start outreach");
            }
          }}
          tabCountsAll={tabCounts?.all ?? 0}
        />
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
        <TabEmptyState tab={tab} allTabsEmpty={isInboxEmpty} />
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
      {openProviderId && (
        <Drawer
          providerId={openProviderId}
          onClose={() => setOpenProviderId(null)}
        />
      )}

      {callOutcomeRow && (
        <LogCallOutcomeModal
          organizationName={callOutcomeRow.organization_name}
          contactName={callOutcomeRow.primary_contact_name}
          contactPhone={callOutcomeRow.primary_contact_phone}
          rowKind={callOutcomeRow.kind === "provider" ? "provider" : "stakeholder"}
          onCancel={() => setCallOutcomeRow(null)}
          onSubmit={async (outcome, notes) => {
            await callAction(callOutcomeRow.id, "log_call", { outcome, notes });
            setCallOutcomeRow(null);
          }}
          onChooseConvert={async (notes) => {
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
          rowKind={classifierRow.row.kind === "provider" ? "provider" : "stakeholder"}
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

/**
 * v9.0 Phase 5: empty state shown when the active tab has zero rows.
 * Upgrades to a single celebratory hero when every primary tab is at
 * zero — points admin at Completed Tasks for what they got done today.
 */
function TabEmptyState({
  tab,
  allTabsEmpty,
}: {
  tab: TabKey;
  allTabsEmpty: boolean;
}) {
  if (allTabsEmpty) {
    return (
      <div className="py-16 text-center">
        <p className="text-base font-semibold text-emerald-700">
          ✓ Everything caught up.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          The In Basket is clear. Head to{" "}
          <a
            href="/admin/medjobs/completed-tasks"
            className="font-medium text-emerald-700 underline hover:no-underline"
          >
            Completed Tasks
          </a>
          {" "}to review what you and the team finished.
        </p>
      </div>
    );
  }
  const blurbs: Partial<Record<TabKey, string>> = {
    candidates: "No live candidates yet.",
    prospects: "No prospects need research right now.",
    calls: "No phone calls due.",
    replies: "No inbox triage right now. The cadence is humming along.",
    meetings: "No meetings in flight or booked.",
    partners: "No partners yet. Mark a stakeholder as Partner when they commit to sharing.",
    clients: "No clients yet. Providers enter the pilot when they accept T&C at first interview.",
    campuses: "No campuses configured yet.",
  };
  return (
    <p className="py-12 text-center text-sm text-gray-400">
      {blurbs[tab] ?? "Nothing here right now."}
    </p>
  );
}

