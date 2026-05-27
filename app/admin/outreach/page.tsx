"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DateRangePopover, {
  resolveRange,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FilterTab = "all" | "has_responses" | "pending_only";

interface OutreachItem {
  id: string;
  status: "pending" | "accepted" | "declined";
  message: string | null;
  created_at: string;
  family: {
    id: string;
    name: string;
    location: string;
  };
  reply_message?: string | null;
  replied_at?: string | null;
}

interface ProviderOutreach {
  provider: {
    id: string;
    name: string;
    slug: string;
    location: string;
  };
  stats: {
    total: number;
    pending: number;
    accepted: number;
    declined: number;
  };
  outreach: OutreachItem[];
  lastActivity: string | null;
}

interface OutreachData {
  providers: ProviderOutreach[];
  totals: {
    providers: number;
    sent: number;
    accepted: number;
    declined: number;
    pending: number;
  };
}

interface TabCount {
  all: number;
  has_responses: number;
  pending_only: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(isoDate: string | undefined | null): string {
  if (!isoDate) return "—";
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Calculate response time between two dates
function responseTime(sentAt: string, repliedAt: string): string {
  const sent = new Date(sentAt).getTime();
  const replied = new Date(repliedAt).getTime();
  const diffMs = replied - sent;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return "< 1h";
  if (hours < 24) return `${hours}h`;
  if (days === 1) return "1 day";
  return `${days} days`;
}

// Truncate text with ellipsis
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  highlight,
  color,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
  color?: "emerald" | "amber" | "gray";
}) {
  const colorClasses = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    gray: "text-gray-500",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        highlight
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className={`text-2xl font-semibold tabular-nums ${color ? colorClasses[color] : "text-gray-900"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge Component
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "pending" | "accepted" | "declined" }) {
  const config = {
    accepted: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      label: "Accepted",
    },
    declined: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      dot: "bg-gray-400",
      label: "Declined",
    },
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500 animate-pulse",
      label: "Pending",
    },
  };

  const { bg, text, dot, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible Message Component
// ─────────────────────────────────────────────────────────────────────────────

const MESSAGE_TRUNCATE_LENGTH = 150;

function CollapsibleMessage({
  message,
  variant,
  label,
  subLabel,
}: {
  message: string;
  variant: "provider" | "family";
  label: string;
  subLabel?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsTruncation = message.length > MESSAGE_TRUNCATE_LENGTH;

  const displayText = isExpanded || !needsTruncation
    ? message
    : truncateText(message, MESSAGE_TRUNCATE_LENGTH);

  const colors = variant === "provider"
    ? { bg: "bg-blue-50", border: "border-blue-100", label: "text-blue-600", text: "text-blue-900" }
    : { bg: "bg-emerald-50", border: "border-emerald-100", label: "text-emerald-600", text: "text-emerald-900" };

  return (
    <div className={`${colors.bg} rounded-lg px-3 py-2.5 border ${colors.border}`}>
      <p className={`text-[11px] font-medium ${colors.label} mb-1 uppercase tracking-wide`}>
        {label}
        {subLabel && (
          <span className="font-normal ml-2 normal-case">{subLabel}</span>
        )}
      </p>
      <p className={`text-sm ${colors.text} whitespace-pre-wrap leading-relaxed`}>
        {displayText}
      </p>
      {needsTruncation && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`mt-1.5 text-xs font-medium ${colors.label} hover:underline`}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Row Component
// ─────────────────────────────────────────────────────────────────────────────

function ProviderRow({
  data,
  isExpanded,
  onToggle,
}: {
  data: ProviderOutreach;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { provider, stats, outreach, lastActivity } = data;
  const router = useRouter();

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Row Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        {/* Expand Icon */}
        <div className="w-5 shrink-0">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
          </svg>
        </div>

        {/* Provider Info */}
        <div className="flex-[2] min-w-0">
          <Link
            href={`/admin/directory/${provider.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-gray-900 hover:text-primary-600 transition-colors truncate block"
          >
            {provider.name}
          </Link>
          {provider.location && (
            <p className="text-sm text-gray-500 truncate">{provider.location}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-gray-900 tabular-nums">{stats.total}</p>
          <p className="text-xs text-gray-400">Sent</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-emerald-600 tabular-nums">{stats.accepted}</p>
          <p className="text-xs text-gray-400">Accepted</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-gray-500 tabular-nums">{stats.declined}</p>
          <p className="text-xs text-gray-400">Declined</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-amber-600 tabular-nums">{stats.pending}</p>
          <p className="text-xs text-gray-400">Pending</p>
        </div>

        {/* Last Activity */}
        <div className="w-24 text-right">
          <p className="text-sm text-gray-400">
            {timeAgo(lastActivity)}
          </p>
        </div>
      </div>

      {/* Expanded Content - Individual Outreach Items */}
      {isExpanded && (
        <div className="bg-gray-50/50 border-t border-gray-100">
          {outreach.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400 italic">No outreach yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {outreach.map((item) => (
                <div key={item.id} className="px-5 py-4 pl-14">
                  {/* Family + Status Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/care-seekers/${item.family.id}`)}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors text-left"
                      >
                        → {item.family.name}
                      </button>
                      {item.family.location && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.family.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-gray-400">{timeAgo(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Message Thread */}
                  <div className="space-y-2">
                    {/* Provider's message */}
                    {item.message && (
                      <CollapsibleMessage
                        message={item.message}
                        variant="provider"
                        label="Provider&apos;s Message"
                      />
                    )}

                    {/* Family's reply */}
                    {item.status === "accepted" && item.reply_message && (
                      <CollapsibleMessage
                        message={item.reply_message}
                        variant="family"
                        label="Family&apos;s Reply"
                        subLabel={item.replied_at ? `· Responded in ${responseTime(item.created_at, item.replied_at)}` : undefined}
                      />
                    )}

                    {/* Status context */}
                    {item.status === "accepted" && !item.reply_message && (
                      <p className="text-xs text-emerald-600 italic pl-1">
                        ✓ Family accepted — conversation can continue via contact info
                      </p>
                    )}
                    {item.status === "declined" && (
                      <p className="text-xs text-gray-500 italic pl-1">
                        Family declined this connection request
                      </p>
                    )}
                    {item.status === "pending" && (
                      <p className="text-xs text-amber-600 italic pl-1">
                        Awaiting family response...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function AdminOutreachPage() {
  const [data, setData] = useState<OutreachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Date range filter
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    preset: "30d",
    customFrom: "",
    customTo: "",
  });

  // Pagination
  const [page, setPage] = useState(1);

  // Expanded state
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());

  // Debounce search
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filter, dateRange]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Apply date range filter
      const resolved = resolveRange(dateRange);
      if (resolved.from) params.set("from_date", resolved.from);
      if (resolved.to) params.set("to_date", resolved.to);

      const url = `/api/admin/outreach${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);

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
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // First filter by search (used for tab counts)
  const searchFilteredProviders = data?.providers.filter((p) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    const matchesName = p.provider.name.toLowerCase().includes(q);
    const matchesLocation = p.provider.location.toLowerCase().includes(q);
    const matchesFamily = p.outreach.some((o) => o.family.name.toLowerCase().includes(q));
    return matchesName || matchesLocation || matchesFamily;
  }) ?? [];

  // Tab counts (based on search-filtered results)
  const tabCounts: TabCount = {
    all: searchFilteredProviders.length,
    has_responses: searchFilteredProviders.filter((p) => p.stats.accepted > 0 || p.stats.declined > 0).length,
    pending_only: searchFilteredProviders.filter((p) => p.stats.pending > 0 && p.stats.accepted === 0 && p.stats.declined === 0).length,
  };

  // Then apply tab filter for final display
  const filteredProviders = searchFilteredProviders.filter((p) => {
    switch (filter) {
      case "has_responses":
        return p.stats.accepted > 0 || p.stats.declined > 0;
      case "pending_only":
        return p.stats.pending > 0 && p.stats.accepted === 0 && p.stats.declined === 0;
      default:
        return true;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredProviders.length / PAGE_SIZE);
  const paginatedProviders = filteredProviders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Toggle provider expansion
  const toggleProvider = (providerId: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  // Calculate accept rate
  const acceptRate = data && data.totals.sent > 0
    ? Math.round((data.totals.accepted / data.totals.sent) * 100)
    : 0;

  const tabs: { value: FilterTab; label: string; count: number }[] = [
    { value: "all", label: "All Providers", count: tabCounts.all },
    { value: "has_responses", label: "Has Responses", count: tabCounts.has_responses },
    { value: "pending_only", label: "Pending Only", count: tabCounts.pending_only },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Provider Outreach
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track providers reaching out to families via Find Families
          </p>
        </div>

        {/* Date Range Filter */}
        <DateRangePopover value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      {data && (
        <div className="grid grid-cols-6 gap-3 mb-6">
          <StatCard label="Active Providers" value={data.totals.providers} />
          <StatCard label="Total Sent" value={data.totals.sent} />
          <StatCard label="Accepted" value={data.totals.accepted} color="emerald" highlight />
          <StatCard label="Declined" value={data.totals.declined} color="gray" />
          <StatCard label="Pending" value={data.totals.pending} color="amber" />
          <StatCard label="Accept Rate" value={`${acceptRate}%`} color="emerald" />
        </div>
      )}

      {/* Filter Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={[
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === tab.value
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {tab.label}
              <span
                className={[
                  "ml-1.5 px-1.5 py-0.5 rounded text-xs",
                  filter === tab.value
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-500",
                ].join(" ")}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search providers or families..."
            className="w-64 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Provider List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <div className="w-5" /> {/* Expand icon space */}
          <div className="flex-[2]">Provider</div>
          <div className="flex-1 text-center">Sent</div>
          <div className="flex-1 text-center">Accepted</div>
          <div className="flex-1 text-center">Declined</div>
          <div className="flex-1 text-center">Pending</div>
          <div className="w-24 text-right">Last Active</div>
        </div>

        {/* Loading / Empty / List */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          </div>
        ) : paginatedProviders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium">
              {debouncedSearch ? "No matching providers" : "No outreach yet"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {debouncedSearch
                ? "Try a different search term"
                : "When providers reach out to families, they'll appear here."
              }
            </p>
          </div>
        ) : (
          <div>
            {paginatedProviders.map((provider) => (
              <ProviderRow
                key={provider.provider.id}
                data={provider}
                isExpanded={expandedProviders.has(provider.provider.id)}
                onToggle={() => toggleProvider(provider.provider.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredProviders.length > 0 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-gray-500">
            {filteredProviders.length <= PAGE_SIZE
              ? `${filteredProviders.length} provider${filteredProviders.length === 1 ? "" : "s"}`
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredProviders.length)} of ${filteredProviders.length}`
            }
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
