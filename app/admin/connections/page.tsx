"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DateRangePopover, {
  resolveRange,
  rangeLabel,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";
import ConnectionRow, { type ConnectionRowData } from "@/components/admin/ConnectionRow";
import type { ConnectionTemperatureState } from "@/lib/connection-temperature";

interface Pulse {
  total: number;
  delta: number | null;
  series: { date: string; count: number }[];
  bucket: string;
}

type Engagement = { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean };

interface ListResponse {
  connections: (ConnectionRowData & { provider: { activityKey: string | null } })[];
  total: number;
  counts: Record<ConnectionTemperatureState, number>;
  engagement: Record<string, Engagement>;
  truncated: boolean;
}

type Filter = "queue" | "live" | "closed";

/** A minimal, dependency-free sparkline for the hero. Decorative — cosmetic
 *  glitches are harmless if the data shape ever shifts. */
function Sparkline({ series }: { series: { date: string; count: number }[] }) {
  if (!series || series.length < 2) return null;
  const counts = series.map((s) => s.count);
  const max = Math.max(1, ...counts);
  const W = 120;
  const H = 28;
  const step = W / (series.length - 1);
  const pts = counts
    .map((c, i) => `${(i * step).toFixed(1)},${(H - (c / max) * H).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="text-emerald-400" aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ConnectionsTrackerPage() {
  const [range, setRange] = useState<DateRangeValue>({
    preset: "30d",
    customFrom: "",
    customTo: "",
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("queue");

  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [list, setList] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const buildDateParams = useCallback(() => {
    const { from, to } = resolveRange(range);
    const params = new URLSearchParams();
    if (from) params.set("date_from", from);
    if (to) params.set("date_to", to);
    return params;
  }, [range]);

  // Hero KPI (own fetch — independent of the queue filter).
  useEffect(() => {
    let cancelled = false;
    const params = buildDateParams();
    fetch(`/api/admin/connections/pulse?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => !cancelled && setPulse(data))
      .catch(() => !cancelled && setPulse(null));
    return () => {
      cancelled = true;
    };
  }, [buildDateParams]);

  // Queue list.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = buildDateParams();
    if (search.trim()) params.set("search", search.trim());
    if (filter === "live") params.set("state", "live");
    else if (filter === "closed") params.set("state", "closed");
    // "queue" => no state param: API returns all non-closed, prioritized.

    fetch(`/api/admin/connections?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((data: ListResponse) => {
        if (!cancelled) setList(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setList(null);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [buildDateParams, search, filter]);

  const counts = list?.counts;
  const needsYouCount = counts
    ? counts.going_cold + counts.awaiting_provider + counts.awaiting_family
    : 0;

  const deltaEl = useMemo(() => {
    if (!pulse || pulse.delta === null || range.preset === "all") return null;
    const up = pulse.delta > 0;
    const flat = pulse.delta === 0;
    const color = up ? "text-emerald-600" : flat ? "text-gray-400" : "text-rose-600";
    const label = flat ? "flat" : `${up ? "↑" : "↓"} ${Math.abs(pulse.delta)}%`;
    return (
      <span className={`text-sm font-medium ${color}`}>
        {label}
        <span className="ml-1.5 font-normal text-gray-400">vs. prior {rangeLabel(range)}</span>
      </span>
    );
  }, [pulse, range]);

  const tabs: { key: Filter; label: string; count: number | undefined }[] = [
    { key: "queue", label: "Needs you", count: counts ? needsYouCount : undefined },
    { key: "live", label: "Live & healthy", count: counts?.live },
    { key: "closed", label: "Closed", count: counts?.closed },
  ];

  return (
    <div className="mx-auto max-w-3xl px-1 py-2">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Connections</h1>
        <DateRangePopover value={range} onChange={setRange} />
      </div>

      {/* Hero KPI — successful connections (provider replied or accepted) */}
      <div className="mb-8 rounded-2xl border border-stone-200/70 bg-stone-50/40 px-6 py-6">
        <p className="text-sm text-gray-500">Successful connections</p>
        <div className="mt-1 flex items-end justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[52px] leading-none text-gray-900 tabular-nums">
              {pulse ? pulse.total.toLocaleString() : "—"}
            </span>
            {deltaEl}
          </div>
          <Sparkline series={pulse?.series ?? []} />
        </div>
        <p className="mt-3 text-xs text-gray-400">
          A family and provider actually connected — the provider replied, or the connection was
          accepted.
        </p>
      </div>

      {/* Section tabs */}
      <div className="mb-3 flex items-center gap-1 border-b border-gray-100">
        {tabs.map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={[
                "relative -mb-px px-3 py-2 text-sm transition-colors",
                active
                  ? "font-medium text-gray-900"
                  : "text-gray-500 hover:text-gray-800",
              ].join(" ")}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1.5 text-xs text-gray-400 tabular-nums">{t.count}</span>
              )}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gray-900" />
              )}
            </button>
          );
        })}

        <div className="ml-auto py-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search family or provider…"
            className="w-52 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
          />
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-gray-100 bg-white">
        {loading ? (
          <div className="px-4 py-16 text-center text-sm text-gray-400">Loading…</div>
        ) : error ? (
          <div className="px-4 py-16 text-center text-sm text-rose-600">
            Couldn’t load connections. Try again.
          </div>
        ) : !list || list.connections.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-gray-400">
            {filter === "queue"
              ? "Nothing needs you right now."
              : filter === "live"
                ? "No live conversations in this range."
                : "No closed connections in this range."}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {list.connections.map((c) => (
              <ConnectionRow
                key={c.id}
                c={c}
                engagement={
                  c.provider.activityKey ? list.engagement[c.provider.activityKey] : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {list?.truncated && (
        <p className="mt-2 text-xs text-amber-600">
          Showing a capped slice — narrow the date range for complete counts.
        </p>
      )}
    </div>
  );
}
