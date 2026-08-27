"use client";

import { useState, useEffect, useCallback } from "react";

interface SequenceConversion {
  provider_id: string;
  provider_name: string;
  city: string | null;
  claim_email: string;
  claimed_at: string;
  assigned_to: string | null;
  assigned_to_display_name: string | null;
}

interface SequenceConversionsModalProps {
  onClose: () => void;
}

export function SequenceConversionsModal({ onClose }: SequenceConversionsModalProps) {
  const [providers, setProviders] = useState<SequenceConversion[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filter state
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Fetch conversions
  const fetchConversions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const url = `/api/admin/provider-outreach/sequence-conversions${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch conversions");
      }

      const data = await res.json();
      setProviders(data.providers || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch conversions");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  // Fetch on mount and when date filters change
  useEffect(() => {
    fetchConversions();
  }, [fetchConversions]);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = dateFrom || dateTo;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Sequence Conversions</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0 bg-gray-50">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Date range:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="From"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="To"
              />
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            )}
            <div className="ml-auto text-sm text-gray-600 font-medium tabular-nums">
              {loading ? "..." : `${total} provider${total !== 1 ? "s" : ""}`}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchConversions}
                className="mt-2 text-sm text-teal-700 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : providers.length === 0 ? (
            <div className="py-12 text-center">
              <svg
                className="w-12 h-12 mx-auto text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-3 text-sm text-gray-500">
                {hasFilters ? "No conversions in this date range" : "No sequence conversions yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Table header */}
              <div className="px-5 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide grid grid-cols-12 gap-2">
                <div className="col-span-4">Provider</div>
                <div className="col-span-2">City</div>
                <div className="col-span-2">Owner</div>
                <div className="col-span-2 text-right">Claimed</div>
              </div>

              {/* Rows */}
              {providers.map((provider) => (
                <div key={provider.provider_id} className="px-5 py-3">
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4">
                      <div className="text-sm font-medium text-gray-900 truncate" title={provider.provider_name}>
                        {provider.provider_name}
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-gray-600 truncate" title={provider.city || "—"}>
                      {provider.city || "—"}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600 truncate" title={provider.assigned_to_display_name || "—"}>
                      {provider.assigned_to_display_name || "—"}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600 text-right tabular-nums">
                      {formatDate(provider.claimed_at)}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                    <span className="text-gray-300">&rarr;</span>
                    <span>claimed with: {provider.claim_email}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
