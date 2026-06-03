"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DateRangePopover, {
  resolveRange,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";
import ConnectionRow, { type ConnectionRowData } from "@/components/admin/ConnectionRow";
import type { ConnectionTemperatureState } from "@/lib/connection-temperature";

interface Pulse {
  total: number;
  delta: number | null;
  series: { date: string; count: number }[];
  bucket: string;
  // Response metrics
  responseRate?: number;
  medianResponseTime?: number | null;
  awaitingCount?: number;
}

interface Funnel {
  leads_sent: number;
  emails_opened: number;
  leads_viewed: number;
  contacts_revealed: number;
  providers_responded: number;
  open_rate: number;
  view_rate: number;
  reveal_rate: number;
  response_rate: number;
}

interface ActionCounts {
  nudge_provider: number;
  nudge_family: number;
  call_no_email: number;
  hot_leads: number;
}

type Engagement = { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean };

interface ResponseCounts {
  all: number;
  needs_attention: number;
  provider_nudged: number;
  family_nudged: number;
  responded: number;
  no_email: number;
}

// Simplified counts for 3-tab UI
interface SimplifiedCounts {
  todo: number;      // needs_attention + no_email
  waiting: number;   // provider_nudged + family_nudged
  connected: number; // responded
}

interface ListResponse {
  connections: (ConnectionRowData & { provider: { activityKey: string | null } })[];
  total: number;
  counts: Record<ConnectionTemperatureState, number>;
  responseCounts?: ResponseCounts;
  engagement: Record<string, Engagement>;
  truncated: boolean;
  action_counts?: ActionCounts;
}

