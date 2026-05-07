"use client";

/**
 * v8.10.33 / v8.10.47: Tab-row overflow menu — also a custom-chart
 * series picker. The dropdown has two sections:
 *
 *   Compare in chart — checkboxes per metric. Selecting one or more
 *     overrides the active tab's default chart with a multi-line
 *     view of the selected categories.
 *
 *   Open view       — navigation rows for hidden tabs (Archive, All,
 *     Emails Sent, Outbound, Signups).
 *
 * Extracted from app/admin/student-outreach/page.tsx as part of the
 * v9.0 MedJobs reorg (Phase 0).
 */

import { useEffect, useRef, useState } from "react";
import type { TabCounts } from "@/lib/student-outreach/types";
import {
  CHART_SERIES_OPTIONS,
  type TabDef,
  type TabKey,
} from "@/lib/student-outreach/tab-config";

export function TabOverflowMenu({
  tabs,
  activeTab,
  onSelect,
  tabCounts,
  chartSeries,
  onToggleChartSeries,
  onClearChartSeries,
}: {
  tabs: TabDef[];
  activeTab: TabKey;
  onSelect: (tab: TabKey) => void;
  tabCounts: TabCounts | null;
  chartSeries: Set<string>;
  onToggleChartSeries: (metric: string) => void;
  onClearChartSeries: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navIsActive = tabs.some((t) => t.key === activeTab);
  const indicatorDot = navIsActive || chartSeries.size > 0;
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((s) => !s)}
        title="Compare metrics in chart, or open a hidden view"
        aria-label="Chart and views"
        aria-expanded={open}
        className={`flex items-center whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
          navIsActive
            ? "border-gray-900 text-gray-900"
            : "border-transparent text-gray-400 hover:text-gray-600"
        }`}
      >
        <span aria-hidden className="text-base leading-none">⋯</span>
        {indicatorDot && (
          <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-gray-900" aria-hidden />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-72 rounded-md border border-gray-200 bg-white py-2 shadow-lg">
          {/* ── Chart series picker (top) ──────────────────────────── */}
          <div className="flex items-center justify-between px-3 pb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Compare in chart
            </span>
            {chartSeries.size > 0 && (
              <button
                onClick={onClearChartSeries}
                className="text-[11px] font-medium text-gray-500 hover:text-gray-900"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-0.5 px-1 pb-2">
            {CHART_SERIES_OPTIONS.map((opt) => {
              const checked = chartSeries.has(opt.metric);
              const count =
                opt.countKey && tabCounts
                  ? tabCounts[opt.countKey] ?? null
                  : null;
              return (
                <label
                  key={opt.metric}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleChartSeries(opt.metric)}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: opt.color }}
                    aria-hidden
                  />
                  <span className="flex-1 text-gray-700">{opt.label}</span>
                  {typeof count === "number" && count > 0 && (
                    <span className="text-xs tabular-nums text-gray-400">{count}</span>
                  )}
                </label>
              );
            })}
          </div>

          {/* ── Open-view navigation (bottom) ──────────────────────── */}
          <div className="border-t border-gray-100 pt-1.5">
            <div className="px-3 pb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Open view
              </span>
            </div>
            <div className="space-y-0.5 px-1 pb-1">
              {tabs.map((t) => {
                const count =
                  t.key === "outbound" ||
                  t.key === "emails_sent" ||
                  t.key === "signups"
                    ? null
                    : tabCounts?.[
                        t.key as Exclude<TabKey, "outbound" | "emails_sent" | "signups">
                      ];
                const active = t.key === activeTab;
                return (
                  <button
                    key={t.key}
                    onClick={() => { onSelect(t.key); setOpen(false); }}
                    title={t.tooltip}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${
                      active
                        ? "bg-gray-50 font-medium text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{t.label}</span>
                    {typeof count === "number" && count > 0 && (
                      <span className="text-xs tabular-nums text-gray-400">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
