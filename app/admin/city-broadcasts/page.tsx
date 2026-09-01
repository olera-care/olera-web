"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DateRangePopover, {
  type DateRangeValue,
  type DateRangePresetOption,
  rangeLabel,
} from "@/components/admin/DateRangePopover";

// Custom presets for city broadcasts - just the lookback windows we care about
const BROADCAST_DATE_PRESETS: DateRangePresetOption[] = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

// Convert DateRangeValue preset to days for API
function presetToDays(preset: string): number {
  switch (preset) {
    case "7d": return 7;
    case "14d": return 14;
    case "30d": return 30;
    case "90d": return 90;
    default: return 7;
  }
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {message}
    </div>
  );
}

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
  stage: "broadcast_ready" | "not_interested" | "archived";
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

interface ExcludedProvider {
  provider_id: string;
  provider_name: string;
  category: string | null;
  city: string;
  state: string | null;
  email: string;
  exclusion_reason: "bounced" | "complained";
  last_bounce_at: string | null;
  last_complaint_at: string | null;
}

interface ExcludedPayload {
  excluded: ExcludedProvider[];
  stats: {
    bounced: number;
    complained: number;
    total: number;
  };
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
  pagination: {
    page: number;
    per_page: number;
    total_cities: number;
    total_pages: number;
  };
  filters: {
    days: number;
    status: string;
    done_sub: string | null;
    city: string;
    search: string;
  };
}

interface BroadcastHistoryRecord {
  id: string;
  created_at: string;
  event_type: "question_asked" | "profile_published";
  event_city: string;
  event_category: string | null;
}

const PAGE_SIZE = 10;

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

// Reason options for Not Interested action
const NOT_INTERESTED_REASONS = [
  { value: "declined_explicitly", label: "Declined explicitly" },
  { value: "wrong_business_type", label: "Wrong business type" },
  { value: "out_of_business", label: "Out of business" },
  { value: "already_has_solution", label: "Already has a solution" },
  { value: "no_response_exhausted", label: "No response (exhausted)" },
  { value: "contact_unreachable", label: "Contact unreachable" },
  { value: "other", label: "Other" },
] as const;

// Reason options for Archive action
const ARCHIVE_REASONS = [
  { value: "uninterested_provider", label: "Uninterested provider" },
  { value: "inactive", label: "Inactive" },
  { value: "inactive_multiple_attempts", label: "Inactive (multiple attempts)" },
  { value: "out_of_business", label: "Out of business" },
  { value: "invalid_provider", label: "Invalid provider" },
  { value: "wrong_contact_info", label: "Wrong contact info" },
  { value: "duplicate", label: "Duplicate" },
  { value: "other", label: "Other" },
] as const;

