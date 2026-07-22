"use client";

/**
 * Provider Outreach worklist view.
 *
 * Task-based buckets instead of a flat directory:
 *   1. Ready to email   — has email, send now
 *   2. Call to get email — has phone, no email
 *   3. Needs research    — no contact info at all
 *
 * Each row shows phone prominently with a Call button.
 * "Assign a batch" placeholder for future agent assignment.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProviderOutreachRefresh } from "@/hooks/useProviderOutreachRefresh";
import { ProviderDrawer } from "@/components/admin/provider-outreach/ProviderDrawer";
import { LogCallModal } from "@/components/admin/provider-outreach/LogCallModal";

const LAST_OPENED_KEY = "provider-outreach-last-opened";

interface ProviderRow {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_category: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  slug?: string | null;
  google_rating?: number | null;
  status: string;
}

interface BucketCounts {
  email_ready: number;
  call_for_email: number;
  needs_research: number;
  total: number;
}

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

type Bucket = "email_ready" | "call_for_email" | "needs_research";

const BUCKETS: {
  key: Bucket;
  label: string;
  subtitle: string;
  dotColor: string;
}[] = [
  { key: "email_ready", label: "Ready to email", subtitle: "Have an email, send now", dotColor: "bg-emerald-400" },
  { key: "call_for_email", label: "Call to get email", subtitle: "Have a phone, no email", dotColor: "bg-blue-400" },
  { key: "needs_research", label: "Needs research", subtitle: "No email or phone yet", dotColor: "bg-amber-400" },
];

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function ProviderOutreachTabPage() {
  const searchParams = useSearchParams();
  const stateParam = searchParams?.get("state")?.toUpperCase() || "";
  const stateName = STATE_NAMES[stateParam] || stateParam;

  const bucketParam = searchParams?.get("bucket") as Bucket | null;
  const [counts, setCounts] = useState<BucketCounts | null>(null);
  const [activeBucket, setActiveBucket] = useState<Bucket>(bucketParam && ["email_ready", "call_for_email", "needs_research"].includes(bucketParam) ? bucketParam : "call_for_email");
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(50);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderRow | null>(null);
  const [logCallProvider, setLogCallProvider] = useState<ProviderRow | null>(null);

  // Record last opened timestamp for this state
  const lastOpenedFormatted = useMemo(() => {
    if (!stateParam) return null;
    try {
      const stored = localStorage.getItem(LAST_OPENED_KEY);
      const dates: Record<string, string> = stored ? JSON.parse(stored) : {};
      const prev = dates[stateParam];
      // Save current visit
      dates[stateParam] = new Date().toISOString();
      localStorage.setItem(LAST_OPENED_KEY, JSON.stringify(dates));
      if (prev) {
        return new Date(prev).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      return "Just now";
    } catch { return null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateParam]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [activeBucket, debouncedSearch]);

  const fetchCounts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (stateParam) params.set("state", stateParam);
      params.set("counts_only", "1");
      const res = await fetch(`/api/admin/provider-outreach/providers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts);
      }
    } catch {}
  }, [stateParam]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stateParam) params.set("state", stateParam);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("bucket", activeBucket);
      params.set("page", String(page));
      params.set("per_page", String(perPage));

      const res = await fetch(`/api/admin/provider-outreach/providers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [stateParam, debouncedSearch, activeBucket, page, perPage]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => { fetchRows(); }, [fetchRows]);
  useProviderOutreachRefresh(() => { fetchCounts(); fetchRows(); });

  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-5">
        <Link
          href="/admin/provider-outreach/sites"
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          States
        </Link>
        <span className="text-gray-300">&rsaquo;</span>
        <span className="text-gray-500">
          {stateName || "All States"}
        </span>
        <span className="text-gray-300">&rsaquo;</span>
        <span className="font-bold text-gray-900">Worklists</span>
      </div>

      {/* Agent + last opened */}
      <div className="flex items-center gap-4 mb-5 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">C</span>
          <span className="text-gray-600 font-medium">Chantel</span>
        </span>
        {lastOpenedFormatted && (
          <span>Last opened {lastOpenedFormatted}</span>
        )}
      </div>

      {/* Bucket cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {BUCKETS.map((b) => {
          const count = counts ? counts[b.key] : 0;
          const isActive = activeBucket === b.key;
          return (
            <button
              key={b.key}
              onClick={() => setActiveBucket(b.key)}
              className={`rounded-xl border-2 px-5 py-4 text-left transition-all ${
                isActive
                  ? "border-primary-500 bg-primary-50/40 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block h-2.5 w-2.5 rounded-sm ${b.dotColor}`} />
                <span className={`text-sm font-medium ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                  {b.label}
                </span>
              </div>
              <p className="text-3xl font-bold tabular-nums text-gray-900 mt-1">
                {count.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{b.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Active worklist */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Worklist header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {BUCKETS.find((b) => b.key === activeBucket)!.label}
              <span className="ml-2 font-normal text-gray-400">
                {total.toLocaleString()} provider{total === 1 ? "" : "s"}
              </span>
            </h3>
            <button
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              title="Coming soon"
            >
              Assign a batch
            </button>
          </div>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by provider name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">Loading...</p>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">
              {debouncedSearch ? "No providers match your search." : "This worklist is empty."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((row) => (
              <div
                key={row.provider_id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedProvider(row)}
              >
                {/* Provider info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {row.provider_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {[row.city, row.provider_category].filter(Boolean).join(" · ") || "--"}
                  </p>
                </div>

                {/* Phone + action */}
                <div className="flex items-center gap-3 shrink-0">
                  {row.phone ? (
                    <span className="text-sm tabular-nums text-gray-600">{formatPhone(row.phone)}</span>
                  ) : (
                    <span className="text-xs text-gray-300">
                      {activeBucket === "needs_research" ? "No phone, no email" : "No phone"}
                    </span>
                  )}

                  {activeBucket === "call_for_email" && row.phone && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setLogCallProvider(row); }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                      </svg>
                      Call
                    </button>
                  )}
                  {activeBucket === "email_ready" && row.email && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      Email now
                    </span>
                  )}
                  {activeBucket === "needs_research" && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      Research
                    </span>
                  )}

                  {/* Chevron to indicate clickable row */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 shrink-0">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-xs">
            <span className="text-gray-400 tabular-nums">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Provider detail drawer */}
      {selectedProvider && (
        <ProviderDrawer
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
        />
      )}

      {logCallProvider && (
        <LogCallModal
          providerName={logCallProvider.provider_name}
          providerLocation={[logCallProvider.city, logCallProvider.state].filter(Boolean).join(", ")}
          providerId={logCallProvider.provider_id}
          providerEmail={logCallProvider.email}
          onLog={() => setLogCallProvider(null)}
          onCancel={() => setLogCallProvider(null)}
        />
      )}
    </div>
  );
}
