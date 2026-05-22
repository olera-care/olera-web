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
import { useToast } from "@/components/admin/Toast";
import { useRecentMoves } from "@/components/admin/RecentMoves";
import { logActionSuccessMessage } from "@/lib/student-outreach/log-success-messages";
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
  type CandidateRow,
  type ClientRow,
  type ProviderProspectRow,
  type TabKey,
} from "@/lib/student-outreach/tab-config";
import { RowCard } from "@/components/admin/medjobs/cards/StakeholderCard";
import { SiteCard } from "@/components/admin/medjobs/cards/SiteCard";
import { ClientCard } from "@/components/admin/medjobs/cards/ClientCard";
import { CandidateCard } from "@/components/admin/medjobs/cards/SpecialtyCards";
import { CardOverflowMenu } from "@/components/admin/medjobs/cards/CardOverflowMenu";
import { ResearchTabContent } from "@/components/admin/medjobs/lists/ResearchTabContent";
import { RepliesGroupedList } from "@/components/admin/medjobs/lists/RepliesGroupedList";
import { InBasketHero } from "@/components/admin/medjobs/InBasketHero";
import { BulkResearchModal } from "@/app/admin/student-outreach/BulkResearchModal";
import { useMedJobsRefresh, refreshMedJobs } from "@/hooks/useMedJobsRefresh";

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
  // v9.0 Phase 7 Commit N: entity rows for the In Basket tabs that key
  // off business_profile_tasks / site_tasks rather than student_outreach.
  // The queue endpoint can't hydrate these (the tabs are entity-driven,
  // not stakeholder-driven), so each tab side-fetches its own list
  // narrowed to entities with pending operational work.
  const [clientRows, setClientRows] = useState<ClientRow[]>([]);
  const [candidateRows, setCandidateRows] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);
  const [openProviderId, setOpenProviderId] = useState<string | null>(null);
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null);
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
          // v9.0 Phase 7 Commit N: In Basket Sites tab surfaces sites
          // v9.0 Phase 7 Commit P: In Basket Sites tab content =
          // sites with pending site_tasks only (matches the queue
          // counts.sites + sidebar Sites fraction). Research-needed
          // sites are still surfaced when admin manually queues a
          // site_task on them; the auto-prompting model is deferred
          // to a follow-up auto-queue trigger.
          const all = (d.rows ?? []) as CampusRow[];
          setCampusBanners(all.filter((c) => c.has_pending_task === true));
        } else {
          setCampusBanners([]);
        }
      } else {
        setCampusBanners([]);
      }

      // v9.0 Phase 7 Commit N: side-fetch entity rows for the
      // task-driven In Basket tabs (clients / candidates). The queue
      // endpoint can't hydrate them — clients are business_profiles
      // and candidates are student business_profiles, not
      // student_outreach rows. The dedicated entity endpoints accept
      // ?with_pending_task=true to narrow the result to the In Basket
      // subset.
      if (tab === "clients") {
        const r = await fetch(
          `/api/admin/medjobs/clients?with_pending_task=true`,
        );
        if (r.ok) {
          const d = await r.json();
          setClientRows((d.rows ?? []) as ClientRow[]);
        } else {
          setClientRows([]);
        }
      } else {
        setClientRows([]);
      }

      if (tab === "candidates") {
        const r = await fetch(
          `/api/admin/student-outreach/candidates?with_pending_task=true`,
        );
        if (r.ok) {
          const d = await r.json();
          setCandidateRows((d.rows ?? []) as CandidateRow[]);
        } else {
          setCandidateRows([]);
        }
      } else {
        setCandidateRows([]);
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

  // v9.0 Phase 7 Commit O: shared mark-as-unread helper for entity-task
  // entities. POSTs to the unified mark-entity-read endpoint with
  // action='unread' so the entity's viewed_at clears, surfacing it as
  // unread again across the In Basket + sidebar.
  const markEntityUnread = useCallback(
    async (kind: "client" | "candidate" | "site", id: string) => {
      try {
        await fetch("/api/admin/medjobs/mark-entity-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, id, action: "unread" }),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to mark unread");
      }
    },
    [],
  );

  const toast = useToast();
  const { markMoved, isRecent } = useRecentMoves();
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
      // E1: surface a progression toast for meaningful Log actions.
      const message = logActionSuccessMessage(action, payload);
      if (message) {
        toast(message);
        // E2: also mark the row as recently moved so the destination
        // tab can highlight it.
        markMoved(outreachId);
      }
      await refetch();
      // v9.0 Phase 7 Commit K: fan-out so the sidebar fractions +
      // hero counts update live alongside this page's refetch.
      refreshMedJobs();
    },
    [refetch, refreshMedJobs, toast, markMoved],
  );

  const renderRow = useCallback(
    (row: TabRow) => (
      <RowCard
        tab={tab}
        row={row}
        recentlyMoved={isRecent(row.id)}
        onOpenDrawer={() => setOpenOutreachId(row.id)}
        onLogCallOutcome={() => setCallOutcomeRow(row)}
        onClassifyReply={(source) => setClassifierRow({ row, source })}
        onMarkPartner={() => setPartnerRow(row)}
        onMakeClient={async () => {
          // Provider conversion shortcut from the row overflow.
          // Mirrors the drawer's MakeClientFooter — confirm prompt,
          // make_client action, lazy unlock of catchment Partner
          // Prospects on next read. No modal because the conversion
          // doesn't need committment-evidence payload (admin's
          // judgment call from outreach signals).
          if (
            !window.confirm(
              `Mark ${row.organization_name} as a Client?\n\nThis writes the conversion timestamp on the provider profile and surfaces Partner Prospects for any Site in this provider's catchment.`,
            )
          )
            return;
          try {
            await callAction(row.id, "make_client");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Action failed");
          }
        }}
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
        onOpenDirectory={
          row.kind === "provider" && row.provider_slug
            ? () => {
                window.open(`/provider/${row.provider_slug}`, "_blank", "noopener,noreferrer");
              }
            : undefined
        }
        onSeeLogHistory={() => {
          window.location.href = `/admin/medjobs/logs?outreach_id=${row.id}`;
        }}
      />
    ),
    [tab, callAction, isRecent],
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

  // Auto-pivot: when counts arrive and the active tab has 0 work,
  // switch to the first tab that does have work. Without this, the
  // initialTab="clients" default on the In Basket page would anchor
  // Clients into the bar even when the only operational work is in
  // Prospects (or any other tab). Lets smart-hide actually hide
  // Clients on fresh load.
  //
  // Skipped when the URL has an explicit ?tab=... so a deep-link to an
  // empty tab still works. Once auto-pivot fires, setTabAndUrl writes
  // ?tab=<picked> to the URL — subsequent count changes won't pivot
  // again because the URL is now explicit.
  useEffect(() => {
    if (!tabCounts) return;
    if (tabFromUrl != null) return;
    if ((tabCounts[tab] ?? 0) > 0) return;
    const firstWithWork = TABS.find((t) => (tabCounts[t.key] ?? 0) > 0);
    if (firstWithWork && firstWithWork.key !== tab) {
      setTabAndUrl(firstWithWork.key);
    }
  }, [tabCounts, tab, tabFromUrl, setTabAndUrl]);

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
          so counts only reflect active work.
          Entirely hidden when isInboxEmpty — a fully-clean inbox has
          no tabs, just the "Everything caught up" empty state. Tabs
          surface only when actual operational work exists. */}
      {!isInboxEmpty && (
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
      )}

      {/* Per-tab list rendering. Each tab is a workflow category;
          smart-hide already removed empty ones from the bar.
          v9.0 Phase 7 Commit M: only show "Loading…" on the first
          fetch (rows.length === 0). Background refetches keep the
          existing list visible so the page doesn't flash on every
          drawer open / action. */}
      {loading && rows.length === 0 ? (
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
          researchCampuses={researchCampuses}
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
          onOpenCampusResearch={(campus) => setBulkResearchCampus(campus)}
          onMarkResearchComplete={async (campus) => {
            try {
              const res = await fetch(
                `/api/admin/student-outreach/campuses/${campus.slug}`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ research_complete: true }),
                },
              );
              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to mark research complete");
              }
              await refetch();
              refreshMedJobs();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to mark research complete");
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
        // v9.0 Phase 7 Commit N: In Basket Sites tab surfaces sites
        // with active operational work — research-needed prompts OR
        // sites with a pending site_task. Click opens the SiteDrawer
        // for the Step Board.
        campusBanners.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No sites need attention right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {campusBanners.map((c) => (
              <li key={c.id}>
                <SiteCard
                  row={c}
                  onView={() => {
                    window.location.href = `/admin/student-outreach/campus/${c.slug}`;
                  }}
                />
              </li>
            ))}
          </ul>
        )
      ) : tab === "clients" ? (
        // v9.0 Phase 7 Commit N: In Basket Clients tab renders provider
        // clients with at least one pending business_profile_task
        // (kind=client). Click opens the ProviderDrawer (Step Board).
        // Commit O: cards inherit row.unread; overflow includes
        // Mark as unread parity with stakeholder cards.
        clientRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No clients with pending steps right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {clientRows.map((r) => (
              <li key={r.id}>
                <ClientCard
                  row={r}
                  onManage={() => setOpenProviderId(r.id)}
                  overflowMenu={
                    <CardOverflowMenu
                      items={[
                        {
                          label: "Mark as unread",
                          onClick: async () => {
                            await markEntityUnread("client", r.id);
                            await refetch();
                            refreshMedJobs();
                          },
                        },
                      ]}
                    />
                  }
                />
              </li>
            ))}
          </ul>
        )
      ) : tab === "candidates" ? (
        candidateRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No candidates with pending steps right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {candidateRows.map((r) => (
              <li key={r.id}>
                <CandidateCard
                  row={r}
                  onOpen={() => setOpenCandidateId(r.id)}
                  overflowMenu={
                    <CardOverflowMenu
                      items={[
                        {
                          label: "Mark as unread",
                          onClick: async () => {
                            await markEntityUnread("candidate", r.id);
                            await refetch();
                            refreshMedJobs();
                          },
                        },
                        {
                          label: "Open profile editor",
                          onClick: () => {
                            window.location.href = `/admin/medjobs/${r.id}`;
                          },
                        },
                      ]}
                    />
                  }
                />
              </li>
            ))}
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
            <li key={row.row_key ?? row.id}>{renderRow(row)}</li>
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

      {/* v9.0 Phase 7 Commit N: entity drawers for the In Basket
          Clients / Candidates / Sites tabs. Each closes back to a
          refetch so the EntityStepBoard's task completions reflect
          immediately in the In Basket. */}
      {openProviderId && (
        <Drawer
          providerId={openProviderId}
          onClose={() => {
            setOpenProviderId(null);
            void refetch();
          }}
        />
      )}
      {openCandidateId && (
        <Drawer
          candidateId={openCandidateId}
          onClose={() => {
            setOpenCandidateId(null);
            void refetch();
          }}
        />
      )}

      {callOutcomeRow && (
        <LogCallOutcomeModal
          organizationName={callOutcomeRow.organization_name}
          contactName={callOutcomeRow.primary_contact_name}
          contactPhone={callOutcomeRow.primary_contact_phone}
          rowKind={callOutcomeRow.kind === "provider" ? "provider" : "stakeholder"}
          onCancel={() => setCallOutcomeRow(null)}
          onSubmit={async (outcome, notes, partner, meetingAt) => {
            // R5: terminal admin overrides dispatched directly.
            if (outcome === "mark_dnc" || outcome === "mark_no_response_closed") {
              await callAction(callOutcomeRow.id, outcome, { notes });
            } else if (outcome === "meeting_scheduled") {
              // P1: call-driven meeting commitment dispatches
              // mark_meeting_scheduled directly.
              await callAction(callOutcomeRow.id, "mark_meeting_scheduled", {
                meeting_at: meetingAt ?? null,
                notes,
              });
            } else {
              // v9 final: scope the log to this row's specific call task
              // so the General Contact card and each Specific Contact
              // card close their own tasks independently. Without
              // task_id the server falls back to the oldest due call.
              await callAction(callOutcomeRow.id, "log_call", {
                outcome,
                notes,
                task_id: callOutcomeRow.due_call_task?.id,
              });
              if (partner) {
                await callAction(callOutcomeRow.id, "mark_partner", { ...partner });
              }
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
          onSubmit={async (classification, payload, partner, redirect) => {
            if (classification === "became_client") {
              // P3: provider reply → direct client conversion.
              await callAction(classifierRow.row.id, "make_client", {
                notes: payload.notes,
              });
            } else if (classification === "redirected" && redirect) {
              // P4: add the new contact + stop the original cadence.
              // stop_cadence: true ensures cadence stops for the original
              // recipient even though we're using keep_emailing.
              const derivedName =
                [redirect.first_name, redirect.last_name]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || redirect.email;
              await callAction(classifierRow.row.id, "add_contact", {
                name: derivedName,
                first_name: redirect.first_name || null,
                last_name: redirect.last_name || null,
                email: redirect.email || null,
              });
              await callAction(classifierRow.row.id, "classify_reply", {
                classification: "keep_emailing",
                notes: payload.notes,
                stop_cadence: true,
              });
            } else {
              await callAction(classifierRow.row.id, "classify_reply", {
                classification,
                notes: payload.notes,
                meeting_at: payload.meeting_at,
              });
              if (partner) {
                await callAction(classifierRow.row.id, "mark_partner", { ...partner });
              }
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
          rowKind={logMeetingRow.kind === "provider" ? "provider" : "stakeholder"}
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
              } else if (status === "no_show") {
                // P6: emit meeting_no_show + keep meeting_state in_flight.
                await callAction(logMeetingRow.id, "flag_wants_meeting", {
                  notes: payload.notes,
                  no_show: true,
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
              } else if (status === "done_client") {
                // P3: post-meeting provider conversion.
                await callAction(logMeetingRow.id, "make_client", {
                  notes: payload.notes,
                });
              } else if (status === "not_a_fit") {
                // C3: post-meeting decline path.
                await callAction(logMeetingRow.id, "mark_not_interested", {
                  notes: payload.notes,
                });
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
