"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProviderInfo {
  name: string;
  category: string;
  city: string;
  state: string;
  slug: string;
  claimed?: boolean;
}

interface ActivityEvent {
  id: string;
  provider_id: string;
  event_type: string;
  email_type: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  provider: ProviderInfo | null;
}

interface ProviderAgg {
  provider_id: string;
  total_clicks: number;
  last_active: string;
  email_types: Record<string, number>;
  recent_clicks_7d: number;
  provider: ProviderInfo | null;
}

type View = "feed" | "providers";
type TimeWindow = "7" | "30" | "90";
type EmailTypeFilter = "" | "connection_request" | "question_received" | "new_review";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function emailTypeLabel(type: string | null): string {
  if (!type) return "Email";
  const map: Record<string, string> = {
    connection_request: "Lead",
    question_received: "Question",
    new_review: "Review",
    add_email_notification: "Lead",
  };
  return map[type] || type;
}

function emailTypeBadgeColor(type: string | null): string {
  if (!type) return "bg-gray-100 text-gray-600";
  const map: Record<string, string> = {
    connection_request: "bg-blue-50 text-blue-700",
    question_received: "bg-amber-50 text-amber-700",
    new_review: "bg-violet-50 text-violet-700",
    add_email_notification: "bg-blue-50 text-blue-700",
  };
  return map[type] || "bg-gray-100 text-gray-600";
}

function engagementLabel(clicks7d: number): { text: string; className: string } {
  if (clicks7d >= 3) return { text: "Hot", className: "bg-teal-50 text-teal-700" };
  if (clicks7d >= 1) return { text: "Active this week", className: "bg-emerald-50 text-emerald-600" };
  return { text: "Gone quiet", className: "bg-gray-50 text-gray-400" };
}

