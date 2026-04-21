"use client";

import { useEffect, useMemo, useState } from "react";
import type { DateRangeValue } from "./DateRangePopover";
import DateRangePopover, { resolveRange } from "./DateRangePopover";

type Bucket = "hour" | "day" | "week" | "month";

interface Stats {
  total: number;
  delta: number | null;
  series: { date: string; count: number }[];
  bucket: Bucket;
}

/**
 * PulseHeader — page-level hero for admin list views.
 * Title row + big KPI + delta + full-width interactive chart.
 *
 * Chart follows the page's date filter; parent owns the range state.
 */
export default function PulseHeader({
  title,
  kpiSuffix,
  statsPath,
  range,
  onRangeChange,
  maxY,
}: {
  title: string;
  kpiSuffix: string;
  statsPath: string;
  range: DateRangeValue;
  onRangeChange: (next: DateRangeValue) => void;
  /** Fixed Y-axis ceiling. Omit for auto-scale (derived from data's max). */
  maxY?: number;
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
        if (!cancelled) setStats(data);
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
      <div className="flex items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
        <DateRangePopover value={range} onChange={onRangeChange} />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white px-6 pt-6 pb-5">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[44px] font-semibold text-gray-900 tracking-tight tabular-nums leading-none">
            {stats ? stats.total.toLocaleString() : "—"}
          </span>
          <span className="text-sm text-gray-500">{kpiSuffix}</span>
        </div>
        <DeltaLine stats={stats} range={range} />

        <div className="mt-6">
          <Chart series={stats?.series ?? []} bucket={stats?.bucket ?? "day"} loading={loading} maxY={maxY} />
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
  const label = sign === "flat" ? "flat" : `${sign} ${Math.abs(stats.delta)}%`;

  return (
    <p className="mt-2 text-xs text-gray-500">
      <span className={`font-medium ${color}`}>{label}</span>
      <span className="text-gray-300 mx-1.5">·</span>
      <span>vs. prior {priorLabel(range)}</span>
    </p>
  );
}

function priorLabel(range: DateRangeValue): string {
  if (range.preset === "today" || range.preset === "yesterday") return "day";
  if (range.preset === "7d") return "7 days";
  if (range.preset === "30d") return "30 days";
  if (range.preset === "90d") return "90 days";
  if (range.preset === "1y") return "year";
  return "period";
}

const CHART_HEIGHT = 180;
const CHART_PAD_TOP = 30;
const CHART_PAD_BOTTOM = 8;

function Chart({
  series,
  bucket,
  loading,
  maxY,
}: {
  series: { date: string; count: number }[];
  bucket: Bucket;
  loading: boolean;
  maxY?: number;
}) {
  // Stateful callback ref: the effect re-runs when the div actually mounts,
  // which matters because loading/empty states return without the ref div.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!container) return;
    // Synchronous measurement avoids a 0→actual flash on first render.
    setWidth(container.offsetWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(Math.round(w));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [container]);

  const chart = useMemo(
    () => buildPath(series, width || 800, CHART_HEIGHT, CHART_PAD_TOP, CHART_PAD_BOTTOM, maxY),
    [series, width, maxY],
  );

  const hasData = series.length > 0 && chart.realMax > 0;
  const showSkeleton = loading && series.length === 0;
  const showChart = hasData && width > 0;

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!container || !hasData) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, relX / rect.width));
    const idx = Math.round(frac * (series.length - 1));
    setHoverIndex(idx);
  };

  const hover = hoverIndex !== null && hasData ? chart.points[hoverIndex] : null;

  const TOOLTIP_W = 108;
  const tooltipLeft = hover
    ? Math.max(4, Math.min(width - TOOLTIP_W - 4, hover.x - TOOLTIP_W / 2))
    : 0;
  const tooltipAbove = hover ? hover.y > 50 : true;

  const firstLabel = hasData ? formatBucketDate(series[0].date, bucket) : "";
  const lastLabel = hasData ? formatBucketDate(series[series.length - 1].date, bucket) : "";
  const showLabels = hasData && series.length > 1;

  return (
    <div>
      <div
        ref={setContainer}
        className={`relative w-full ${hasData ? "cursor-crosshair" : ""}`}
        style={{ height: CHART_HEIGHT }}
        onMouseMove={hasData ? handleMove : undefined}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {showSkeleton && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse" />
        )}

        {!showSkeleton && !hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-300">
            No activity in this range
          </div>
        )}

        {showChart && (
          <>
            <svg
              width={width}
              height={CHART_HEIGHT}
              className="absolute inset-0 block"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="pulse-fill-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Max-value gridline — anchors the top of the chart so peaks don't read as clipped */}
              <line
                x1={0}
                x2={width}
                y1={CHART_PAD_TOP}
                y2={CHART_PAD_TOP}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <path d={chart.areaPath} fill="url(#pulse-fill-gradient)" />
              <path
                d={chart.linePath}
                fill="none"
                stroke="#047857"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {chart.points.length > 0 && !hover && (
                <circle
                  cx={chart.points[chart.points.length - 1].x}
                  cy={chart.points[chart.points.length - 1].y}
                  r={3}
                  fill="#047857"
                />
              )}
              {hover && (
                <>
                  <line
                    x1={hover.x}
                    x2={hover.x}
                    y1={0}
                    y2={CHART_HEIGHT}
                    stroke="#111827"
                    strokeOpacity={0.08}
                    strokeWidth={1}
                  />
                  <circle cx={hover.x} cy={hover.y} r={4.5} fill="#ffffff" />
                  <circle
                    cx={hover.x}
                    cy={hover.y}
                    r={4.5}
                    fill="none"
                    stroke="#047857"
                    strokeWidth={2}
                  />
                </>
              )}
            </svg>
            {/* Y-axis max label — floating reference for the top of the data */}
            <div
              className="absolute left-0 text-[11px] font-medium text-gray-500 tabular-nums pointer-events-none"
              style={{ top: Math.max(0, CHART_PAD_TOP - 18) }}
            >
              {chart.max.toLocaleString()}
            </div>
          </>
        )}

        {showChart && hover && hoverIndex !== null && (
          <div
            className="absolute pointer-events-none z-10 bg-gray-900 text-white rounded-lg px-2.5 py-1.5 shadow-lg"
            style={{
              left: tooltipLeft,
              top: tooltipAbove ? Math.max(4, hover.y - 48) : Math.min(CHART_HEIGHT - 48, hover.y + 12),
              width: TOOLTIP_W,
            }}
          >
            <div className="text-sm font-semibold tabular-nums leading-tight">
              {series[hoverIndex].count.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-300 leading-tight mt-0.5">
              {formatBucketDate(series[hoverIndex].date, bucket)}
            </div>
          </div>
        )}
      </div>

      {showLabels && (
        <div className="flex justify-between mt-2 text-[11px] text-gray-400 tabular-nums">
          <span>{firstLabel}</span>
          <span>{lastLabel}</span>
        </div>
      )}
    </div>
  );
}

