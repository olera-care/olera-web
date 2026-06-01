"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

type PeriodFilter = "7d" | "30d" | "90d" | "all";

interface ProviderEngagement {
  id: string;
  display_name: string;
  slug: string;
  requests_sent: number;
  requests_this_month: number;
  olera_reviews_count: number;
  google_connected: boolean;
  last_request_at: string | null;
}

interface Summary {
  total_requests: number;
  total_providers: number;
  requests_this_month: number;
  by_method: { email: number; link: number; sms: number };
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

export default function RequestEngagementSection() {
  const [expanded, setExpanded] = useState(false);
  const [providers, setProviders] = useState<ProviderEngagement[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [total, setTotal] = useState(0);
  const fetchedAt = useRef<number>(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/review-requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers ?? []);
        setSummary(data.summary ?? null);
        setTotal(data.total ?? 0);
        fetchedAt.current = Date.now();
      } else {
        setError("Failed to load data. Please try again.");
      }
    } catch {
      setError("Failed to load data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [period, debouncedSearch]);

  // Clear cache when period or search changes (triggers refetch via the effect below)
  useEffect(() => {
    setSummary(null);
    setProviders([]);
    fetchedAt.current = 0;
  }, [period, debouncedSearch]);

  // Lazy-load data on expand with 5-minute cache
  useEffect(() => {
    if (!expanded) return;

    const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    const shouldRefresh = !summary || (Date.now() - fetchedAt.current > REFRESH_INTERVAL_MS);

    if (!shouldRefresh) return;

    fetchData();
  }, [expanded, summary, fetchData]);

  const periods: { label: string; value: PeriodFilter }[] = [
    { label: "7 days", value: "7d" },
    { label: "30 days", value: "30d" },
    { label: "90 days", value: "90d" },
    { label: "All time", value: "all" },
  ];

  // Calculate email percentage
  const emailPercent = summary
    ? summary.total_requests > 0
      ? Math.round((summary.by_method.email / summary.total_requests) * 100)
      : 0
    : 0;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
        </svg>
        Request Engagement
        <span className="text-xs text-gray-400 font-normal">provider review request activity</span>
      </button>

      {expanded && (
        <div className="mt-4">
          {loading && !summary ? (
            <div className="text-sm text-gray-400">Loading engagement data...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <>
              {/* Summary cards */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                    <div className="text-xl font-semibold tabular-nums text-gray-900">
                      {summary.total_requests.toLocaleString()}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">Total Sent</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                    <div className="text-xl font-semibold tabular-nums text-gray-900">
                      {summary.total_providers.toLocaleString()}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">Providers Using</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                    <div className="text-xl font-semibold tabular-nums text-gray-900">
                      {summary.requests_this_month.toLocaleString()}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">This Month</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                    <div className="text-xl font-semibold tabular-nums text-gray-900">
                      {emailPercent}%
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">Via Email</div>
                  </div>
                </div>
              )}

              {/* Period filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                {periods.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={[
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      period === p.value
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    ].join(" ")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by provider name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Provider table */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-gray-400">Loading...</div>
                </div>
              ) : providers.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <p className="text-sm text-gray-500">No providers have sent review requests yet.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Provider</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Requests</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">This Month</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Olera Reviews</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Google</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {providers.map((provider) => (
                          <tr key={provider.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <Link
                                href={`/provider/${provider.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary-600 hover:underline"
                              >
                                {provider.display_name}
                              </Link>
                              <p className="text-xs text-gray-400">{provider.slug}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium text-gray-900">
                                {provider.requests_sent}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-700">
                                {provider.requests_this_month}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-700">
                                {provider.olera_reviews_count}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {provider.google_connected ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                                  Connected
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                              {provider.last_request_at
                                ? formatRelativeTime(provider.last_request_at)
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {total > providers.length && (
                    <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-500">
                      Showing {providers.length} of {total} providers
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
