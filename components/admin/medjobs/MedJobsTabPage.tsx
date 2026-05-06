"use client";

/**
 * MedJobsTabPage — the In Basket workflow surface. v9.0 Phase 6: tabs
 * are state-based (Unread / Undone) instead of entity-keyed. Cards in
 * the feed are heterogeneous — stakeholder rows, virtual provider
 * prospects, and campus banners all flow through one list — but each
 * card carries its own kind-aware chrome.
 *
 * Inventory + relationship surfaces (Clients / Candidates / Partners)
 * moved to dedicated /admin/medjobs/{name} pages outside In Basket.
 *
 * Smart-hide: a tab is visible when (count > 0) OR it's the active
 * tab. URL-driven via ?tab= so deep links land correctly.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PulseHeader from "@/components/admin/PulseHeader";
import type { DateRangeValue } from "@/components/admin/DateRangePopover";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import { AddStakeholderModal } from "@/app/admin/student-outreach/AddStakeholderModal";
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
  StakeholderType,
  TabCounts,
  TabRow,
} from "@/lib/student-outreach/types";
import {
  STOP_OUTREACH_ACTIONS,
  STOP_OUTREACH_LABELS,
  TAB_STATS,
  TABS,
  TYPE_FILTERS,
  type ProviderProspectRow,
  type TabKey,
} from "@/lib/student-outreach/tab-config";
import { RowCard } from "@/components/admin/medjobs/cards/StakeholderCard";
import { ProviderProspectCard } from "@/components/admin/medjobs/cards/ProviderProspectCard";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

interface MedJobsTabPageProps {
  initialTab: TabKey;
  title?: string;
}

const VALID_TAB_KEYS: ReadonlySet<TabKey> = new Set(TABS.map((t) => t.key));

export function MedJobsTabPage({
  initialTab,
  title = "MedJobs · In Basket",
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
  const [providerProspects, setProviderProspects] = useState<ProviderProspectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

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
      queueParams.set("tab", tab);
      if (debouncedSearch) queueParams.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/student-outreach/queue?${queueParams}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setCampuses(data.campuses ?? []);
      setRows(data.rows ?? []);
      setTabCounts(data.tab_counts ?? null);

      // v9.0 Phase 6: virtual provider prospects always surface in the
      // Unread tab as fresh-attention items. Fetched in parallel; cheap.
      if (tab === "unread") {
        const p = new URLSearchParams();
        if (campusSlug) p.set("campus", campusSlug);
        const r = await fetch(`/api/admin/medjobs/provider-prospects?${p}`);
        if (r.ok) {
          const d = await r.json();
          setProviderProspects(d.rows ?? []);
        } else {
          setProviderProspects([]);
        }
      } else {
        setProviderProspects([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [campusSlug, typeFilter, tab, debouncedSearch]);

  useEffect(() => { refetch(); }, [refetch]);
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

  const visibleTabs = useMemo(() => {
    return TABS.filter((t) => {
      const total = tabCounts?.[t.key] ?? 0;
      return total > 0 || t.key === tab;
    });
  }, [tabCounts, tab]);

  const isInboxEmpty = useMemo(() => {
    if (!tabCounts) return false;
    return TABS.every((t) => (tabCounts[t.key] ?? 0) === 0);
  }, [tabCounts]);

  const setTabAndUrl = useCallback(
    (next: TabKey) => {
      setTab(next);
      const sp = new URLSearchParams(searchParams?.toString() ?? "");
      sp.set("tab", next);
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

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

      {/* v9.0 Phase 6: state-based tab bar — Unread / Undone. */}
      <div className="mb-8 flex items-center border-b border-gray-100">
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {visibleTabs.map((t) => {
            const count = tabCounts?.[t.key] ?? 0;
            const active = t.key === tab;
            const isUnreadTab = t.key === "unread" && count > 0;
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
                    {count}
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
      ) : isInboxEmpty && providerProspects.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-base font-semibold text-emerald-700">
            ✓ Everything caught up.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            The In Basket is clear. Head to{" "}
            <a
              href="/admin/medjobs/completed-work"
              className="font-medium text-emerald-700 underline hover:no-underline"
            >
              Completed Work
            </a>
            {" "}to review what you and the team finished.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {/* v9.0 Phase 6: virtual provider prospects flow into the
              Unread tab — they're inherently new (no viewed_at on a
              non-existent row) until materialized. */}
          {providerProspects.map((p) => (
            <li key={p.id}>
              <ProviderProspectCard
                row={p}
                onStartOutreach={async () => {
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
              />
            </li>
          ))}
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
    </div>
  );
}
