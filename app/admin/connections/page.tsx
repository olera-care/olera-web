"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PulseHeader from "@/components/admin/PulseHeader";
import { resolveRange, type DateRangeValue } from "@/components/admin/DateRangePopover";
import ConnectionRow, { type ConnectionRowData } from "@/components/admin/ConnectionRow";

type Engagement = { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean; continue_in_inbox: boolean };

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
  emptyMessage: string;
}

const TABS: TabConfig[] = [
  { key: "all", label: "All", emptyMessage: "No connections yet." },
  { key: "engaged", label: "Engaged", emptyMessage: "No engaged providers yet." },
  { key: "no_activity", label: "No Activity", emptyMessage: "All providers have engaged." },
];

const PAGE_SIZE = 50;

export default function ConnectionsTrackerPage() {
  const [range, setRange] = useState<DateRangeValue>({
    preset: "30d",
    customFrom: "",
    customTo: "",
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(0);

  // Delete state
  const [pendingDelete, setPendingDelete] = useState<ConnectionRowData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Debounce search input by 300ms
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [activeFilter, range]);

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

  const fetchConnections = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = buildDateParams();
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    params.set("filter", activeFilter);
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));

    fetch(`/api/admin/connections?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((data: ListResponse) => {
        setList(data);
      })
      .catch(() => {
        setError(true);
        setList(null);
      })
      .finally(() => setLoading(false));
  }, [buildDateParams, debouncedSearch, activeFilter, page]);

  // Fetch connections when dependencies change
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const activeTabConfig = TABS.find((t) => t.key === activeFilter);

  // Get count for tab
  const getTabCount = (key: FilterKey): number => {
    if (!list) return 0;
    if (key === "all") return list.total;
    if (key === "engaged") return list.engagedCount ?? 0;
    if (key === "no_activity") return list.noActivityCount ?? 0;
    return 0;
  };

  // Delete handlers
  const requestDelete = (id: string) => {
    const connection = list?.connections.find(c => c.id === id);
    if (connection) {
      setPendingDelete(connection);
      setDeleteError(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    setDeleting(true);
    setDeleteError(null);

    // Optimistic removal
    const connectionToDelete = pendingDelete;
    setList(prev => prev ? {
      ...prev,
      connections: prev.connections.filter(c => c.id !== connectionToDelete.id),
      total: prev.total - 1,
    } : null);

    try {
      const res = await fetch(`/api/admin/connections/${connectionToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPendingDelete(null);
      } else {
        // Rollback on error
        fetchConnections();
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "Failed to delete connection");
      }
    } catch {
      fetchConnections();
      setDeleteError("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = list ? Math.ceil(list.total / PAGE_SIZE) : 0;

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

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by family or provider name..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setDebouncedSearch(""); setPage(0); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs - underline style like Leads page */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {TABS.map((tab) => {
          const count = getTabCount(tab.key);
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${isActive ? "text-gray-500" : "text-gray-300"}`}>
                {count}
              </span>
            </button>
          );
        })}
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
                onDelete={requestDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && list && list.connections.length > 0 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-gray-500">
            {list.total <= PAGE_SIZE
              ? `${list.total} total`
              : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, list.total)} of ${list.total}`
            }
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {list?.truncated && (
        <p className="mt-2 text-xs text-amber-600">
          Showing a capped slice — narrow the date range for complete counts.
        </p>
      )}

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-connection-title"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 id="delete-connection-title" className="text-base font-semibold text-gray-900 mb-3">
              Delete this connection?
            </h3>
            <dl className="text-sm text-gray-700 space-y-1.5 mb-4">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Family</dt>
                <dd className="text-gray-900">{pendingDelete.family.display_name || "Unknown"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Provider</dt>
                <dd className="text-gray-900">{pendingDelete.provider.display_name || "Unknown"}</dd>
              </div>
            </dl>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-5">
              This will permanently delete this connection and all associated messages. This cannot be undone.
            </p>
            {deleteError && (
              <p className="text-[12px] text-red-600 mb-3">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(null);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
