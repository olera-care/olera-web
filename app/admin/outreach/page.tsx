"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type DateRange = "7d" | "30d" | "90d";

interface FunnelMetrics {
  views: number;
  clicks: number;
  sent: number;
  accepted: number;
  declined: number;
}

interface Rates {
  viewToClick: number;
  clickToSend: number;
  acceptRate: number;
  declineRate: number;
}

interface AIUsage {
  generated: number;
  percentOfSent: number;
}

interface OutreachItem {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  provider: {
    id: string;
    name: string;
    slug: string;
    location: string;
    image_url: string | null;
  } | null;
  family: {
    id: string;
    name: string;
    slug: string;
    location: string;
    image_url: string | null;
  } | null;
}

interface OutreachData {
  funnel: FunnelMetrics;
  rates: Rates;
  aiUsage: AIUsage;
  recentOutreach: OutreachItem[];
  total: number;
  days: number;
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "accepted":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Accepted
        </span>
      );
    case "declined":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          Declined
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Pending
        </span>
      );
  }
}

function FunnelCard({
  label,
  value,
  rate,
  showArrow,
  tooltip,
}: {
  label: string;
  value: number;
  rate?: number;
  showArrow?: boolean;
  tooltip?: string;
}) {
  // Format rate with better precision for small values
  const formatRate = (r: number): string => {
    if (r === 0) return "0%";
    if (r < 1) return `${r.toFixed(1)}%`;
    if (r < 10) return `${r.toFixed(1)}%`;
    return `${Math.round(r)}%`;
  };

  return (
    <div className="relative bg-white rounded-xl border border-gray-100 px-4 py-4 group">
      {showArrow && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-gray-300 z-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
      )}
      <div className="text-2xl font-semibold text-gray-900 tabular-nums">
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="relative">
            <svg className="w-3.5 h-3.5 text-gray-300 cursor-help" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              {tooltip}
            </span>
          </span>
        )}
      </div>
      {rate !== undefined && rate > 0 && (
        <div className="text-xs text-gray-400 mt-1 tabular-nums">{formatRate(rate)}</div>
      )}
    </div>
  );
}

export default function AdminOutreachPage() {
  const [data, setData] = useState<OutreachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>("30d");
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 25;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      const res = await fetch(
        `/api/admin/outreach?days=${days}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`
      );

      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError("Failed to load outreach data");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [range, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to first page when range changes
  useEffect(() => {
    setPage(0);
  }, [range]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Provider Outreach
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track provider engagement with Find Families
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(["7d", "30d", "90d"] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                range === r
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Funnel Metrics */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            <FunnelCard
              label="Views"
              value={data.funnel.views}
              showArrow
              tooltip="Total page views (not unique)"
            />
            <FunnelCard
              label="Clicks"
              value={data.funnel.clicks}
              rate={data.rates.viewToClick}
              showArrow
              tooltip="Family card clicks"
            />
            <FunnelCard
              label="Sent"
              value={data.funnel.sent}
              rate={data.rates.clickToSend}
              showArrow
              tooltip="Outreach messages sent"
            />
            <FunnelCard
              label="Accepted"
              value={data.funnel.accepted}
              rate={data.rates.acceptRate}
              tooltip="Families who accepted"
            />
            <FunnelCard
              label="Declined"
              value={data.funnel.declined}
              rate={data.rates.declineRate}
              tooltip="Families who declined"
            />
          </div>

          {/* AI Usage */}
          <div className="mb-8 px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">AI-Assisted Messages:</span>{" "}
              {data.aiUsage.generated} of {data.funnel.sent} sent messages ({data.aiUsage.percentOfSent}%)
              were written with AI help
            </p>
          </div>

          {/* Recent Outreach Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden relative">
            {/* Loading overlay during pagination */}
            {loading && data && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
              </div>
            )}
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Recent Outreach
              </h2>
            </div>

            {data.recentOutreach.length === 0 ? (
              <div className="text-center py-16 text-sm text-gray-400">
                No outreach in this period
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3">Provider</th>
                      <th className="px-5 py-3">Family</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentOutreach.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          {item.provider ? (
                            <div>
                              <Link
                                href={`/admin/directory/${item.provider.slug}`}
                                className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                              >
                                {item.provider.name}
                              </Link>
                              {item.provider.location && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {item.provider.location}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Unknown</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {item.family ? (
                            <div>
                              <Link
                                href={`/admin/care-seekers/${item.family.id}`}
                                className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                              >
                                {item.family.name}
                              </Link>
                              {item.family.location && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {item.family.location}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Unknown</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">
                          {formatTimeAgo(item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {data.total > PAGE_SIZE && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.total)} of{" "}
                      {data.total}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={(page + 1) * PAGE_SIZE >= data.total}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
