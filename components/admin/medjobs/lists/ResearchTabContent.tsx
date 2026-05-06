"use client";

/**
 * Prospects-tab content. v9.0 Phase 3 cleanup: Campus operational
 * cards moved to the Campuses tab. Prospects now shows only the
 * generated outreach work — provider prospects (virtual rows from
 * catchment) and stakeholder rows (materialized student_outreach
 * records in research stage).
 *
 * Filter chips: All / Providers / Stakeholders / Ready to email.
 */

import { useMemo, useState, type ReactNode } from "react";
import type { TabRow } from "@/lib/student-outreach/types";
import type { ProviderProspectRow } from "@/lib/student-outreach/tab-config";
import { FilterPill } from "../cards/StakeholderCard";
import { ProviderProspectCard } from "../cards/ProviderProspectCard";

/**
 * v9.0 Phase 3 kind filter for the Prospects list. campus_research
 * dropped — that work moved to the Campuses tab where it belongs.
 */
type ProspectKindFilter = "all" | "ready" | "stakeholders" | "providers";

export function ResearchTabContent({
  rows,
  providerProspects,
  renderRow,
  onBulkStartOutreach,
  onStartProviderOutreach,
  tabCountsAll,
}: {
  rows: TabRow[];
  /** v9.0 Phase 2 Tier 3: virtual provider prospects from catchment. */
  providerProspects: ProviderProspectRow[];
  renderRow: (row: TabRow) => ReactNode;
  onBulkStartOutreach: (selectedRows: TabRow[]) => Promise<void>;
  onStartProviderOutreach: (row: ProviderProspectRow) => void;
  tabCountsAll: number;
}) {
  const [filter, setFilter] = useState<ProspectKindFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);

  const readyRows = useMemo(() => rows.filter((r) => r.status === "researched"), [rows]);
  const showStakeholderRows =
    filter === "all" || filter === "stakeholders" || filter === "ready";
  const showProviderRows = filter === "all" || filter === "providers";
  const visibleRows = filter === "ready" ? readyRows : showStakeholderRows ? rows : [];
  const visibleProviderProspects = showProviderRows ? providerProspects : [];
  const stakeholderCount = rows.length;
  const providerCount = providerProspects.length;

  const visibleIds = useMemo(() => new Set(visibleRows.map((r) => r.id)), [visibleRows]);
  const effectiveSelected = useMemo(
    () => new Set(Array.from(selectedIds).filter((id) => visibleIds.has(id))),
    [selectedIds, visibleIds],
  );

  const toggleRow = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allReadySelected =
    readyRows.length > 0 && readyRows.every((r) => effectiveSelected.has(r.id));
  const toggleSelectAllReady = () => {
    if (allReadySelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(readyRows.map((r) => r.id)));
  };

  const runBulk = async () => {
    const selected = readyRows.filter((r) => effectiveSelected.has(r.id));
    if (selected.length === 0) return;
    if (!window.confirm(
      `Start outreach for ${selected.length} stakeholder${selected.length === 1 ? "" : "s"}? Day-0 emails fire immediately; later days auto-send on schedule.`,
    )) return;
    setBulkRunning(true);
    try {
      await onBulkStartOutreach(selected);
      setSelectedIds(new Set());
    } finally {
      setBulkRunning(false);
    }
  };

  const totalVisible = visibleProviderProspects.length + visibleRows.length;
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

  return (
    <div className="space-y-6">
      {/* v9.0 Phase 2 Tier 3: kind filter chips. Always visible at top
          so admin can switch between provider prospecting (Stage 1) and
          stakeholder prospecting (Stage 2) without bouncing between
          pages. Existing "Ready to email" chip preserved as a sub-filter
          for the bulk-start workflow. */}
      <div className="flex flex-wrap items-center gap-1 px-1">
        <FilterPill
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
          count={stakeholderCount + providerCount}
        />
        <FilterPill
          active={filter === "providers"}
          onClick={() => setFilter("providers")}
          label="Providers"
          count={providerCount}
        />
        <FilterPill
          active={filter === "stakeholders"}
          onClick={() => setFilter("stakeholders")}
          label="Stakeholders"
          count={stakeholderCount}
        />
        <FilterPill
          active={filter === "ready"}
          onClick={() => setFilter("ready")}
          label="Ready to email"
          count={readyRows.length}
        />
        {filter === "ready" && readyRows.length > 0 && (
          <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 px-2 text-xs font-medium text-gray-500 hover:text-gray-700">
            <input
              type="checkbox"
              checked={allReadySelected}
              onChange={toggleSelectAllReady}
              className="h-3.5 w-3.5 rounded border-gray-300"
            />
            Select all
          </label>
        )}
      </div>

      {effectiveSelected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-sm font-medium text-emerald-900">
            {effectiveSelected.size} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkRunning}
              className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={runBulk}
              disabled={bulkRunning}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {bulkRunning
                ? "Starting…"
                : `Start outreach for ${effectiveSelected.size}`}
            </button>
          </div>
        </div>
      )}

      {/* v9.0 Phase 2 Tier 3: virtual provider prospects from catchment. */}
      {visibleProviderProspects.length > 0 && (
        <div>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Provider prospects ({visibleProviderProspects.length})
          </h3>
          <ul className="space-y-2">
            {visibleProviderProspects.map((p) => (
              <li key={p.id}>
                <ProviderProspectCard
                  row={p}
                  onStartOutreach={() => onStartProviderOutreach(p)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stakeholder rows (existing student_outreach prospect/researched rows). */}
      {showStakeholderRows && rows.length > 0 && (
        <div>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {filter === "ready"
              ? `Ready to email (${visibleRows.length})`
              : `Stakeholders in research (${rows.length})`}
          </h3>
          {visibleRows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
              {filter === "ready"
                ? "No stakeholders are ready to email yet."
                : "No stakeholders in research."}
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleRows.map((row) => {
                const isReady = row.status === "researched";
                return (
                  <li key={row.id} className="flex items-start gap-2">
                    {isReady && (
                      <input
                        type="checkbox"
                        checked={effectiveSelected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="mt-4 shrink-0 rounded border-gray-300"
                        title="Select for bulk Start outreach"
                      />
                    )}
                    {!isReady && <span className="w-4 shrink-0" aria-hidden />}
                    <div className="flex-1">{renderRow(row)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Empty state when filter narrows to nothing. */}
      {totalVisible === 0 && (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
          Nothing matches this filter. Try the All chip above.
        </p>
      )}
    </div>
  );
}

