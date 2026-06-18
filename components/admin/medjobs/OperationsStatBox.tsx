"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { resolveRange, type DateRangeValue } from "@/components/admin/DateRangePopover";

interface Stats {
  total: number;
  delta: number | null;
  series: { date: string; count: number }[];
  bucket: string;
}

/**
 * Compact dashboard tile for the Operations board: headline number + delta +
 * sparkline + "View all →". A controlled date range (owned by the board)
 * drives the sparkline/delta. Two modes:
 *   - metric set    → fetch /stats for the sparkline + delta. Headline is
 *     `value` (current roster/pipeline total) when provided, else stats.total.
 *   - metric unset  → count-only tile (no history), e.g. provider prospects.
 */
export function OperationsStatBox({
  title,
  href,
  range,
  metric,
  value,
  unit,
  chips,
}: {
  title: string;
  href: string;
  range: DateRangeValue;
  /** Stats metric for the sparkline + delta. Omit for a count-only tile. */
  metric?: string;
  /** Current total to show as the headline. When omitted (and metric set),
   *  the stats range total is shown instead. */
  value?: number | null;
  /** Suffix under the number (e.g. "in catchment", "in range"). */
  unit?: string;
  chips?: React.ReactNode;
}) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!metric) return;
    let cancelled = false;
    const { from, to } = resolveRange(range);
    const params = new URLSearchParams();
    params.set("metric", metric);
    if (from) params.set("date_from", from);
    if (to) params.set("date_to", to);
    fetch(`/api/admin/student-outreach/stats?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setStats(d);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [metric, range]);

  // Headline: tiles that own a current count pass `value` (number while
  // loaded, null while loading → show "—"). Activity tiles omit `value`
  // entirely (undefined) and show the stats range total instead.
  const headline =
    value !== undefined ? value : metric ? stats?.total ?? null : null;

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white px-5 py-4 transition-colors hover:border-gray-200 hover:bg-gray-50/50"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </span>
        <span className="text-xs text-primary-700 opacity-0 transition-opacity group-hover:opacity-100">
          View all →
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums leading-none text-gray-900">
          {headline != null ? headline.toLocaleString() : "—"}
        </span>
        {metric ? <Delta stats={stats} range={range} /> : null}
      </div>
      {unit ? <span className="mt-1 text-xs text-gray-400">{unit}</span> : null}

      {metric ? (
        <div className="mt-3">
          <Sparkline series={stats?.series ?? []} />
        </div>
      ) : null}

      {chips ? <div className="mt-3">{chips}</div> : null}
    </Link>
  );
}

function Delta({ stats, range }: { stats: Stats | null; range: DateRangeValue }) {
  if (!stats || stats.delta == null || range.preset === "all") return null;
  const sign = stats.delta > 0 ? "▲" : stats.delta < 0 ? "▼" : "";
  const color =
    stats.delta > 0 ? "text-emerald-600" : stats.delta < 0 ? "text-rose-600" : "text-gray-400";
  return (
    <span className={`text-xs font-medium tabular-nums ${color}`}>
      {sign} {Math.abs(stats.delta)}%
    </span>
  );
}

const SPARK_W = 220;
const SPARK_H = 36;

function Sparkline({ series }: { series: { date: string; count: number }[] }) {
  const path = useMemo(() => {
    if (series.length === 0) return null;
    const max = Math.max(1, ...series.map((s) => s.count));
    const n = series.length;
    const pts = series.map((s, i) => {
      const x = n === 1 ? SPARK_W / 2 : (i / (n - 1)) * SPARK_W;
      const y = SPARK_H - 2 - (s.count / max) * (SPARK_H - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${pts.join(" L ")}`;
  }, [series]);

  if (!path) {
    return <div className="h-9 rounded bg-gray-50" aria-hidden />;
  }
  return (
    <svg width="100%" height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none" aria-hidden>
      <path d={path} fill="none" stroke="#047857" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
