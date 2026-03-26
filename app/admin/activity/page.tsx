"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

interface FamilyInfo {
  name: string;
  email: string | null;
  city: string | null;
  state: string | null;
  care_types: string[];
  timeline: string | null;
  account_id: string | null;
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

interface FamilyEvent {
  id: string;
  profile_id: string;
  event_type: string;
  email_type: string | null;
  related_provider_id: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  family: FamilyInfo | null;
}

interface ProviderAgg {
  provider_id: string;
  total_clicks: number;
  last_active: string;
  email_types: Record<string, number>;
  recent_clicks_7d: number;
  provider: ProviderInfo | null;
}

interface FamilyAgg {
  profile_id: string;
  total_events: number;
  last_active: string;
  event_types: Record<string, number>;
  recent_events_7d: number;
  connections_count: number;
  providers_contacted: number;
  family: FamilyInfo | null;
}

type Actor = "providers" | "families";
type SubView = "people" | "feed";
type TimeWindow = "7" | "30" | "90";

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

function providerEmailTypeLabel(type: string | null): string {
  if (!type) return "Email";
  const map: Record<string, string> = {
    connection_request: "Lead",
    question_received: "Question",
    new_review: "Review",
    add_email_notification: "Lead",
  };
  return map[type] || type;
}

function providerEmailTypeBadgeColor(type: string | null): string {
  if (!type) return "bg-gray-100 text-gray-600";
  const map: Record<string, string> = {
    connection_request: "bg-blue-50 text-blue-700",
    question_received: "bg-amber-50 text-amber-700",
    new_review: "bg-violet-50 text-violet-700",
    add_email_notification: "bg-blue-50 text-blue-700",
  };
  return map[type] || "bg-gray-100 text-gray-600";
}

function familyEventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    connection_sent: "Connection",
    profile_enriched: "Profile",
    email_click: "Email",
    question_asked: "Question",
    matches_activated: "Matches",
  };
  return map[type] || type;
}

function familyEventTypeBadgeColor(type: string): string {
  const map: Record<string, string> = {
    connection_sent: "bg-blue-50 text-blue-700",
    profile_enriched: "bg-violet-50 text-violet-700",
    email_click: "bg-amber-50 text-amber-700",
    question_asked: "bg-teal-50 text-teal-700",
    matches_activated: "bg-emerald-50 text-emerald-700",
  };
  return map[type] || "bg-gray-100 text-gray-600";
}

function engagementLabel(count7d: number): { text: string; className: string } {
  if (count7d >= 3) return { text: "Hot", className: "bg-teal-50 text-teal-700" };
  if (count7d >= 1) return { text: "Active this week", className: "bg-emerald-50 text-emerald-600" };
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

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "ASAP",
  within_1_month: "1 mo",
  within_3_months: "3 mo",
  exploring: "Exploring",
};

// ---------------------------------------------------------------------------
// Shared Components
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

function Pagination({ page, setPage, total, pageSize }: {
  page: number; setPage: (p: number) => void; total: number; pageSize: number;
}) {
  if (total <= pageSize) return null;
  return (
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
  );
}

// ---------------------------------------------------------------------------
// Provider Feed View
// ---------------------------------------------------------------------------

