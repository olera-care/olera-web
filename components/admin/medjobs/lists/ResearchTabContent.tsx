"use client";

/**
 * v9.0 Phase 7 Commit I: Prospects-tab content with collapsible
 * sections. Replaces the heavy two-pill toggle from Commit H — the
 * toggle visually segmented the queue and pushed admins to flip
 * between two views; collapsible disclosure is calmer and
 * single-surface.
 *
 *   Provider Prospects
 *     Catchment-derived virtual rows for providers who could become
 *     Clients. Materialize → Start outreach moves them into the
 *     stakeholder workflow.
 *
 *   Partner Prospects
 *     University research card + downstream stakeholders being
 *     researched. Gated by partner-prospect-unlock: only appears
 *     after the Site has at least one client provider in catchment.
 *
 * v9.0 Phase 8: conditional grouping. Section headers only render
 * when BOTH prospect types have cards. The common operational state
 * after Site activation is Provider-only (no client conversions yet),
 * and a header/chevron over a single section adds chrome without
 * adding clarity. When the Partner Prospect gate unlocks, the second
 * section appears and both render as collapsibles. When only Partner
 * Prospects remain (unusual but possible — provider prospects all
 * materialized), that single section also renders flat.
 *
 * Default-open rule (only relevant when both sections render):
 * whichever has the highest unread leads. Provider Prospects have no
 * unread tracking (virtual rows), so Partner Prospects opens when it
 * has any unread; otherwise Provider Prospects opens (the
 * funnel-unlock path is the default).
 *
 * No bulk selection in MVP — admins click rows individually.
 */

import { useMemo, useRef, useState, type ReactNode } from "react";
import type { ResearchCampusCard, TabRow } from "@/lib/student-outreach/types";
import type { ProviderProspectRow } from "@/lib/student-outreach/tab-config";
import { ProviderProspectCard } from "../cards/ProviderProspectCard";
import { useRouter } from "next/navigation";
import { CampusResearchCard } from "../cards/CampusResearchCard";
import { CardOverflowMenu } from "../cards/CardOverflowMenu";
import { ResearchWorkspace } from "../ResearchWorkspace";
import { refreshMedJobs } from "@/hooks/useMedJobsRefresh";

