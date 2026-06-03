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

interface Funnel {
  leads_sent: number;
  emails_opened: number;
  emails_clicked: number;
  leads_viewed: number;
  contacts_revealed: number;
  providers_responded: number;
  open_rate: number;
  click_rate: number;
  view_rate: number;
  reveal_rate: number;
  response_rate: number;
  overall_rate: number;
}

interface ActionCounts {
  nudge_provider: number;
  nudge_family: number;
  call_no_email: number;
  hot_leads: number;
}

interface FunnelSummary {
  total_leads: number;
  emails_opened: number;
  leads_viewed: number;
  contacts_revealed: number;
  hot_leads: number;
  connected: number;
}

type Engagement = { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean };

interface ListResponse {
  connections: (ConnectionRowData & { provider: { activityKey: string | null } })[];
  total: number;
  counts: Record<ConnectionTemperatureState, number>;
  engagement: Record<string, Engagement>;
  truncated: boolean;
  action_counts?: ActionCounts;
  funnel?: FunnelSummary;
}

type Filter = "queue" | "live" | "closed";
type ActionTab = "nudge_provider" | "nudge_family" | "call_no_email" | "hot_leads" | null;

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

/** Engagement Funnel Visualization */
function EngagementFunnel({ funnel }: { funnel: Funnel | null }) {
  if (!funnel) return null;

  const stages = [
    { label: "Leads Sent", value: funnel.leads_sent, rate: null },
    { label: "Emails Opened", value: funnel.emails_opened, rate: funnel.open_rate },
    { label: "Leads Viewed", value: funnel.leads_viewed, rate: funnel.view_rate },
    { label: "Contact Revealed", value: funnel.contacts_revealed, rate: funnel.reveal_rate },
    { label: "Connected", value: funnel.providers_responded, rate: funnel.response_rate },
  ];

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Engagement Funnel
      </h2>
      <div className="flex items-stretch gap-1">
        {stages.map((stage, i) => (
          <div
            key={stage.label}
            className="flex-1 rounded-lg border border-gray-100 bg-white px-3 py-3 text-center"
          >
            <p className="text-[11px] font-medium text-gray-500">{stage.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
              {stage.value.toLocaleString()}
            </p>
            {stage.rate !== null && (
              <p className="mt-0.5 text-xs tabular-nums text-gray-400">({stage.rate}%)</p>
            )}
            {i < stages.length - 1 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200" aria-hidden>
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Action Queue Tabs */
function ActionQueueTabs({
  counts,
  selected,
  onSelect,
}: {
  counts: ActionCounts | undefined;
  selected: ActionTab;
  onSelect: (tab: ActionTab) => void;
}) {
  const tabs: { key: ActionTab; label: string; emoji: string; count: number | undefined }[] = [
    { key: "nudge_provider", label: "Nudge Provider", emoji: "📧", count: counts?.nudge_provider },
    { key: "nudge_family", label: "Nudge Family", emoji: "👨‍👩‍👧", count: counts?.nudge_family },
    { key: "call_no_email", label: "Call (No Email)", emoji: "📞", count: counts?.call_no_email },
    { key: "hot_leads", label: "Hot Leads", emoji: "🔥", count: counts?.hot_leads },
  ];

  return (
    <div className="mb-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Action Queue
      </h2>
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const isSelected = selected === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(isSelected ? null : tab.key)}
              className={[
                "flex-1 rounded-xl border px-3 py-3 text-center transition-all",
                isSelected
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
              ].join(" ")}
            >
              <span className="text-lg" aria-hidden>
                {tab.emoji}
              </span>
              <p className="mt-1 text-xs font-medium">{tab.label}</p>
              <p
                className={[
                  "mt-0.5 text-lg font-semibold tabular-nums",
                  isSelected ? "text-white" : "text-gray-900",
                ].join(" ")}
              >
                {tab.count ?? "—"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
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
  const [actionTab, setActionTab] = useState<ActionTab>(null);

  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
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

  // Funnel metrics (own fetch — independent of the queue filter).
  useEffect(() => {
    let cancelled = false;
    const params = buildDateParams();
    fetch(`/api/admin/connections/funnel?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => !cancelled && setFunnel(data))
      .catch(() => !cancelled && setFunnel(null));
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

    // Apply action tab filter if selected
    if (actionTab) {
      params.set("tab", actionTab);
    } else if (filter === "live") {
      params.set("state", "live");
    } else if (filter === "closed") {
      params.set("state", "closed");
    }
    // "queue" with no action tab => no state param: API returns all non-closed, prioritized.

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
  }, [buildDateParams, search, filter, actionTab]);

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

  // Reset action tab when changing main filter
  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
    setActionTab(null);
  };

  // Get empty state message based on current filter/tab
  const getEmptyMessage = () => {
    if (actionTab) {
      switch (actionTab) {
        case "nudge_provider":
          return "No providers to nudge right now.";
        case "nudge_family":
          return "No families to nudge right now.";
        case "call_no_email":
          return "No providers without email to call.";
        case "hot_leads":
          return "No hot leads to review.";
      }
    }
    switch (filter) {
      case "queue":
        return "Nothing needs you right now.";
      case "live":
        return "No live conversations in this range.";
      case "closed":
        return "No closed connections in this range.";
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-1 py-2">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Connections</h1>
          <p className="mt-0.5 text-sm text-gray-500">Family inquiries to providers</p>
        </div>
        <DateRangePopover value={range} onChange={setRange} />
      </div>

      {/* Engagement Funnel */}
      <EngagementFunnel funnel={funnel} />

      {/* Action Queue Tabs */}
      {filter === "queue" && (
        <ActionQueueTabs
          counts={list?.action_counts}
          selected={actionTab}
          onSelect={setActionTab}
        />
      )}

      {/* Hero KPI — successful connections (provider replied or accepted) */}
      <div className="mb-6 rounded-2xl border border-stone-200/70 bg-stone-50/40 px-6 py-5">
        <p className="text-sm text-gray-500">Successful connections</p>
        <div className="mt-1 flex items-end justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[42px] leading-none text-gray-900 tabular-nums">
              {pulse ? pulse.total.toLocaleString() : "—"}
            </span>
            {deltaEl}
          </div>
          <Sparkline series={pulse?.series ?? []} />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          A family and provider actually connected — the provider replied, or the connection was
          accepted.
        </p>
      </div>

      {/* Section tabs */}
      <div className="mb-3 flex items-center gap-1 border-b border-gray-100">
        {tabs.map((t) => {
          const active = filter === t.key && !actionTab;
          return (
            <button
              key={t.key}
              onClick={() => handleFilterChange(t.key)}
              className={[
                "relative -mb-px px-3 py-2 text-sm transition-colors",
                active ? "font-medium text-gray-900" : "text-gray-500 hover:text-gray-800",
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

      {/* Active action tab indicator */}
      {actionTab && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-gray-500">Filtering by:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-sm font-medium text-white">
            {actionTab === "nudge_provider" && "📧 Nudge Provider"}
            {actionTab === "nudge_family" && "👨‍👩‍👧 Nudge Family"}
            {actionTab === "call_no_email" && "📞 Call (No Email)"}
            {actionTab === "hot_leads" && "🔥 Hot Leads"}
            <button
              onClick={() => setActionTab(null)}
              className="ml-1 hover:text-gray-300"
              aria-label="Clear filter"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* List */}
      <div className="rounded-xl border border-gray-100 bg-white">
        {loading ? (
          <div className="px-4 py-16 text-center text-sm text-gray-400">Loading…</div>
        ) : error ? (
          <div className="px-4 py-16 text-center text-sm text-rose-600">
            Could not load connections. Try again.
          </div>
        ) : !list || list.connections.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-gray-400">{getEmptyMessage()}</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {list.connections.map((c) => (
              <ConnectionRow
                key={c.id}
                c={c}
                engagement={
                  c.provider.activityKey ? list.engagement[c.provider.activityKey] : undefined
                }
                showHeatScore={actionTab === "hot_leads"}
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