function formatBucketDate(iso: string, bucket: Bucket): string {
  const d = new Date(iso);
  // Server buckets on UTC day boundaries; format labels in UTC so they
  // line up with the bucketing rather than drifting by a timezone offset.
  if (bucket === "hour") {
    return d.toLocaleString("en-US", { hour: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  }
  if (bucket === "month") {
    return d.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  }
  return d.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * Build a monotone cubic Bezier path (Fritsch–Carlson) from the series.
 * Keeps curves smooth without overshooting between points.
 *
 * `maxY` overrides the scale ceiling when provided (fixed Y-axis). Without
 * it, the chart auto-scales to the data's max.
 */
function buildPath(
  series: { date: string; count: number }[],
  width: number,
  height: number,
  padTop: number,
  padBottom: number,
  maxY?: number,
) {
  if (series.length === 0) {
    return {
      linePath: "",
      areaPath: "",
      points: [] as { x: number; y: number }[],
      max: 0,
      realMax: 0,
    };
  }

  // realMax drives the empty-state check; scaleMax fixes the visual ceiling
  // (maxY if provided, otherwise the data's own max).
  const realMax = series.reduce((m, p) => Math.max(m, p.count), 0);
  const scaleMax = Math.max(1, maxY ?? realMax);
  const displayMax = maxY ?? realMax;
  const n = series.length;
  const innerH = height - padTop - padBottom;

  const points = series.map((p, i) => {
    const x = n === 1 ? width / 2 : (i / (n - 1)) * width;
    // Clamp so points that exceed maxY sit on the ceiling instead of
    // rendering above the SVG viewport.
    const ratio = Math.min(1, p.count / scaleMax);
    const y = padTop + innerH - ratio * innerH;
    return { x, y };
  });

  if (points.length === 1) {
    const p = points[0];
    return {
      linePath: `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
      areaPath: "",
      points,
      max: displayMax,
      realMax,
    };
  }

  // Fritsch–Carlson monotone cubic interpolation
  const dx: number[] = [];
  const dy: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    dy.push(points[i + 1].y - points[i].y);
  }
  const slope: number[] = [];
  slope[0] = dy[0] / dx[0];
  for (let i = 1; i < n - 1; i++) {
    if (dy[i - 1] * dy[i] <= 0) {
      slope[i] = 0;
    } else {
      const common = dx[i - 1] + dx[i];
      slope[i] =
        (3 * common) /
        ((common + dx[i]) / dy[i - 1] + (common + dx[i - 1]) / dy[i]);
    }
  }
  slope[n - 1] = dy[n - 2] / dx[n - 2];

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const x1 = points[i].x + dx[i] / 3;
    const y1 = points[i].y + (slope[i] * dx[i]) / 3;
    const x2 = points[i + 1].x - dx[i] / 3;
    const y2 = points[i + 1].y - (slope[i + 1] * dx[i]) / 3;
    d += ` C ${x1.toFixed(2)} ${y1.toFixed(2)}, ${x2.toFixed(2)} ${y2.toFixed(2)}, ${points[i + 1].x.toFixed(2)} ${points[i + 1].y.toFixed(2)}`;
  }

  const areaPath = `${d} L ${points[n - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`;

  return { linePath: d, areaPath, points, max: displayMax, realMax };
}