function ProviderFeedView({ events, loading, total, page, setPage, pageSize }: {
  events: ActivityEvent[]; loading: boolean; total: number;
  page: number; setPage: (p: number) => void; pageSize: number;
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
          <div key={event.id} className="flex items-center gap-3 py-3.5 border-b border-gray-100/80 group">
            <div className="min-w-0 flex-1">
              <a href={`/provider/${event.provider?.slug || event.provider_id}`} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors truncate block">
                {event.provider?.name || event.provider_id}
              </a>
              {event.provider && (
                <span className="text-xs text-gray-400">
                  {categoryLabel(event.provider.category)}
                  {event.provider.city && ` \u00b7 ${event.provider.city}, ${event.provider.state}`}
                </span>
              )}
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${providerEmailTypeBadgeColor(event.email_type)}`}>
              {providerEmailTypeLabel(event.email_type)}
            </span>
            <span className="text-xs text-gray-400 shrink-0 w-20 text-right">{relativeTime(event.created_at)}</span>
          </div>
        ))}
      </div>
      <Pagination page={page} setPage={setPage} total={total} pageSize={pageSize} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Providers People View
// ---------------------------------------------------------------------------

function ProvidersPeopleView({ providers, loading, total, page, setPage, pageSize }: {
  providers: ProviderAgg[]; loading: boolean; total: number;
  page: number; setPage: (p: number) => void; pageSize: number;
}) {
  if (loading) return <Skeleton rows={8} />;
  if (providers.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-gray-400">No provider activity yet. Providers who click email links will appear here.</p>
      </div>
    );
  }
  return (
    <div>
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
            <div key={p.provider_id} className="flex items-center gap-3 py-3.5 border-b border-gray-100/80">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <a href={`/provider/${p.provider?.slug || p.provider_id}`} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors truncate">
                    {p.provider?.name || p.provider_id}
                  </a>
                  {p.provider && !p.provider.claimed && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 shrink-0">Unclaimed</span>
                  )}
                  {p.provider?.claimed && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 shrink-0">Claimed</span>
                  )}
                </div>
                {p.provider && (
                  <span className="text-xs text-gray-400">
                    {categoryLabel(p.provider.category)}
                    {p.provider.city && ` \u00b7 ${p.provider.city}, ${p.provider.state}`}
                  </span>
                )}
                {Object.keys(p.email_types).length > 0 && (
                  <div className="flex gap-1.5 mt-1">
                    {Object.entries(p.email_types).map(([type, count]) => (
                      <span key={type} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${providerEmailTypeBadgeColor(type)}`}>
                        {providerEmailTypeLabel(type)} {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-16 text-center"><span className="text-sm font-medium text-gray-900">{p.total_clicks}</span></div>
              <div className="w-24 text-center">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${engagement.className}`}>{engagement.text}</span>
              </div>
              <div className="w-20 text-right"><span className="text-xs text-gray-400">{relativeTime(p.last_active)}</span></div>
            </div>
          );
        })}
      </div>
      <Pagination page={page} setPage={setPage} total={total} pageSize={pageSize} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Family Feed View
// ---------------------------------------------------------------------------

function FamilyFeedView({ events, loading, total, page, setPage, pageSize }: {
  events: FamilyEvent[]; loading: boolean; total: number;
  page: number; setPage: (p: number) => void; pageSize: number;
}) {
  if (loading) return <Skeleton rows={8} />;
  if (events.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-gray-400">
          No family activity yet. Events will appear here as care seekers connect with providers, complete profiles, and click email links.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="space-y-0">
        {events.map((event) => (
          <div key={event.id} className="flex items-center gap-3 py-3.5 border-b border-gray-100/80 group">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/care-seekers/${event.profile_id}`}
                className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors truncate block">
                {event.family?.name || "Unknown"}
              </Link>
              {event.family && (
                <span className="text-xs text-gray-400">
                  {event.family.care_types[0] && categoryLabel(event.family.care_types[0])}
                  {event.family.city && ` \u00b7 ${event.family.city}, ${event.family.state}`}
                  {event.family.timeline && ` \u00b7 ${TIMELINE_LABELS[event.family.timeline] || event.family.timeline}`}
                </span>
              )}
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${familyEventTypeBadgeColor(event.event_type)}`}>
              {familyEventTypeLabel(event.event_type)}
            </span>
            <span className="text-xs text-gray-400 shrink-0 w-20 text-right">{relativeTime(event.created_at)}</span>
          </div>
        ))}
      </div>
      <Pagination page={page} setPage={setPage} total={total} pageSize={pageSize} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Families People View
// ---------------------------------------------------------------------------

function FamiliesPeopleView({ families, loading, total, page, setPage, pageSize }: {
  families: FamilyAgg[]; loading: boolean; total: number;
  page: number; setPage: (p: number) => void; pageSize: number;
}) {
  if (loading) return <Skeleton rows={8} />;
  if (families.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-gray-400">
          No family activity yet. Families who connect with providers will appear here.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center gap-3 py-2.5 border-b border-gray-200 text-xs text-gray-400 font-medium">
        <div className="flex-1 min-w-0">Family</div>
        <div className="w-16 text-center">Events</div>
        <div className="w-20 text-center">Connects</div>
        <div className="w-24 text-center">Status</div>
        <div className="w-20 text-right">Last active</div>
      </div>
      <div className="space-y-0">
        {families.map((f) => {
          const engagement = engagementLabel(f.recent_events_7d);
          return (
            <div key={f.profile_id} className="flex items-center gap-3 py-3.5 border-b border-gray-100/80">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/care-seekers/${f.profile_id}`}
                    className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors truncate">
                    {f.family?.name || "Unknown"}
                  </Link>
                  {f.family?.timeline && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                      f.family.timeline === "immediate" ? "bg-red-50 text-red-600" :
                      f.family.timeline === "within_1_month" ? "bg-amber-50 text-amber-600" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      {TIMELINE_LABELS[f.family.timeline] || f.family.timeline}
                    </span>
                  )}
                  {f.family && !f.family.account_id && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 shrink-0">Guest</span>
                  )}
                </div>
                {f.family && (
                  <span className="text-xs text-gray-400">
                    {f.family.care_types[0] && categoryLabel(f.family.care_types[0])}
                    {f.family.city && ` \u00b7 ${f.family.city}, ${f.family.state}`}
                  </span>
                )}
                {Object.keys(f.event_types).length > 0 && (
                  <div className="flex gap-1.5 mt-1">
                    {Object.entries(f.event_types).map(([type, count]) => (
                      <span key={type} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${familyEventTypeBadgeColor(type)}`}>
                        {familyEventTypeLabel(type)} {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-16 text-center"><span className="text-sm font-medium text-gray-900">{f.total_events}</span></div>
              <div className="w-20 text-center"><span className="text-sm font-medium text-gray-900">{f.connections_count}</span></div>
              <div className="w-24 text-center">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${engagement.className}`}>{engagement.text}</span>
              </div>
              <div className="w-20 text-right"><span className="text-xs text-gray-400">{relativeTime(f.last_active)}</span></div>
            </div>
          );
        })}
      </div>
      <Pagination page={page} setPage={setPage} total={total} pageSize={pageSize} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 40;

