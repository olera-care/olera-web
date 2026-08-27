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
  conversion_source: string;
}

interface SequenceConversionsModalProps {
  onClose: () => void;
}

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  smartlead: { label: "SmartLead", color: "bg-blue-100 text-blue-700" },
  fax: { label: "Fax", color: "bg-amber-100 text-amber-700" },
  contact_form: { label: "Contact Form", color: "bg-purple-100 text-purple-700" },
  direct_mail: { label: "Direct Mail", color: "bg-green-100 text-green-700" },
  linkedin: { label: "LinkedIn", color: "bg-sky-100 text-sky-700" },
};

export function SequenceConversionsModal({ onClose }: SequenceConversionsModalProps) {
  const [providers, setProviders] = useState<SequenceConversion[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [bySource, setBySource] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showAll, setShowAll] = useState(false);

  const fetchConversions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);

      const url = `/api/admin/provider-outreach/sequence-conversions${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch conversions");
      }

      const data = await res.json();
      setProviders(data.providers || []);
      setTotal(data.total || 0);
      setBySource(data.by_source || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch conversions");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchConversions();
  }, [fetchConversions]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

  const clearFilter = () => setSelectedDate("");
  const hasFilter = Boolean(selectedDate);

  // Show first 5 by default, expand to show all
  const displayedProviders = showAll ? providers : providers.slice(0, 5);
  const hasMore = providers.length > 5;

  // Get active sources (those with count > 0)
  const activeSources = Object.entries(bySource)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              {loading ? (
                <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
              ) : (
                <h2 className="text-2xl font-semibold text-gray-900">
                  {total} provider{total !== 1 ? "s" : ""} claimed
                </h2>
              )}
              <p className="text-sm text-gray-500 mt-1">from sequence outreach</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Source Pills */}
          {!loading && activeSources.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {activeSources.map(([source, count]) => {
                const config = SOURCE_CONFIG[source] || { label: source, color: "bg-gray-100 text-gray-700" };
                return (
                  <span
                    key={source}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}
                  >
                    {config.label}
                    <span className="text-xs opacity-75">{count}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Date Filter */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <label className="text-sm text-gray-500">Claimed on</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {hasFilter && (
              <button
                type="button"
                onClick={clearFilter}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Show all
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="space-y-4 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-5 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchConversions}
                className="mt-2 text-sm text-primary-600 hover:underline font-medium"
              >
                Try again
              </button>
            </div>
          ) : providers.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500">
                {hasFilter ? "No conversions on this date" : "No sequence conversions yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-1 pt-2">
              {displayedProviders.map((provider) => {
                const sourceConfig = SOURCE_CONFIG[provider.conversion_source] || {
                  label: provider.conversion_source,
                  color: "bg-gray-100 text-gray-700",
                };

                return (
                  <div
                    key={provider.provider_id}
                    className="group py-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {provider.provider_name}
                          </h3>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${sourceConfig.color}`}
                          >
                            {sourceConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {provider.city || "—"}
                          <span className="mx-1.5 text-gray-300">·</span>
                          {provider.assigned_to_display_name || "—"}
                          <span className="mx-1.5 text-gray-300">·</span>
                          {formatDate(provider.claimed_at)}
                        </p>
                      </div>
                    </div>
                    {/* Email shown subtly */}
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {provider.claim_email}
                    </p>
                  </div>
                );
              })}

              {/* Show more button */}
              {hasMore && !showAll && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="w-full py-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Show {providers.length - 5} more
                </button>
              )}
              {hasMore && showAll && (
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  className="w-full py-3 text-sm text-gray-500 hover:text-gray-700"
                >
                  Show less
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
