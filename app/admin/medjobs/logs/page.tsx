"use client";

/**
 * v9.0 Phase 7 Commit E: Logs page — analytics + history + charting
 * surface for MedJobs.
 *
 * The In Basket stays operational/calm/throughput-oriented (no charts);
 * Logs is the analytics layer. PulseHeader at the top (single metric
 * default, with a multi-series picker for funnel comparisons), then
 * the touchpoint feed below as the searchable history.
 *
 * Chart metric defaults to "activity" — the catch-all touchpoint count.
 * Multi-series picker (CHART_SERIES_OPTIONS) lets admin compose a
 * chart with multiple metrics on one X-axis (signups vs candidates vs
 * partners, etc.). When ≥1 series is checked, the chart switches to
 * a multi-line `metric=custom&series=…` view.
 *
 * Internal API (/api/admin/medjobs/completed-work) keeps its name —
 * UI rename is "Completed Work" → "Logs" only.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import {
  CompletedTaskCard,
  type CompletedTaskRow,
} from "@/components/admin/medjobs/cards/CompletedTaskCard";
import PulseHeader from "@/components/admin/PulseHeader";
import type { DateRangeValue } from "@/components/admin/DateRangePopover";
import { resolveRange } from "@/components/admin/DateRangePopover";
import { CHART_SERIES_OPTIONS } from "@/lib/student-outreach/tab-config";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

export default function LogsPage() {
  const [rows, setRows] = useState<CompletedTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRangeValue>({
    preset: "30d",
    customFrom: "",
    customTo: "",
  });
  const [chartSeries, setChartSeries] = useState<Set<string>>(new Set());
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from } = resolveRange(range);
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      params.set("limit", "100");
      const res = await fetch(`/api/admin/medjobs/completed-work?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void refetch();
  }, [refetch]);
  useMedJobsRefresh(refetch);

  // Chart metric: default = activity (all touchpoints). When the user
  // picks ≥1 metric in the multi-series picker, switch to the custom
  // breakdown view that the /stats endpoint serves.
  const statsPath = useMemo(() => {
    if (chartSeries.size === 0) {
      return "/api/admin/student-outreach/stats?metric=activity";
    }
    const series = Array.from(chartSeries).join(",");
    return `/api/admin/student-outreach/stats?metric=custom&series=${encodeURIComponent(series)}`;
  }, [chartSeries]);

  const kpiSuffix =
    chartSeries.size === 0
      ? "logged events"
      : chartSeries.size === 1
        ? `${labelFor(Array.from(chartSeries)[0])} events`
        : `events (${chartSeries.size} metrics)`;

  return (
    <div>
      <PulseHeader
        title="MedJobs · Logs"
        kpiSuffix={kpiSuffix}
        statsPath={statsPath}
        range={range}
        onRangeChange={setRange}
      />

      {/* Multi-series picker. Compose a custom chart by checking N
          metrics; clear to fall back to the single-metric default. */}
      <ChartSeriesPicker
        selected={chartSeries}
        onToggle={(metric) =>
          setChartSeries((prev) => {
            const next = new Set(prev);
            if (next.has(metric)) next.delete(metric);
            else next.add(metric);
            return next;
          })
        }
        onClear={() => setChartSeries(new Set())}
      />

      <p className="-mt-2 mb-4 text-sm text-gray-500">
        Every logged action across MedJobs. Click any row to open it for context.
      </p>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
          Nothing completed in this range yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <CompletedTaskCard
                row={r}
                onOpenDrawer={() => setOpenOutreachId(r.outreach_id)}
              />
            </li>
          ))}
        </ul>
      )}

      {openOutreachId && (
        <Drawer
          outreachId={openOutreachId}
          onClose={() => setOpenOutreachId(null)}
          onAction={() => {
            void refetch();
          }}
        />
      )}
    </div>
  );
}

function labelFor(metric: string): string {
  const opt = CHART_SERIES_OPTIONS.find((o) => o.metric === metric);
  return opt?.label ?? metric;
}

function ChartSeriesPicker({
  selected,
  onToggle,
  onClear,
}: {
  selected: Set<string>;
  onToggle: (metric: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Compare metrics
        </span>
        {selected.size > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] font-medium text-gray-500 hover:text-gray-900"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CHART_SERIES_OPTIONS.map((opt) => {
          const checked = selected.has(opt.metric);
          return (
            <button
              key={opt.metric}
              onClick={() => onToggle(opt.metric)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                checked
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: opt.color }}
                aria-hidden
              />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
