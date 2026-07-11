"use client";

/**
 * Cold Outreach Admin Demo
 *
 * Mirrors the staffing-outreach page pattern with:
 * - Tab navigation for sequence stages
 * - Real unclaimed provider data from API
 * - Engagement signals (opened, clicked, replied)
 * - Drawer for detailed provider view
 *
 * This is a DEMO page - no actual emails are sent.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Select from "@/components/ui/Select";
import { ColdOutreachDrawer } from "./Drawer";

// ============================================================
// Types
// ============================================================

type OutreachStage = "not_started" | "sending" | "awaiting_response" | "completed" | "closed";

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
  created_at: string;
  stage: OutreachStage;
  sequence_started_at: string | null;
  email1_sent_at: string | null;
  email1_opened: boolean;
  email1_clicked: boolean;
  email2_sent_at: string | null;
  email2_opened: boolean;
  responded: boolean;
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
};

// ============================================================
// Constants
// ============================================================

const STAGE_TABS: Array<{ key: OutreachStage; label: string }> = [
  { key: "not_started", label: "Not Started" },
  { key: "sending", label: "Sending" },
  { key: "awaiting_response", label: "Needs Follow-up" },
  { key: "completed", label: "Claimed" },
  { key: "closed", label: "Closed" },
];

const PAGE_SIZE = 50;

// ============================================================
// Main Component
// ============================================================

export default function ColdOutreachAdminPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] = useState<OutreachStage>("not_started");
  const [city, setCity] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  const [openProviderId, setOpenProviderId] = useState<string | null>(null);
  const [showQueueConfirm, setShowQueueConfirm] = useState(false);
  const [queueingAll, setQueueingAll] = useState(false);

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
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [city, stage, debouncedSearch, page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // City options for dropdown
  const cityOptions = useMemo(
    () => [
      { value: "", label: "All Cities" },
      ...(data?.cities ?? []).map((c) => ({
        value: c.state ? `${c.city}, ${c.state}` : c.city,
        label: `${c.city}, ${c.state} (${c.count})`,
      })),
    ],
    [data?.cities]
  );

  // Handle stage change
  const handleStageChange = useCallback(
    (newStage: OutreachStage) => {
      if (newStage === stage) return;
      setLoading(true);
      setPage(0);
      setStage(newStage);
    },
    [stage]
  );

  // Simulate starting sequences
  const handleQueueAll = async () => {
    setQueueingAll(true);
    await new Promise((r) => setTimeout(r, 1500));
    setQueueingAll(false);
    setShowQueueConfirm(false);
    // In production, this would call an API to start sequences
    refetch();
  };

  const selectedProvider = useMemo(
    () => data?.rows.find((r) => r.id === openProviderId) ?? null,
    [data?.rows, openProviderId]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2">
                <Image src="/images/olera-logo.png" alt="Olera" width={24} height={24} />
                <span className="font-semibold text-gray-900">Admin</span>
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-600 text-sm">Cold Outreach</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-medium rounded">
                DEMO
              </span>
              <Link
                href="/cold-outreach-demo"
                className="text-[13px] text-gray-500 hover:text-gray-700"
              >
                ← Provider View
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
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

        {/* Row 1: Search | City dropdown | Stats */}
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
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400"
            />
          </div>

          {/* City dropdown */}
          <div className="w-64">
            <Select
              options={cityOptions}
              value={city ?? ""}
              onChange={(value) => {
                setLoading(true);
                setPage(0);
                setCity(value || null);
              }}
              placeholder="Select city..."
              size="sm"
              searchable
              searchPlaceholder="Search cities..."
            />
          </div>

          {/* Inline stats */}
          <div className="ml-auto flex items-center gap-4">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">
                {loading ? "-" : data?.total ?? 0}
              </span>
              {" providers"}
            </p>
            {!loading && data && (
              <p className="text-sm text-gray-500">
                <span className="font-medium text-emerald-600">
                  {data.rows.filter((r) => r.views > 0).length}
                </span>
                {" with views"}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Stage tabs + Queue All button */}
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
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                  {typeof count === "number" && (
                    <span
                      className={`text-xs ${active ? "text-white/70" : "text-gray-400"}`}
                    >
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Queue All button - only show on Not Started tab */}
          {stage === "not_started" && (data?.tabCounts.not_started ?? 0) > 0 && (
            <button
              onClick={() => setShowQueueConfirm(true)}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Start Sequences
            </button>
          )}
        </div>

        {/* Provider List */}
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
        ) : !data || data.rows.length === 0 ? (
          <EmptyState stage={stage} hasSearch={!!debouncedSearch} />
        ) : (
          <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {data.rows.map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => setOpenProviderId(row.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {row.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                        {row.email && (
                          <span className="text-gray-400"> · {row.email}</span>
                        )}
                      </p>
                    </div>

                    {/* Views badge */}
                    {row.views > 0 && (
                      <span className="hidden sm:inline rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {row.views} views
                      </span>
                    )}

                    {/* Engagement signals - only show on sending/awaiting tabs */}
                    {(stage === "sending" || stage === "awaiting_response") && (
                      <div className="flex items-center gap-1">
                        {row.email1_opened && (
                          <span className="text-sky-500" title="Email opened">
                            👁
                          </span>
                        )}
                        {row.email1_clicked && (
                          <span className="text-purple-500" title="Link clicked">
                            🔗
                          </span>
                        )}
                        {row.responded && (
                          <span className="text-green-500" title="Claimed profile">
                            ✓
                          </span>
                        )}
                      </div>
                    )}

                    {/* Category */}
                    {row.category && (
                      <span className="hidden lg:inline text-xs text-gray-400 truncate max-w-[120px]">
                        {formatCategory(row.category)}
                      </span>
                    )}

                    {/* Chevron */}
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {data.total > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.total)} of{" "}
                  {data.total}
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
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-[13px] text-amber-800">
            <span className="font-medium">Demo:</span> This page fetches real unclaimed
            provider data. Outreach status is simulated. No actual emails are sent.
          </p>
        </div>
      </main>

      {/* Queue All Confirmation Modal */}
      {showQueueConfirm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowQueueConfirm(false)}
          />
          <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Start Email Sequences
              </h2>
              <button
                onClick={() => setShowQueueConfirm(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    City
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 truncate">
                    {city ?? "All Cities"}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    Providers
                  </p>
                  <p className="mt-1 text-3xl font-bold text-blue-700">
                    {data?.tabCounts.not_started ?? 0}
                  </p>
                </div>
              </div>

              {/* What will happen */}
              <div className="rounded-xl border border-gray-200 p-4 mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  What will happen
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Email 1 sent from Logan
                      </p>
                      <p className="text-xs text-gray-500">
                        Shows their profile view count + CTA
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Wait 3 days</p>
                      <p className="text-xs text-gray-500">
                        Providers move to Sending tab
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Email 2 if no response
                      </p>
                      <p className="text-xs text-gray-500">
                        Then move to Needs Follow-up tab
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Preview */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Email Preview
                  </p>
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
                      <p className="text-sm font-medium text-gray-900">
                        Dr. Logan DuBose
                      </p>
                      <p className="text-xs text-gray-400">logan@olera.care</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    "Families are looking at your listing on Olera. Your profile had{" "}
                    <strong>X views</strong> this month..."
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQueueConfirm(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQueueAll}
                  disabled={queueingAll}
                  className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {queueingAll
                    ? "Starting..."
                    : `Start ${data?.tabCounts.not_started ?? 0} Sequences`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Drawer */}
      {openProviderId && selectedProvider && (
        <ColdOutreachDrawer
          provider={selectedProvider}
          onClose={() => setOpenProviderId(null)}
          onAction={() => {
            refetch();
            setOpenProviderId(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Empty State Component
// ============================================================

function EmptyState({
  stage,
  hasSearch,
}: {
  stage: OutreachStage;
  hasSearch: boolean;
}) {
  if (hasSearch) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-7 w-7 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900">No matches found</p>
        <p className="mt-1 text-sm text-gray-500">
          Try a different search term or clear filters.
        </p>
      </div>
    );
  }

  const configs: Record<
    OutreachStage,
    { icon: string; title: string; desc: string; color: string }
  > = {
    not_started: {
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      title: "No providers to reach",
      desc: "All unclaimed providers have been added to a sequence.",
      color: "bg-blue-100 text-blue-600",
    },
    sending: {
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "No emails sending",
      desc: "Start sequences from the Not Started tab.",
      color: "bg-amber-100 text-amber-600",
    },
    awaiting_response: {
      icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
      title: "No follow-ups needed",
      desc: "Providers who don't respond will appear here.",
      color: "bg-amber-100 text-amber-600",
    },
    completed: {
      icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
      title: "No claimed providers yet",
      desc: "Providers who claim their profile will appear here.",
      color: "bg-emerald-100 text-emerald-600",
    },
    closed: {
      icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
      title: "No closed providers",
      desc: "Bounced emails and do-not-contact will appear here.",
      color: "bg-gray-100 text-gray-600",
    },
  };

  const config = configs[stage];

  return (
    <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
      <div
        className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${config.color}`}
      >
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d={config.icon}
          />
        </svg>
      </div>
      <p className="text-lg font-semibold text-gray-900">{config.title}</p>
      <p className="mt-1 text-sm text-gray-500">{config.desc}</p>
    </div>
  );
}

// ============================================================
// Helper Functions
// ============================================================

function formatCategory(category: string): string {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
