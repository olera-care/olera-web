"use client";

/**
 * Admin Staffing Outreach V2 — main page.
 *
 * Five-tab navigation for automated email sequences:
 *   1. To Queue    — Providers waiting to start sequence (queued status)
 *   2. Sequencing  — Emails in progress (Resend automation)
 *   3. Needs Call  — Sequence complete, no response (manual call)
 *   4. Enrolled    — Success (activated, enrolled)
 *   5. Closed      — Dead ends (closed, bounced)
 *
 * Key Principle: Admins do minimal manual work. System handles email sending.
 *
 * Data comes from /api/admin/staffing-outreach/queue (batches + rows)
 * and /api/admin/staffing-outreach/[id] (drawer detail).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Drawer } from "./Drawer";
import Select from "@/components/ui/Select";
import type {
  DrawerContext,
  QueueRow,
  StaffingBatch,
} from "@/lib/staffing-outreach/types";

// V2: 5 tabs for automated email sequence workflow
const STAGE_TABS: Array<{ key: string; label: string }> = [
  { key: "to_queue", label: "Not Started" },
  { key: "sequencing", label: "Sending" },
  { key: "needs_call", label: "Needs Follow-up" },
  { key: "enrolled", label: "Active Partners" },
  { key: "closed", label: "Closed" },
];

type Stage = "to_queue" | "sequencing" | "needs_call" | "enrolled" | "closed";

const PAGE_SIZE = 50;

export default function StaffingOutreachPage() {
  const [batches, setBatches] = useState<StaffingBatch[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("to_queue");
  const [queueingAll, setQueueingAll] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);
  const [showQueueConfirm, setShowQueueConfirm] = useState(false); // Queue All confirmation modal

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch queue (and batches on first load)
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (batchId) params.set("batch", batchId);
      params.set("stage", stage);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/staffing-outreach/queue?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setBatches(data.batches ?? []);
      setRows(data.rows ?? []);
      setTabCounts(data.tabCounts ?? {});
      setTotal(data.total ?? 0);
      // Note: Default to "All Universities" (batchId = null) for overview
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [batchId, stage, debouncedSearch, page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const currentBatch = useMemo(
    () => batches.find((b) => b.id === batchId) ?? null,
    [batches, batchId],
  );

  // Convert batches to Select options with "All Universities" option
  const batchOptions = useMemo(
    () => [
      { value: "", label: "All Universities" },
      ...batches.map((b) => ({ value: b.id, label: b.university_name })),
    ],
    [batches],
  );

  // Queue All - show confirmation modal
  const handleQueueAllClick = useCallback(() => {
    if (!batchId) {
      setError("Select a university first to queue all providers");
      return;
    }
    const toQueueCount = tabCounts["to_queue"] ?? 0;
    if (toQueueCount === 0) {
      setError("No providers to queue");
      return;
    }
    setShowQueueConfirm(true);
  }, [batchId, tabCounts]);

  // Queue All - execute after confirmation
  const handleQueueAllConfirm = useCallback(async () => {
    setShowQueueConfirm(false);
    setQueueingAll(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staffing-outreach/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_sequence_batch",
          batch_id: batchId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch queue failed");

      // Show results summary
      const { summary } = data;
      if (summary.failed > 0) {
        setError(`Queued ${summary.success}/${summary.total}. ${summary.failed} failed.`);
      }

      // Refresh the queue
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Batch queue failed");
    } finally {
      setQueueingAll(false);
    }
  }, [batchId, refetch]);

  const handleRowAction = useCallback(
    async (refreshedCtx: DrawerContext | null) => {
      // Calculate next item BEFORE refetch (rows will be stale after refetch)
      let nextId: string | null = null;
      if (refreshedCtx) {
        const idx = rows.findIndex((r) => r.id === refreshedCtx.outreach.id);
        const next = rows[idx + 1] ?? rows.find((r) => r.id !== refreshedCtx.outreach.id);
        nextId = next?.id ?? null;
      }

      // Refetch the queue to update statuses + tab counts
      await refetch();

      // Auto-advance to the next row (calculated before refetch)
      if (refreshedCtx) {
        setOpenOutreachId(nextId);
      }
    },
    [refetch, rows],
  );

  // Handle stage change - clear rows immediately to prevent stale flash
  const handleStageChange = useCallback((newStage: Stage) => {
    if (newStage === stage) return;
    setRows([]);
    setLoading(true);
    setPage(0);
    setStage(newStage);
  }, [stage]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Provider Outreach</h1>
        <p className="text-lg text-gray-600 mt-1">
          Enroll home care agencies into the Student Caregiver Pilot.
        </p>
      </div>

      {/* Row 1: Search | University dropdown | Stats */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search - w-64 with icon */}
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

        {/* University dropdown */}
        <div className="w-72">
          <Select
            options={batchOptions}
            value={batchId ?? ""}
            onChange={(value) => {
              setRows([]);
              setLoading(true);
              setPage(0);
              setBatchId(value || null);
            }}
            placeholder="Select university..."
            size="sm"
            searchable
            searchPlaceholder="Search universities..."
          />
        </div>

        {/* Inline stats */}
        {currentBatch && (
          <p className="text-sm text-gray-500 ml-auto">
            <span className="font-medium text-gray-700">
              {currentBatch.total_providers}
            </span>
            {" total"}
          </p>
        )}
      </div>

      {/* Row 2: Stage tabs + Queue All button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {STAGE_TABS.map((t) => {
            const count = tabCounts[t.key];
            const active = t.key === stage;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleStageChange(t.key as Stage)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  active
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.label}
                {typeof count === "number" && (
                  <span className={`text-xs ${
                    active ? "text-white/70" : "text-gray-400"
                  }`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Queue All button - only show on To Queue tab with providers */}
        {stage === "to_queue" && (tabCounts["to_queue"] ?? 0) > 0 && batchId && (
          <button
            onClick={handleQueueAllClick}
            disabled={queueingAll}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {queueingAll ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            {queueingAll ? "Queuing..." : "Queue All"}
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
          {batches.length === 0 ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">No active batches</p>
              <p className="mt-1 text-sm text-gray-500">
                Run the seed script: npx tsx scripts/seed-staffing-outreach.ts --university {"<slug>"} --apply
              </p>
            </>
          ) : stage === "to_queue" ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">All started!</p>
              <p className="mt-1 text-sm text-gray-500">All providers have been sent to the email sequence.</p>
            </>
          ) : stage === "sequencing" ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">No emails sending</p>
              <p className="mt-1 text-sm text-gray-500">Start providers from the Not Started tab to begin sending emails.</p>
            </>
          ) : stage === "needs_call" ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">No follow-ups needed</p>
              <p className="mt-1 text-sm text-gray-500">Providers who don&apos;t respond to emails will appear here.</p>
            </>
          ) : stage === "enrolled" ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">No active partners yet</p>
              <p className="mt-1 text-sm text-gray-500">Providers will appear here once they accept the partnership.</p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">No closed providers</p>
              <p className="mt-1 text-sm text-gray-500">Providers marked as bounced or do-not-contact will appear here.</p>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {rows.map((row) => {
              const dueInfo = row.next_action_due_at ? getDueInfo(row.next_action_due_at) : null;
              const isClaimed = row.claimed_by && row.claimed_until && new Date(row.claimed_until) > new Date();

              return (
                <li key={row.id}>
                  <button
                    onClick={() => setOpenOutreachId(row.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Claimed indicator - shown above name */}
                      {isClaimed && (
                        <p className="text-xs text-blue-600 mb-0.5">
                          Claimed
                        </p>
                      )}
                      <p className="truncate text-sm font-medium text-gray-900">
                        {row.provider_name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {/* Show university when querying all universities (no batch filter) */}
                        {!batchId && row.university_name && (
                          <span className="font-medium text-gray-600">{row.university_name} · </span>
                        )}
                        {[row.provider_city, row.provider_state]
                          .filter(Boolean)
                          .join(", ") || "—"}
                        {/* Show email or phone */}
                        {(row.provider_email || row.research_data?.general_email) ? (
                          <span className="text-gray-600"> · {row.provider_email || row.research_data?.general_email}</span>
                        ) : row.provider_phone ? (
                          <span> · {row.provider_phone}</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Engagement signals - only show on sequencing/needs_call tabs */}
                      {(stage === "sequencing" || stage === "needs_call") && (
                        <>
                          {row.engagement?.emailOpened && (
                            <span className="hidden sm:inline text-sky-500" title="Email opened">
                              👁
                            </span>
                          )}
                          {row.engagement?.emailClicked && (
                            <span className="hidden sm:inline text-purple-500" title="Link clicked">
                              🔗
                            </span>
                          )}
                          {row.engagement?.replied && (
                            <span className="hidden sm:inline text-green-500" title="Reply received">
                              💬
                            </span>
                          )}
                        </>
                      )}
                      {/* Overdue indicator - only show on needs_call tab */}
                      {stage === "needs_call" && dueInfo?.isOverdue && (
                        <span className={`hidden sm:inline rounded-full px-2 py-0.5 text-xs font-medium ${getOverduePillClass(dueInfo.urgency)}`}>
                          {dueInfo.label}
                        </span>
                      )}
                      {/* Chevron indicator */}
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
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
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Queue All Confirmation Drawer */}
      {showQueueConfirm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowQueueConfirm(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Start Email Sequences</h2>
              <button
                onClick={() => setShowQueueConfirm(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">University</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 truncate">{currentBatch?.university_name}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Providers</p>
                  <p className="mt-1 text-3xl font-bold text-blue-700">{tabCounts["to_queue"] ?? 0}</p>
                </div>
              </div>

              {/* What will happen */}
              <div className="rounded-xl border border-gray-200 p-4 mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">What will happen</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">1</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email 1 sent immediately</p>
                      <p className="text-xs text-gray-500">Introduction to the Student Caregiver Program</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">2</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Wait 3 days</p>
                      <p className="text-xs text-gray-500">Providers move to Sending tab</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">3</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email 2 sent if no response</p>
                      <p className="text-xs text-gray-500">Then move to Needs Follow-up tab</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note about missing emails */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex gap-3">
                  <svg className="h-5 w-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Providers without email will be skipped</p>
                    <p className="text-xs text-amber-700 mt-0.5">They&apos;ll stay in To Queue until you add an email address</p>
                  </div>
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
                  onClick={handleQueueAllConfirm}
                  disabled={queueingAll}
                  className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {queueingAll ? "Starting..." : `Start ${tabCounts["to_queue"] ?? 0} Sequences`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      {openOutreachId && (
        <Drawer
          outreachId={openOutreachId}
          onClose={() => setOpenOutreachId(null)}
          onAction={handleRowAction}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  // V2 status display configuration
  const styles: Record<string, string> = {
    // V2 statuses
    queued: "bg-gray-100 text-gray-700",
    sequencing: "bg-blue-50 text-blue-700",
    needs_call: "bg-amber-50 text-amber-700",
    consented: "bg-emerald-50 text-emerald-700",
    activated: "bg-purple-50 text-purple-700",
    enrolled: "bg-green-100 text-green-800",
    bounced: "bg-red-50 text-red-700",
    closed: "bg-gray-100 text-gray-500",
    // Legacy statuses
    pre_call_outreach: "bg-blue-50 text-blue-700",
    calling: "bg-amber-50 text-amber-700",
    connected_no_consent: "bg-amber-50 text-amber-700",
    do_not_contact: "bg-gray-100 text-gray-500",
    wrong_number: "bg-gray-100 text-gray-500",
  };
  const labels: Record<string, string> = {
    // V2 statuses
    queued: "To Queue",
    sequencing: "Sequencing",
    needs_call: "Needs Call",
    consented: "Consented",
    activated: "Activated",
    enrolled: "Enrolled",
    bounced: "Bounced",
    closed: "Closed",
    // Legacy statuses
    pre_call_outreach: "Sequencing",
    calling: "Needs Call",
    connected_no_consent: "Needs Call",
    do_not_contact: "Closed",
    wrong_number: "Closed",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

type UrgencyLevel = "none" | "low" | "medium" | "high";

interface DueInfo {
  label: string;
  isOverdue: boolean;
  urgency: UrgencyLevel;
}

function getDueInfo(iso: string): DueInfo {
  const due = new Date(iso);
  const now = new Date();
  const diffMin = Math.round((due.getTime() - now.getTime()) / 60_000);
  const diffDays = Math.round(-diffMin / (60 * 24));

  if (diffMin < -60 * 24 * 6) {
    // 6+ days overdue = high urgency
    return { label: `${diffDays}d overdue`, isOverdue: true, urgency: "high" };
  }
  if (diffMin < -60 * 24 * 3) {
    // 3-5 days overdue = medium urgency
    return { label: `${diffDays}d overdue`, isOverdue: true, urgency: "medium" };
  }
  if (diffMin < -60 * 24) {
    // 1-2 days overdue = low urgency
    return { label: `${diffDays}d overdue`, isOverdue: true, urgency: "low" };
  }
  if (diffMin < -60) {
    return { label: `${Math.round(-diffMin / 60)}h overdue`, isOverdue: true, urgency: "low" };
  }
  if (diffMin < 0) {
    return { label: "due now", isOverdue: true, urgency: "low" };
  }
  if (diffMin < 60) {
    return { label: `in ${diffMin}m`, isOverdue: false, urgency: "none" };
  }
  if (diffMin < 60 * 24) {
    return { label: `in ${Math.round(diffMin / 60)}h`, isOverdue: false, urgency: "none" };
  }
  return { label: `in ${Math.round(diffMin / (60 * 24))}d`, isOverdue: false, urgency: "none" };
}

/** Pill styling for overdue indicator */
function getOverduePillClass(urgency: UrgencyLevel): string {
  switch (urgency) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-orange-100 text-orange-700";
    case "low":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-500";
  }
}
