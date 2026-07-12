"use client";

/**
 * Cold Outreach Admin Demo
 *
 * Matches admin layout patterns with proper spacing.
 * Simplified 4-tab workflow for demo purposes.
 *
 * Key behaviors:
 * - Tab counts only show contactable providers (with email)
 * - "Send" updates local state to move providers to Sent tab
 * - Clean stacked row layout for readability
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Select from "@/components/ui/Select";

// ============================================================
// Types
// ============================================================

type OutreachStage = "to_send" | "sent" | "claimed" | "needs_followup";

type ProviderRow = {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  views: number;
  hasEmail: boolean;
  stage: OutreachStage;
  email1_sent_at: string | null;
  email1_opened: boolean;
  email2_sent_at: string | null;
  email2_opened: boolean;
};

type CityOption = {
  city: string;
  state: string;
  count: number;
};

type ApiResponse = {
  rows: ProviderRow[];
  total: number;
  tabCounts: Record<OutreachStage, number>;
  cities: CityOption[];
  stats: {
    totalWithEmail: number;
    totalWithoutEmail: number;
  };
};

// ============================================================
// Constants
// ============================================================

const STAGE_TABS: Array<{ key: OutreachStage; label: string }> = [
  { key: "to_send", label: "To Send" },
  { key: "sent", label: "Sent" },
  { key: "claimed", label: "Claimed" },
  { key: "needs_followup", label: "Needs Follow-up" },
];

const PAGE_SIZE = 50;

// ============================================================
// Main Component
// ============================================================

export default function ColdOutreachAdminPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] = useState<OutreachStage>("to_send");
  const [city, setCity] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  // Track providers we've "sent" in this session (for demo)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch data
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      params.set("stage", stage);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/cold-outreach-demo?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const json = await res.json();

      // Apply local "sent" state - move sent providers to "sent" stage
      const rows = json.rows.map((row: ProviderRow) => {
        if (sentIds.has(row.id) && row.stage === "to_send") {
          return {
            ...row,
            stage: "sent" as OutreachStage,
            email1_sent_at: new Date().toISOString(),
            email1_opened: false,
          };
        }
        return row;
      });

      // Recalculate tab counts with local state
      const tabCounts = { ...json.tabCounts };
      const sentCount = rows.filter((r: ProviderRow) => sentIds.has(r.id) && r.stage === "to_send").length;
      // Note: The filter above won't match because we already updated stage
      // So we need to count based on sentIds
      for (const id of sentIds) {
        // Check if this provider was originally to_send
        const originalRow = json.rows.find((r: ProviderRow) => r.id === id);
        if (originalRow && originalRow.stage === "to_send") {
          tabCounts.to_send = Math.max(0, tabCounts.to_send - 1);
          tabCounts.sent = tabCounts.sent + 1;
        }
      }

      setData({ ...json, rows, tabCounts });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [city, stage, debouncedSearch, page, sentIds]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // City options for dropdown
  const cityOptions = useMemo(
    () => [
      { value: "", label: "All Cities" },
      ...(data?.cities ?? []).map((c) => ({
        value: c.state ? `${c.city}, ${c.state}` : c.city,
        label: c.state
          ? `${c.city}, ${c.state} (${c.count})`
          : `${c.city} (${c.count})`,
      })),
    ],
    [data?.cities]
  );

  // Contactable providers on current page (for selection)
  const contactableOnPage = useMemo(
    () => (data?.rows ?? []).filter((p) => p.hasEmail && p.stage === "to_send"),
    [data?.rows]
  );

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = new Set(contactableOnPage.map((p) => p.id));
    const allPageSelected = contactableOnPage.every((p) => selectedIds.has(p.id));

    if (allPageSelected) {
      // Deselect all on this page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of pageIds) next.delete(id);
        return next;
      });
    } else {
      // Select all on this page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of pageIds) next.add(id);
        return next;
      });
    }
  };

  // Handle stage change
  const handleStageChange = useCallback(
    (newStage: OutreachStage) => {
      if (newStage === stage) return;
      setLoading(true);
      setPage(0);
      setStage(newStage);
      setSelectedIds(new Set());
    },
    [stage]
  );

  // Handle send - update local state to move providers to Sent
  const handleSend = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200)); // Simulate API call

    // Mark these providers as sent in local state
    setSentIds((prev) => {
      const next = new Set(prev);
      for (const id of selectedIds) next.add(id);
      return next;
    });

    setSending(false);
    setShowSendConfirm(false);
    setSelectedIds(new Set());
    // refetch will apply the sentIds overlay
  };

  const allPageSelected =
    contactableOnPage.length > 0 && contactableOnPage.every((p) => selectedIds.has(p.id));

  // Filter rows to hide sent providers from "to_send" view
  const visibleRows = useMemo(() => {
    if (!data) return [];
    if (stage === "to_send") {
      return data.rows.filter((r) => !sentIds.has(r.id));
    }
    if (stage === "sent") {
      // Include providers we've sent + those already in sent stage
      return data.rows.filter((r) => sentIds.has(r.id) || r.stage === "sent");
    }
    return data.rows;
  }, [data, stage, sentIds]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Container matching admin layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin" className="hover:text-gray-700">
              Admin
            </Link>
            <span>/</span>
            <span className="text-gray-900">Cold Outreach</span>
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-medium rounded">
              DEMO
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Provider Outreach</h1>
          <p className="text-lg text-gray-600 mt-1">
            Send profile completion emails to unclaimed providers.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Row 1: Search + City dropdown */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Search */}
          <div className="relative w-full sm:w-64">
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
              placeholder="Search providers..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400"
            />
          </div>

          {/* City dropdown */}
          <div className="w-72">
            <Select
              options={cityOptions}
              value={city ?? ""}
              onChange={(value) => {
                setCity(value || null);
                setPage(0);
                setSelectedIds(new Set());
              }}
              placeholder="All Cities"
              size="sm"
              searchable
              searchPlaceholder="Search cities..."
            />
          </div>

          {/* Stats */}
          {data?.stats && (
            <p className="ml-auto text-sm text-gray-500">
              <span className="font-medium text-gray-700">{data.stats.totalWithEmail}</span> with email
              {data.stats.totalWithoutEmail > 0 && (
                <span className="text-gray-400"> · {data.stats.totalWithoutEmail} without</span>
              )}
            </p>
          )}
        </div>

        {/* Row 2: Stage tabs + Send button */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {STAGE_TABS.map((t) => {
              const count = data?.tabCounts[t.key] ?? 0;
              const active = t.key === stage;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleStageChange(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    active
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {t.label}
                  <span className={`text-xs ${active ? "text-white/70" : "text-gray-400"}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Send button */}
          {stage === "to_send" && selectedIds.size > 0 && (
            <button
              onClick={() => setShowSendConfirm(true)}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Send to {selectedIds.size}
            </button>
          )}
        </div>

        {/* Provider List */}
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ) : visibleRows.length === 0 ? (
          <EmptyState stage={stage} sentCount={sentIds.size} />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Table Header - only on To Send */}
            {stage === "to_send" && contactableOnPage.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">
                  Select all on this page ({contactableOnPage.length})
                </span>
              </div>
            )}

            {/* Provider Rows */}
            <ul className="divide-y divide-gray-100">
              {visibleRows.map((row) => (
                <ProviderRow
                  key={row.id}
                  row={row}
                  stage={stage}
                  isSelected={selectedIds.has(row.id)}
                  onToggle={() => toggleSelect(row.id)}
                  wasSent={sentIds.has(row.id)}
                />
              ))}
            </ul>

            {/* Pagination */}
            {data && data.total > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500">
                  Page {page + 1} of {Math.ceil(data.total / PAGE_SIZE)}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * PAGE_SIZE >= data.total}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Demo Notice */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Demo mode:</span> This page uses real provider data.
            Outreach status is simulated and persists only in your browser session. No actual emails are sent.
          </p>
        </div>

        {/* Send Confirmation Drawer */}
        {showSendConfirm && (
          <SendConfirmDrawer
            city={city}
            selectedCount={selectedIds.size}
            sending={sending}
            onClose={() => setShowSendConfirm(false)}
            onConfirm={handleSend}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Provider Row Component
// ============================================================

function ProviderRow({
  row,
  stage,
  isSelected,
  onToggle,
  wasSent,
}: {
  row: ProviderRow;
  stage: OutreachStage;
  isSelected: boolean;
  onToggle: () => void;
  wasSent: boolean;
}) {
  const location = [row.city, row.state].filter(Boolean).join(", ") || "Location unknown";
  const category = row.category ? formatCategory(row.category) : null;

  return (
    <li
      className={`flex items-start gap-4 px-4 py-4 transition-colors hover:bg-gray-50 ${
        isSelected ? "bg-primary-50" : ""
      } ${!row.hasEmail ? "opacity-50" : ""}`}
    >
      {/* Checkbox - only on To Send tab for contactable providers */}
      {stage === "to_send" && (
        <div className="pt-0.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            disabled={!row.hasEmail}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
          />
        </div>
      )}

      {/* Provider Info - stacked layout */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">{location}</p>
        <div className="flex items-center gap-2 mt-1">
          {category && (
            <span className="text-xs text-gray-400">{category}</span>
          )}
          {row.hasEmail ? (
            <span className="text-xs text-gray-400">{row.email}</span>
          ) : (
            <span className="text-xs text-red-400">No email</span>
          )}
        </div>
      </div>

      {/* Right side - views + engagement */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Views badge */}
        {row.views > 0 && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            {row.views} views
          </span>
        )}

        {/* Engagement signals - Sent tab */}
        {stage === "sent" && (
          <div className="flex items-center gap-1.5">
            {wasSent && (
              <span className="text-xs text-gray-400">Just sent</span>
            )}
            {row.email1_opened && (
              <span className="text-xs text-sky-600" title="Email 1 opened">
                Opened
              </span>
            )}
            {row.email2_sent_at && !row.email2_opened && (
              <span className="text-xs text-gray-400" title="Email 2 sent">
                E2 sent
              </span>
            )}
            {row.email2_opened && (
              <span className="text-xs text-purple-600" title="Email 2 opened">
                E2 opened
              </span>
            )}
          </div>
        )}

        {/* Claimed badge */}
        {stage === "claimed" && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
            Profile claimed
          </span>
        )}
      </div>
    </li>
  );
}

// ============================================================
// Empty State Component
// ============================================================

function EmptyState({ stage, sentCount }: { stage: OutreachStage; sentCount: number }) {
  const configs: Record<OutreachStage, { icon: string; title: string; desc: string }> = {
    to_send: {
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      title: sentCount > 0 ? "All sent!" : "No providers to contact",
      desc: sentCount > 0
        ? `You've sent ${sentCount} emails this session. Check the Sent tab.`
        : "No unclaimed providers with emails in this city.",
    },
    sent: {
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "No sequences in progress",
      desc: "Send emails from the To Send tab to see them here.",
    },
    claimed: {
      icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
      title: "No claimed profiles yet",
      desc: "Providers who complete their profile appear here.",
    },
    needs_followup: {
      icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
      title: "No follow-ups needed",
      desc: "Providers who don't respond after the sequence appear here.",
    },
  };

  const config = configs[stage];

  return (
    <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={config.icon} />
        </svg>
      </div>
      <p className="text-lg font-semibold text-gray-900">{config.title}</p>
      <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{config.desc}</p>
    </div>
  );
}

// ============================================================
// Send Confirmation Drawer
// ============================================================

function SendConfirmDrawer({
  city,
  selectedCount,
  sending,
  onClose,
  onConfirm,
}: {
  city: string | null;
  selectedCount: number;
  sending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Start Email Sequence</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 truncate">
                {city ?? "All Cities"}
              </p>
            </div>
            <div className="rounded-xl bg-primary-50 p-4">
              <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">Providers</p>
              <p className="mt-1 text-3xl font-bold text-primary-700">{selectedCount}</p>
            </div>
          </div>

          {/* Sequence explanation */}
          <div className="rounded-xl border border-gray-200 p-4 mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-3">Email sequence</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email 1 sent immediately</p>
                  <p className="text-xs text-gray-500">Shows their profile view count + claim CTA</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Wait 3 days</p>
                  <p className="text-xs text-gray-500">Provider appears in Sent tab</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email 2 if no response</p>
                  <p className="text-xs text-gray-500">Then → Claimed or Needs Follow-up</p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email preview</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src="/images/for-providers/team/logan.jpg"
                  alt="Logan"
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Dr. Logan DuBose</p>
                  <p className="text-xs text-gray-400">logan@olera.care</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                &ldquo;Families are searching for you on Olera. Your listing had <strong>X views</strong> this
                month — claim your profile to start getting inquiries...&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={sending}
              className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {sending ? "Sending..." : `Send to ${selectedCount}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatCategory(category: string): string {
  return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
