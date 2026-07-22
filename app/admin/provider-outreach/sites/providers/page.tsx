"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DC: "District of Columbia", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  MA: "Massachusetts", MD: "Maryland", ME: "Maine", MI: "Michigan", MN: "Minnesota",
  MO: "Missouri", MS: "Mississippi", MT: "Montana", NC: "North Carolina",
  ND: "North Dakota", NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NV: "Nevada", NY: "New York", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia",
  VT: "Vermont", WA: "Washington", WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming",
};

interface ProviderRow {
  provider_id: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  status: string;
}

const FILTER_LABELS: Record<string, string> = {
  all: "All providers",
  called: "Called",
  claimed: "Claimed",
  left_to_call: "Left to call",
};

export default function ProvidersListPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "all";

  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/provider-outreach/sites?providers_for=${filter}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setProviders((d?.providers ?? []) as ProviderRow[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const q = search.toLowerCase();
  const filtered = q
    ? providers.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.city || "").toLowerCase().includes(q) ||
          (p.state || "").toLowerCase().includes(q) ||
          (STATE_NAMES[p.state || ""] || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      )
    : providers;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/provider-outreach/sites"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {FILTER_LABELS[filter] || "Providers"}
          </h1>
          {!loading && (
            <p className="text-sm text-gray-500">{filtered.length.toLocaleString()} providers</p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 rounded-lg bg-gray-100 p-1 w-fit">
        {(["all", "called", "claimed", "left_to_call"] as const).map((f) => (
          <Link
            key={f}
            href={`/admin/provider-outreach/sites/providers?filter=${f}`}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === f
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {FILTER_LABELS[f]}
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, city, or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
        />
      </div>

      {/* List */}
      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading providers...</p>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="grid grid-cols-[1fr_120px_80px_100px] gap-2 px-5 py-2.5 border-b border-gray-100 text-[11px] font-medium uppercase tracking-wider text-gray-400">
              <span>Provider</span>
              <span>City</span>
              <span>State</span>
              <span className="text-right">Status</span>
            </div>
            {filtered.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-gray-400">
                {search ? "No providers match your search." : "No providers found."}
              </p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[calc(100vh-320px)] overflow-y-auto">
                {filtered.slice(0, 200).map((p) => {
                  let statusLabel = "Not contacted";
                  let statusColor = "text-gray-400";
                  if (p.status === "in_sequence" || p.status === "send_ready" || p.status === "paused") {
                    statusLabel = "In sequence";
                    statusColor = "text-blue-600";
                  } else if (p.status === "claimed") {
                    statusLabel = "Claimed";
                    statusColor = "text-emerald-600";
                  }

                  return (
                    <div
                      key={p.provider_id}
                      className="grid grid-cols-[1fr_120px_80px_100px] gap-2 items-center px-5 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        {p.category && <p className="text-xs text-gray-400 truncate">{p.category}</p>}
                      </div>
                      <span className="text-sm text-gray-600 truncate">{p.city || "--"}</span>
                      <span className="text-sm text-gray-600">{p.state || "--"}</span>
                      <span className={`text-xs font-medium text-right ${statusColor}`}>{statusLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {filtered.length > 200 && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Showing 200 of {filtered.length.toLocaleString()} providers. Use search to narrow results.
            </p>
          )}
        </>
      )}
    </div>
  );
}
