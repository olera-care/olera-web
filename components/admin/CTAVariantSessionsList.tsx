"use client";

/**
 * Sessions table for the CTA Variants admin drill-in.
 *
 * Lazy-fetches one A/B arm's sessions from /api/admin/analytics/cta-variant-sessions
 * on first expand and caches in component state. Pagination is "load more" —
 * each click appends the next page rather than replacing.
 *
 * One row per session, not per event. Furthest stage is the deepest stage
 * the session reached during the time window. For Converted-stage sessions,
 * `submitter` carries the email captured at lead submission.
 */

import { useEffect, useState, useCallback } from "react";

type Stage = "impression" | "clicked" | "converted";

type SessionRow = {
  session_id: string;
  furthest_stage: Stage;
  provider_id: string | null;
  first_seen: string;
  submitter: string | null;
};

type ApiResponse = {
  variant: string;
  total: number;
  sessions: SessionRow[];
};

const PAGE_SIZE = 50;

const STAGE_LABEL: Record<Stage, string> = {
  impression: "Impression",
  clicked: "Clicked",
  converted: "Converted",
};

const STAGE_BADGE_CLASS: Record<Stage, string> = {
  impression: "bg-gray-100 text-gray-600",
  clicked: "bg-amber-50 text-amber-800",
  converted: "bg-emerald-50 text-emerald-800",
};

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export default function CTAVariantSessionsList({
  variant,
  dateFrom,
  dateTo,
}: {
  variant: string;
  dateFrom: string | null;
  dateTo: string | null;
}) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      const isInitial = !append;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("variant", variant);
        if (dateFrom) params.set("date_from", dateFrom);
        if (dateTo) params.set("date_to", dateTo);
        if (stageFilter !== "all") params.set("stage", stageFilter);
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String(offset));
        const res = await fetch(`/api/admin/analytics/cta-variant-sessions?${params.toString()}`);
        if (!res.ok) throw new Error("fetch failed");
        const data: ApiResponse = await res.json();
        setTotal(data.total);
        setSessions((prev) => (append ? [...prev, ...data.sessions] : data.sessions));
      } catch {
        setError("Couldn't load sessions. Try again.");
      } finally {
        if (isInitial) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [variant, dateFrom, dateTo, stageFilter],
  );

  useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  const hasMore = total !== null && sessions.length < total;

  const STAGE_CHIPS: Array<{ key: Stage | "all"; label: string }> = [
    { key: "all", label: "All" },
    { key: "impression", label: "Impression" },
    { key: "clicked", label: "Clicked" },
    { key: "converted", label: "Converted" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="px-5 py-3 border-b border-gray-100 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Sessions in this arm
          </div>
          {total !== null && (
            <div className="text-xs text-gray-600 mt-0.5">
              Showing {sessions.length} of {total}
              {stageFilter !== "all" && (
                <span className="text-gray-400"> · filtered to {STAGE_LABEL[stageFilter]}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STAGE_CHIPS.map(({ key, label }) => {
            const active = stageFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStageFilter(key)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                  active
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">Loading…</div>
      ) : error ? (
        <div className="px-5 py-6 text-center text-sm text-red-600">
          {error}
          <button
            type="button"
            onClick={() => fetchPage(0, false)}
            className="ml-3 underline underline-offset-2 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          No sessions in this window.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-2 font-medium">Furthest stage</th>
                  <th className="px-3 py-2 font-medium">Submitter / Session</th>
                  <th className="px-3 py-2 font-medium">Provider page</th>
                  <th className="px-3 py-2 font-medium text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.session_id}
                    className="group border-b border-gray-50 last:border-b-0 hover:bg-gray-50/40"
                  >
                    <td className="px-5 py-2">
                      <span
                        className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${STAGE_BADGE_CLASS[s.furthest_stage]}`}
                      >
                        {STAGE_LABEL[s.furthest_stage]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {s.submitter ? (
                        <span className="font-medium text-gray-900">{s.submitter}</span>
                      ) : (
                        <span className="text-gray-400 font-mono text-[11px]">
                          {s.session_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {s.provider_id ? (
                        <a
                          href={`/provider/${s.provider_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-700 hover:text-gray-900 underline-offset-2 hover:underline truncate inline-block max-w-[280px]"
                        >
                          {s.provider_id}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-500 whitespace-nowrap">
                      {formatRelativeTime(s.first_seen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => fetchPage(sessions.length, true)}
                disabled={loadingMore}
                className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-2 disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : `Load ${Math.min(PAGE_SIZE, total! - sessions.length)} more`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
