"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PulseHeader from "@/components/admin/PulseHeader";
import { resolveRange, type DateRangeValue } from "@/components/admin/DateRangePopover";
import ConnectionRow, { type ConnectionRowData } from "@/components/admin/ConnectionRow";

type Engagement = { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean };

interface ListResponse {
  connections: (ConnectionRowData & { provider: { activityKey: string | null } })[];
  total: number;
  engagedCount?: number;
  noActivityCount?: number;
  engagement: Record<string, Engagement>;
  truncated: boolean;
}

// Simplified tabs: All, Engaged, No Activity
type FilterKey = "all" | "engaged" | "no_activity";

interface TabConfig {
  key: FilterKey;
  label: string;
  getCount: (list: ListResponse | null) => number;
  emptyMessage: string;
}

const TABS: TabConfig[] = [
  {
    key: "all",
    label: "All",
    getCount: (list) => list?.total ?? 0,
    emptyMessage: "No connections yet.",
  },
  {
    key: "engaged",
    label: "Engaged",
    getCount: (list) => list?.engagedCount ?? 0,
    emptyMessage: "No engaged providers yet.",
  },
  {
    key: "no_activity",
    label: "No Activity",
    getCount: (list) => list?.noActivityCount ?? 0,
    emptyMessage: "All providers have engaged.",
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
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

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
      {/* Header with KPI + trend chart */}
      <PulseHeader
        title="Connections"
        kpiSuffix="successful"
        statsPath="/api/admin/connections/pulse"
        range={range}
        onRangeChange={setRange}
      />

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
