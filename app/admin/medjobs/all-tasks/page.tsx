"use client";

/**
 * v9.0 Phase 5: All Tasks page. Full operational repository — every
 * touchpoint across every state, with quick-filter chips replacing
 * the legacy Emails Sent / Outbound / Replies / Calls / Meetings menu
 * views and a free-text search by org name.
 *
 * The card render reuses CompletedTaskCard since the row shape is
 * compatible — All Tasks is a superset of Completed Tasks.
 */

import { useCallback, useEffect, useState } from "react";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import {
  CompletedTaskCard,
  type CompletedTaskRow,
} from "@/components/admin/medjobs/cards/CompletedTaskCard";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

const FILTER_CHIPS: Array<{ key: string; label: string; types: string[] }> = [
  { key: "all", label: "All", types: [] },
  {
    key: "emails_sent",
    label: "Emails Sent",
    types: ["email_sent"],
  },
  {
    key: "outbound",
    label: "Outbound",
    types: ["email_sent", "ig_dm_sent", "contact_form_submitted"],
  },
  {
    key: "replies",
    label: "Replies",
    types: ["email_replied", "ig_dm_replied"],
  },
  {
    key: "calls",
    label: "Calls",
    types: ["call_no_answer", "call_voicemail", "call_connected", "call_wrong_number"],
  },
  {
    key: "meetings",
    label: "Meetings",
    types: ["meeting_scheduled", "meeting_held", "meeting_no_show", "meeting_rescheduled"],
  },
  {
    key: "stage_changes",
    label: "Stage changes",
    types: ["stage_change", "distribution_confirmed"],
  },
  {
    key: "notes",
    label: "Notes",
    types: ["note_added"],
  },
];

const RANGE_OPTIONS = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "365d", label: "Last year", days: 365 },
] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number]["key"];

export default function AllTasksPage() {
  const [rows, setRows] = useState<CompletedTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterKey, setFilterKey] = useState<string>("all");
  const [rangeKey, setRangeKey] = useState<RangeKey>("90d");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = RANGE_OPTIONS.find((r) => r.key === rangeKey)?.days ?? 90;
      const from = new Date();
      from.setDate(from.getDate() - days);
      const params = new URLSearchParams();
      params.set("from", from.toISOString());
      params.set("limit", "200");
      const filter = FILTER_CHIPS.find((f) => f.key === filterKey);
      if (filter && filter.types.length > 0) {
        params.set("types", filter.types.join(","));
      }
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/medjobs/all-tasks?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filterKey, rangeKey, debouncedSearch]);

  useEffect(() => { refetch(); }, [refetch]);
  useMedJobsRefresh(refetch);

  return (
    <div>
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">MedJobs · All Tasks</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              The full operational record. Filter, search, and audit.
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
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by organization name…"
          className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
        />

        <div className="mt-3 flex flex-wrap items-center gap-1">
          {FILTER_CHIPS.map((chip) => {
            const active = filterKey === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setFilterKey(chip.key)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-gray-900 font-medium text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {chip.label}
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
          {search ? "No matches in this range." : "Nothing logged in this range yet."}
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