// Action confirmation modal
function ActionModal({
  provider,
  action,
  onConfirm,
  onCancel,
  loading,
}: {
  provider: ProviderBroadcast;
  action: "not_interested" | "archived";
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  const reasons = action === "not_interested" ? NOT_INTERESTED_REASONS : ARCHIVE_REASONS;
  const title = action === "not_interested" ? "Mark as Not Interested" : "Archive Provider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{provider.provider_name}</p>
        </div>

        <div className="px-5 py-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
          >
            <option value="">Select a reason...</option>
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Bulk action confirmation modal
function BulkActionModal({
  count,
  action,
  onConfirm,
  onCancel,
  loading,
}: {
  count: number;
  action: "not_interested" | "archived";
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  const reasons = action === "not_interested" ? NOT_INTERESTED_REASONS : ARCHIVE_REASONS;
  const title = action === "not_interested" ? "Mark as Not Interested" : "Archive Providers";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            {count} provider{count > 1 ? "s" : ""} selected
          </p>
        </div>

        <div className="px-5 py-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
          >
            <option value="">Select a reason...</option>
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : `${title} (${count})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Floating bulk action bar
function BulkActionBar({
  count,
  onNotInterested,
  onArchive,
  onClear,
}: {
  count: number;
  onNotInterested: () => void;
  onArchive: () => void;
  onClear: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transform">
      <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-lg">
        <span className="text-sm font-medium text-gray-700">
          {count} selected
        </span>
        <div className="h-4 w-px bg-gray-200" />
        <button
          type="button"
          onClick={onNotInterested}
          className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Not Interested
        </button>
        <button
          type="button"
          onClick={onArchive}
          className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Archive
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function ActionsDropdown({
  provider,
  onAction,
}: {
  provider: ProviderBroadcast;
  onAction: (providerId: string, action: "not_interested" | "archived") => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onAction(provider.provider_id, "not_interested");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Not Interested
          </button>
          <button
            type="button"
            onClick={() => {
              onAction(provider.provider_id, "archived");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Archive
          </button>
        </div>
      )}
    </div>
  );
}

function ProviderRow({
  provider,
  onAction,
  selected,
  onToggleSelect,
  showCheckbox,
}: {
  provider: ProviderBroadcast;
  onAction: (providerId: string, action: "not_interested" | "archived") => void;
  selected: boolean;
  onToggleSelect: (providerId: string) => void;
  showCheckbox: boolean;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<BroadcastHistoryRecord[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const broadcastLabel =
    provider.last_broadcast_type === "question_asked"
      ? "Question"
      : provider.last_broadcast_type === "profile_published"
        ? "Profile"
        : null;

  // Determine if actions are available (only for broadcast_ready providers who haven't claimed)
  const showActions = provider.stage === "broadcast_ready" && !provider.claimed;

  // Fetch history when expanded
  const toggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }

    setShowHistory(true);
    if (history !== null) return; // Already fetched

    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/city-broadcasts/history?provider_id=${provider.provider_id}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch {
      // Silently fail - history is optional
    } finally {
      setLoadingHistory(false);
    }
  };

  // Status badge based on stage and claim status
  const renderStatus = () => {
    // Terminal states
    if (provider.stage === "not_interested") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
          Not Interested
        </span>
      );
    }
    if (provider.stage === "archived") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
          Archived
        </span>
      );
    }

    // broadcast_ready stage - show conversion/claimed/waiting
    if (provider.is_conversion) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
          Converted
        </span>
      );
    }
    if (provider.claimed) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
          Claimed
        </span>
      );
    }
    if (provider.broadcasts_received > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          Waiting
        </span>
      );
    }
    return <span className="text-sm text-gray-400">-</span>;
  };

  const colSpan = showCheckbox ? 7 : 6;

  return (
    <>
      <tr className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${selected ? "bg-blue-50" : ""}`}>
        {showCheckbox && (
          <td className="w-10 px-3 py-2.5">
            {showActions ? (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect(provider.provider_id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            ) : (
              <span className="block h-4 w-4" />
            )}
          </td>
        )}
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
            <button
              type="button"
              onClick={toggleHistory}
              className="group text-left hover:bg-gray-100 rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 transition-colors"
              title="Click to see broadcast history"
            >
              <span className="font-mono text-sm tabular-nums text-gray-700 group-hover:text-blue-600">
                {provider.broadcasts_received}
              </span>
              {broadcastLabel && (
                <div className="text-[10px] text-gray-400">
                  {broadcastLabel} · {relative(provider.last_broadcast_at)}
                </div>
              )}
            </button>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-center">
          {renderStatus()}
        </td>
        <td className="px-4 py-2.5 text-center">
          {showActions ? (
            <ActionsDropdown provider={provider} onAction={onAction} />
          ) : (
            <span className="text-gray-300">-</span>
          )}
        </td>
      </tr>
      {showHistory && (
        <tr className="bg-blue-50/50">
          <td colSpan={colSpan} className="px-4 py-3">
            <div className="text-[11px] font-medium text-gray-500 mb-2">Broadcast History</div>
            {loadingHistory ? (
              <div className="text-xs text-gray-400">Loading...</div>
            ) : history && history.length > 0 ? (
              <div className="space-y-1.5">
                {history.map((record) => (
                  <div key={record.id} className="flex items-center gap-3 text-xs">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-medium ${
                      record.event_type === "question_asked"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {record.event_type === "question_asked" ? "Question" : "Profile"}
                    </span>
                    <span className="text-gray-600">
                      {record.event_city}
                      {record.event_category && ` · ${record.event_category}`}
                    </span>
                    <span className="text-gray-400 ml-auto">
                      {relative(record.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400">No broadcast records found</div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// Excluded provider row with actions
function ExcludedProviderRow({
  provider,
  onFixed,
  setToast,
}: {
  provider: ExcludedProvider;
  onFixed: () => void;
  setToast: (toast: { message: string; type: "success" | "error" }) => void;
}) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState(provider.email);
  const [saving, setSaving] = useState(false);

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === provider.email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: provider.provider_id,
          email: newEmail,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update email");
      }
      setToast({ message: "Email updated successfully", type: "success" });
      setShowEmailModal(false);
      onFixed();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Failed to update", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_ids: [provider.provider_id],
          stage: "archived",
          // Use valid archive reasons from VALID_ARCHIVE_REASONS in update-stage API
          // complained = they don't want our emails, bounced = wrong contact info
          reason: provider.exclusion_reason === "complained" ? "provider_requested_no_emails" : "wrong_contact_info",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to archive");
      }
      setToast({ message: "Provider archived", type: "success" });
      onFixed();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Failed to archive", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const issueDate = provider.last_complaint_at || provider.last_bounce_at;

  return (
    <>
      <tr className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{provider.provider_name}</div>
          {provider.category && (
            <div className="text-[11px] text-gray-500">{provider.category}</div>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {provider.city}{provider.state && `, ${provider.state}`}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={provider.email}>
          {provider.email}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            provider.exclusion_reason === "complained"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          }`}>
            {provider.exclusion_reason === "complained" ? "Complained" : "Bounced"}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {issueDate ? relative(issueDate) : "-"}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            {provider.exclusion_reason === "bounced" && (
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Fix Email
              </button>
            )}
            <button
              type="button"
              onClick={handleArchive}
              disabled={saving}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Archive
            </button>
          </div>
        </td>
      </tr>

      {/* Update email modal */}
      {showEmailModal && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="border-b border-gray-200 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">New email:</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Enter new email address"
                />
                <button
                  type="button"
                  onClick={handleUpdateEmail}
                  disabled={saving || !newEmail || newEmail === provider.email}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function CitySection({
  group,
  defaultExpanded,
  onAction,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  showCheckbox,
}: {
  group: CityGroup;
  defaultExpanded: boolean;
  onAction: (providerId: string, action: "not_interested" | "archived") => void;
  selectedIds: Set<string>;
  onToggleSelect: (providerId: string) => void;
  onToggleSelectAll: (providerIds: string[], select: boolean) => void;
  showCheckbox: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Get selectable providers (broadcast_ready and not claimed)
  const selectableProviders = group.providers.filter(
    (p) => p.stage === "broadcast_ready" && !p.claimed
  );
  const selectableIds = selectableProviders.map((p) => p.provider_id);
  const selectedInCity = selectableIds.filter((id) => selectedIds.has(id));
  const allSelected = selectableIds.length > 0 && selectedInCity.length === selectableIds.length;
  const someSelected = selectedInCity.length > 0 && selectedInCity.length < selectableIds.length;

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
                {showCheckbox && (
                  <th className="w-10 px-3 py-2">
                    {selectableIds.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        onChange={() => onToggleSelectAll(selectableIds, !allSelected)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        title={allSelected ? "Deselect all in city" : "Select all in city"}
                      />
                    )}
                  </th>
                )}
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 text-center font-medium">Broadcasts</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
                <th className="w-12 px-4 py-2 text-center font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {group.providers.map((provider) => (
                <ProviderRow
                  key={provider.provider_id}
                  provider={provider}
                  onAction={onAction}
                  selected={selectedIds.has(provider.provider_id)}
                  onToggleSelect={onToggleSelect}
                  showCheckbox={showCheckbox}
                />
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
  const [excludedData, setExcludedData] = useState<ExcludedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Date range state - default to 7 days
  const initialDays = searchParams.get("days") || "7";
  const initialPreset = ["7", "14", "30", "90"].includes(initialDays) ? `${initialDays}d` : "7d";
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    preset: initialPreset as DateRangeValue["preset"],
    customFrom: "",
    customTo: "",
  });

  // Action modal state (single provider)
  const [pendingAction, setPendingAction] = useState<{
    provider: ProviderBroadcast;
    action: "not_interested" | "archived";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingBulkAction, setPendingBulkAction] = useState<{
    providerIds: string[];
    action: "not_interested" | "archived";
  } | null>(null);

  // Local state for inputs (updated immediately for responsive UI)
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [cityInput, setCityInput] = useState(searchParams.get("city") || "");

  // Pagination state
  const [page, setPage] = useState(1);

  // Open action confirmation modal
  const handleActionClick = useCallback((providerId: string, action: "not_interested" | "archived") => {
    const provider = data?.cities.flatMap((c) => c.providers).find((p) => p.provider_id === providerId);
    if (provider) {
      setPendingAction({ provider, action });
    }
  }, [data]);

  // Confirm action with reason
  const handleActionConfirm = useCallback(async (reason: string) => {
    if (!pendingAction) return;

    const { provider, action } = pendingAction;
    setActionLoading(true);

    try {
      const body: Record<string, unknown> = {
        provider_ids: [provider.provider_id],
        stage: action,
      };

      // Add the required reason field based on action type
      if (action === "not_interested") {
        body.not_interested_reason = reason;
      } else if (action === "archived") {
        body.reason = reason;
      }

      const res = await fetch("/api/admin/provider-outreach/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const responseBody = await res.json().catch(() => ({}));
        throw new Error(responseBody.error || `Failed to update provider`);
      }

      // Remove provider from the current data
      setData((prev) => {
        if (!prev) return prev;

        // Find the provider to get their stats
        const removedProvider = prev.cities
          .flatMap((c) => c.providers)
          .find((p) => p.provider_id === provider.provider_id);

        // Calculate new stats
        const newSent = (removedProvider?.broadcasts_received ?? 0) > 0 ? prev.stats.sent - 1 : prev.stats.sent;
        const newConversions = removedProvider?.is_conversion ? prev.stats.conversions - 1 : prev.stats.conversions;
        const newConversion = newSent > 0 ? Math.round((newConversions / newSent) * 1000) / 10 : 0;

        return {
          ...prev,
          stats: {
            ...prev.stats,
            pool: prev.stats.pool - 1,
            sent: newSent,
            claimed: removedProvider?.claimed ? prev.stats.claimed - 1 : prev.stats.claimed,
            conversions: newConversions,
            conversion: newConversion,
          },
          cities: prev.cities
            .map((city) => ({
              ...city,
              pool_count: city.pool_count - city.providers.filter((p) => p.provider_id === provider.provider_id).length,
              sent_count: city.providers.some((p) => p.provider_id === provider.provider_id && p.broadcasts_received > 0)
                ? city.sent_count - 1
                : city.sent_count,
              claimed_count: city.providers.some((p) => p.provider_id === provider.provider_id && p.claimed)
                ? city.claimed_count - 1
                : city.claimed_count,
              conversion_count: city.providers.some((p) => p.provider_id === provider.provider_id && p.is_conversion)
                ? city.conversion_count - 1
                : city.conversion_count,
              providers: city.providers.filter((p) => p.provider_id !== provider.provider_id),
            }))
            .filter((city) => city.providers.length > 0),
        };
      });

      setToast({
        message: action === "not_interested" ? "Marked as Not Interested" : "Provider archived",
        type: "success",
      });
      setPendingAction(null);
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Failed to update provider",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }, [pendingAction]);

  // Toggle single provider selection
  const handleToggleSelect = useCallback((providerId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  }, []);

  // Toggle all providers in a city
  const handleToggleSelectAll = useCallback((providerIds: string[], select: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of providerIds) {
        if (select) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  }, []);

  // Clear all selections
  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Open bulk action modal
  const handleBulkAction = useCallback((action: "not_interested" | "archived") => {
    if (selectedIds.size === 0) return;
    setPendingBulkAction({
      providerIds: [...selectedIds],
      action,
    });
  }, [selectedIds]);

  // Confirm bulk action with reason
  const handleBulkActionConfirm = useCallback(async (reason: string) => {
    if (!pendingBulkAction) return;

    const { providerIds, action } = pendingBulkAction;
    setActionLoading(true);

    try {
      const body: Record<string, unknown> = {
        provider_ids: providerIds,
        stage: action,
      };

      if (action === "not_interested") {
        body.not_interested_reason = reason;
      } else if (action === "archived") {
        body.reason = reason;
      }

      const res = await fetch("/api/admin/provider-outreach/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const responseBody = await res.json().catch(() => ({}));
        throw new Error(responseBody.error || `Failed to update providers`);
      }

      // Remove providers from the current data
      const removedSet = new Set(providerIds);
      setData((prev) => {
        if (!prev) return prev;

        const removedProviders = prev.cities
          .flatMap((c) => c.providers)
          .filter((p) => removedSet.has(p.provider_id));

        // Calculate new stats
        let sentDelta = 0;
        let claimedDelta = 0;
        let conversionsDelta = 0;

        for (const p of removedProviders) {
          if (p.broadcasts_received > 0) sentDelta++;
          if (p.claimed) claimedDelta++;
          if (p.is_conversion) conversionsDelta++;
        }

        const newSent = prev.stats.sent - sentDelta;
        const newConversions = prev.stats.conversions - conversionsDelta;
        const newConversion = newSent > 0 ? Math.round((newConversions / newSent) * 1000) / 10 : 0;

        return {
          ...prev,
          stats: {
            ...prev.stats,
            pool: prev.stats.pool - providerIds.length,
            sent: newSent,
            claimed: prev.stats.claimed - claimedDelta,
            conversions: newConversions,
            conversion: newConversion,
          },
          cities: prev.cities
            .map((city) => {
              const cityRemoved = city.providers.filter((p) => removedSet.has(p.provider_id));
              return {
                ...city,
                pool_count: city.pool_count - cityRemoved.length,
                sent_count: city.sent_count - cityRemoved.filter((p) => p.broadcasts_received > 0).length,
                claimed_count: city.claimed_count - cityRemoved.filter((p) => p.claimed).length,
                conversion_count: city.conversion_count - cityRemoved.filter((p) => p.is_conversion).length,
                providers: city.providers.filter((p) => !removedSet.has(p.provider_id)),
              };
            })
            .filter((city) => city.providers.length > 0),
        };
      });

      // Clear selection
      setSelectedIds(new Set());

      setToast({
        message: `${providerIds.length} provider${providerIds.length > 1 ? "s" : ""} ${action === "not_interested" ? "marked as Not Interested" : "archived"}`,
        type: "success",
      });
      setPendingBulkAction(null);
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Failed to update providers",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }, [pendingBulkAction]);

  // Debounced values for API calls (300ms delay)
  const debouncedSearch = useDebounce(searchInput, 300);
  const debouncedCity = useDebounce(cityInput, 300);

  // Convert date range preset to days
  const days = presetToDays(dateRange.preset);
  const status = searchParams.get("status") || "all";
  const doneSub = searchParams.get("done_sub") || "claimed";

  // Clear selection and reset page when switching tabs or changing filters
  // This prevents bulk-actioning providers that are no longer visible
  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
  }, [status, doneSub, debouncedSearch, debouncedCity]);

  // Sync URL when debounced values change
  // Note: days is now UI-only state (not synced to URL), so we remove any stale ?days param
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("days"); // Remove stale days param - date range is now UI-only state
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

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      if (status === "excluded") {
        // Load excluded providers
        const res = await fetch("/api/admin/city-broadcasts/excluded", {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        setExcludedData(await res.json());
        setData(null);
      } else {
        // Load normal data
        const params = new URLSearchParams();
        params.set("days", String(days));
        params.set("page", String(page));
        params.set("per_page", String(PAGE_SIZE));
        if (status !== "all") params.set("status", status);
        if (status === "done") params.set("done_sub", doneSub);
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
        setExcludedData(null);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [days, status, doneSub, debouncedCity, debouncedSearch, page]);

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
          <div className="flex items-center gap-2">
            <DateRangePopover
              value={dateRange}
              onChange={setDateRange}
              presets={BROADCAST_DATE_PRESETS}
              ariaLabel="Broadcast stats lookback"
              hideCustomRange
            />
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex min-h-9 items-center rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 hover:border-gray-300 disabled:opacity-50"
            >
              {loading && data ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        }
      />

      {loading && !data && <div className="mt-6 h-24 animate-pulse rounded-xl bg-gray-100" />}
      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Couldn&rsquo;t load: {err}
        </div>
      )}

      {/* Stats - contextual based on current tab */}
      {status === "excluded" && excludedData && (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat
            value={excludedData.stats.total}
            label="Excluded providers"
            detail="Need attention to receive broadcasts"
            tone={excludedData.stats.total > 0 ? "muted" : "default"}
          />
          <Stat
            value={excludedData.stats.bounced}
            label="Bounced emails"
            detail="Email failed to deliver"
            tone={excludedData.stats.bounced > 0 ? "muted" : "default"}
          />
          <Stat
            value={excludedData.stats.complained}
            label="Complained"
            detail="Marked as spam"
            tone={excludedData.stats.complained > 0 ? "muted" : "default"}
          />
        </div>
      )}

      {data && (
        <>
          {status === "done" && doneSub === "not_interested" ? (
            // Not Interested tab - show simple count
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                value={data.stats.pool}
                label="Not Interested"
                detail="Providers marked as not interested"
                tone="muted"
              />
            </div>
          ) : status === "done" && doneSub === "archived" ? (
            // Archived tab - show simple count
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                value={data.stats.pool}
                label="Archived"
                detail="Providers archived from outreach"
                tone="muted"
              />
            </div>
          ) : status === "done" && doneSub === "claimed" ? (
            // Claimed tab - show claimed stats
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                value={data.stats.pool}
                label="Claimed profiles"
                detail="Linked to an account"
                tone={data.stats.pool > 0 ? "success" : "muted"}
              />
              <Stat
                value={data.stats.conversions}
                label="True conversions"
                detail="Claimed after receiving broadcast"
                tone={data.stats.conversions > 0 ? "success" : "muted"}
              />
              <Stat
                value={data.stats.pool - data.stats.conversions}
                label="Claimed organically"
                detail="Claimed before any broadcast"
                tone="default"
              />
              <Stat
                value={data.stats.conversions > 0 ? `${Math.round((data.stats.conversions / data.stats.pool) * 100)}%` : "0%"}
                label="Broadcast attribution"
                detail="% of claims from broadcasts"
                tone={data.stats.conversions > 0 ? "success" : "muted"}
              />
            </div>
          ) : status === "waiting" ? (
            // Waiting tab - show waiting-specific stats
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                value={data.stats.pool}
                label="Waiting for response"
                detail="Received broadcast, not yet claimed"
                tone={data.stats.pool > 0 ? "default" : "muted"}
              />
              <Stat
                value={data.stats.sent}
                label="Received broadcasts"
                detail={rangeLabel(dateRange, BROADCAST_DATE_PRESETS)}
                tone={data.stats.sent > 0 ? "success" : "muted"}
              />
              <Stat
                value={`${data.stats.conversion}%`}
                label="Conversion rate"
                detail={`${data.stats.conversions} converted of ${data.stats.sent} sent`}
                tone={data.stats.conversion >= 10 ? "success" : "default"}
              />
            </div>
          ) : (
            // Pool tab - show full funnel stats
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat value={data.stats.pool} label="In broadcast pool" detail="broadcast_ready providers" />
              <Stat
                value={data.stats.sent}
                label="Received broadcasts"
                detail={rangeLabel(dateRange, BROADCAST_DATE_PRESETS)}
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
          )}
        </>
      )}

      {/* Filters - always show tabs, conditionally show search/city filter */}
      {(data || excludedData) && (
        <div className={`mt-6 flex flex-wrap items-center gap-3 ${status === "excluded" ? "rounded-xl" : "rounded-t-xl border-b-0"} border border-gray-200 bg-gray-50 px-4 py-3`}>
          {/* Status filter - main tabs */}
          <div className="flex gap-1.5">
            {[
              { value: "all", label: "Pool" },
              { value: "waiting", label: "Waiting" },
              { value: "done", label: "Done" },
              { value: "excluded", label: "Excluded" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (opt.value === "all") {
                    params.delete("status");
                    params.delete("done_sub");
                  } else {
                    params.set("status", opt.value);
                    if (opt.value === "done") {
                      params.set("done_sub", "claimed");
                    } else {
                      params.delete("done_sub");
                    }
                  }
                  router.push(`/admin/city-broadcasts?${params.toString()}`);
                }}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  status === opt.value || (status === "all" && opt.value === "all")
                    ? opt.value === "done"
                      ? "bg-green-600 text-white"
                      : opt.value === "waiting"
                        ? "bg-amber-600 text-white"
                        : opt.value === "excluded"
                          ? "bg-red-600 text-white"
                          : "bg-gray-900 text-white"
                    : "border border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Done sub-filter - only shown when status=done */}
          {status === "done" && (
            <div className="flex gap-1 border-l border-gray-300 pl-3">
              {[
                { value: "claimed", label: "Claimed" },
                { value: "not_interested", label: "Not Interested" },
                { value: "archived", label: "Archived" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("done_sub", opt.value);
                    router.push(`/admin/city-broadcasts?${params.toString()}`);
                  }}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                    doneSub === opt.value
                      ? opt.value === "claimed"
                        ? "bg-green-100 text-green-700"
                        : opt.value === "not_interested"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-200 text-gray-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Search and city filter - only for non-excluded tabs */}
          {status !== "excluded" && (
            <>
              <input
                type="text"
                placeholder="Search provider..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="ml-auto rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-0"
              />
              <input
                type="text"
                placeholder="Filter city..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-0"
              />
            </>
          )}
        </div>
      )}

      {/* Excluded providers list */}
      {status === "excluded" && excludedData && (
        <>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {excludedData.excluded.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">
                No excluded providers. All broadcast_ready providers have valid emails.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3 font-medium">Provider</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="w-24 px-4 py-3 text-center font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {excludedData.excluded.map((provider) => (
                    <ExcludedProviderRow
                      key={provider.provider_id}
                      provider={provider}
                      onFixed={() => void load()}
                      setToast={setToast}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="mt-3 text-[11px] text-gray-400">
            {excludedData.stats.total} excluded providers total.
          </p>
        </>
      )}

      {/* Cities list - for non-excluded tabs */}
      {data && (
        <>
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
                  onAction={handleActionClick}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  showCheckbox={status === "all" || status === "waiting"}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[11px] text-gray-400">
              {data.pagination.total_cities <= PAGE_SIZE
                ? `${data.pagination.total_cities} cities, ${data.stats.pool} providers total`
                : `Cities ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, data.pagination.total_cities)} of ${data.pagination.total_cities} (${data.stats.pool} providers total)`
              }
            </p>
            {data.pagination.total_pages > 1 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(data.pagination.total_pages, p + 1))}
                  disabled={page >= data.pagination.total_pages || loading}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Action confirmation modal (single provider) */}
      {pendingAction && (
        <ActionModal
          provider={pendingAction.provider}
          action={pendingAction.action}
          onConfirm={handleActionConfirm}
          onCancel={() => setPendingAction(null)}
          loading={actionLoading}
        />
      )}

      {/* Bulk action confirmation modal */}
      {pendingBulkAction && (
        <BulkActionModal
          count={pendingBulkAction.providerIds.length}
          action={pendingBulkAction.action}
          onConfirm={handleBulkActionConfirm}
          onCancel={() => setPendingBulkAction(null)}
          loading={actionLoading}
        />
      )}

      {/* Bulk action bar (floating at bottom) */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onNotInterested={() => handleBulkAction("not_interested")}
          onArchive={() => handleBulkAction("archived")}
          onClear={handleClearSelection}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
