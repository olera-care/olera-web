"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface Metrics {
  profilesCreated: number;
  profilesCompleted: number;
  wentLive: number;
  skippedGoLive: number;
  providerInterested: number;
  interestResponded: number;
  interestDeclined: number;
  conversations: number;
  goLiveRate: number;
  interestRate: number;
  responseRate: number;
  conversationRate: number;
}

interface MatchEvent {
  id: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  from_profile: {
    id: string;
    display_name: string;
    city: string | null;
    state: string | null;
    type: string;
    category: string | null;
  } | null;
  to_profile: {
    id: string;
    display_name: string;
    city: string | null;
    state: string | null;
    type: string;
    care_types: string[] | null;
    metadata: Record<string, unknown> | null;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  archived: "bg-gray-100 text-gray-800",
};

function MetricCard({
  label,
  value,
  sub,
  color = "text-gray-900",
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function RateCard({
  label,
  rate,
  numerator,
  denominator,
}: {
  label: string;
  rate: number;
  numerator: number;
  denominator: number;
}) {
  const barColor =
    rate >= 50 ? "bg-green-500" : rate >= 25 ? "bg-yellow-500" : "bg-red-400";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{rate}%</p>
      <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
        <div
          className={`h-2 rounded-full ${barColor} transition-all`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {numerator} / {denominator}
      </p>
    </div>
  );
}

export default function AdminMatchesPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/matches?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to fetch matches data:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getEventLabel(event: MatchEvent) {
    if (event.status === "accepted") return "Accepted";
    if (event.status === "declined") return "Declined";
    return "Reached out";
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
        <p className="text-gray-500 mt-1">
          Track the care seeker → provider matching funnel
        </p>
      </div>

      {/* Funnel Metrics */}
      {metrics && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            User Events
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Profiles Created"
              value={metrics.profilesCreated}
              sub="Family accounts with profiles"
            />
            <MetricCard
              label="Profiles Completed"
              value={metrics.profilesCompleted}
              sub="Care types + location set"
            />
            <MetricCard
              label="Went Live"
              value={metrics.wentLive}
              color="text-green-600"
              sub="Activated Matches"
            />
            <MetricCard
              label="Skipped Go Live"
              value={metrics.skippedGoLive}
              color="text-amber-600"
              sub="Complete but not live"
            />
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Provider Interest Events
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Provider Interested"
              value={metrics.providerInterested}
              sub="Reach-outs sent"
            />
            <MetricCard
              label="Interest Responded"
              value={metrics.interestResponded}
              color="text-green-600"
              sub="Family accepted"
            />
            <MetricCard
              label="Interest Declined"
              value={metrics.interestDeclined}
              color="text-red-500"
              sub="Family declined"
            />
            <MetricCard
              label="Conversations"
              value={metrics.conversations}
              sub="2+ messages exchanged"
            />
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <RateCard
              label="Go Live Rate"
              rate={metrics.goLiveRate}
              numerator={metrics.wentLive}
              denominator={metrics.profilesCompleted}
            />
            <RateCard
              label="Interest Rate"
              rate={metrics.interestRate}
              numerator={metrics.providerInterested}
              denominator={metrics.wentLive}
            />
            <RateCard
              label="Response Rate"
              rate={metrics.responseRate}
              numerator={metrics.interestResponded}
              denominator={metrics.providerInterested}
            />
            <RateCard
              label="Conversation Rate"
              rate={metrics.conversationRate}
              numerator={metrics.conversations}
              denominator={metrics.interestResponded}
            />
          </div>
        </>
      )}

      {/* Recent Activity */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Recent Provider Reach-Outs
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading && events.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {debouncedSearch
              ? "No matches found for your search"
              : "No provider reach-outs yet"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Provider
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Care Seeker
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Care Types
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const provider = event.from_profile;
                const seeker = event.to_profile;
                const careTypes = seeker?.care_types || [];

                return (
                  <tr
                    key={event.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {provider?.display_name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {[provider?.city, provider?.state]
                            .filter(Boolean)
                            .join(", ") || "—"}
                          {provider?.category && (
                            <span className="ml-1 text-gray-400">
                              · {provider.category}
                            </span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {seeker ? (
                        <Link
                          href={`/admin/care-seekers/${seeker.id}`}
                          className="text-primary-600 hover:underline font-medium"
                        >
                          {seeker.display_name || "Unknown"}
                        </Link>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                      <p className="text-xs text-gray-500">
                        {[seeker?.city, seeker?.state]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {careTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {careTypes.slice(0, 2).map((ct) => (
                            <span
                              key={ct}
                              className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
                            >
                              {ct.replace(/_/g, " ")}
                            </span>
                          ))}
                          {careTypes.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{careTypes.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          STATUS_COLORS[event.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getEventLabel(event)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(event.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
