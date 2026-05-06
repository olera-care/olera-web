"use client";

/**
 * MedJobsTabPage — the In Basket workflow surface. v9.0 Phase 7:
 * entity-keyed tabs (Clients · Candidates · Prospects · Partners ·
 * Meetings · Replies · Calls · Sites) with smart-hide so empty
 * categories drop out of the bar. Cards in the feed are heterogeneous
 * — stakeholder rows, virtual provider prospects, and site banners
 * all flow through one list — but each card carries its own
 * kind-aware chrome.
 *
 * Inventory + relationship surfaces (Sites / Clients / Candidates /
 * Partners) live on dedicated /admin/medjobs/{name} pages outside In
 * Basket. The In Basket tab for each entity surfaces only items with
 * pending action.
 *
 * Smart-hide: a tab is visible when (count > 0) OR it's the active
 * tab. URL-driven via ?tab= so deep links land correctly.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import { LogCallOutcomeModal } from "@/app/admin/student-outreach/LogCallOutcomeModal";
import { ReplyClassifierModal } from "@/app/admin/student-outreach/ReplyClassifierModal";
import { MarkPartnerModal } from "@/app/admin/student-outreach/MarkPartnerModal";
import {
  LogMeetingModal,
  type MeetingStatus,
} from "@/app/admin/student-outreach/LogMeetingModal";
import type {
  Campus,
  DrawerContext,
  ResearchCampusCard,
  StakeholderType,
  TabCounts,
  TabUnreadCounts,
  TabRow,
} from "@/lib/student-outreach/types";
import {
  STOP_OUTREACH_ACTIONS,
  STOP_OUTREACH_LABELS,
  TABS,
  TYPE_FILTERS,
  type CampusRow,
  type ProviderProspectRow,
  type TabKey,
} from "@/lib/student-outreach/tab-config";
import { RowCard } from "@/components/admin/medjobs/cards/StakeholderCard";
import { SiteCard } from "@/components/admin/medjobs/cards/SiteCard";
import { ResearchTabContent } from "@/components/admin/medjobs/lists/ResearchTabContent";
import { RepliesGroupedList } from "@/components/admin/medjobs/lists/RepliesGroupedList";
import { InBasketHero } from "@/components/admin/medjobs/InBasketHero";
import { BulkResearchModal } from "@/app/admin/student-outreach/BulkResearchModal";
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<TabRow[]>([]);
  const [tabCounts, setTabCounts] = useState<TabCounts | null>(null);
  const [tabUnreadCounts, setTabUnreadCounts] = useState<TabUnreadCounts | null>(null);
  const [providerProspects, setProviderProspects] = useState<ProviderProspectRow[]>([]);
  const [researchCampuses, setResearchCampuses] = useState<ResearchCampusCard[]>([]);
  const [campusBanners, setCampusBanners] = useState<CampusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);
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
      queueParams.set("tab", tab);
      if (debouncedSearch) queueParams.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/student-outreach/queue?${queueParams}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setCampuses(data.campuses ?? []);
      setRows(data.rows ?? []);
      setTabCounts(data.tab_counts ?? null);
      setTabUnreadCounts(data.tab_unread_counts ?? null);
      setResearchCampuses(data.research_campuses ?? []);

      // Per-tab side fetches.
      if (tab === "prospects") {
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

      if (tab === "sites") {
        const r = await fetch(`/api/admin/medjobs/campuses`);
        if (r.ok) {
          const d = await r.json();
          // v9.0 Phase 7: Sites tab inside In Basket shows ONLY
          // Stage-2-unlocked sites with no stakeholders yet — the
          // research-needed prompts. The full site inventory lives
          // on /admin/medjobs/sites (Sites page).
          const all = (d.rows ?? []) as CampusRow[];
          setCampusBanners(
            all.filter(
              (c) =>
                c.stage === "stakeholder_prospecting" &&
                c.stakeholder_count === 0,
            ),
          );
        } else {
          setCampusBanners([]);
        }
      } else {
        setCampusBanners([]);
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
      {/* v9.0 Phase 7 Commit J: In Basket is queue-focused — title +
          hero, no top-page action buttons. Open Gmail + Add
          Stakeholder were noise on a calm operational surface; they
          live on more contextual surfaces (the Sites page hosts
          stakeholder additions per-site). */}
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      </header>

      <InBasketHero />

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
          title="Filter to one site, or 'All sites' to see everything."
          className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none"
        >
          <option value="">All sites</option>
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

      {/* v9.0 Phase 6.5: entity-keyed tab bar with smart-hide. Tab is
          visible when (count > 0) OR it's the active tab. Bolded +
          fraction `unread/total` when unread > 0; muted + plain count
          otherwise. Completed rows leave the tab on status transition,
          so counts only reflect active work. */}
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
                  // v9.0 Phase 7 Commit E: bold the tab label AND the
                  // fraction together when unread > 0. Inactive unread
                  // tabs also darken so the bold actually pops against
                  // the muted gray-400 default — bold alone on light
                  // text barely renders. Read tabs stay font-medium +
                  // gray-400 to keep the inactive zone calm.
                  isUnreadTab
                    ? active
                      ? "border-gray-900 font-semibold text-gray-900"
                      : "border-transparent font-semibold text-gray-900 hover:text-gray-700"
                    : active
                      ? "border-gray-900 font-medium text-gray-900"
                      : "border-transparent font-medium text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 text-xs tabular-nums ${
                      isUnreadTab
                        ? "font-semibold text-gray-900"
                        : "text-gray-400"
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

      {/* Per-tab list rendering. Each tab is a workflow category;
          smart-hide already removed empty ones from the bar. */}
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : isInboxEmpty ? (
        <div className="py-16 text-center">
          <p className="text-base font-semibold text-emerald-700">
            ✓ Everything caught up.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            The In Basket is clear. Head to{" "}
            <a
              href="/admin/medjobs/logs"
              className="font-medium text-emerald-700 underline hover:no-underline"
            >
              Logs
            </a>
            {" "}to review what you and the team finished.
          </p>
        </div>
      ) : tab === "prospects" ? (
        <ResearchTabContent
          rows={rows}
          providerProspects={providerProspects}
          renderRow={renderRow}
          onStartProviderOutreach={async (p) => {
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
      ) : tab === "replies" ? (
        rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No inbox triage right now.</p>
        ) : (
          <RepliesGroupedList rows={rows} renderRow={(row) => renderRow(row)} />
        )
      ) : tab === "sites" ? (
        // v9.0 Phase 7: Sites tab inside In Basket shows only
        // research-needed prompts (Stage 2 unlocked, 0 stakeholders).
        // The full site inventory lives on /admin/medjobs/sites.
        campusBanners.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No sites need stakeholder research right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {campusBanners.map((c) => {
              // Build a ResearchCampusCard payload for the
              // BulkResearchModal trigger from the queue's campus row.
              const matching = researchCampuses.find((r) => r.id === c.id);
              return (
                <li key={c.id}>
                  <SiteCard
                    row={c}
                    onAddStakeholders={() => {
                      const payload = matching ?? {
                        id: c.id,
                        slug: c.slug,
                        name: c.name,
                        state: c.state,
                        city: c.city,
                        research_stakeholder_count: c.stakeholder_count,
                        last_added_at: c.last_added_at,
                      };
                      setBulkResearchCampus(payload);
                    }}
                    onViewSite={() => {
                      window.location.href = `/admin/student-outreach/campus/${c.slug}`;
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">
          {tab === "calls"
            ? "No phone calls due. 🎉"
            : tab === "meetings"
            ? "No meetings in flight or booked."
            : tab === "partners"
            ? "No partners have open tasks. Add a custom step from the Partner drawer to bring one back."
            : "Nothing here right now."}
        </p>
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
          onClose={() => {
            // v9.0 Phase 7 Commit J: refetch on close so the
            // mark_read fired during the drawer's lifetime is
            // reflected in the list — bolding clears + tab fractions
            // update without admin needing to take an explicit
            // action.
            setOpenOutreachId(null);
            void refetch();
          }}
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
          onSubmit={async (outcome, notes, partner) => {
            // v9.0 Phase 7 Commit G: partner branch is now self-contained
            // — log_call lands first, then mark_partner with the evidence
            // payload. Two POSTs back to back; the previous chained
            // MarkPartnerModal flow is gone.
            await callAction(callOutcomeRow.id, "log_call", { outcome, notes });
            if (partner) {
              await callAction(callOutcomeRow.id, "mark_partner", { ...partner });
            }
            setCallOutcomeRow(null);
          }}
        />
      )}
      {classifierRow && (
        <ReplyClassifierModal
          organizationName={classifierRow.row.organization_name}
          source={classifierRow.source}
          rowKind={classifierRow.row.kind === "provider" ? "provider" : "stakeholder"}
          onCancel={() => setClassifierRow(null)}
          onSubmit={async (classification, payload, partner) => {
            await callAction(classifierRow.row.id, "classify_reply", {
              classification,
              notes: payload.notes,
              meeting_at: payload.meeting_at,
            });
            if (partner) {
              await callAction(classifierRow.row.id, "mark_partner", { ...partner });
            }
            setClassifierRow(null);
          }}
        />
      )}
      {partnerRow && (
        <MarkPartnerModal
          organizationName={partnerRow.organization_name}
          onCancel={() => setPartnerRow(null)}
          onConfirm={async (payload) => {
            try {
              await callAction(partnerRow.id, "mark_partner", { ...payload });
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
          onSubmit={async (status: MeetingStatus, payload, partner) => {
            try {
              if (status === "booked") {
                await callAction(logMeetingRow.id, "mark_meeting_scheduled", {
                  meeting_at: payload.meeting_at,
                  notes: payload.notes,
                });
              } else if (status === "finding_time") {
                await callAction(logMeetingRow.id, "flag_wants_meeting", {
                  notes: payload.notes,
                });
              } else if (status === "done_followup") {
                await callAction(logMeetingRow.id, "mark_meeting_followup", {
                  notes: payload.notes,
                });
              } else if (status === "done_partner" && partner) {
                // v9.0 Phase 7 Commit G: done_partner is now a direct
                // mark_partner; no chained MarkPartnerModal. The meeting
                // log itself is implicit in the partner conversion.
                await callAction(logMeetingRow.id, "mark_partner", { ...partner });
              }
              setLogMeetingRow(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
              throw e;
            }
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
