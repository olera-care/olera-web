"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import PulseHeader from "@/components/admin/PulseHeader";
import { resolveRange, type DateRangeValue } from "@/components/admin/DateRangePopover";
import ConnectionRow, { type ConnectionRowData } from "@/components/admin/ConnectionRow";

// Per-provider engagement data (messaged/providerResponded is per-connection via c.responded)
type Engagement = { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean; phone_copied: boolean; email_copied: boolean; phone_clicked: boolean; email_link_clicked: boolean; continue_in_inbox: boolean };

// Direction type for inbound/outbound toggle
type Direction = "inbound" | "outbound";

interface WorkflowCounts {
  all: number;
  needs_attention: number;
  awaiting_provider: number;
  awaiting_family: number;
  connected: number;
  stuck: number;
}

interface EngagementCounts {
  all: number;
  awaiting: number;
  viewed: number;
  connected: number;
  needs_follow_up: number;
  declined: number;
  needs_email: number;
  archived: number;
}

interface FamilyEngagementCounts {
  all: number;
  new: number;
  awaiting: number;
  connected: number;
  needs_follow_up: number;
}

interface FunnelStats {
  total: number;
  providerViewed: number;
  providerViewedRate: number;
  responded: number;
  respondedRate: number;
  connected: number;
  connectedRate: number;
}

interface ProviderActions {
  viewed: number;
  copiedPhone: number;
  copiedEmail: number;
  messaged: number;
  declined: number;
  copiedPhoneRate: number;
  copiedEmailRate: number;
  messagedRate: number;
  declinedRate: number;
}

interface ListResponse {
  connections: (ConnectionRowData & { provider: { activityKey: string | null }; engagementLevel: EngagementLevel; familyEngagementLevel: FamilyEngagementLevel; lastMessageAt: string | null })[];
  total: number;
  perspective: Perspective;
  workflowCounts: WorkflowCounts;
  engagementCounts: EngagementCounts;
  familyEngagementCounts: FamilyEngagementCounts;
  funnelStats: FunnelStats;
  providerActions: ProviderActions;
  engagement: Record<string, Engagement>;
  truncated: boolean;
}

// Engagement level type
type EngagementLevel = "awaiting" | "viewed" | "connected" | "needs_follow_up";
type FamilyEngagementLevel = "new" | "awaiting" | "connected" | "needs_follow_up";

// Perspective type
type Perspective = "provider" | "family";

// Engagement-based tabs
type ProviderFilterKey = "all" | EngagementLevel | "needs_email" | "declined" | "admin_not_interested" | "archived";
type FamilyFilterKey = "all" | FamilyEngagementLevel;
type FilterKey = ProviderFilterKey | FamilyFilterKey;

interface TabConfig {
  key: FilterKey;
  label: string;
  description: string;
  emptyMessage: string;
}

// Provider perspective tabs
// First 4: Provider lifecycle (what providers do)
// Rest: Admin workflow (what admin handles)
const PROVIDER_TABS: TabConfig[] = [
  // Provider actions
  { key: "awaiting", label: "Awaiting", description: "Provider hasn't engaged yet, automation still working", emptyMessage: "No leads awaiting provider engagement." },
  { key: "viewed", label: "Viewed", description: "Provider opened the lead drawer", emptyMessage: "No leads have been viewed yet." },
  { key: "connected", label: "Connected", description: "Provider reached out to family", emptyMessage: "No connected leads yet." },
  { key: "declined", label: "Declined", description: "Provider declined lead in portal (not a fit, not accepting clients, etc.)", emptyMessage: "No declined leads." },
  // Admin workflow
  { key: "needs_follow_up", label: "Needs Follow-up", description: "Email sequence complete, no response - requires manual intervention", emptyMessage: "No providers need follow-up." },
  { key: "needs_email", label: "Needs Email", description: "Provider has no email, invalid email, or delivery failed", emptyMessage: "All providers have working emails." },
  { key: "admin_not_interested", label: "Not Interested", description: "Admin confirmed provider not interested (soft rejection)", emptyMessage: "No leads marked as not interested." },
  { key: "archived", label: "Archived", description: "Admin-archived providers - no emails sent to them", emptyMessage: "No archived providers." },
  { key: "all", label: "All", description: "Everything", emptyMessage: "No connections yet." },
];

// Family perspective tabs
const FAMILY_TABS: TabConfig[] = [
  { key: "new", label: "New", description: "Provider hasn't responded yet", emptyMessage: "No connections awaiting provider response." },
  { key: "awaiting", label: "Awaiting", description: "Provider responded, awaiting family reply", emptyMessage: "No families awaiting response." },
  { key: "connected", label: "Connected", description: "Family replied to provider", emptyMessage: "No families have replied yet." },
  { key: "needs_follow_up", label: "Needs Follow-up", description: "No family activity for 10+ days, requires manual intervention", emptyMessage: "No families need follow-up." },
  { key: "all", label: "All", description: "Everything", emptyMessage: "No connections yet." },
];

// Outbound tabs (provider-initiated outreach to families)
type OutboundFilterKey = "all" | "accepted" | "pending" | "declined";
interface OutboundTabConfig {
  key: OutboundFilterKey;
  label: string;
  description: string;
  emptyMessage: string;
}

const OUTBOUND_TABS: OutboundTabConfig[] = [
  { key: "all", label: "All", description: "All outreach", emptyMessage: "No outreach sent yet." },
  { key: "accepted", label: "Accepted", description: "Family accepted the request", emptyMessage: "No accepted requests yet." },
  { key: "pending", label: "Pending", description: "Awaiting family response", emptyMessage: "No pending requests." },
  { key: "declined", label: "Declined", description: "Family declined the request", emptyMessage: "No declined requests." },
];

