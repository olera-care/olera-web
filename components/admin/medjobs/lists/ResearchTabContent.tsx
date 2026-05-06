"use client";

/**
 * Prospects-tab content. Two sections, top to bottom:
 *   1. Campus cards — one per campus where research_complete=false. Each
 *      is an entry point into the BulkResearchModal for that campus.
 *   2. Stakeholder rows — same row cards as today, one per row in
 *      prospect/researched status.
 *
 * v8.10.18: dropped the inline "+ Add campus" affordance entirely.
 * Campuses enter Student Outreach only via the Staffing Outreach
 * workflow. v9.0: stays the same; manual add still suppressed.
 *
 * Extracted from app/admin/student-outreach/page.tsx as part of the
 * v9.0 MedJobs reorg (Phase 0).
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ResearchCampusCard, TabRow } from "@/lib/student-outreach/types";
import { formatRelative } from "@/lib/student-outreach/formatters";
import { FilterPill, MenuItem } from "../cards/StakeholderCard";

export function ResearchTabContent({
  rows,
  researchCampuses,
  renderRow,
  onContinueCampus,
  onMarkResearchComplete,
  onBulkStartOutreach,
  tabCountsAll,
}: {
  rows: TabRow[];
  researchCampuses: ResearchCampusCard[];
  renderRow: (row: TabRow) => ReactNode;
  onContinueCampus: (campus: ResearchCampusCard) => void;
  onMarkResearchComplete: (slug: string, name: string) => Promise<void>;
  onBulkStartOutreach: (selectedRows: TabRow[]) => Promise<void>;
  tabCountsAll: number;
}) {
  const [filter, setFilter] = useState<"all" | "ready">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);

  const readyRows = useMemo(() => rows.filter((r) => r.status === "researched"), [rows]);
  const visibleRows = filter === "ready" ? readyRows : rows;

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

  const showCampusSection = researchCampuses.length > 0;
  const showStakeholderSection = rows.length > 0;

  if (!showCampusSection && !showStakeholderSection) {
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
      {showCampusSection && (
        <div>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Campuses in research
          </h3>
          <ul className="space-y-2">
            {researchCampuses.map((c) => (
              <li key={c.id}>
                <ResearchCampusCardView
                  campus={c}
                  onContinue={() => onContinueCampus(c)}
                  onMarkComplete={() => onMarkResearchComplete(c.slug, c.name)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {showStakeholderSection && (
        <div>
          {showCampusSection && (
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Stakeholders in research ({rows.length})
            </h3>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-1 px-1">
            <FilterPill
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="All"
              count={rows.length}
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
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
    </div>
  );
}

function ResearchCampusCardView({
  campus,
  onContinue,
  onMarkComplete,
}: {
  campus: ResearchCampusCard;
  onContinue: () => void;
  onMarkComplete: () => void;
}) {
  const hasStakeholders = campus.research_stakeholder_count > 0;
  // v9.0 Phase 2: campus has reached Stage 2 (≥1 client in catchment)
  // but no stakeholders are in research yet — fire the dedicated
  // "Campus research needed" banner styling so admin sees it as a
  // prompt to act, not as ongoing work.
  const isResearchNeeded =
    campus.stage === "stakeholder_prospecting" && !hasStakeholders;

  if (isResearchNeeded) {
    return (
      <div className="rounded-lg border-2 border-violet-200 bg-violet-50 px-4 py-3 transition-colors hover:bg-violet-100">
        <div className="flex items-start justify-between gap-3">
          <button onClick={onContinue} className="min-w-0 flex-1 text-left">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="rounded bg-violet-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-900">
                Campus research needed
              </span>
              <p className="truncate text-sm font-medium text-gray-900">
                {campus.name}
              </p>
            </div>
            <p className="mt-0.5 truncate text-xs text-violet-900">
              {campus.client_count
                ? `${campus.client_count} ${campus.client_count === 1 ? "client" : "clients"} in catchment`
                : "Stage 2 unlocked"}
              {" · Add student orgs, advisors, dept heads, professors."}
            </p>
            <p className="mt-0.5 text-[11px] text-violet-700">
              {[campus.city, campus.state].filter(Boolean).join(", ") || "—"}
            </p>
          </button>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onContinue(); }}
              className="rounded-md bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-800"
            >
              Add stakeholders →
            </button>
            <CampusOverflowMenu onMarkComplete={onMarkComplete} />
          </div>
        </div>
      </div>
    );
  }

  // Existing card variant (research ongoing, with stakeholders).
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onContinue} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {campus.name}
            </p>
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {[campus.city, campus.state].filter(Boolean).join(", ")}
            {hasStakeholders && ` · ${campus.research_stakeholder_count} ${campus.research_stakeholder_count === 1 ? "stakeholder" : "stakeholders"}`}
            {campus.client_count != null && campus.client_count > 0 && ` · ${campus.client_count} ${campus.client_count === 1 ? "client" : "clients"} in catchment`}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {campus.last_added_at ? `Last added ${formatRelative(campus.last_added_at)}` : "Just added"}
          </p>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            Research ongoing
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onContinue(); }}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            {hasStakeholders ? "Continue →" : "Start research →"}
          </button>
          <CampusOverflowMenu onMarkComplete={onMarkComplete} />
        </div>
      </div>
    </div>
  );
}

function CampusOverflowMenu({ onMarkComplete }: { onMarkComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative self-end">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((s) => !s); }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        title="More actions"
        aria-label="More actions"
      >
        <span aria-hidden>⋯</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <MenuItem onClick={() => { onMarkComplete(); setOpen(false); }}>
            Mark research complete
          </MenuItem>
        </div>
      )}
    </div>
  );
}
