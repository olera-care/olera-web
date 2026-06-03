"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DateRangePopover, {
  resolveRange,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";
import ConnectionRow, { type ConnectionRowData } from "@/components/admin/ConnectionRow";

interface ActionCounts {
  nudge_provider: number;
  nudge_family: number;
  call_no_email: number;
  hot_leads: number;
}

type Engagement = { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean };

interface ResponseCounts {
  all: number;
  needs_attention: number;
  provider_nudged: number;
  family_nudged: number;
  responded: number;
  no_email: number;
}

interface ListResponse {
  connections: (ConnectionRowData & { provider: { activityKey: string | null } })[];
  total: number;
  responseCounts?: ResponseCounts;
  trulyConnectedCount?: number;
  engagement: Record<string, Engagement>;
  truncated: boolean;
  action_counts?: ActionCounts;
}

// Unified filter type combining action queues and status tabs
type FilterKey = "hot_leads" | "nudge_provider" | "nudge_family" | "call_no_email" | "waiting" | "connected";

interface TabConfig {
  key: FilterKey;
  label: string;
  emoji?: string;
  getCount: (list: ListResponse | null) => number;
  emptyMessage: string;
}

const TABS: TabConfig[] = [
  {
    key: "hot_leads",
    label: "Hot",
    emoji: "🔥",
    getCount: (list) => list?.action_counts?.hot_leads ?? 0,
    emptyMessage: "No hot leads right now.",
  },
  {
    key: "nudge_provider",
    label: "Nudge Provider",
    getCount: (list) => list?.action_counts?.nudge_provider ?? 0,
    emptyMessage: "No providers to nudge.",
  },
  {
    key: "nudge_family",
    label: "Nudge Family",
    getCount: (list) => list?.action_counts?.nudge_family ?? 0,
    emptyMessage: "No families to follow up with.",
  },
  {
    key: "call_no_email",
    label: "Call",
    getCount: (list) => list?.action_counts?.call_no_email ?? 0,
    emptyMessage: "No providers without email.",
  },
  {
    key: "waiting",
    label: "Waiting",
    getCount: (list) => (list?.responseCounts?.provider_nudged ?? 0) + (list?.responseCounts?.family_nudged ?? 0),
    emptyMessage: "No connections waiting for response.",
  },
  {
    key: "connected",
    label: "Connected",
    getCount: (list) => list?.trulyConnectedCount ?? 0,
    emptyMessage: "No successful connections yet.",
  },
];

export default function ConnectionsTrackerPage() {
  const [range, setRange] = useState<DateRangeValue>({
    preset: "30d",
    customFrom: "",
    customTo: "",
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("nudge_provider");

  // Debounce search input by 300ms
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

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

  // Connection list with filtering
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = buildDateParams();
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    params.set("filter", activeFilter);

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
  }, [buildDateParams, debouncedSearch, activeFilter]);

  const activeTabConfig = TABS.find((t) => t.key === activeFilter);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <DateRangePopover value={range} onChange={setRange} />
      </div>

      {/* Unified filter tabs + search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1.5">
          {TABS.map((tab) => {
            const count = tab.getCount(list);
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.emoji && <span>{tab.emoji}</span>}
                {tab.label}
                <span
                  className={`ml-0.5 px-1.5 py-0.5 rounded text-xs font-semibold ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs ml-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="px-4 py-16 text-center text-sm text-gray-400">Loading...</div>
        ) : error ? (
          <div className="px-4 py-16 text-center text-sm text-rose-600">
            Could not load connections. Try again.
          </div>
        ) : !list || list.connections.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-gray-400">
            {activeTabConfig?.emptyMessage ?? "No connections found."}
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
          Showing a capped slice - narrow the date range for complete counts.
        </p>
      )}
    </div>
  );
}