function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    "Home Care (Non-medical)": "Home Care",
    "Home Health Care": "Home Health",
    "Assisted Living": "Assisted Living",
    "Memory Care": "Memory Care",
    "Nursing Homes": "Nursing Home",
    "Independent Living": "Independent Living",
  };
  return map[category] || category;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={[
            "px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-150",
            value === opt.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3.5 border-b border-gray-50">
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-50 rounded animate-pulse" />
          <div className="ml-auto h-4 w-12 bg-gray-50 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed View
// ---------------------------------------------------------------------------

function FeedView({
  events,
  loading,
  total,
  page,
  setPage,
  pageSize,
}: {
  events: ActivityEvent[];
  loading: boolean;
  total: number;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
}) {
  if (loading) return <Skeleton rows={8} />;

  if (events.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-gray-400">
          No provider activity yet. Activity will appear here as providers engage with email notifications.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-0">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 py-3.5 border-b border-gray-100/80 group"
          >
            {/* Provider name */}
            <div className="min-w-0 flex-1">
              {event.provider ? (
                <Link
                  href={`/admin/directory/${event.provider_id}`}
                  className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors truncate block"
                >
                  {event.provider.name}
                </Link>
              ) : (
                <span className="text-sm font-medium text-gray-500 truncate block">
                  {event.provider_id}
                </span>
              )}
              {event.provider && (
                <span className="text-xs text-gray-400">
                  {categoryLabel(event.provider.category)}
                  {event.provider.city && ` \u00b7 ${event.provider.city}, ${event.provider.state}`}
                </span>
              )}
            </div>

            {/* Email type badge */}
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${emailTypeBadgeColor(
                event.email_type
              )}`}
            >
              {emailTypeLabel(event.email_type)}
            </span>

            {/* Timestamp */}
            <span className="text-xs text-gray-400 shrink-0 w-20 text-right">
              {relativeTime(event.created_at)}
            </span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-gray-400">
            {page * pageSize + 1}&ndash;{Math.min((page + 1) * pageSize, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * pageSize >= total}
              className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Providers View
// ---------------------------------------------------------------------------

function ProvidersView({
  providers,
  loading,
  total,
  page,
  setPage,
  pageSize,
}: {
  providers: ProviderAgg[];
  loading: boolean;
  total: number;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
}) {
  if (loading) return <Skeleton rows={8} />;

  if (providers.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-gray-400">
          No provider activity yet. Providers who click email links will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Table header */}
      <div className="flex items-center gap-3 py-2.5 border-b border-gray-200 text-xs text-gray-400 font-medium">
        <div className="flex-1 min-w-0">Provider</div>
        <div className="w-16 text-center">Clicks</div>
        <div className="w-24 text-center">Status</div>
        <div className="w-20 text-right">Last active</div>
      </div>

      <div className="space-y-0">
        {providers.map((p) => {
          const engagement = engagementLabel(p.recent_clicks_7d);
          return (
            <div
              key={p.provider_id}
              className="flex items-center gap-3 py-3.5 border-b border-gray-100/80"
            >
              {/* Provider info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {p.provider ? (
                    <Link
                      href={`/admin/directory/${p.provider_id}`}
                      className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors truncate"
                    >
                      {p.provider.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-gray-500 truncate">
                      {p.provider_id}
                    </span>
                  )}
                  {p.provider && !p.provider.claimed && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 shrink-0">
                      Unclaimed
                    </span>
                  )}
                  {p.provider?.claimed && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 shrink-0">
                      Claimed
                    </span>
                  )}
                </div>
                {p.provider && (
                  <span className="text-xs text-gray-400">
                    {categoryLabel(p.provider.category)}
                    {p.provider.city && ` \u00b7 ${p.provider.city}, ${p.provider.state}`}
                  </span>
                )}
                {/* Email type breakdown */}
                {Object.keys(p.email_types).length > 0 && (
                  <div className="flex gap-1.5 mt-1">
                    {Object.entries(p.email_types).map(([type, count]) => (
                      <span
                        key={type}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${emailTypeBadgeColor(type)}`}
                      >
                        {emailTypeLabel(type)} {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Click count */}
              <div className="w-16 text-center">
                <span className="text-sm font-medium text-gray-900">
                  {p.total_clicks}
                </span>
              </div>

              {/* Engagement status */}
              <div className="w-24 text-center">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${engagement.className}`}
                >
                  {engagement.text}
                </span>
              </div>

              {/* Last active */}
              <div className="w-20 text-right">
                <span className="text-xs text-gray-400">
                  {relativeTime(p.last_active)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-gray-400">
            {page * pageSize + 1}&ndash;{Math.min((page + 1) * pageSize, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * pageSize >= total}
              className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 40;

export default function ActivityCenterPage() {
  const [view, setView] = useState<View>("providers");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("30");
  const [emailTypeFilter, setEmailTypeFilter] = useState<EmailTypeFilter>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const [feedEvents, setFeedEvents] = useState<ActivityEvent[]>([]);
  const [feedTotal, setFeedTotal] = useState(0);
  const [providerRows, setProviderRows] = useState<ProviderAgg[]>([]);
  const [providersTotal, setProvidersTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [view, timeWindow, emailTypeFilter, search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        view,
        days: timeWindow,
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (emailTypeFilter) params.set("email_type", emailTypeFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/activity?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      if (view === "feed") {
        setFeedEvents(data.events || []);
        setFeedTotal(data.total || 0);
      } else {
        setProviderRows(data.providers || []);
        setProvidersTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Activity fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [view, timeWindow, emailTypeFilter, search, page]);

  // Fetch total count for the header (all time)
  useEffect(() => {
    fetch("/api/admin/activity?view=feed&days=9999&count_only=true")
      .then((r) => r.json())
      .then((d) => setTotalCount(d.count || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (val: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearch(val), 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
          Activity Center
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {totalCount !== null
            ? totalCount === 0
              ? "Waiting for first email click"
              : `${totalCount} total engagement${totalCount === 1 ? "" : "s"} tracked`
            : "\u00a0"}
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          options={[
            { label: "Providers", value: "providers" as View },
            { label: "Feed", value: "feed" as View },
          ]}
          value={view}
          onChange={setView}
        />

        <SegmentedControl
          options={[
            { label: "7d", value: "7" as TimeWindow },
            { label: "30d", value: "30" as TimeWindow },
            { label: "90d", value: "90" as TimeWindow },
          ]}
          value={timeWindow}
          onChange={setTimeWindow}
        />

        <select
          value={emailTypeFilter}
          onChange={(e) =>
            setEmailTypeFilter(e.target.value as EmailTypeFilter)
          }
          className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          <option value="">All types</option>
          <option value="connection_request">Leads</option>
          <option value="question_received">Questions</option>
          <option value="new_review">Reviews</option>
        </select>

        <div className="ml-auto">
          <input
            type="text"
            placeholder="Search providers..."
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-48 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>
      </div>

      {/* Content */}
      {view === "feed" ? (
        <FeedView
          events={feedEvents}
          loading={loading}
          total={feedTotal}
          page={page}
          setPage={setPage}
          pageSize={PAGE_SIZE}
        />
      ) : (
        <ProvidersView
          providers={providerRows}
          loading={loading}
          total={providersTotal}
          page={page}
          setPage={setPage}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  );
}
