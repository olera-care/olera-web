"use client";

import { useEffect, useMemo, useState } from "react";
import type { DateRangeValue } from "./DateRangePopover";
import DateRangePopover, { resolveRange } from "./DateRangePopover";

interface Stats {
  total: number;
  delta: number | null;
  series: { date: string; count: number }[];
  bucket: "hour" | "day" | "week" | "month";
}

/**
 * PulseHeader — page-level hero for admin list views.
 * Title + big KPI + sparkline + delta + date-range popover.
 *
 * Fetches from `statsPath` whenever the range changes. Parent owns the range
 * state so the list below can stay in sync.
 */
export default function PulseHeader({
  title,
  kpiSuffix,
  statsPath,
  range,
  onRangeChange,
}: {
  title: string;
  kpiSuffix: string;
  statsPath: string;
  range: DateRangeValue;
  onRangeChange: (next: DateRangeValue) => void;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const { from, to } = resolveRange(range);
    const params = new URLSearchParams();
    if (from) params.set("date_from", from);
    if (to) params.set("date_to", to);
    fetch(`${statsPath}?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statsPath, range]);

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
        <DateRangePopover value={range} onChange={onRangeChange} />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2.5">
              <span className="text-[40px] font-semibold text-gray-900 tracking-tight tabular-nums leading-none">
                {stats ? stats.total.toLocaleString() : "—"}
              </span>
              <span className="text-sm text-gray-500">{kpiSuffix}</span>
            </div>
            <DeltaLine stats={stats} range={range} />
          </div>

          <div className="flex-1 max-w-[60%] min-w-0">
            <Sparkline series={stats?.series ?? []} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeltaLine({ stats, range }: { stats: Stats | null; range: DateRangeValue }) {
  if (!stats) return <p className="mt-2 text-xs text-gray-400">&nbsp;</p>;
  if (range.preset === "all") {
    return <p className="mt-2 text-xs text-gray-400">All time</p>;
  }
  if (stats.delta === null) {
    return <p className="mt-2 text-xs text-gray-400">&nbsp;</p>;
  }

  const sign = stats.delta > 0 ? "up" : stats.delta < 0 ? "down" : "flat";
  const color =
    sign === "up" ? "text-emerald-600" : sign === "down" ? "text-rose-600" : "text-gray-400";
  const label =
    sign === "flat" ? "flat" : `${sign} ${Math.abs(stats.delta)}%`;

  return (
    <p className="mt-2 text-xs text-gray-500">
      <span className={`font-medium ${color}`}>{label}</span>
      <span className="text-gray-300 mx-1.5">·</span>
      <span>vs. prior {priorLabel(range)}</span>
    </p>
  );
}

function priorLabel(range: DateRangeValue): string {
  if (range.preset === "today") return "day";
  if (range.preset === "yesterday") return "day";
  if (range.preset === "7d") return "7 days";
  if (range.preset === "30d") return "30 days";
  if (range.preset === "90d") return "90 days";
  if (range.preset === "1y") return "year";
  if (range.preset === "custom") return "period";
  return "period";
}

function Sparkline({
  series,
  loading,
}: {
  series: { date: string; count: number }[];
  loading: boolean;
}) {
  const { path, area, points, max } = useMemo(() => buildChart(series), [series]);

  if (loading && series.length === 0) {
    return (
      <div className="h-12 w-full rounded-lg bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse" />
    );
  }

  if (series.length === 0 || max === 0) {
    return (
      <div className="h-12 w-full flex items-center justify-end text-[11px] text-gray-300">
        No activity in this range
      </div>
    );
  }

  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-12 overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="pulse-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#111827" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#111827" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#pulse-fill)" />
      <path d={path} fill="none" stroke="#111827" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {points.length > 0 && (
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={1.6} fill="#111827" />
      )}
    </svg>
  );
}

function buildChart(series: { date: string; count: number }[]) {
  if (series.length === 0) return { path: "", area: "", points: [], max: 0 };
  const max = Math.max(1, ...series.map((p) => p.count));
  const n = series.length;

  const pts = series.map((p, i) => {
    const x = n === 1 ? 50 : (i / (n - 1)) * 100;
    // leave 2px headroom top + bottom within the 24 viewbox
    const y = 22 - (p.count / max) * 20;
    return { x, y };
  });

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const area = `${path} L 100 24 L 0 24 Z`;
  return { path, area, points: pts, max };
}
