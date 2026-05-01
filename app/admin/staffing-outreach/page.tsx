"use client";

/**
 * Admin Staffing Outreach — main page.
 *
 * Mirrors the layout grammar of /admin/questions: stat strip, search,
 * tabs, list with click-to-open drawer. The drawer (Drawer.tsx) handles
 * the per-row workflow: research, call, history.
 *
 * Data comes from /api/admin/staffing-outreach/queue (batches + rows)
 * and /api/admin/staffing-outreach/[id] (drawer detail).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Drawer } from "./Drawer";
import type {
  DrawerContext,
  QueueRow,
  StaffingBatch,
} from "@/lib/staffing-outreach/types";

const TABS: Array<{ key: string; label: string }> = [
  { key: "today", label: "Today" },
  { key: "queued", label: "Queued" },
  { key: "pre_call", label: "Pre-call" },
  { key: "calling", label: "Calling" },
  { key: "post_consent", label: "Post-consent" },
  { key: "activated", label: "Activated" },
  { key: "enrolled", label: "Enrolled" },
  { key: "stopped", label: "Stopped" },
  { key: "all", label: "All" },
];

export default function StaffingOutreachPage() {
  const [batches, setBatches] = useState<StaffingBatch[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [tab, setTab] = useState("today");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch queue (and batches on first load)
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (batchId) params.set("batch", batchId);
      if (tab) params.set("tab", tab);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/staffing-outreach/queue?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setBatches(data.batches ?? []);
      setRows(data.rows ?? []);
      setTabCounts(data.tabCounts ?? {});
      // Auto-select first batch if none chosen
      if (!batchId && data.batches?.[0]) {
        setBatchId(data.batches[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [batchId, tab, debouncedSearch]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const currentBatch = useMemo(
    () => batches.find((b) => b.id === batchId) ?? null,
    [batches, batchId],
  );

  const handleRowAction = useCallback(
    async (refreshedCtx: DrawerContext | null) => {
      // Refetch the queue to update statuses + tab counts
      await refetch();
      // Auto-advance: open the next row in the current tab
      if (refreshedCtx) {
        const idx = rows.findIndex((r) => r.id === refreshedCtx.outreach.id);
        const next = rows[idx + 1] ?? rows.find((r) => r.id !== refreshedCtx.outreach.id);
        setOpenOutreachId(next?.id ?? null);
      }
    },
    [refetch, rows],
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Staffing Outreach</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enroll home care agencies into the Student Caregiver Pilot, one
          partner university at a time.
        </p>
      </div>

      {/* University dropdown + stat strip */}
      <div className="mb-5 flex items-center gap-4">
        <select
          value={batchId ?? ""}
          onChange={(e) => setBatchId(e.target.value || null)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none"
        >
          {batches.length === 0 && <option value="">No active batches</option>}
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.university_name}
            </option>
          ))}
        </select>
        {currentBatch && (
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">
              {currentBatch.catchment_cities.length} cities
            </span>
            {" · "}
            <span>{currentBatch.total_providers} providers</span>
            {" · "}
            <span className="text-emerald-700">
              {tabCounts.today ?? 0} due today
            </span>
            {" · "}
            <span>{currentBatch.total_enrolled} enrolled</span>
          </p>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by provider name..."
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-100">
        {TABS.map((t) => {
          const count = tabCounts[t.key];
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {typeof count === "number" && (
                <span
                  className={`ml-1.5 text-xs ${
                    active ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">
          {batches.length === 0
            ? "No active batches yet. Run the seed script: npx tsx scripts/seed-staffing-outreach.ts --university <slug> --apply"
            : "Nothing in this tab."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                onClick={() => setOpenOutreachId(row.id)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {row.provider_name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {[row.provider_city, row.provider_state]
                      .filter(Boolean)
                      .join(", ") || "—"}
                    {row.provider_phone && ` · ${row.provider_phone}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={row.status} />
                  {row.next_action_due_at && (
                    <span className="hidden text-xs text-gray-400 sm:inline">
                      {formatDueDate(row.next_action_due_at)}
                    </span>
                  )}
                  {row.claimed_by && row.claimed_until && new Date(row.claimed_until) > new Date() && (
                    <span className="hidden text-xs text-amber-600 sm:inline">
                      claimed
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
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
  const styles: Record<string, string> = {
    queued: "bg-gray-100 text-gray-700",
    pre_call_outreach: "bg-blue-50 text-blue-700",
    calling: "bg-blue-50 text-blue-700",
    connected_no_consent: "bg-amber-50 text-amber-700",
    consented: "bg-emerald-50 text-emerald-700",
    nurturing: "bg-emerald-50 text-emerald-700",
    activated: "bg-purple-50 text-purple-700",
    enrolled: "bg-purple-100 text-purple-800",
    do_not_contact: "bg-gray-100 text-gray-500",
    wrong_number: "bg-gray-100 text-gray-500",
  };
  const labels: Record<string, string> = {
    queued: "Queued",
    pre_call_outreach: "Pre-call",
    calling: "Calling",
    connected_no_consent: "No consent",
    consented: "Consented",
    nurturing: "Nurturing",
    activated: "Activated",
    enrolled: "Enrolled",
    do_not_contact: "DNC",
    wrong_number: "Wrong #",
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

function formatDueDate(iso: string): string {
  const due = new Date(iso);
  const now = new Date();
  const diffMin = Math.round((due.getTime() - now.getTime()) / 60_000);
  if (diffMin < -60 * 24)
    return `${Math.round(-diffMin / (60 * 24))}d overdue`;
  if (diffMin < 0) return "due now";
  if (diffMin < 60) return `in ${diffMin}m`;
  if (diffMin < 60 * 24) return `in ${Math.round(diffMin / 60)}h`;
  return `in ${Math.round(diffMin / (60 * 24))}d`;
}