// Outbound connection type from API
interface OutboundConnection {
  id: string;
  type: string;
  status: "accepted" | "pending" | "declined";
  created_at: string;
  family: {
    id: string | null;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    image_url: string | null;
    city: string | null;
  };
  provider: {
    id: string | null;
    display_name: string | null;
    slug: string | null;
    email: string | null;
    phone: string | null;
    image_url: string | null;
    is_active: boolean;
    city: string | null;
    state: string | null;
  };
  messagePreview: string;
  replyMessage: string | null;
  repliedAt: string | null;
  threadLength: number;
}

interface OutboundCounts {
  all: number;
  accepted: number;
  pending: number;
  declined: number;
}

interface OutboundStats {
  total: number;
  accepted: number;
  pending: number;
  declined: number;
  acceptRate: number;
}

interface OutboundListResponse {
  connections: OutboundConnection[];
  total: number;
  direction: "outbound";
  outboundCounts: OutboundCounts;
  outboundStats: OutboundStats;
  truncated: boolean;
}

const PAGE_SIZE = 50;

// Funnel stat component - matches Care Seekers style
function FunnelStat({
  label,
  value,
  format,
  highlight,
  subtitle,
}: {
  label: string;
  value: number;
  format?: "number" | "percent";
  highlight?: boolean;
  subtitle?: string;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        highlight ? "border-emerald-200 bg-emerald-50/50" : "border-gray-200 bg-white"
      }`}
    >
      <div className={`text-xl font-semibold tabular-nums ${highlight ? "text-emerald-600" : "text-gray-900"}`}>
        {format === "percent" ? `${value}%` : value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">{label}</div>
      {subtitle && (
        <div className="mt-0.5 text-[10px] text-gray-400">{subtitle}</div>
      )}
    </div>
  );
}

// Status badge for outbound connections
function OutboundStatusBadge({ status }: { status: "accepted" | "pending" | "declined" }) {
  const config = {
    accepted: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Accepted" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
    declined: { bg: "bg-gray-100", text: "text-gray-600", label: "Declined" },
  };
  const { bg, text, label } = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

// Detail type for outbound connections (from detail API)
interface OutboundDetail {
  id: string;
  type: string;
  status: string;
  isOutbound: boolean;
  family: {
    id: string | null;
    display_name: string | null;
    email: string | null;
    phone: string | null;
  };
  provider: {
    id: string | null;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    slug: string | null;
  };
  thread: Array<{
    text: string;
    created_at: string | null;
    is_auto_reply: boolean;
    role: "provider" | "family" | "system";
  }>;
  emails: Array<{
    id: string;
    email_type: string | null;
    recipient_type: string | null;
    status: string | null;
    created_at: string | null;
  }>;
}

// Row for outbound connections with expand/collapse
function OutboundConnectionRow({ connection, onDelete }: { connection: OutboundConnection; onDelete?: (id: string) => void }) {
  const c = connection;
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<OutboundDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showEmails, setShowEmails] = useState(false);

  const providerName = c.provider.display_name || "Provider";
  const familyName = c.family.display_name || "Family";
  const providerLocation = [c.provider.city, c.provider.state].filter(Boolean).join(", ");

  // Time ago helper
  const timeAgo = (isoDate: string | null): string => {
    if (!isoDate) return "";
    const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const fmtDate = (iso: string | null): string => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const age = timeAgo(c.created_at);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !detail && !loading) {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch(`/api/admin/connections/${c.id}`);
        if (!res.ok) throw new Error("failed");
        setDetail(await res.json());
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="group">
      {/* Collapsed row - matches ConnectionRow styling */}
      <div className="flex w-full items-center gap-3 px-4 py-4 hover:bg-stone-50/60 transition-colors">
        <button
          onClick={toggle}
          className="flex-1 min-w-0 text-left"
          aria-expanded={open}
        >
          {/* Primary line: names */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{providerName}</span>
            <span className="text-gray-400">→</span>
            <span className="font-medium text-gray-900 truncate">{familyName}</span>
          </div>
          {/* Secondary line: location + status */}
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            {providerLocation && (
              <>
                <span className="truncate">{providerLocation}</span>
                <span className="text-gray-300">|</span>
              </>
            )}
            <OutboundStatusBadge status={c.status} />
            {c.threadLength > 1 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-gray-400">{c.threadLength} messages</span>
              </>
            )}
          </div>
        </button>

        {/* Timestamp */}
        <span className="text-sm text-gray-400 shrink-0">{age}</span>

        {/* Delete button - hover reveal */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(c.id);
            }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all"
            title="Delete connection"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        {/* Expand chevron */}
        <button
          onClick={toggle}
          className="p-1"
          aria-label={open ? "Collapse" : "Expand"}
        >
          <svg
            className={`h-5 w-5 text-gray-300 transition-transform shrink-0 ${open ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-gray-100 bg-stone-50/40 px-4 py-4">
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : loadError ? (
            <p className="text-sm text-rose-600">Could not load details. Try again.</p>
          ) : detail ? (
            <div className="space-y-4">
              {/* Contact cards */}
              <div className="flex gap-4 flex-wrap">
                {/* Provider contact */}
                <div className="flex-1 min-w-[200px] bg-white rounded-lg border border-gray-200 p-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Provider</span>
                  <p className="font-medium text-gray-900 text-sm truncate mt-1">{detail.provider.display_name || "Unknown"}</p>
                  <div className="mt-1 space-y-0.5 text-sm">
                    {detail.provider.email && (
                      <a href={`mailto:${detail.provider.email}`} className="block text-blue-600 hover:underline truncate">{detail.provider.email}</a>
                    )}
                    {detail.provider.phone && (
                      <a href={`tel:${detail.provider.phone}`} className="block text-blue-600 hover:underline">{detail.provider.phone}</a>
                    )}
                  </div>
                </div>

                {/* Family contact */}
                <div className="flex-1 min-w-[200px] bg-white rounded-lg border border-gray-200 p-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Family</span>
                  <p className="font-medium text-gray-900 text-sm truncate mt-1">{detail.family.display_name || "Unknown"}</p>
                  <div className="mt-1 space-y-0.5 text-sm">
                    {detail.family.email && (
                      <a href={`mailto:${detail.family.email}`} className="block text-blue-600 hover:underline truncate">{detail.family.email}</a>
                    )}
                    {detail.family.phone && (
                      <a href={`tel:${detail.family.phone}`} className="block text-blue-600 hover:underline">{detail.family.phone}</a>
                    )}
                  </div>
                </div>
              </div>

              {/* Conversation thread */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Conversation</h3>
                {detail.thread.length === 0 ? (
                  <p className="text-sm text-gray-400">No messages yet.</p>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {detail.thread.map((m, i) => (
                      <div key={i} className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            {m.role === "family" ? "Family" : m.role === "provider" ? "Provider" : "System"}
                          </span>
                          {m.is_auto_reply && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">auto</span>
                          )}
                          {m.created_at && (
                            <span className="text-xs text-gray-400">{fmtDate(m.created_at)}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{m.text || <span className="text-gray-300">-</span>}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email trail */}
              {detail.emails.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowEmails(!showEmails)}
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${showEmails ? "rotate-90" : ""}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
                    </svg>
                    Show {detail.emails.length} email{detail.emails.length !== 1 ? "s" : ""} sent
                  </button>

                  {showEmails && (
                    <div className="mt-2 bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                      {detail.emails.map((e) => (
                        <div key={e.id} className="p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-700">{e.email_type?.replace(/_/g, " ") || "Email"}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              e.recipient_type === "family"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-purple-50 text-purple-600"
                            }`}>
                              {e.recipient_type === "family" ? "To Family" : "To Provider"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{fmtDate(e.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function ConnectionsTrackerPage() {
  const searchParams = useSearchParams();

  // Read initial direction from URL (supports /admin/outreach redirect)
  const initialDirection = searchParams.get("direction") === "outbound" ? "outbound" : "inbound";

  const [range, setRange] = useState<DateRangeValue>({
    preset: "all",
    customFrom: "",
    customTo: "",
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [direction, setDirection] = useState<Direction>(initialDirection);
  const [perspective, setPerspective] = useState<Perspective>("provider");
  // Default filter: "awaiting" for inbound, "all" for outbound
  const [activeFilter, setActiveFilter] = useState<FilterKey | OutboundFilterKey>(
    initialDirection === "outbound" ? "all" : "awaiting"
  );
  const [page, setPage] = useState(0);

  // Stats row state (collapsible)
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);

  // Export CSV state
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Action dialog state - supports Mark Viewed, Mark Connected, Mark Not Interested, Archive Provider, Unarchive, Hide
  type ActionType = "mark_viewed" | "mark_connected" | "mark_not_interested" | "archive_provider" | "unarchive_lead" | "hide_connection";
  const [pendingAction, setPendingAction] = useState<{
    connectionId: string;
    providerId: string | null;
    familyName: string | null;
    providerName: string | null;
    isArchived: boolean; // true if lead is already archived (for unarchive)
    isProviderArchived: boolean; // true if provider is admin-archived
    providerArchiveInfo?: {
      reason: string | null;
      archivedBy: string | null;
      archivedAt: string | null;
    } | null;
  } | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");

  // Mark Viewed reason options
  const MARK_VIEWED_REASONS = [
    "Provider confirmed they saw it (phone call)",
    "Provider confirmed they saw it (email)",
    "Other",
  ] as const;

  // Mark Connected reason options
  const MARK_CONNECTED_REASONS = [
    "Confirmed via phone call",
    "Confirmed via email",
    "Provider confirmed in portal",
    "Other",
  ] as const;

  // Mark Not Interested reason options
  const MARK_NOT_INTERESTED_REASONS = [
    "Not a fit for family's needs",
    "Not accepting new clients",
    "Unable to reach family",
    "Provider requested no more leads",
    "Other",
  ] as const;

  // Archive Provider reason options (maps to API values)
  const ARCHIVE_PROVIDER_REASONS = [
    { value: "provider_requested_no_emails", label: "Provider requested no emails" },
    { value: "inactive", label: "Inactive / Not responding" },
    { value: "duplicate", label: "Duplicate profile" },
    { value: "other", label: "Other" },
  ] as const;

  // Debounce search input by 300ms
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [activeFilter, range]);

  // Reset filter when perspective changes (since filter keys differ between perspectives)
  useEffect(() => {
    // Family perspective starts with "new", provider with "awaiting"
    setActiveFilter(perspective === "family" ? "new" : "awaiting");
    setPage(0);
  }, [perspective]);

  // Reset filter and perspective when direction changes
  useEffect(() => {
    if (direction === "outbound") {
      setActiveFilter("all"); // Outbound default tab
    } else {
      setActiveFilter("awaiting"); // Inbound default tab
    }
    setPage(0);
  }, [direction]);

  const [list, setList] = useState<ListResponse | null>(null);
  const [outboundList, setOutboundList] = useState<OutboundListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const buildDateParams = useCallback(() => {
    const { from, to } = resolveRange(range);
    const params = new URLSearchParams();
    if (from) params.set("date_from", from);
    if (to) params.set("date_to", to);
    return params;
  }, [range]);

  // Toast helper
  function showToast(message: string, type: "success" | "error" = "success") {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  // Export CSV handler
  async function handleExport() {
    setExporting(true);
    try {
      const params = buildDateParams();
      params.set("direction", direction);
      if (direction === "inbound") {
        params.set("perspective", perspective);
      }
      params.set("filter", activeFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/admin/connections/export?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Export failed", "error");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || "olera-connections.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const total = direction === "outbound" ? outboundList?.total ?? 0 : list?.total ?? 0;
      showToast(`Exported ${total.toLocaleString()} connections`);
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  const fetchConnections = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = buildDateParams();
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

    // Validate filter matches direction to prevent race condition on direction switch
    const validOutboundFilters = ["all", "accepted", "pending", "declined"];
    const validFilter = direction === "outbound"
      ? (validOutboundFilters.includes(activeFilter) ? activeFilter : "all")
      : activeFilter;
    params.set("filter", validFilter);
    params.set("direction", direction);
    if (direction === "inbound") {
      params.set("perspective", perspective);
    }
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));

    fetch(`/api/admin/connections?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((data) => {
        if (direction === "outbound") {
          setOutboundList(data as OutboundListResponse);
          setList(null);
        } else {
          setList(data as ListResponse);
          setOutboundList(null);
        }
      })
      .catch(() => {
        setError(true);
        setList(null);
        setOutboundList(null);
      })
      .finally(() => setLoading(false));
  }, [buildDateParams, debouncedSearch, activeFilter, direction, perspective, page]);

  // Fetch connections when dependencies change
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Use direction-aware and perspective-aware tabs
  const INBOUND_TABS = perspective === "family" ? FAMILY_TABS : PROVIDER_TABS;
  const activeInboundTabConfig = INBOUND_TABS.find((t) => t.key === activeFilter);
  const activeOutboundTabConfig = OUTBOUND_TABS.find((t) => t.key === activeFilter);

  // Get count for inbound tab (using perspective-aware engagement counts)
  const getInboundTabCount = (key: FilterKey): number => {
    if (perspective === "family") {
      if (!list?.familyEngagementCounts) return 0;
      const counts = list.familyEngagementCounts;
      if (key in counts) {
        return counts[key as keyof FamilyEngagementCounts] ?? 0;
      }
      return 0;
    } else {
      // Provider perspective
      if (!list?.engagementCounts) return 0;
      const counts = list.engagementCounts;
      if (key in counts) {
        return counts[key as keyof EngagementCounts] ?? 0;
      }
      return 0;
    }
  };

  // Get count for outbound tab
  const getOutboundTabCount = (key: OutboundFilterKey): number => {
    if (!outboundList?.outboundCounts) return 0;
    return outboundList.outboundCounts[key] ?? 0;
  };

  // Handle action button click - opens multi-action dialog
  const handleConnectionAction = (
    connectionId: string,
    providerId: string | null,
    familyName: string | null,
    providerName: string | null,
    isArchived: boolean,
    isProviderArchived: boolean,
    providerArchiveInfo?: { reason: string | null; archivedBy: string | null; archivedAt: string | null } | null
  ) => {
    setPendingAction({ connectionId, providerId, familyName, providerName, isArchived, isProviderArchived, providerArchiveInfo });
    setSelectedAction(null);
    setActionError(null);
    setActionReason("");
    setActionNotes("");
  };

  // Reset dialog state
  const closeActionDialog = () => {
    setPendingAction(null);
    setSelectedAction(null);
    setActionError(null);
    setActionReason("");
    setActionNotes("");
  };

  // Calculate destination tab for a connection (used in confirmation modals)
  // Note: This predicts where the connection will go AFTER the action completes
  const getDestinationTab = (connectionId: string, action?: ActionType): { tab: string; label: string; warning?: string } | null => {
    const conn = list?.connections.find(c => c.id === connectionId);
    if (!conn) return null;

    // If provider is inactive (deleted account), connection stays in Archived
    // regardless of unarchive actions - is_active is a separate flag we can't change
    if (conn.isProviderInactive) {
      return {
        tab: "archived",
        label: "Archived",
        warning: "Provider account is inactive"
      };
    }

    // For "Unarchive Lead" action: if provider is still admin-archived at provider level,
    // the connection stays in Archived (we're only clearing connection-level archive)
    // Note: This shouldn't happen since the action is hidden when provider is archived,
    // but check anyway for safety
    if (action === "unarchive_lead" && conn.isProviderArchived) {
      return {
        tab: "archived",
        label: "Archived",
        warning: "Provider is archived at provider level"
      };
    }

    // Check email issue and claimed status
    const hasEmailIssue = conn.emailIssueType !== null && conn.emailIssueType !== undefined;
    const isProviderClaimed = conn.provider?.isAccountClaimed === true;
    const engagementLevel = conn.engagementLevel;
    const hasProviderEngagement = engagementLevel === "viewed" || engagementLevel === "connected";

    // Claimed providers with email issues go to engagement tab (we can't fix their email)
    // Unclaimed providers with email issues and no engagement go to Needs Email
    if (hasEmailIssue && !isProviderClaimed && !hasProviderEngagement) {
      return { tab: "needs_email", label: "Needs Email" };
    }

    // Otherwise, go to engagement-based tab
    const tabLabels: Record<EngagementLevel, string> = {
      awaiting: "Awaiting",
      viewed: "Viewed",
      connected: "Connected",
      needs_follow_up: "Needs Follow-up",
    };

    if (engagementLevel && tabLabels[engagementLevel]) {
      return { tab: engagementLevel, label: tabLabels[engagementLevel] };
    }

    return { tab: "awaiting", label: "Awaiting" };
  };

  // Execute the selected action
  const confirmAction = async () => {
    if (!pendingAction || !selectedAction) return;

    setActionLoading(true);
    setActionError(null);

    try {
      let res: Response;
      let successMessage = "";

      if (selectedAction === "mark_viewed") {
        // Mark as Viewed API - moves to Viewed tab, emails continue
        if (!actionReason.trim()) {
          setActionError("Please select a reason");
          setActionLoading(false);
          return;
        }
        if (actionReason === "Other" && !actionNotes.trim()) {
          setActionError("Please provide notes when selecting 'Other'");
          setActionLoading(false);
          return;
        }

        res = await fetch(`/api/admin/connections/${pendingAction.connectionId}/mark-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "viewed",
            reason: actionReason.trim(),
            notes: actionNotes.trim() || undefined,
          }),
        });
        successMessage = "Marked as viewed";

      } else if (selectedAction === "mark_connected") {
        // Mark as Connected API
        if (!actionReason.trim()) {
          setActionError("Please select a reason");
          setActionLoading(false);
          return;
        }
        if (actionReason === "Other" && !actionNotes.trim()) {
          setActionError("Please provide notes when selecting 'Other'");
          setActionLoading(false);
          return;
        }

        res = await fetch(`/api/admin/connections/${pendingAction.connectionId}/mark-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "connected",
            reason: actionReason.trim(),
            notes: actionNotes.trim() || undefined,
          }),
        });
        successMessage = "Marked as connected";

      } else if (selectedAction === "mark_not_interested") {
        // Mark as Not Interested API
        if (!actionReason.trim()) {
          setActionError("Please select a reason");
          setActionLoading(false);
          return;
        }
        if (actionReason === "Other" && !actionNotes.trim()) {
          setActionError("Please provide notes when selecting 'Other'");
          setActionLoading(false);
          return;
        }

        res = await fetch(`/api/admin/connections/${pendingAction.connectionId}/mark-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "not_interested",
            reason: actionReason.trim(),
            notes: actionNotes.trim() || undefined,
          }),
        });
        successMessage = "Marked as not interested";

      } else if (selectedAction === "unarchive_lead") {
        // Unarchive Lead API (via leads page)
        res = await fetch("/api/admin/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: [pendingAction.connectionId],
            action: "unarchive",
          }),
        });
        successMessage = "Lead unarchived";

      } else if (selectedAction === "archive_provider") {
        // Archive Provider API
        if (!pendingAction.providerId) {
          setActionError("Provider ID not available");
          setActionLoading(false);
          return;
        }

        const action = pendingAction.isProviderArchived ? "unarchive" : "archive";
        res = await fetch(`/api/admin/providers/${pendingAction.providerId}/archive`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reason: action === "archive" ? actionReason : undefined,
          }),
        });
        successMessage = pendingAction.isProviderArchived ? "Provider unarchived" : "Provider archived";

      } else if (selectedAction === "hide_connection") {
        // Hide Connection API
        res = await fetch(`/api/admin/connections/${pendingAction.connectionId}/hide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "hide" }),
        });
        successMessage = "Connection hidden";

      } else {
        setActionError("Unknown action");
        setActionLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        closeActionDialog();
        // Refetch to update tab counts
        fetchConnections();
      } else {
        setActionError(data.error || `Failed: ${successMessage}`);
      }
    } catch {
      setActionError("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = direction === "outbound"
    ? (outboundList ? Math.ceil(outboundList.total / PAGE_SIZE) : 0)
    : (list ? Math.ceil(list.total / PAGE_SIZE) : 0);

  const currentTotal = direction === "outbound" ? outboundList?.total ?? 0 : list?.total ?? 0;

  return (
    <div>
      {/* Header with KPI + trend chart */}
      <PulseHeader
        title="Connections"
        kpiSuffix="successful"
        statsPath="/api/admin/connections/pulse"
        range={range}
        onRangeChange={setRange}
        actions={
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setDirection("inbound")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  direction === "inbound"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Inbound
              </button>
              <button
                type="button"
                onClick={() => setDirection("outbound")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  direction === "outbound"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Outbound
              </button>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        }
      />

      {/* Outbound Stats */}
      {direction === "outbound" && outboundList?.outboundStats && (
        <div className="mb-6 grid grid-cols-5 gap-3">
          <FunnelStat label="Total Sent" value={outboundList.outboundStats.total} />
          <FunnelStat label="Accepted" value={outboundList.outboundStats.accepted} highlight />
          <FunnelStat label="Pending" value={outboundList.outboundStats.pending} />
          <FunnelStat label="Declined" value={outboundList.outboundStats.declined} />
          <FunnelStat label="Accept Rate" value={outboundList.outboundStats.acceptRate} format="percent" />
        </div>
      )}

      {/* Collapsible Funnel Stats - Inbound + Provider perspective only */}
      {direction === "inbound" && perspective === "provider" && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setStatsExpanded(!statsExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${statsExpanded ? "rotate-90" : ""}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
            </svg>
            Connection Funnel
            <span className="text-xs text-gray-400 font-normal">
              {range.preset === "all" ? "all time" : range.preset === "30d" ? "last 30 days" : range.preset === "7d" ? "last 7 days" : "custom range"}
            </span>
          </button>

          {statsExpanded && list?.funnelStats && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              <FunnelStat label="Total Leads" value={list.funnelStats.total} />
              <FunnelStat
                label="Provider Viewed"
                value={list.funnelStats.providerViewedRate}
                format="percent"
                subtitle={`${list.funnelStats.providerViewed} ${list.funnelStats.providerViewed === 1 ? "lead" : "leads"}`}
              />
              <FunnelStat
                label="Responded"
                value={list.funnelStats.respondedRate}
                format="percent"
                subtitle={`${list.funnelStats.responded} ${list.funnelStats.responded === 1 ? "lead" : "leads"}`}
              />
              <FunnelStat label="Connected" value={list.funnelStats.connected} highlight />
            </div>
          )}
        </div>
      )}

      {/* Collapsible Provider Actions - Inbound + Provider perspective only */}
      {direction === "inbound" && perspective === "provider" && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setActionsExpanded(!actionsExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${actionsExpanded ? "rotate-90" : ""}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
            </svg>
            Provider Actions
            <span className="text-xs text-gray-400 font-normal">
              {range.preset === "all" ? "all time" : range.preset === "30d" ? "last 30 days" : range.preset === "7d" ? "last 7 days" : "custom range"}
            </span>
          </button>

          {actionsExpanded && list?.providerActions && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <FunnelStat label="Viewed Lead" value={list.providerActions.viewed} />
              <FunnelStat
                label="Called"
                value={list.providerActions.copiedPhoneRate}
                format="percent"
                subtitle={`${list.providerActions.copiedPhone} called`}
              />
              <FunnelStat
                label="Emailed"
                value={list.providerActions.copiedEmailRate}
                format="percent"
                subtitle={`${list.providerActions.copiedEmail} emailed`}
              />
              <FunnelStat
                label="Messaged"
                value={list.providerActions.messagedRate}
                format="percent"
                subtitle={`${list.providerActions.messaged} sent`}
              />
              <FunnelStat
                label="Declined"
                value={list.providerActions.declinedRate}
                format="percent"
                subtitle={`${list.providerActions.declined} declined`}
              />
            </div>
          )}
        </div>
      )}

      {/* Perspective toggle + Search bar (same row) */}
      <div className="mb-6 flex items-center gap-4">
        {/* Perspective toggle - left side, inbound only */}
        {direction === "inbound" && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium text-gray-500">Perspective:</span>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setPerspective("provider")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  perspective === "provider"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Provider
              </button>
              <button
                type="button"
                onClick={() => setPerspective("family")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  perspective === "family"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Family
              </button>
            </div>
          </div>
        )}

        {/* Search input - takes remaining space */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by family or provider name..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setDebouncedSearch(""); setPage(0); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs - underline style */}
      <div className="flex gap-1 mb-6 border-b border-gray-100 overflow-x-auto">
        {direction === "outbound" ? (
          // Outbound tabs
          OUTBOUND_TABS.map((tab) => {
            const count = getOutboundTabCount(tab.key);
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                title={tab.description}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 ${isActive ? "text-gray-500" : "text-gray-300"}`}>
                  {count}
                </span>
              </button>
            );
          })
        ) : (
          // Inbound tabs (existing)
          INBOUND_TABS.map((tab) => {
            const count = getInboundTabCount(tab.key);
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                title={tab.description}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 ${isActive ? "text-gray-500" : "text-gray-300"}`}>
                  {count}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="px-4 py-16 text-center text-sm text-gray-400">Loading...</div>
        ) : error ? (
          <div className="px-4 py-16 text-center text-sm text-rose-600">
            Could not load connections. Try again.
          </div>
        ) : direction === "outbound" ? (
          // Outbound connections rendering
          !outboundList || outboundList.connections.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-gray-400">
              {activeOutboundTabConfig?.emptyMessage ?? "No outreach found."}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {outboundList.connections.map((c) => (
                <OutboundConnectionRow key={c.id} connection={c} />
              ))}
            </div>
          )
        ) : (
          // Inbound connections rendering (existing)
          !list || list.connections.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-gray-400">
              {activeInboundTabConfig?.emptyMessage ?? "No connections found."}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {list.connections.map((c) => (
                <ConnectionRow
                  key={c.id}
                  c={c}
                  perspective={perspective}
                  engagement={list.engagement[c.id]}
                  onConnectionAction={handleConnectionAction}
                  onNudgeSuccess={fetchConnections}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Pagination */}
      {!loading && currentTotal > 0 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-gray-500">
            {currentTotal <= PAGE_SIZE
              ? `${currentTotal} total`
              : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, currentTotal)} of ${currentTotal}`
            }
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {(list?.truncated || outboundList?.truncated) && (
        <p className="mt-2 text-xs text-amber-600">
          Showing a capped slice — narrow the date range for complete counts.
        </p>
      )}

      {/* Connection Action Dialog - supports Mark Connected, Close Lead, Archive Provider */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-dialog-title"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 id="action-dialog-title" className="text-base font-semibold text-gray-900 mb-3">
              Connection Actions
            </h3>

            {/* Connection info */}
            <div className="text-sm text-gray-700 mb-4 space-y-1 pb-3 border-b border-gray-100">
              <p>
                <span className="text-gray-400">Family:</span>{" "}
                <span className="font-medium text-gray-900">{pendingAction.familyName || "Unknown"}</span>
              </p>
              <p>
                <span className="text-gray-400">Provider:</span>{" "}
                <span className="font-medium text-gray-900">{pendingAction.providerName || "Unknown"}</span>
                {pendingAction.isProviderArchived && (
                  <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Archived</span>
                )}
              </p>
            </div>

            {/* Action selection - Step 1 */}
            {!selectedAction && (
              <div className="space-y-2">
                {/* Warning banner when provider is archived */}
                {pendingAction.isProviderArchived && (
                  <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <span className="font-medium">Provider is archived.</span> All leads to this provider appear in the Archived tab. Unarchive the provider to resume normal tracking.
                    </p>
                  </div>
                )}

                {/* Unarchive Lead option - only show if connection is archived AND provider is NOT archived */}
                {/* If provider is archived, unarchiving the lead won't help - need to unarchive provider */}
                {pendingAction.isArchived && !pendingAction.isProviderArchived && (
                  <button
                    onClick={() => setSelectedAction("unarchive_lead")}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Unarchive Lead</p>
                        <p className="text-xs text-gray-500">Restore this lead to active tracking</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Mark as Viewed - move to Viewed tab, emails continue */}
                <button
                  onClick={() => setSelectedAction("mark_viewed")}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Mark as Viewed</p>
                      <p className="text-xs text-gray-500">Provider confirmed they saw it, emails continue</p>
                    </div>
                  </div>
                </button>

                {/* Mark as Connected - always show, but add note if provider is archived */}
                <button
                  onClick={() => setSelectedAction("mark_connected")}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    pendingAction.isProviderArchived
                      ? "border-gray-200 hover:border-green-200 hover:bg-green-50/50"
                      : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      pendingAction.isProviderArchived ? "bg-green-50" : "bg-green-100"
                    }`}>
                      <svg className={`w-4 h-4 ${pendingAction.isProviderArchived ? "text-green-400" : "text-green-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-medium ${pendingAction.isProviderArchived ? "text-gray-600" : "text-gray-900"}`}>Mark as Connected</p>
                      <p className="text-xs text-gray-500">
                        {pendingAction.isProviderArchived
                          ? "Records connection but lead stays in Archived tab"
                          : "Confirm this lead successfully connected"
                        }
                      </p>
                    </div>
                  </div>
                </button>

                {/* Mark Not Interested - admin confirms provider declined during phone call */}
                <button
                  onClick={() => setSelectedAction("mark_not_interested")}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Mark Not Interested</p>
                      <p className="text-xs text-gray-500">Provider declined during admin phone call</p>
                    </div>
                  </div>
                </button>

                {/* Archive Provider */}
                {pendingAction.providerId && (
                  <button
                    onClick={() => setSelectedAction("archive_provider")}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {pendingAction.isProviderArchived ? "Unarchive Provider" : "Archive Provider"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pendingAction.isProviderArchived
                            ? "Resume sending emails to this provider"
                            : "Stop all emails to this provider"
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Hide Connection - for cleaning up test data */}
                <button
                  onClick={() => setSelectedAction("hide_connection")}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Hide Connection</p>
                      <p className="text-xs text-gray-500">Remove from admin view (test data cleanup)</p>
                    </div>
                  </div>
                </button>

                {/* Cancel button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={closeActionDialog}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action confirmation - Step 2 */}
            {selectedAction && (
              <div className="space-y-4">
                {/* Mark Viewed form */}
                {selectedAction === "mark_viewed" && (
                  <>
                    <p className="text-sm text-gray-600">
                      This will move the connection to the <span className="font-medium">Viewed</span> tab. Email sequences will continue to encourage them to connect.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800">
                        Use this when you have called the provider and they confirmed they saw the lead but have not connected yet.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">How was this confirmed?</label>
                      <select
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                      >
                        <option value="">Select a reason...</option>
                        {MARK_VIEWED_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    {actionReason === "Other" && (
                      <textarea
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Please describe how this was confirmed..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                        rows={2}
                      />
                    )}
                  </>
                )}

                {/* Mark Connected form */}
                {selectedAction === "mark_connected" && (
                  <>
                    <p className="text-sm text-gray-600">
                      This will move the connection to the <span className="font-semibold text-gray-900">Connected</span> tab and stop follow-up emails.
                    </p>
                    {pendingAction.isProviderArchived && (
                      <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                          Note: This provider is archived. The lead will be marked as connected but will remain in the Archived tab.
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">How was this confirmed?</label>
                      <select
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      >
                        <option value="">Select a reason...</option>
                        {MARK_CONNECTED_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    {actionReason === "Other" && (
                      <textarea
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Please describe how this was confirmed..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                        rows={2}
                      />
                    )}
                  </>
                )}

                {/* Mark Not Interested form */}
                {selectedAction === "mark_not_interested" && (
                  <>
                    <p className="text-sm text-gray-600">
                      This will move the connection to the <span className="font-semibold text-gray-900">Not Interested</span> tab and stop follow-up emails. If the provider later views or engages, they&apos;ll move back to active tracking and emails will resume.
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Why is provider not interested?</label>
                      <select
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      >
                        <option value="">Select a reason...</option>
                        {MARK_NOT_INTERESTED_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    {actionReason === "Other" && (
                      <textarea
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Please describe the reason..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                        rows={2}
                      />
                    )}
                  </>
                )}

                {/* Unarchive Lead confirmation */}
                {selectedAction === "unarchive_lead" && (() => {
                  const dest = getDestinationTab(pendingAction.connectionId, "unarchive_lead");
                  return (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        This will unarchive the lead and move it to the{" "}
                        <span className="font-semibold text-gray-900">
                          {dest?.label || "appropriate"}
                        </span>{" "}
                        tab.
                      </p>
                      {dest?.warning && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                          Note: {dest.warning}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Archive Provider confirmation */}
                {selectedAction === "archive_provider" && (() => {
                  const dest = getDestinationTab(pendingAction.connectionId, "archive_provider");
                  return (
                  <div className="space-y-3">
                    {pendingAction.isProviderArchived ? (
                      <>
                        <p className="text-sm text-gray-600">
                          This will unarchive <span className="font-medium">{pendingAction.providerName}</span>. This connection will move to the{" "}
                          <span className="font-semibold text-gray-900">
                            {dest?.label || "appropriate"}
                          </span>{" "}
                          tab for this provider, and email sequences will resume.
                        </p>
                        {dest?.warning && (
                          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                            Note: {dest.warning}
                          </p>
                        )}
                        {/* Show why they were archived */}
                        {pendingAction.providerArchiveInfo && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                            <p className="text-xs font-medium text-amber-800">Previously archived:</p>
                            <p className="text-xs text-amber-700">
                              <span className="font-medium">Reason:</span>{" "}
                              {ARCHIVE_PROVIDER_REASONS.find(r => r.value === pendingAction.providerArchiveInfo?.reason)?.label || pendingAction.providerArchiveInfo.reason || "Not specified"}
                            </p>
                            {pendingAction.providerArchiveInfo.archivedBy && (
                              <p className="text-xs text-amber-700">
                                <span className="font-medium">By:</span> {pendingAction.providerArchiveInfo.archivedBy}
                              </p>
                            )}
                            {pendingAction.providerArchiveInfo.archivedAt && (
                              <p className="text-xs text-amber-700">
                                <span className="font-medium">On:</span>{" "}
                                {new Date(pendingAction.providerArchiveInfo.archivedAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">
                          This will archive <span className="font-medium">{pendingAction.providerName}</span> at the provider level:
                        </p>
                        <ul className="text-xs text-gray-500 space-y-1 ml-4 list-disc">
                          <li>All their connections will move to Archived tab</li>
                          <li>No emails will be sent to this provider</li>
                          <li>New leads will automatically be archived</li>
                          <li>Family emails are not affected</li>
                        </ul>
                        {/* Reason selector */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Why are you archiving this provider?
                          </label>
                          <select
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                          >
                            <option value="">Select a reason...</option>
                            {ARCHIVE_PROVIDER_REASONS.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  );
                })()}

                {/* Hide Connection confirmation */}
                {selectedAction === "hide_connection" && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      This will hide the connection from the admin connections page.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800 font-medium mb-1">This is safe:</p>
                      <ul className="text-xs text-blue-700 space-y-0.5 ml-3 list-disc">
                        <li>Data stays in database (not deleted)</li>
                        <li>Provider still sees the lead in their portal</li>
                        <li>Family experience unchanged</li>
                        <li>Email sequences continue normally</li>
                      </ul>
                    </div>
                    <p className="text-xs text-gray-500">
                      Use this to clean up test data from the admin view.
                    </p>
                  </div>
                )}

                {/* Error display */}
                {actionError && (
                  <p className="text-xs text-red-600">{actionError}</p>
                )}

                {/* Action buttons */}
                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAction(null);
                      setActionReason("");
                      setActionNotes("");
                      setActionError(null);
                    }}
                    disabled={actionLoading}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50"
                  >
                    Back
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeActionDialog}
                      disabled={actionLoading}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmAction}
                      disabled={
                        actionLoading ||
                        (selectedAction === "mark_viewed" && !actionReason) ||
                        (selectedAction === "mark_viewed" && actionReason === "Other" && !actionNotes.trim()) ||
                        (selectedAction === "mark_connected" && !actionReason) ||
                        (selectedAction === "mark_connected" && actionReason === "Other" && !actionNotes.trim()) ||
                        (selectedAction === "mark_not_interested" && !actionReason) ||
                        (selectedAction === "mark_not_interested" && actionReason === "Other" && !actionNotes.trim()) ||
                        (selectedAction === "archive_provider" && !pendingAction.isProviderArchived && !actionReason)
                      }
                      className={`text-xs font-medium text-white px-3 py-1.5 rounded-md disabled:opacity-50 ${
                        selectedAction === "mark_viewed"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : selectedAction === "mark_connected"
                          ? "bg-green-600 hover:bg-green-700"
                          : selectedAction === "mark_not_interested"
                          ? "bg-orange-600 hover:bg-orange-700"
                          : selectedAction === "archive_provider"
                          ? pendingAction.isProviderArchived ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                          : selectedAction === "hide_connection"
                          ? "bg-gray-600 hover:bg-gray-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {actionLoading
                        ? "Processing..."
                        : selectedAction === "mark_viewed"
                        ? "Mark Viewed"
                        : selectedAction === "mark_connected"
                        ? "Mark Connected"
                        : selectedAction === "mark_not_interested"
                        ? "Mark Not Interested"
                        : selectedAction === "unarchive_lead"
                        ? "Unarchive"
                        : selectedAction === "hide_connection"
                        ? "Hide Connection"
                        : pendingAction.isProviderArchived
                        ? "Unarchive Provider"
                        : "Archive Provider"
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
