"use client";

/**
 * v9.0 Phase 6: Completed Work page. Chronological touchpoint feed
 * of completed operational actions. The "what we got done" surface.
 *
 * Date range filter at top. Click any card to open the source row's
 * drawer for full context.
 */

import { useCallback, useEffect, useState } from "react";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import {
  CompletedTaskCard,
  type CompletedTaskRow,
} from "@/components/admin/medjobs/cards/CompletedTaskCard";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

const RANGE_OPTIONS = [
  { key: "7d",  label: "Last 7 days",   days: 7 },
  { key: "30d", label: "Last 30 days",  days: 30 },
  { key: "90d", label: "Last 90 days",  days: 90 },
] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number]["key"];

export default function CompletedTasksPage() {
  const [rows, setRows] = useState<CompletedTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = RANGE_OPTIONS.find((r) => r.key === rangeKey)?.days ?? 30;
      const from = new Date();
      from.setDate(from.getDate() - days);
      const params = new URLSearchParams();
      params.set("from", from.toISOString());
      params.set("limit", "100");
      const res = await fetch(`/api/admin/medjobs/completed-work?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [rangeKey]);

  useEffect(() => { refetch(); }, [refetch]);
  useMedJobsRefresh(refetch);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">MedJobs · Completed Work</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            What you and the team finished. Click any row to open it for context.
          </p>
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((opt) => {
            const active = rangeKey === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setRangeKey(opt.key)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-gray-900 font-medium text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </header>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
          Nothing completed in this range yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <CompletedTaskCard
                row={r}
                onOpenDrawer={() => setOpenOutreachId(r.outreach_id)}
              />
            </li>
          ))}
        </ul>
      )}

      {openOutreachId && (
        <Drawer
          outreachId={openOutreachId}
          onClose={() => setOpenOutreachId(null)}
          onAction={() => { void refetch(); }}
        />
      )}
    </div>
  );
}
