"use client";

import { useEffect, useMemo, useState } from "react";
import type { DateRangeValue } from "./DateRangePopover";
import DateRangePopover, { resolveRange } from "./DateRangePopover";

type Bucket = "hour" | "day" | "week" | "month";

interface SeriesGroup {
  name: string;
  color: string;
  series: { date: string; count: number }[];
}

interface Stats {
  total: number;
  delta: number | null;
  series: { date: string; count: number }[];
  bucket: Bucket;
  /** v8.10.41: multi-series breakdown for funnel views. When present,
   *  the chart renders one colored line per group (with a small legend
   *  below) instead of the single-area default. The single `series`
   *  field is ignored when `breakdown` is set. */
  breakdown?: SeriesGroup[];
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
  actions,
  deltaDirection = "up-good",
}: {
  title: string;
  kpiSuffix: string;
  statsPath: string;
  range: DateRangeValue;
  onRangeChange: (next: DateRangeValue) => void;
  /** Optional inline actions rendered between the title and the date
   *  picker. Used for page-level CTAs like "Add Stakeholder" or
   *  "Open Gmail" without adding a competing top-right block. */
  actions?: React.ReactNode;
  /** Delta valence. Backlog-style metrics (e.g. "needing email") pass
   *  "up-bad" so an increase renders in the alarm color and a decrease
   *  in green, instead of the default growth-metric coloring. */
  deltaDirection?: "up-good" | "up-bad";
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
    // v8.10.46: statsPath may already include a `?metric=…&campus=…`
    // query string (per-tab metric was introduced in v8.10.38). Append
    // the date params with `&` in that case — naively concatenating
    // `?` produced a malformed URL where the second `?` got swallowed
    // into the previous param's value, the server returned 400, and
    // every per-tab chart silently rendered empty. URL.searchParams
    // would be cleaner long-term, but it requires absolute URLs which
    // varies across server/client contexts; this delimiter check is
    // the smallest safe fix.
    const sep = statsPath.includes("?") ? "&" : "?";
    const url = params.toString().length > 0 ? `${statsPath}${sep}${params}` : statsPath;
    fetch(url)
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
      {/* v8.10.10: title row only carries page-level controls (title +
          optional actions like Add Stakeholder). The date picker moved
          into the stats card below — it controls the data shown there,
          so it belongs with the data, not with the page actions. */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
        {actions && (
          <div className="flex shrink-0 items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[44px] font-semibold text-gray-900 tracking-tight tabular-nums leading-none">
                {stats ? stats.total.toLocaleString() : "—"}
              </span>
              <span className="text-sm text-gray-500">{kpiSuffix}</span>
            </div>
            <DeltaLine stats={stats} range={range} deltaDirection={deltaDirection} />
          </div>
          <div className="shrink-0">
            <DateRangePopover value={range} onChange={onRangeChange} />
          </div>
        </div>

        <div className="mt-6">
          {stats?.breakdown && stats.breakdown.length > 0 ? (
            <MultiChart
              groups={stats.breakdown}
              bucket={stats.bucket}
              loading={loading}
            />
          ) : (
            <Chart series={stats?.series ?? []} bucket={stats?.bucket ?? "day"} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}

function DeltaLine({
  stats,
  range,
  deltaDirection,
}: {
  stats: Stats | null;
  range: DateRangeValue;
  deltaDirection: "up-good" | "up-bad";
}) {
  if (!stats) return <p className="mt-2 text-xs text-gray-400">&nbsp;</p>;
  if (range.preset === "all") {
    return <p className="mt-2 text-xs text-gray-400">All time</p>;
  }
  if (stats.delta === null) {
    return <p className="mt-2 text-xs text-gray-400">&nbsp;</p>;
  }

  // A huge percentage means the prior-period base was near zero — the
  // number is meaningless noise ("up 9329%"), so render a neutral line.
  if (Math.abs(stats.delta) > 500) {
    return <p className="mt-2 text-xs text-gray-400">vs. quiet prior period</p>;
  }

  const sign = stats.delta > 0 ? "up" : stats.delta < 0 ? "down" : "flat";
  const goodSign = deltaDirection === "up-bad" ? "down" : "up";
  const color =
    sign === "flat"
      ? "text-gray-400"
      : sign === goodSign
        ? "text-emerald-600"
        : "text-rose-600";
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
}: {
  series: { date: string; count: number }[];
  bucket: Bucket;
  loading: boolean;
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
    () => buildPath(series, width || 800, CHART_HEIGHT, CHART_PAD_TOP, CHART_PAD_BOTTOM),
    [series, width],
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
                strokeWidth={2}
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
                    style={{ transition: "x1 90ms ease-out, x2 90ms ease-out" }}
                  />
                  <circle
                    cx={hover.x}
                    cy={hover.y}
                    r={4.5}
                    fill="#ffffff"
                    style={{ transition: "cx 90ms ease-out, cy 90ms ease-out" }}
                  />
                  <circle
                    cx={hover.x}
                    cy={hover.y}
                    r={4.5}
                    fill="none"
                    stroke="#047857"
                    strokeWidth={2}
                    style={{ transition: "cx 90ms ease-out, cy 90ms ease-out" }}
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
              transition: "left 90ms ease-out, top 90ms ease-out",
            }}
          >
            <div className="text-sm font-semibold tabular-nums leading-tight">
              {series[hoverIndex].count.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-300 leading-tight mt-0.5">
              {formatBucketDate(series[hoverIndex].date, bucket, true)}
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

/**
 * Format a bucket's date label for display.
 *
 * Server buckets on UTC boundaries; labels are formatted in UTC so they line
 * up with the bucketing rather than drifting by a timezone offset.
 *
 * When `verbose` is true (tooltip context), week/month labels are expanded so
 * the reader knows they're looking at aggregated totals, not a single day:
 *   week  → "Apr 12 – Apr 18"
 *   month → "April 2026"
 * In non-verbose context (axis corner labels), everything stays short to keep
 * the chart edges clean.
 */
function formatBucketDate(iso: string, bucket: Bucket, verbose = false): string {
  const d = new Date(iso);
  if (bucket === "hour") {
    return d.toLocaleString("en-US", { hour: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  }
  if (bucket === "month") {
    return d.toLocaleString("en-US", {
      month: verbose ? "long" : "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  if (bucket === "week" && verbose) {
    const end = new Date(d);
    end.setUTCDate(end.getUTCDate() + 6);
    const startLabel = d.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    const endLabel = end.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    return `${startLabel} – ${endLabel}`;
  }
  return d.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * v8.10.41: multi-line chart for the All-tab funnel view. Renders one
 * colored line per series group on a shared X axis + Y axis (with the
 * Y max scaled to the global peak across groups). Legend shows the
 * group name + last-bucket count. Hover reveals all values at the
 * crosshair so admin can read the funnel shape (signups → prospects
 * → replies → meetings → partners) at any point in time.
 */
function MultiChart({
  groups,
  bucket,
  loading,
}: {
  groups: SeriesGroup[];
  bucket: Bucket;
  loading: boolean;
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!container) return;
    setWidth(container.offsetWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(Math.round(w));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [container]);

  // Use the first group's series as the bucket grid; all groups share it.
  const bucketDates = groups[0]?.series.map((s) => s.date) ?? [];
  const realMax = groups.reduce(
    (m, g) => g.series.reduce((mm, s) => Math.max(mm, s.count), m),
    0,
  );
  const scaleMax = Math.max(1, niceCeiling(realMax));
  const innerH = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const n = bucketDates.length;

  const groupPaths = useMemo(() => {
    if (n === 0 || !width) return [] as Array<{ name: string; color: string; linePath: string; points: { x: number; y: number }[] }>;
    return groups.map((g) => {
      const points = g.series.map((p, i) => {
        const x = n === 1 ? width / 2 : (i / (n - 1)) * width;
        const ratio = Math.min(1, p.count / scaleMax);
        const y = CHART_PAD_TOP + innerH - ratio * innerH;
        return { x, y };
      });
      let d = "";
      if (points.length > 0) {
        d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
        for (let i = 1; i < points.length; i++) {
          d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
        }
      }
      return { name: g.name, color: g.color, linePath: d, points };
    });
  }, [groups, n, width, scaleMax, innerH]);

  const hasData = n > 0 && realMax > 0;
  const showSkeleton = loading && n === 0;
  const showChart = hasData && width > 0;

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!container || !hasData) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, relX / rect.width));
    const idx = Math.round(frac * (n - 1));
    setHoverIndex(idx);
  };

  const TOOLTIP_W = 168;
  const hoverX = hoverIndex !== null && groupPaths[0]?.points[hoverIndex]?.x;
  const tooltipLeft =
    typeof hoverX === "number"
      ? Math.max(4, Math.min(width - TOOLTIP_W - 4, hoverX - TOOLTIP_W / 2))
      : 0;

  const firstLabel = hasData ? formatBucketDate(bucketDates[0], bucket) : "";
  const lastLabel = hasData ? formatBucketDate(bucketDates[n - 1], bucket) : "";
  const showLabels = hasData && n > 1;

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
            <svg width={width} height={CHART_HEIGHT} className="absolute inset-0 block" aria-hidden="true">
              <line
                x1={0}
                x2={width}
                y1={CHART_PAD_TOP}
                y2={CHART_PAD_TOP}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {groupPaths.map((g) => (
                <path
                  key={g.name}
                  d={g.linePath}
                  fill="none"
                  stroke={g.color}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {hoverIndex !== null && typeof hoverX === "number" && (
                <line
                  x1={hoverX}
                  x2={hoverX}
                  y1={0}
                  y2={CHART_HEIGHT}
                  stroke="#111827"
                  strokeOpacity={0.08}
                  strokeWidth={1}
                />
              )}
              {hoverIndex !== null &&
                groupPaths.map((g) =>
                  g.points[hoverIndex] ? (
                    <circle
                      key={`${g.name}-dot`}
                      cx={g.points[hoverIndex].x}
                      cy={g.points[hoverIndex].y}
                      r={3.5}
                      fill="#ffffff"
                      stroke={g.color}
                      strokeWidth={2}
                    />
                  ) : null,
                )}
            </svg>
            <div
              className="absolute left-0 text-[11px] font-medium text-gray-500 tabular-nums pointer-events-none"
              style={{ top: Math.max(0, CHART_PAD_TOP - 18) }}
            >
              {scaleMax.toLocaleString()}
            </div>
          </>
        )}
        {showChart && hoverIndex !== null && (
          <div
            className="absolute pointer-events-none z-10 bg-gray-900 text-white rounded-lg px-2.5 py-1.5 shadow-lg"
            style={{
              left: tooltipLeft,
              top: 4,
              width: TOOLTIP_W,
            }}
          >
            <div className="text-[10px] font-medium text-gray-300 leading-tight mb-1">
              {formatBucketDate(bucketDates[hoverIndex], bucket, true)}
            </div>
            {groups.map((g) => (
              <div key={g.name} className="flex items-center justify-between gap-2 text-[11px] leading-tight">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  {g.name}
                </span>
                <span className="font-semibold tabular-nums">
                  {(g.series[hoverIndex]?.count ?? 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLabels && (
        <div className="flex justify-between mt-2 text-[11px] text-gray-400 tabular-nums">
          <span>{firstLabel}</span>
          <span>{lastLabel}</span>
        </div>
      )}

      {hasData && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-500">
          {groups.map((g) => {
            const total = g.series.reduce((s, p) => s + p.count, 0);
            return (
              <span key={g.name} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: g.color }}
                />
                <span className="font-medium text-gray-700">{g.name}</span>
                <span className="tabular-nums text-gray-400">
                  {total.toLocaleString()}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Round a value up to the next "nice" number (1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10
 * × power of 10). Combined with a 1.75x target, peaks land in the 40–55%
 * zone — visible headroom regardless of magnitude, clean axis label, scales
 * indefinitely without magic numbers.
 *
 *   9    → 20     (peak 45%)
 *   51   → 100    (peak 51%)
 *   120  → 250    (peak 48%)
 *   650  → 1500   (peak 43%)
 *   999  → 2000   (peak 50%)
 */
function niceCeiling(value: number): number {
  if (value <= 0) return 10;
  const target = value * 1.75;
  const exp = Math.floor(Math.log10(target));
  const pow = Math.pow(10, exp);
  const normalized = target / pow;
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const nice = steps.find((s) => s >= normalized) ?? 10;
  return Math.round(nice * pow);
}

/**
 * Build a straight polyline from the series.
 *
 * Previously used monotone cubic smoothing. Switched to linear because smooth
 * curves on discrete daily buckets create "upward inflections" — the
 * S-shape rise between two buckets visually implies data values that don't
 * exist in the source. Linear interpolation is the most honest read of
 * discrete time-series, and aligns with Linear / Stripe / Datadog analytics.
 *
 * Y-axis ceiling auto-adjusts to a nice round number above the data max so
 * peaks always have visible headroom and never look clipped.
 */
function buildPath(
  series: { date: string; count: number }[],
  width: number,
  height: number,
  padTop: number,
  padBottom: number,
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

  const realMax = series.reduce((m, p) => Math.max(m, p.count), 0);
  const scaleMax = Math.max(1, niceCeiling(realMax));
  const n = series.length;
  const innerH = height - padTop - padBottom;

  const points = series.map((p, i) => {
    const x = n === 1 ? width / 2 : (i / (n - 1)) * width;
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
      max: scaleMax,
      realMax,
    };
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < n; i++) {
    d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  }

  const areaPath = `${d} L ${points[n - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`;

  return { linePath: d, areaPath, points, max: scaleMax, realMax };
}
