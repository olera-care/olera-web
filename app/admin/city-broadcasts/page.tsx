"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

/**
 * /admin/city-broadcasts — City Broadcasts Dashboard
 *
 * Shows stats and events for the city broadcasts system, which sends
 * engagement emails to dormant providers when family activity occurs
 * in their city.
 */

type EventType = "question_asked" | "profile_published";
type Status = "pending" | "processing" | "completed" | "skipped";

interface BroadcastEvent {
  id: string;
  event_type: EventType;
  event_id: string;
  city: string;
  state: string | null;
  category: string | null;
  status: Status;
  skip_reason: string | null;
  providers_eligible: number;
  providers_sent: number;
  processed_at: string | null;
  created_at: string;
}

interface Stats {
  events: number;
  completed: number;
  skipped: number;
  providersSent: number;
  providersEligible: number;
  deliveryRate: number;
}

interface Payload {
  stats: {
    today: Stats;
    week: Stats;
    allTime: Stats;
  };
  topCities: Array<{ city: string; events: number }>;
  events: BroadcastEvent[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    days: number;
  };
}

const EVENT_TYPE_LABELS: Record<EventType, { label: string; cls: string }> = {
  question_asked: { label: "Question", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  profile_published: { label: "Profile", cls: "bg-purple-50 text-purple-700 ring-1 ring-purple-200" },
};

const STATUS_LABELS: Record<Status, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-gray-100 text-gray-600" },
  processing: { label: "Processing", cls: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", cls: "bg-green-100 text-green-700" },
  skipped: { label: "Skipped", cls: "bg-gray-100 text-gray-500" },
};

function relative(iso: string | null): string {
  if (!iso) return "-";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Stat({ value, label, detail, tone = "default" }: {
  value: string | number; label: string; detail?: string; tone?: "default" | "success" | "muted";
}) {
  return (
    <div className="min-h-20 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <span className={`block text-2xl font-semibold leading-none tabular-nums ${
        tone === "success" ? "text-green-600" : tone === "muted" ? "text-gray-400" : "text-gray-950"
      }`}>
        {value}
      </span>
      <span className="mt-2 block text-xs font-semibold text-gray-700">{label}</span>
      {detail && <span className="mt-0.5 block text-[11px] text-gray-400">{detail}</span>}
    </div>
  );
}

export default function CityBroadcastsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const days = parseInt(searchParams.get("days") || "7", 10);
  const city = searchParams.get("city") || "";
  const eventType = searchParams.get("event_type") || "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/admin/city-broadcasts?${params.toString()}`);
    },
    [router, searchParams]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      params.set("days", String(days));
      if (city) params.set("city", city);
      if (eventType) params.set("event_type", eventType);

      const res = await fetch(`/api/admin/city-broadcasts?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [days, city, eventType]);

  useEffect(() => { void load(); }, [load]);

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    return data.events;
  }, [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <AdminPageHeader
        title="City Broadcasts"
        description="Engagement emails to dormant providers when family activity occurs in their city."
        breadcrumbs={[{ label: "Operations", href: "/admin" }]}
        actions={
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-9 items-center rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 hover:border-gray-300 disabled:opacity-50"
          >
            {loading && data ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      {loading && !data && <div className="mt-6 h-24 animate-pulse rounded-xl bg-gray-100" />}
      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Couldn&rsquo;t load: {err}
        </div>
      )}

      {data && (
        <>
          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              value={data.stats.today.providersSent}
              label="Providers reached today"
              detail={`${data.stats.today.events} events`}
              tone={data.stats.today.providersSent > 0 ? "success" : "muted"}
            />
            <Stat
              value={data.stats.week.providersSent}
              label={`Providers reached (${days}d)`}
              detail={`${data.stats.week.events} events`}
            />
            <Stat
              value={`${data.stats.week.deliveryRate}%`}
              label="Delivery rate"
              detail={`${data.stats.week.providersSent} of ${data.stats.week.providersEligible} eligible`}
              tone={data.stats.week.deliveryRate >= 80 ? "success" : "default"}
            />
            <Stat
              value={data.stats.allTime.providersSent}
              label="All-time providers"
              detail={`${data.stats.allTime.events} total events`}
              tone="muted"
            />
          </div>

          {/* Top Cities */}
          {data.topCities.length > 0 && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Top cities this week</h3>
              <div className="flex flex-wrap gap-2">
                {data.topCities.map(({ city: cityName, events }) => (
                  <button
                    key={cityName}
                    onClick={() => updateFilter("city", cityName === city ? "" : cityName)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      cityName === city
                        ? "bg-teal-100 text-teal-800"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cityName} ({events})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-t-xl border border-b-0 border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex gap-1.5">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateFilter("days", String(d))}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                    days === d
                      ? "bg-gray-900 text-white"
                      : "border border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => updateFilter("event_type", "")}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  !eventType
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                All types
              </button>
              <button
                type="button"
                onClick={() => updateFilter("event_type", "question_asked")}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  eventType === "question_asked"
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                Questions
              </button>
              <button
                type="button"
                onClick={() => updateFilter("event_type", "profile_published")}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  eventType === "profile_published"
                    ? "bg-purple-600 text-white"
                    : "border border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                Profiles
              </button>
            </div>
            {city && (
              <span className="text-[11px] text-gray-500">
                Filtered to: <strong>{city}</strong>
                <button
                  onClick={() => updateFilter("city", "")}
                  className="ml-1.5 text-gray-400 hover:text-gray-600"
                >
                  clear
                </button>
              </span>
            )}
          </div>

          {/* Events Table */}
          <div className="overflow-x-auto rounded-b-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">City</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 text-right font-medium">Eligible</th>
                  <th className="px-4 py-2.5 text-right font-medium">Sent</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                      No broadcast events in this period.
                    </td>
                  </tr>
                )}
                {filteredEvents.map((event) => {
                  const typeStyle = EVENT_TYPE_LABELS[event.event_type];
                  const statusStyle = STATUS_LABELS[event.status];
                  return (
                    <tr key={event.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-semibold ${typeStyle.cls}`}>
                          {typeStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => updateFilter("city", event.city)}
                          className="font-semibold text-gray-900 hover:text-teal-700"
                        >
                          {event.city}
                        </button>
                        {event.state && (
                          <span className="ml-1 text-gray-400">{event.state}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {event.category || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-500">
                        {event.providers_eligible}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-700">
                        {event.providers_sent}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-semibold ${statusStyle.cls}`}>
                          {statusStyle.label}
                        </span>
                        {event.skip_reason && (
                          <span className="ml-2 text-[10px] text-gray-400" title={event.skip_reason}>
                            {event.skip_reason.slice(0, 30)}
                            {event.skip_reason.length > 30 ? "..." : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[11px] tabular-nums text-gray-500">
                        {relative(event.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination info */}
          <p className="mt-3 text-[11px] text-gray-400">
            Showing {filteredEvents.length} of {data.pagination.total} events from the last {days} days.
          </p>
        </>
      )}
    </div>
  );
}