/** Engagement Funnel Visualization */
function EngagementFunnel({ funnel }: { funnel: Funnel | null }) {
  if (!funnel) return null;

  const stages = [
    { label: "Leads Sent", value: funnel.leads_sent, rate: null },
    { label: "Emails Opened", value: funnel.emails_opened, rate: funnel.open_rate },
    { label: "Leads Viewed", value: funnel.leads_viewed, rate: funnel.view_rate },
    { label: "Contact Revealed", value: funnel.contacts_revealed, rate: funnel.reveal_rate },
    { label: "Connected", value: funnel.providers_responded, rate: funnel.response_rate },
  ];

  return (
    <div className="mb-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">
        Engagement Funnel
      </p>
      <div className="grid grid-cols-5 gap-2">
        {stages.map((stage) => (
          <div
            key={stage.label}
            className="bg-white rounded-xl border border-gray-200 p-3 text-center"
          >
            <p className="text-[11px] text-gray-500 truncate">{stage.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {stage.value.toLocaleString()}
            </p>
            {stage.rate !== null && (
              <p className="text-[10px] text-gray-400">({stage.rate}%)</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type ActionQueueKey = "nudge_provider" | "nudge_family" | "call_no_email" | "hot_leads";

/** Action Queue Cards */
function ActionQueue({
  counts,
  activeAction,
  onActionClick,
}: {
  counts: ActionCounts | undefined;
  activeAction: ActionQueueKey | null;
  onActionClick: (key: ActionQueueKey | null) => void;
}) {
  if (!counts) return null;

  const actions: Array<{ key: ActionQueueKey; label: string; emoji: string; count: number }> = [
    { key: "nudge_provider", label: "Nudge Provider", emoji: "📧", count: counts.nudge_provider },
    { key: "nudge_family", label: "Nudge Family", emoji: "👨‍👩‍👧", count: counts.nudge_family },
    { key: "call_no_email", label: "Call (No Email)", emoji: "📞", count: counts.call_no_email },
    { key: "hot_leads", label: "Hot Leads", emoji: "🔥", count: counts.hot_leads },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Action Queue
        </p>
        {activeAction && (
          <button
            type="button"
            onClick={() => onActionClick(null)}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear filter
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => {
          const isActive = activeAction === action.key;
          const hasItems = action.count > 0;
          return (
            <button
              key={action.key}
              type="button"
              onClick={() => hasItems && onActionClick(isActive ? null : action.key)}
              disabled={!hasItems}
              className={`rounded-xl border p-3 text-center transition-all ${
                isActive
                  ? "bg-primary-50 border-primary-300 ring-2 ring-primary-200"
                  : hasItems
                    ? "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer"
                    : "bg-gray-50 border-gray-100 cursor-default opacity-60"
              }`}
            >
              <span className="text-lg">{action.emoji}</span>
              <p className="text-[11px] text-gray-500 mt-1">{action.label}</p>
              <p className={`text-xl font-bold ${isActive ? "text-primary-700" : "text-gray-900"}`}>
                {action.count}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type TabFilter = "todo" | "waiting" | "connected";

const TABS: Array<{ key: TabFilter; label: string; description: string }> = [
  { key: "todo", label: "To Do", description: "Action needed" },
  { key: "waiting", label: "Waiting", description: "Pending response" },
  { key: "connected", label: "Connected", description: "Success" },
];

export default function ConnectionsTrackerPage() {
  const [range, setRange] = useState<DateRangeValue>({
    preset: "30d",
    customFrom: "",
    customTo: "",
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("todo");
  const [activeAction, setActiveAction] = useState<ActionQueueKey | null>(null);

  // Debounce search input by 300ms
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [pulseError, setPulseError] = useState(false);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [list, setList] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const buildDateParams = useCallback(() => {
    const { from, to } = resolveRange(range);
    const params = new URLSearchParams();
    if (from) params.set("date_from", from);
    if (to) params.set("date_to", to);
    return params;
  }, [range]);

  // Hero KPI (own fetch — independent of the queue filter).
  useEffect(() => {
    let cancelled = false;
    setPulseError(false);
    const params = buildDateParams();
    fetch(`/api/admin/connections/pulse?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((data) => !cancelled && setPulse(data))
      .catch(() => {
        if (!cancelled) {
          setPulse(null);
          setPulseError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [buildDateParams]);

  // Engagement funnel metrics.
  useEffect(() => {
    let cancelled = false;
    const params = buildDateParams();
    fetch(`/api/admin/connections/funnel?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => !cancelled && setFunnel(data))
      .catch(() => !cancelled && setFunnel(null));
    return () => {
      cancelled = true;
    };
  }, [buildDateParams]);

  // Connection list with response-based filtering.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = buildDateParams();
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

    // Use action filter if active, otherwise use tab filter
    if (activeAction) {
      params.set("filter", activeAction);
    } else {
      params.set("filter", activeTab);
    }

    fetch(`/api/admin/connections?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((data: ListResponse) => {
        if (!cancelled) setList(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setList(null);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [buildDateParams, debouncedSearch, activeTab, activeAction]);

  // Compute simplified counts from raw response counts
  const simplifiedCounts: SimplifiedCounts | null = useMemo(() => {
    const rc = list?.responseCounts;
    if (!rc) return null;
    return {
      todo: rc.needs_attention + rc.no_email,
      waiting: rc.provider_nudged + rc.family_nudged,
      connected: rc.responded,
    };
  }, [list?.responseCounts]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
          <p className="text-sm text-gray-500 mt-1">Family inquiries to providers</p>
        </div>
        <DateRangePopover value={range} onChange={setRange} />
      </div>

      {/* Stats - 4 column grid like Care Seekers */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Successful</p>
          <p className="text-2xl font-bold text-gray-900">{pulse ? pulse.total : "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Response Rate</p>
          <p className="text-2xl font-bold text-emerald-600">{pulse?.responseRate ?? 0}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Median Response</p>
          <p className="text-2xl font-bold text-gray-900">
            {pulse?.medianResponseTime != null ? `${pulse.medianResponseTime}h` : "—"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Awaiting Response</p>
          <p className="text-2xl font-bold text-amber-600">{pulse?.awaitingCount ?? 0}</p>
        </div>
      </div>

      {pulseError && (
        <p className="mb-4 text-xs text-amber-600">
          Could not load metrics. Refresh to try again.
        </p>
      )}

      {/* Engagement Funnel */}
      <EngagementFunnel funnel={funnel} />

      {/* Action Queue */}
      <ActionQueue
        counts={list?.action_counts}
        activeAction={activeAction}
        onActionClick={setActiveAction}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map(({ key, label }) => {
          const active = activeTab === key && !activeAction;
          const count = simplifiedCounts?.[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveTab(key);
                setActiveAction(null); // Clear action filter when switching tabs
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                  active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by family or provider name..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="px-4 py-16 text-center text-sm text-gray-400">Loading…</div>
        ) : error ? (
          <div className="px-4 py-16 text-center text-sm text-rose-600">
            Could not load connections. Try again.
          </div>
        ) : !list || list.connections.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-gray-400">
            {activeAction === "hot_leads"
              ? "No hot leads right now."
              : activeAction === "nudge_provider"
              ? "No providers to nudge."
              : activeAction === "nudge_family"
              ? "No families to follow up with."
              : activeAction === "call_no_email"
              ? "No providers without email."
              : activeTab === "todo"
              ? "Nothing to do. All caught up!"
              : activeTab === "waiting"
              ? "No connections waiting for response."
              : "No successful connections yet."}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {list.connections.map((c) => (
              <ConnectionRow
                key={c.id}
                c={c}
                engagement={
                  c.provider.activityKey ? list.engagement[c.provider.activityKey] : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {list?.truncated && (
        <p className="mt-2 text-xs text-amber-600">
          Showing a capped slice — narrow the date range for complete counts.
        </p>
      )}
    </div>
  );
}