export function ResearchTabContent({
  rows,
  providerProspects,
  researchCampuses,
  renderRow,
  onStartProviderOutreach,
  tabCountsAll,
}: {
  rows: TabRow[];
  providerProspects: ProviderProspectRow[];
  researchCampuses: ResearchCampusCard[];
  renderRow: (row: TabRow) => ReactNode;
  onStartProviderOutreach: (row: ProviderProspectRow) => void;
  /** Legacy props — partner research now runs through the sourcing + audit
   *  modals mounted here, not the BulkResearchModal. Kept optional so existing
   *  parents compile without change. */
  onOpenCampusResearch?: (campus: ResearchCampusCard) => void;
  onMarkResearchComplete?: (campus: ResearchCampusCard) => void;
  tabCountsAll: number;
}) {
  const router = useRouter();
  const [researchCampus, setResearchCampus] = useState<ResearchCampusCard | null>(null);
  // Established render order + per-card element cache for the provider
  // section (see providerItems below). Declared here so the hooks run
  // unconditionally, before the empty-state early return.
  const orderRef = useRef<string[]>([]);
  const nodeCacheRef = useRef<Map<string, { src: unknown; node: ReactNode }>>(
    new Map(),
  );
  // Split materialized rows by kind. Provider-kind rows belong with the
  // virtual provider catchment cards; everything else is a stakeholder
  // (advisor / professor / dept_head / student_org) that lives under
  // Partner Prospects. Without this split, materialized provider rows
  // leak into Partner Prospects after "Log" / Start Outreach.
  const providerRows = useMemo(
    () => rows.filter((r) => r.kind === "provider"),
    [rows],
  );
  const stakeholderRows = useMemo(
    () => rows.filter((r) => r.kind !== "provider"),
    [rows],
  );
  const partnerUnreadCount = useMemo(
    () => stakeholderRows.filter((r) => r.viewed_at == null).length,
    [stakeholderRows],
  );
  const providerUnreadCount = useMemo(
    () => providerRows.filter((r) => r.viewed_at == null).length,
    [providerRows],
  );
  const partnerTotal = researchCampuses.length + stakeholderRows.length;
  const providerTotal = providerProspects.length + providerRows.length;

  const hasProvider = providerTotal > 0;
  const hasPartner = partnerTotal > 0;
  // Only group when both types coexist. A single-type queue renders
  // flat — the operational reality the section header was supposed to
  // surface is already obvious when there's nothing to group against.
  const showSections = hasProvider && hasPartner;

  // Default-open rule applies only when sections render. Partner opens
  // first when it has unread or research cards; otherwise Provider
  // opens (the funnel-unlock path).
  const [providerOpen, setProviderOpen] = useState<boolean>(
    partnerUnreadCount === 0 && researchCampuses.length === 0 && hasProvider,
  );
  const [partnerOpen, setPartnerOpen] = useState<boolean>(
    partnerUnreadCount > 0 ||
      researchCampuses.length > 0 ||
      (!hasProvider && stakeholderRows.length > 0),
  );

  const totalAvailable = providerTotal + partnerTotal;

  if (totalAvailable === 0) {
    const headline = tabCountsAll === 0 ? "Nothing here yet." : "✓ All caught up.";
    const headlineColor = tabCountsAll === 0 ? "text-gray-700" : "text-primary-700";
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

  // v9 final: merge materialized rows + virtual catchment cards into
  // a single list sorted by created_at desc so opening a virtual
  // prospect (which materializes it) doesn't visually move the
  // card. The materialize endpoint inherits bp.created_at, and
  // both list sources sort by the same key — so the card stays at
  // the same rank through the transition, just changing visual
  // shape from a virtual ProviderProspectCard to a materialized
  // StakeholderCard in place.
  const renderVirtualProspect = (p: typeof providerProspects[number]) => (
    <ProviderProspectCard
      row={p}
      onStartOutreach={() => onStartProviderOutreach(p)}
      overflowMenu={
        <CardOverflowMenu
          items={[
            {
              label: "Open in directory ↗",
              onClick: () => {
                window.open(
                  `/admin/directory?providerId=${p.provider_id}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              },
            },
            {
              label: "See log history",
              onClick: () => {
                window.location.href = `/admin/medjobs/logs?provider_id=${p.provider_id}`;
              },
            },
            {
              label: "Mark as Client ✓",
              tone: "celebration",
              onClick: async () => {
                if (
                  !window.confirm(
                    `Mark ${p.provider_name} as a Client?\n\nMaterializes the outreach row and flags the provider as a Client.`,
                  )
                )
                  return;
                try {
                  const res = await fetch(
                    "/api/admin/medjobs/provider-prospects/materialize",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        provider_id: p.provider_id,
                        campus_id: p.campus_id,
                      }),
                    },
                  );
                  const body = await res.json();
                  if (!res.ok) throw new Error(body.error || "Materialize failed");
                  await fetch(`/api/admin/student-outreach/${body.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "make_client" }),
                  });
                  window.location.reload();
                } catch (e) {
                  console.error(e);
                }
              },
            },
          ]}
        />
      }
    />
  );

  // Stable render order — a function of WHICH cards exist, not of any
  // mutable field. A card keeps its position once it has one; new cards
  // append (newest-first among the newcomers); removed cards drop out.
  // This makes it structurally impossible for ANY re-render — a read-state
  // flip, an optimistic update, a background refresh — to reorder the list.
  // Only a genuine change to the set of cards moves anything. Replaces the
  // every-render re-sort by created_at, where order was derived from a
  // refetched/mutable field and so shuffled whenever the list re-rendered.
  // Per-card element cache. A card's rendered element is reused (SAME
  // object reference) as long as its source row object is unchanged, so
  // React bails out of re-rendering that card entirely. An optimistic read
  // flip (setStakeholderRead) creates a new object ONLY for the clicked
  // row — every other row keeps its reference — so opening an unread card
  // re-renders just that one card instead of all ~60. That double-work
  // (full-list re-render + drawer mount in one commit) is what made
  // opening an UNREAD card slow while a READ card opened instantly.
  let providerItems: Array<{ key: string; node: ReactNode }> = [];
  if (hasProvider) {
    const nextCache = new Map<string, { src: unknown; node: ReactNode }>();
    const cachedNode = (key: string, src: unknown, make: () => ReactNode): ReactNode => {
      const prev = nodeCacheRef.current.get(key);
      const node = prev && prev.src === src ? prev.node : make();
      nextCache.set(key, { src, node });
      return node;
    };
    const items = new Map<string, { key: string; sortKey: string; node: ReactNode }>();
    for (const row of providerRows) {
      const key = row.row_key ?? row.id;
      items.set(key, {
        key,
        sortKey: row.created_at,
        node: cachedNode(key, row, () => renderRow(row)),
      });
    }
    for (const p of providerProspects) {
      items.set(p.id, {
        key: p.id,
        sortKey: p.created_at,
        node: cachedNode(p.id, p, () => renderVirtualProspect(p)),
      });
    }
    nodeCacheRef.current = nextCache;
    const established = orderRef.current.filter((k) => items.has(k));
    const establishedKeys = new Set(established);
    const incoming = [...items.values()]
      .filter((it) => !establishedKeys.has(it.key))
      .sort((a, b) => {
        const byDate = b.sortKey.localeCompare(a.sortKey);
        return byDate !== 0 ? byDate : a.key.localeCompare(b.key);
      })
      .map((it) => it.key);
    const order = [...established, ...incoming];
    orderRef.current = order;
    providerItems = order.map((k) => {
      const it = items.get(k)!;
      return { key: it.key, node: it.node };
    });
  } else {
    orderRef.current = [];
    nodeCacheRef.current = new Map();
  }

  const providerCardList = hasProvider ? (
    <ul className="space-y-2 pt-2">
      {providerItems.map((it) => (
        <li key={it.key}>{it.node}</li>
      ))}
    </ul>
  ) : null;

  const partnerCardList = hasPartner ? (
    <ul className="space-y-2 pt-2">
      {researchCampuses.map((c) => (
        <li key={`research-${c.id}`}>
          <CampusResearchCard
            row={c}
            onFindPartners={() => setResearchCampus(c)}
            onSeeStakeholders={() =>
              router.push(`/admin/student-outreach/campus/${c.slug}`)
            }
          />
        </li>
      ))}
      {stakeholderRows.map((row) => (
        <li key={row.row_key ?? row.id}>{renderRow(row)}</li>
      ))}
    </ul>
  ) : null;

  // Partner research runs through the single Research Workspace (links →
  // extract → verify → review → attest → generate). Attestation of all three
  // subtypes sets research_complete, which removes this card from the queue.
  const modals = researchCampus ? (
    <ResearchWorkspace
      campusSlug={researchCampus.slug}
      universityName={researchCampus.name}
      onClose={() => setResearchCampus(null)}
      onChanged={() => refreshMedJobs()}
    />
  ) : null;

  // Single-type queue: render the surviving cards flat. No section
  // header, no chevron — the grouping UI exists to differentiate two
  // queues, and there's nothing to differentiate against here.
  if (!showSections) {
    return (
      <div className="space-y-3">
        {providerCardList ?? partnerCardList}
        {modals}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Section
        label="Provider Prospects"
        count={providerTotal}
        unread={providerUnreadCount > 0 ? providerUnreadCount : null}
        open={providerOpen}
        onToggle={() => setProviderOpen((s) => !s)}
      >
        {providerCardList}
      </Section>
      <Section
        label="Partner Prospects"
        count={partnerTotal}
        unread={partnerUnreadCount}
        open={partnerOpen}
        onToggle={() => setPartnerOpen((s) => !s)}
      >
        {partnerCardList}
      </Section>
      {modals}
    </div>
  );
}

/**
 * Subtle disclosure header. Click to expand/collapse. When unread > 0
 * the count fragment renders as `unread/total` and bolds — same
 * pattern as the In Basket tab bar.
 */
function Section({
  label,
  count,
  unread,
  open,
  onToggle,
  children,
}: {
  label: string;
  count: number;
  /** Pass null when the section has no unread tracking (e.g. virtual
   *  provider prospect rows). */
  unread: number | null;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const hasUnread = unread != null && unread > 0;
  return (
    <section>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-md px-1 py-1.5 text-left transition-colors hover:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          <Chevron open={open} />
          <span
            className={`text-xs uppercase tracking-wide ${
              hasUnread ? "font-semibold text-gray-900" : "font-semibold text-gray-500"
            }`}
          >
            {label}
          </span>
          <span
            className={`text-xs tabular-nums ${
              hasUnread ? "font-semibold text-gray-900" : "text-gray-400"
            }`}
          >
            {hasUnread ? `${unread}/${count}` : count}
          </span>
        </span>
      </button>
      {open && children}
    </section>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
