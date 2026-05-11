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
 *     Stakeholders being researched. UI rename of "stakeholders in
 *     research" — they're prospective Partners. DB stays
 *     student_outreach.
 *
 * Default-open rule: whichever section has the highest unread count
 * leads. Provider Prospects have no unread tracking (virtual rows),
 * so Partner Prospects opens when it has any unread; otherwise
 * Provider Prospects opens (the funnel-unlock path is the default).
 *
 * No bulk selection in MVP — admins click rows individually. The
 * multi-select system landed in Commit H but proved too heavy for
 * daily flow.
 */

import { useMemo, useState, type ReactNode } from "react";
import type { ResearchCampusCard, TabRow } from "@/lib/student-outreach/types";
import type { ProviderProspectRow } from "@/lib/student-outreach/tab-config";
import { ProviderProspectCard } from "../cards/ProviderProspectCard";
import { CampusResearchCard } from "../cards/CampusResearchCard";
import { CardOverflowMenu } from "../cards/CardOverflowMenu";

export function ResearchTabContent({
  rows,
  providerProspects,
  researchCampuses,
  renderRow,
  onStartProviderOutreach,
  onOpenCampusResearch,
  onMarkResearchComplete,
  tabCountsAll,
}: {
  rows: TabRow[];
  providerProspects: ProviderProspectRow[];
  researchCampuses: ResearchCampusCard[];
  renderRow: (row: TabRow) => ReactNode;
  onStartProviderOutreach: (row: ProviderProspectRow) => void;
  onOpenCampusResearch: (campus: ResearchCampusCard) => void;
  onMarkResearchComplete: (campus: ResearchCampusCard) => void;
  tabCountsAll: number;
}) {
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

  // Default-open rule: Partner Prospects opens when it has unread or
  // any queued research cards; Provider Prospects opens otherwise
  // (the funnel-unlock path). Single section opens by default — the
  // other stays collapsed until admin chooses.
  const [providerOpen, setProviderOpen] = useState<boolean>(
    partnerUnreadCount === 0 && researchCampuses.length === 0 && providerTotal > 0,
  );
  const [partnerOpen, setPartnerOpen] = useState<boolean>(
    partnerUnreadCount > 0 ||
      researchCampuses.length > 0 ||
      (providerTotal === 0 && stakeholderRows.length > 0),
  );

  const totalAvailable = providerTotal + partnerTotal;

  if (totalAvailable === 0) {
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
    <div className="space-y-3">
      {providerTotal > 0 && (
        <Section
          label="Provider Prospects"
          count={providerTotal}
          unread={providerUnreadCount > 0 ? providerUnreadCount : null}
          open={providerOpen}
          onToggle={() => setProviderOpen((s) => !s)}
        >
          <ul className="space-y-2 pt-2">
            {providerProspects.map((p) => (
              <li key={p.id}>
                <ProviderProspectCard
                  row={p}
                  onStartOutreach={() => onStartProviderOutreach(p)}
                  overflowMenu={
                    <CardOverflowMenu
                      items={[
                        {
                          label: "Open in Directory",
                          onClick: () => {
                            window.open(
                              `/admin/directory?providerId=${p.provider_id}`,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          },
                        },
                      ]}
                    />
                  }
                />
              </li>
            ))}
            {providerRows.map((row) => (
              <li key={row.id}>{renderRow(row)}</li>
            ))}
          </ul>
        </Section>
      )}

      {partnerTotal > 0 && (
        <Section
          label="Partner Prospects"
          count={partnerTotal}
          unread={partnerUnreadCount}
          open={partnerOpen}
          onToggle={() => setPartnerOpen((s) => !s)}
        >
          <ul className="space-y-2 pt-2">
            {researchCampuses.map((c) => (
              <li key={`research-${c.id}`}>
                <CampusResearchCard
                  row={c}
                  onOpenResearch={() => onOpenCampusResearch(c)}
                  overflowMenu={
                    <CardOverflowMenu
                      items={[
                        {
                          label: "Mark research complete",
                          onClick: () => onMarkResearchComplete(c),
                        },
                        {
                          label: "Open site management page",
                          onClick: () => {
                            window.open(
                              `/admin/student-outreach/campus/${c.slug}`,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          },
                        },
                      ]}
                    />
                  }
                />
              </li>
            ))}
            {stakeholderRows.map((row) => (
              <li key={row.id}>{renderRow(row)}</li>
            ))}
          </ul>
        </Section>
      )}
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
