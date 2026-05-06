"use client";

/**
 * v9.0 Phase 7 Commit H: Prospects-tab content with a sub-segment
 * toggle. The tab fans out into two queues that are operationally
 * different but both fall under "prospects":
 *
 *   Provider Prospects (default)
 *     Catchment-derived virtual rows for providers who could become
 *     Clients. Materialize → Start outreach moves them into the
 *     stakeholder workflow.
 *
 *   Partner Prospects
 *     Stakeholders being researched (orgs, advisors, dept heads,
 *     professors). UI rename of "stakeholders in research" since
 *     they are, in funnel terms, prospective Partners. DB schema
 *     stays as student_outreach.
 *
 * Multi-select bulk Start outreach is offered on the Provider
 * Prospects sub-segment — same materialize action, batched. Queue
 * is sorted server-side; this surface just renders.
 */

import { useMemo, useState, type ReactNode } from "react";
import type { TabRow } from "@/lib/student-outreach/types";
import type { ProviderProspectRow } from "@/lib/student-outreach/tab-config";
import { ProviderProspectCard } from "../cards/ProviderProspectCard";

type Segment = "provider" | "partner";

export function ResearchTabContent({
  rows,
  providerProspects,
  renderRow,
  onStartProviderOutreach,
  onStartProviderOutreachBulk,
  tabCountsAll,
}: {
  rows: TabRow[];
  providerProspects: ProviderProspectRow[];
  renderRow: (row: TabRow) => ReactNode;
  onStartProviderOutreach: (row: ProviderProspectRow) => void;
  /** v9.0 Phase 7 Commit H: bulk materialize. Parent batches the
   *  POSTs and refetches once. */
  onStartProviderOutreachBulk?: (rows: ProviderProspectRow[]) => Promise<void>;
  tabCountsAll: number;
}) {
  // Default to Provider Prospects — the unlock-funnel path. Once a
  // provider in the catchment converts, that catchment opens up to
  // partner prospecting on the same site.
  const [segment, setSegment] = useState<Segment>(
    providerProspects.length > 0 || rows.length === 0 ? "provider" : "partner",
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const totalAvailable = providerProspects.length + rows.length;

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

  const visibleProviderRows = providerProspects;
  const allVisibleSelected =
    visibleProviderRows.length > 0 &&
    visibleProviderRows.every((p) => selected.has(p.id));
  const someSelected = visibleProviderRows.some((p) => selected.has(p.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleProviderRows.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedRows = useMemo(
    () => visibleProviderRows.filter((p) => selected.has(p.id)),
    [visibleProviderRows, selected],
  );

  return (
    <div className="space-y-4">
      {/* Sub-segment toggle. Two pills, count next to each. Hidden if
          either segment is empty AND the other has data — one-segment
          views skip the toggle. */}
      {providerProspects.length > 0 && rows.length > 0 && (
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          <SegmentTab
            active={segment === "provider"}
            label="Provider Prospects"
            count={providerProspects.length}
            onClick={() => setSegment("provider")}
          />
          <SegmentTab
            active={segment === "partner"}
            label="Partner Prospects"
            count={rows.length}
            onClick={() => setSegment("partner")}
          />
        </div>
      )}

      {segment === "provider" && providerProspects.length > 0 && (
        <div>
          {/* Bulk-select header. Surfaces only when there's >1 prospect
              so single-row queues stay clean. */}
          {visibleProviderRows.length > 1 && onStartProviderOutreachBulk && (
            <div className="mb-2 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 rounded border-gray-300"
                />
                {someSelected ? `${selected.size} selected` : "Select all"}
              </label>
              {someSelected && (
                <button
                  onClick={async () => {
                    setBulkSubmitting(true);
                    try {
                      await onStartProviderOutreachBulk(selectedRows);
                      setSelected(new Set());
                    } finally {
                      setBulkSubmitting(false);
                    }
                  }}
                  disabled={bulkSubmitting}
                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {bulkSubmitting
                    ? "Starting…"
                    : `Start outreach on ${selected.size}`}
                </button>
              )}
            </div>
          )}

          <ul className="space-y-2">
            {visibleProviderRows.map((p) => (
              <li key={p.id} className="flex items-stretch gap-2">
                {visibleProviderRows.length > 1 && onStartProviderOutreachBulk && (
                  <label className="flex shrink-0 items-center px-1">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300"
                    />
                  </label>
                )}
                <div className="min-w-0 flex-1">
                  <ProviderProspectCard
                    row={p}
                    onStartOutreach={() => onStartProviderOutreach(p)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {segment === "partner" && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>{renderRow(row)}</li>
          ))}
        </ul>
      )}

      {/* Empty-state per segment when only one side has data. */}
      {segment === "provider" && providerProspects.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-400">
          No provider prospects in catchment right now.
        </p>
      )}
      {segment === "partner" && rows.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-400">
          No partner prospects in research right now.
        </p>
      )}
    </div>
  );
}

function SegmentTab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-gray-900 font-semibold text-white"
          : "font-medium text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
      <span
        className={`ml-1.5 text-xs tabular-nums ${
          active ? "text-gray-300" : "text-gray-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
