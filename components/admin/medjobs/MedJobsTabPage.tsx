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
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { useRecentMoves } from "@/components/admin/RecentMoves";
import { logActionSuccessMessage } from "@/lib/student-outreach/log-success-messages";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
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
  MENU_TABS,
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
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";

interface MedJobsTabPageProps {
  initialTab: TabKey;
  title?: string;
}

// v10 (Phase 1 Bullet 4, 2026-06-04): valid keys span BOTH the primary
// horizontal row and the ⋯ overflow menu so deep links to any tab — including
// clients/partners/candidates which moved to MENU_TABS — still resolve.
const VALID_TAB_KEYS: ReadonlySet<TabKey> = new Set([
  ...TABS.map((t) => t.key),
  ...MENU_TABS.map((t) => t.key),
]);

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
  // Active partners (TabRows) for the Partners audience tab's active section.
  const [partnerRows, setPartnerRows] = useState<TabRow[]>([]);
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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Audience queues compose existing queue views: their primary rows are
      // the prospecting side (tab=prospects), with the active-entity side
      // pulled in via side-fetches below. Other tabs query their own key.
      const queueTab: TabKey =
        tab === "providers" || tab === "partner_book" ? "prospects" : tab;
      const queueParams = new URLSearchParams();
      if (campusSlug) queueParams.set("campus", campusSlug);
      if (typeFilter !== "all") queueParams.set("type", typeFilter);
      queueParams.set("tab", queueTab);
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
      // Provider prospects (virtual catchment rows) feed the Prospects tab and
      // the Providers audience tab's prospecting section.
      if (tab === "prospects" || tab === "providers") {
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

      // Active partners (kind != provider, status active_partner, pending task)
      // feed the Partners audience tab's active section. Pulled from the queue
      // with tab=partners so they hydrate as full TabRows (same RowCard +
      // drawer path as the prospecting section).
      if (tab === "partner_book") {
        const p = new URLSearchParams();
        if (campusSlug) p.set("campus", campusSlug);
        if (typeFilter !== "all") p.set("type", typeFilter);
        p.set("tab", "partners");
        if (debouncedSearch) p.set("search", debouncedSearch);
        const r = await fetch(`/api/admin/student-outreach/queue?${p}`);
        if (r.ok) {
          const d = await r.json();
          setPartnerRows(d.rows ?? []);
        } else {
          setPartnerRows([]);
        }
      } else {
        setPartnerRows([]);
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
      // Active clients feed the Clients tab and the Providers audience tab's
      // active section.
      if (tab === "clients" || tab === "providers") {
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
    // slotTab selects the card's action-slots (buildRowSlots). Audience tabs
    // pass an explicit underlying key per section ("prospects" for the
    // prospecting rows, "partners" for the active-partner rows) so each row
    // gets the right buttons even though the active tab is providers/partner_book.
    (row: TabRow, slotTab: TabKey = tab) => (
      <RowCard
        tab={slotTab}
        row={row}
        recentlyMoved={isRecent(row.id)}
        onOpenDrawer={() => setOpenOutreachId(row.id)}
        onStopOutreach={async (reason) => {
          const action = STOP_OUTREACH_ACTIONS[reason];
          const label = STOP_OUTREACH_LABELS[reason];
          if (!window.confirm(`Stop outreach: ${label}?`)) return;
          try { await callAction(row.id, action); }
          catch (e) { setError(e instanceof Error ? e.message : "Action failed"); }
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

  // Shared prospect-research handlers — used by the Prospects tab and the
  // Providers / Partners audience tabs (which reuse ResearchTabContent for
  // their prospecting sections).
  const startProviderOutreach = useCallback(
    async (p: ProviderProspectRow) => {
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
    },
    [refetch],
  );

  // Client list renderer — shared by the Clients tab and the Providers
  // audience tab's active section.
  const renderClientList = useCallback(
    (list: ClientRow[]) => (
      <ul className="space-y-2">
        {list.map((r) => (
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
    ),
    [markEntityUnread, refetch],
  );

  // Always show the four core operational tabs (Prospects · Calls · Emails ·
  // Meetings), even when empty. Each has its own empty state, so a quiet
  // "No calls due" reads better than a tab that vanishes — the admin always
  // knows where calls/meetings will land. (Smart-hide removed for these.)
  const visibleTabs = TABS;

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
        <div className="min-w-[220px] flex-1">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by organization name…"
            size="sm"
          />
        </div>
        <div className="shrink-0 min-w-[140px]">
          <Select
            value={campusSlug}
            onChange={(val) => setCampusSlug(val)}
            size="sm"
            options={[
              { value: "", label: "All sites" },
              ...campuses.map((c) => ({ value: c.slug, label: c.name })),
            ]}
          />
        </div>
        <div className="shrink-0 min-w-[120px]">
          <Select
            value={typeFilter}
            onChange={(val) => setTypeFilter(val as StakeholderType | "all")}
            size="sm"
            options={TYPE_FILTERS.map((f) => ({ value: f.key, label: f.label }))}
          />
        </div>
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
          <p className="text-base font-semibold text-primary-700">
            ✓ Everything caught up.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            The In Basket is clear. Head to{" "}
            <Link
              href="/admin/medjobs/logs"
              className="font-medium text-primary-700 underline hover:no-underline"
            >
              Logs
            </Link>
            {" "}to review what you and the team finished.
          </p>
        </div>
      ) : tab === "providers" ? (
        // Provider audience queue: prospecting (catchment agency prospects)
        // folded with active clients. Provider-kind materialized rows + virtual
        // catchment cards render via ResearchTabContent (provider side only).
        <div className="space-y-8">
          <section>
            <AudienceSectionHeader label="Prospecting · agencies in catchment" />
            <ResearchTabContent
              rows={rows.filter((r) => r.kind === "provider")}
              providerProspects={providerProspects}
              researchCampuses={[]}
              renderRow={(row) => renderRow(row, "prospects")}
              onStartProviderOutreach={startProviderOutreach}
              tabCountsAll={tabCounts?.all ?? 0}
            />
          </section>
          <section>
            <AudienceSectionHeader label="Active clients · pending steps" />
            {clientRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No clients with pending steps right now.
              </p>
            ) : (
              renderClientList(clientRows)
            )}
          </section>
        </div>
      ) : tab === "partner_book" ? (
        // Partner audience queue: prospecting (campus stakeholders + research
        // cards) folded with active partners. Partner-kind prospect rows render
        // via ResearchTabContent (partner side only); active partners below.
        <div className="space-y-8">
          <section>
            <AudienceSectionHeader label="Prospecting · campus stakeholders" />
            <ResearchTabContent
              rows={rows.filter((r) => r.kind !== "provider")}
              providerProspects={[]}
              researchCampuses={researchCampuses}
              renderRow={(row) => renderRow(row, "prospects")}
              onStartProviderOutreach={startProviderOutreach}
              tabCountsAll={tabCounts?.all ?? 0}
            />
          </section>
          <section>
            <AudienceSectionHeader label="Active partners · pending steps" />
            {partnerRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No partners have open tasks right now.
              </p>
            ) : (
              <ul className="space-y-2">
                {partnerRows.map((row) => (
                  <li key={row.row_key ?? row.id}>{renderRow(row, "partners")}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : tab === "prospects" ? (
        <ResearchTabContent
          rows={rows}
          providerProspects={providerProspects}
          researchCampuses={researchCampuses}
          renderRow={renderRow}
          onStartProviderOutreach={startProviderOutreach}
          onOpenCampusResearch={(campus) => setBulkResearchCampus(campus)}
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
          renderClientList(clientRows)
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
      ) : tab === "calls" ? (
        <CallsSectioned rows={rows} renderRow={renderRow} />
      ) : tab === "meetings" ? (
        <MeetingsSectioned rows={rows} renderRow={renderRow} />
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


// Section header for the audience queues (Providers / Partners), separating
// each tab's prospecting and active-entity sections.
function AudienceSectionHeader({ label }: { label: string }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </p>
  );
}


// ── v10 Bullet 7 (2026-06-04): Calls tab sectioned rendering ──────────────
// Splits the rows into Today + Upcoming sections. "Today" = due_at by
// end-of-day local; everything past that is Upcoming, grouped by day.
// Sort priority: within Today, clicked-not-activated rows surface FIRST
// (engagement-driven priority bump from Pass A strategy depth).

function CallsSectioned({
  rows,
  renderRow,
}: {
  rows: TabRow[];
  renderRow: (row: TabRow) => React.ReactNode;
}) {
  const endOfToday = (() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  })();

  // Partition by due_at; rows without due_call_task fall into Today as
  // safety (overdue or anomalous — admin still sees them).
  const todayRows: TabRow[] = [];
  const upcomingRows: TabRow[] = [];
  for (const r of rows) {
    const dueIso = r.due_call_task?.due_at;
    const due = dueIso ? new Date(dueIso).getTime() : 0;
    if (!dueIso || due <= endOfToday) todayRows.push(r);
    else upcomingRows.push(r);
  }

  // Today: clicked-not-activated first, then by due_at ASC.
  todayRows.sort((a, b) => {
    const ac = a.engagement_substate === "clicked_not_activated" ? 0 : 1;
    const bc = b.engagement_substate === "clicked_not_activated" ? 0 : 1;
    if (ac !== bc) return ac - bc;
    const ad = a.due_call_task?.due_at ?? "";
    const bd = b.due_call_task?.due_at ?? "";
    return ad.localeCompare(bd);
  });

  // Upcoming: by due_at ASC. Group by day label for visual scanning.
  upcomingRows.sort((a, b) =>
    (a.due_call_task?.due_at ?? "").localeCompare(b.due_call_task?.due_at ?? ""),
  );
  const upcomingByDay = new Map<string, TabRow[]>();
  for (const r of upcomingRows) {
    const dueIso = r.due_call_task?.due_at;
    if (!dueIso) continue;
    const label = formatUpcomingDayLabel(dueIso);
    const list = upcomingByDay.get(label) ?? [];
    list.push(r);
    upcomingByDay.set(label, list);
  }

  return (
    <div className="space-y-6">
      {todayRows.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Today’s Calls ({todayRows.length})
          </h3>
          <ul className="space-y-2">
            {todayRows.map((row) => (
              <li key={row.row_key ?? row.id}>{renderRow(row)}</li>
            ))}
          </ul>
        </section>
      )}
      {upcomingByDay.size > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Upcoming ({upcomingRows.length})
          </h3>
          <div className="space-y-4">
            {[...upcomingByDay.entries()].map(([dayLabel, dayRows]) => (
              <div key={dayLabel}>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  {dayLabel} · {dayRows.length}
                </p>
                <ul className="space-y-2">
                  {dayRows.map((row) => (
                    <li key={row.row_key ?? row.id}>{renderRow(row)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatUpcomingDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDay = 86_400_000;
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((dayStart - startOfToday) / oneDay);
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}


// ── v10 Bullet 10 (2026-06-04): Meetings tab sectioned rendering ──────────
// Splits Meetings rows into three sections so admin sees what needs action
// vs what's in flight:
//   Upcoming    — meeting_state="scheduled" AND meeting_at > now()
//   In-flight   — meeting_state="in_flight" (coordinating; needs admin
//                 attention to book a time or handle a reschedule)
//   Past        — meeting_state="scheduled" AND meeting_at <= now()
//                 (meeting happened — admin needs to log the outcome)
//
// Calendly self-bookings ingested via the calendly-webhook flow into
// meeting_scheduled touchpoints surface here as Upcoming automatically.

function MeetingsSectioned({
  rows,
  renderRow,
}: {
  rows: TabRow[];
  renderRow: (row: TabRow) => React.ReactNode;
}) {
  const now = Date.now();
  const upcomingRows: TabRow[] = [];
  const inFlightRows: TabRow[] = [];
  const pastRows: TabRow[] = [];

  for (const r of rows) {
    if (r.meeting_state === "scheduled") {
      const t = r.meeting_at ? new Date(r.meeting_at).getTime() : 0;
      if (t && t > now) upcomingRows.push(r);
      else pastRows.push(r);
    } else if (r.meeting_state === "in_flight") {
      inFlightRows.push(r);
    } else {
      // Defensive — meetings tab data shouldn't surface other states,
      // but if it does, treat as in-flight to keep them visible.
      inFlightRows.push(r);
    }
  }

  // Upcoming sorts by meeting_at ASC (soonest first). In-flight by
  // last_activity_at DESC (most recent first). Past by meeting_at DESC
  // (most recent meeting first — that's what needs logging).
  upcomingRows.sort((a, b) =>
    (a.meeting_at ?? "").localeCompare(b.meeting_at ?? ""),
  );
  inFlightRows.sort((a, b) =>
    (b.last_activity_at ?? "").localeCompare(a.last_activity_at ?? ""),
  );
  pastRows.sort((a, b) =>
    (b.meeting_at ?? "").localeCompare(a.meeting_at ?? ""),
  );

  return (
    <div className="space-y-6">
      {upcomingRows.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Upcoming ({upcomingRows.length})
          </h3>
          <ul className="space-y-2">
            {upcomingRows.map((row) => (
              <li key={row.row_key ?? row.id}>{renderRow(row)}</li>
            ))}
          </ul>
        </section>
      )}
      {pastRows.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Needs logging ({pastRows.length})
          </h3>
          <p className="mb-2 text-[11px] text-gray-500">
            Meeting time has passed — log the outcome to move the row forward.
          </p>
          <ul className="space-y-2">
            {pastRows.map((row) => (
              <li key={row.row_key ?? row.id}>{renderRow(row)}</li>
            ))}
          </ul>
        </section>
      )}
      {inFlightRows.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Finding a time ({inFlightRows.length})
          </h3>
          <ul className="space-y-2">
            {inFlightRows.map((row) => (
              <li key={row.row_key ?? row.id}>{renderRow(row)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