const PROVIDER_EVENT_FILTER_OPTIONS = [
  { value: "", label: "All types" },
  { value: "connection_request", label: "Leads" },
  { value: "question_received", label: "Questions" },
  { value: "new_review", label: "Reviews" },
];

const FAMILY_EVENT_FILTER_OPTIONS = [
  { value: "", label: "All types" },
  { value: "connection_sent", label: "Connections" },
  { value: "profile_enriched", label: "Profile" },
  { value: "email_click", label: "Email clicks" },
  { value: "question_asked", label: "Questions" },
  { value: "matches_activated", label: "Matches" },
];

export default function ActivityCenterPage() {
  const urlParams = useSearchParams();
  const initialActor = (urlParams.get("actor") as Actor) || "providers";

  const [actor, setActor] = useState<Actor>(initialActor);
  const [subView, setSubView] = useState<SubView>("people");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("30");
  const [eventFilter, setEventFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Provider data
  const [providerFeedEvents, setProviderFeedEvents] = useState<ActivityEvent[]>([]);
  const [providerFeedTotal, setProviderFeedTotal] = useState(0);
  const [providerRows, setProviderRows] = useState<ProviderAgg[]>([]);
  const [providersTotal, setProvidersTotal] = useState(0);

  // Family data
  const [familyFeedEvents, setFamilyFeedEvents] = useState<FamilyEvent[]>([]);
  const [familyFeedTotal, setFamilyFeedTotal] = useState(0);
  const [familyRows, setFamilyRows] = useState<FamilyAgg[]>([]);
  const [familiesTotal, setFamiliesTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset page and event filter when actor or subView changes
  useEffect(() => {
    setPage(0);
    setEventFilter("");
  }, [actor, subView]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [timeWindow, eventFilter, search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        actor,
        days: timeWindow,
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });

      if (subView === "feed") {
        params.set("view", "feed");
      } else {
        params.set("view", "people");
      }

      if (eventFilter) params.set("event_type", eventFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/activity?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      if (actor === "families") {
        if (subView === "feed") {
          setFamilyFeedEvents(data.events || []);
          setFamilyFeedTotal(data.total || 0);
        } else {
          setFamilyRows(data.families || []);
          setFamiliesTotal(data.total || 0);
        }
      } else {
        if (subView === "feed") {
          setProviderFeedEvents(data.events || []);
          setProviderFeedTotal(data.total || 0);
        } else {
          setProviderRows(data.providers || []);
          setProvidersTotal(data.total || 0);
        }
      }
    } catch (err) {
      console.error("Activity fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [actor, subView, timeWindow, eventFilter, search, page]);

  // Fetch total counts for header
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/activity?actor=providers&view=feed&days=9999&count_only=true").then(r => r.json()).catch(() => ({ count: 0 })),
      fetch("/api/admin/activity?actor=families&view=feed&days=9999&count_only=true").then(r => r.json()).catch(() => ({ count: 0 })),
    ]).then(([prov, fam]) => {
      setTotalCount((prov.count || 0) + (fam.count || 0));
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (val: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearch(val), 300);
  };

  const filterOptions = actor === "families" ? FAMILY_EVENT_FILTER_OPTIONS : PROVIDER_EVENT_FILTER_OPTIONS;

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
              ? "Waiting for first engagement"
              : `${totalCount} total engagement${totalCount === 1 ? "" : "s"} tracked`
            : "\u00a0"}
        </p>
      </div>

      {/* Actor toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          options={[
            { label: "Providers", value: "providers" as Actor },
            { label: "Families", value: "families" as Actor },
          ]}
          value={actor}
          onChange={setActor}
        />

        <div className="w-px h-5 bg-gray-200" />

        <SegmentedControl
          options={[
            { label: "People", value: "people" as SubView },
            { label: "Feed", value: "feed" as SubView },
          ]}
          value={subView}
          onChange={setSubView}
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
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="ml-auto">
          <input
            type="text"
            placeholder={actor === "families" ? "Search families..." : "Search providers..."}
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-48 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>
      </div>

      {/* Content */}
      {actor === "families" ? (
        subView === "feed" ? (
          <FamilyFeedView
            events={familyFeedEvents} loading={loading} total={familyFeedTotal}
            page={page} setPage={setPage} pageSize={PAGE_SIZE}
          />
        ) : (
          <FamiliesPeopleView
            families={familyRows} loading={loading} total={familiesTotal}
            page={page} setPage={setPage} pageSize={PAGE_SIZE}
          />
        )
      ) : (
        subView === "feed" ? (
          <ProviderFeedView
            events={providerFeedEvents} loading={loading} total={providerFeedTotal}
            page={page} setPage={setPage} pageSize={PAGE_SIZE}
          />
        ) : (
          <ProvidersPeopleView
            providers={providerRows} loading={loading} total={providersTotal}
            page={page} setPage={setPage} pageSize={PAGE_SIZE}
          />
        )
      )}
    </div>
  );
}
