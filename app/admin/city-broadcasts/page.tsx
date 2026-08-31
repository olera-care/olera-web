"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

/**
 * /admin/city-broadcasts — City Broadcasts Dashboard
 *
 * Provider-centric view showing which providers are in the broadcast pool,
 * who has received broadcasts, and who has claimed.
 */

interface ProviderBroadcast {
  provider_id: string;
  provider_name: string;
  category: string | null;
  city: string;
  state: string | null;
  phone: string | null;
  email: string | null;
  broadcasts_received: number;
  last_broadcast_at: string | null;
  last_broadcast_type: "question_asked" | "profile_published" | null;
  claimed: boolean;
  claimed_at: string | null;
  is_conversion: boolean;
}

interface CityGroup {
  city: string;
  state: string | null;
  pool_count: number;
  sent_count: number;
  claimed_count: number;
  conversion_count: number;
  providers: ProviderBroadcast[];
}

/** Debounce hook for search inputs */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

interface Payload {
  stats: {
    pool: number;
    sent: number;
    claimed: number;
    conversions: number; // True conversions (claimed after broadcast)
    conversion: number; // Conversion rate percentage
  };
  cities: CityGroup[];
  filters: {
    days: number;
    status: string;
    city: string;
    search: string;
  };
}

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

function Stat({
  value,
  label,
  detail,
  tone = "default",
}: {
  value: string | number;
  label: string;
  detail?: string;
  tone?: "default" | "success" | "muted";
}) {
  return (
    <div className="min-h-20 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <span
        className={`block text-2xl font-semibold leading-none tabular-nums ${
          tone === "success"
            ? "text-green-600"
            : tone === "muted"
              ? "text-gray-400"
              : "text-gray-950"
        }`}
      >
        {value}
      </span>
      <span className="mt-2 block text-xs font-semibold text-gray-700">{label}</span>
      {detail && <span className="mt-0.5 block text-[11px] text-gray-400">{detail}</span>}
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ProviderRow({ provider }: { provider: ProviderBroadcast }) {
  const broadcastLabel =
    provider.last_broadcast_type === "question_asked"
      ? "Question"
      : provider.last_broadcast_type === "profile_published"
        ? "Profile"
        : null;

  return (
    <tr className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <td className="px-4 py-2.5">
        <div className="font-medium text-gray-900">{provider.provider_name}</div>
        {provider.category && (
          <div className="text-[11px] text-gray-500">{provider.category}</div>
        )}
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-600">{provider.phone || "-"}</td>
      <td className="px-4 py-2.5 text-sm text-gray-600 max-w-[200px] truncate" title={provider.email || ""}>
        {provider.email || "-"}
      </td>
      <td className="px-4 py-2.5 text-center">
        {provider.broadcasts_received > 0 ? (
          <div>
            <span className="font-mono text-sm tabular-nums text-gray-700">
              {provider.broadcasts_received}
            </span>
            {broadcastLabel && (
              <div className="text-[10px] text-gray-400">
                {broadcastLabel} · {relative(provider.last_broadcast_at)}
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-center">
        {provider.is_conversion ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            Converted
          </span>
        ) : provider.claimed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
            Claimed
          </span>
        ) : provider.broadcasts_received > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            Waiting
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}

function CitySection({ group, defaultExpanded }: { group: CityGroup; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div>
            <span className="font-semibold text-gray-900">{group.city}</span>
            {group.state && <span className="ml-1 text-gray-400">{group.state}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
              {group.pool_count} in pool
            </span>
            {group.sent_count > 0 && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                {group.sent_count} sent
              </span>
            )}
            {group.conversion_count > 0 && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                {group.conversion_count} converted
              </span>
            )}
            {group.claimed_count > group.conversion_count && (
              <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                {group.claimed_count - group.conversion_count} claimed prior
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400">
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 text-center font-medium">Broadcasts</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {group.providers.map((provider) => (
                <ProviderRow key={provider.provider_id} provider={provider} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function CityBroadcastsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Local state for inputs (updated immediately for responsive UI)
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [cityInput, setCityInput] = useState(searchParams.get("city") || "");

  // Debounced values for API calls (300ms delay)
  const debouncedSearch = useDebounce(searchInput, 300);
  const debouncedCity = useDebounce(cityInput, 300);

  const days = parseInt(searchParams.get("days") || "7", 10);
  const status = searchParams.get("status") || "all";

  // Sync URL when debounced values change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    if (debouncedCity) {
      params.set("city", debouncedCity);
    } else {
      params.delete("city");
    }
    const newUrl = `/admin/city-broadcasts?${params.toString()}`;
    const currentUrl = `/admin/city-broadcasts?${searchParams.toString()}`;
    if (newUrl !== currentUrl) {
      router.push(newUrl);
    }
  }, [debouncedSearch, debouncedCity, searchParams, router]);

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
      if (status !== "all") params.set("status", status);
      if (debouncedCity) params.set("city", debouncedCity);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/city-broadcasts?${params.toString()}`, {
        cache: "no-store",
      });
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
  }, [days, status, debouncedCity, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <AdminPageHeader
        title="City Broadcasts"
        description="Providers eligible for city broadcasts when family activity occurs."
        breadcrumbs={[{ label: "Inbox", href: "/admin" }]}
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
            <Stat value={data.stats.pool} label="In broadcast pool" detail="broadcast_ready providers" />
            <Stat
              value={data.stats.sent}
              label={`Sent broadcasts (${days}d)`}
              detail="At least 1 broadcast received"
              tone={data.stats.sent > 0 ? "success" : "muted"}
            />
            <Stat
              value={data.stats.claimed}
              label="Claimed profiles"
              detail="Linked to an account"
              tone={data.stats.claimed > 0 ? "success" : "muted"}
            />
            <Stat
              value={`${data.stats.conversion}%`}
              label="Conversion rate"
              detail={`${data.stats.conversions} converted of ${data.stats.sent} sent`}
              tone={data.stats.conversion >= 10 ? "success" : "default"}
            />
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-t-xl border border-b-0 border-gray-200 bg-gray-50 px-4 py-3">
            {/* Days filter */}
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

            {/* Status filter */}
            <div className="flex gap-1.5">
              {[
                { value: "all", label: "All" },
                { value: "sent", label: "Sent" },
                { value: "waiting", label: "Waiting" },
                { value: "claimed", label: "Claimed" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateFilter("status", opt.value === "all" ? "" : opt.value)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                    status === opt.value || (status === "all" && opt.value === "all")
                      ? opt.value === "claimed"
                        ? "bg-green-600 text-white"
                        : opt.value === "sent"
                          ? "bg-blue-600 text-white"
                          : opt.value === "waiting"
                            ? "bg-amber-600 text-white"
                            : "bg-gray-900 text-white"
                      : "border border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search provider..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="ml-auto rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-0"
            />

            {/* City filter */}
            <input
              type="text"
              placeholder="Filter city..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-0"
            />
          </div>

          {/* Cities */}
          <div className="overflow-hidden rounded-b-xl border border-gray-200 bg-white">
            {data.cities.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">
                No providers match the current filters.
              </div>
            ) : (
              data.cities.map((group, idx) => (
                <CitySection
                  key={group.state ? `${group.city}-${group.state}` : group.city}
                  group={group}
                  defaultExpanded={idx === 0}
                />
              ))
            )}
          </div>

          {/* Summary */}
          <p className="mt-3 text-[11px] text-gray-400">
            {data.cities.length} cities, {data.stats.pool} providers total.
          </p>
        </>
      )}
    </div>
  );
}
