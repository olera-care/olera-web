"use client";

/**
 * Sessions table for the Family Intake admin drill-in.
 *
 * Lazy-fetches one A/B arm's sessions from /api/admin/analytics/variant-sessions
 * on first expand and caches in component state. Pagination is "load more" —
 * each click appends the next page rather than replacing, so the user can
 * scroll through history without losing prior context.
 *
 * One row per session, not per event. Furthest stage is the deepest stage
 * the session reached during the time window. For Submitted-stage sessions,
 * `submitter` carries the email captured at submit (joined from accounts +
 * business_profiles for benefits arms, agent_outreach_requests for outreach,
 * provider_questions for qa_email_capture).
 *
 * Per-row trash icon hard-deletes the session's submission across every
 * related table (DELETE handler in /api/admin/analytics/variant-sessions).
 * Used for cleaning up admin test traffic that would otherwise pollute
 * conversion counts.
 */

import { useEffect, useState, useCallback } from "react";
import { careNeedLabel } from "@/lib/analytics/variant-copy";
import SessionDetailDrawer from "@/components/admin/SessionDetailDrawer";

type Stage = "impression" | "started" | "care_need" | "submitted";

type SessionRow = {
  session_id: string;
  furthest_stage: Stage;
  provider_id: string | null;
  first_seen: string;
  care_need_selected: string | null;
  submitter: string | null;
  submitter_link_id: string | null;
};

type ApiResponse = {
  variant: string;
  total: number;
  sessions: SessionRow[];
};

const PAGE_SIZE = 50;

// Base labels — care_need is overridden to "Engaged" for multi_provider variants
const STAGE_LABEL: Record<Stage, string> = {
  impression: "Impression",
  started: "Started",
  care_need: "Care need ✓",
  submitted: "Submitted",
};

// Get the display label for a stage, accounting for variant-specific naming
function getStageLabel(stage: Stage, variant: string): string {
  if (stage === "care_need" && (variant === "multi_provider" || variant === "multi_provider_v2")) {
    return "Engaged";
  }
  return STAGE_LABEL[stage];
}

const STAGE_BADGE_CLASS: Record<Stage, string> = {
  impression: "bg-gray-100 text-gray-600",
  started: "bg-amber-50 text-amber-800",
  care_need: "bg-blue-50 text-blue-800",
  submitted: "bg-emerald-50 text-emerald-800",
};

// Plain-English description of what hard-deleting this session will
// cascade to. Shown in the confirm modal so the operator can verify
// they're about to nuke the right thing. Mirrors the actual cascade
// scope in the DELETE handler at /api/admin/analytics/variant-sessions.
function cascadeSummary(variant: string, stage: Stage): string {
  const eventsLine = "tracking events for this session (impressions, clicks, step completions)";
  if (stage !== "submitted") return `Removes ${eventsLine}.`;
  if (variant === "outreach") {
    return `Removes the outreach request row + ${eventsLine}.`;
  }
  if (variant === "qa_email_capture") {
    return `Removes the captured question(s) + ${eventsLine}.`;
  }
  // benefits arms (and legacy V2): deleting accounts cascades to
  // business_profiles (the family lead profile) and from there to
  // connections. The auth.users entry and any saved_programs are
  // preserved — test cleanup, not a full account purge.
  return `Removes the family account + lead profile (cascades to connection history) + ${eventsLine}.`;
}

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export default function VariantSessionsList({
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
  // Stage filter — "all" by default, switching to a specific stage
  // makes the most-converted-arms-with-1024-rows case scannable.
  // Server-side filter so we don't have to load every page just to
  // find the 3 Submitted rows.
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  // Delete state — pendingDelete holds the row the operator clicked the
  // trash icon on; we render a confirmation modal until they confirm or
  // cancel. deleteError surfaces backend failures inline in the modal so
  // the operator can retry without losing context.
  const [pendingDelete, setPendingDelete] = useState<SessionRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Detail drawer — clicking anywhere on a row (other than the inner
  // provider link or trash icon) opens it.
  const [detailRow, setDetailRow] = useState<SessionRow | null>(null);

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
        const res = await fetch(`/api/admin/analytics/variant-sessions?${params.toString()}`);
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

  // Refetch from scratch whenever variant, window, or stage filter changes.
  useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/admin/analytics/variant-sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: pendingDelete.session_id, variant }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Delete failed (${res.status})`);
      }
      // Remove the deleted row locally. Avoids refetching from offset 0
      // which would throw away any "Load more" state and force the
      // operator to scroll/page back to verify the row is gone. Total
      // count is decremented to keep "Showing N of M" honest.
      const removedId = pendingDelete.session_id;
      setSessions((prev) => prev.filter((s) => s.session_id !== removedId));
      setTotal((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, variant]);

  const hasMore = total !== null && sessions.length < total;

  // Variants that skip certain funnel stages. Used for smart empty states.
  // - SBF variants (availability, loss, empathic, control, money_loss):
  //   impression → started → care_need → submitted
  // - outreach: impression → started → submitted (no care_need/engaged)
  // - qa_email_capture: impression → submitted (no started, no care_need/engaged)
  // - multi_provider / multi_provider_v2: impression → started → engaged → submitted
  const VARIANTS_WITHOUT_CARE_NEED = new Set(["outreach", "qa_email_capture"]);
  const VARIANTS_WITHOUT_STARTED = new Set(["qa_email_capture"]);
  // Variants that use "Engaged" instead of "Care need" for the third step
  const VARIANTS_WITH_ENGAGED_LABEL = new Set(["multi_provider", "multi_provider_v2"]);

  // All filter buttons shown consistently for all variants.
  // When a stage doesn't apply, we show a smart empty state instead of hiding.
  // Label for care_need varies by variant (Engaged for multi_provider, Care need for others)
  const careNeedChipLabel = VARIANTS_WITH_ENGAGED_LABEL.has(variant) ? "Engaged" : "Care need ✓";
  const STAGE_CHIPS: Array<{ key: Stage | "all"; label: string }> = [
    { key: "all", label: "All" },
    { key: "impression", label: "Impression" },
    { key: "started", label: "Started" },
    { key: "care_need", label: careNeedChipLabel },
    { key: "submitted", label: "Submitted" },
  ];

  // Helper to determine if a stage is not part of this variant's flow
  const isStageNotApplicable = (stage: Stage): boolean => {
    if (stage === "started" && VARIANTS_WITHOUT_STARTED.has(variant)) return true;
    if (stage === "care_need" && VARIANTS_WITHOUT_CARE_NEED.has(variant)) return true;
    return false;
  };

  // Generate empty state message for inapplicable stages
  const getNotApplicableMessage = (stage: Stage): string | null => {
    if (stage === "started" && VARIANTS_WITHOUT_STARTED.has(variant)) {
      return `The "${variant}" flow doesn't include a "Started" step — visitors go directly from Impression → Submitted.`;
    }
    if (stage === "care_need" && VARIANTS_WITHOUT_CARE_NEED.has(variant)) {
      return `The "${variant}" flow doesn't include a "Care need" step.`;
    }
    return null;
  };

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
                <span className="text-gray-400"> · filtered to {getStageLabel(stageFilter, variant)}</span>
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
          {stageFilter !== "all" && isStageNotApplicable(stageFilter) ? (
            <div className="max-w-sm mx-auto">
              <div className="text-gray-500 font-medium mb-1">Stage not applicable</div>
              <div className="text-gray-400 text-xs leading-relaxed">
                {getNotApplicableMessage(stageFilter)}
              </div>
            </div>
          ) : (
            "No sessions in this window."
          )}
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
                  {!VARIANTS_WITHOUT_CARE_NEED.has(variant) && (
                    <th className="px-3 py-2 font-medium">Care need</th>
                  )}
                  <th className="px-3 py-2 font-medium text-right">When</th>
                  <th className="px-2 py-2 font-medium w-8" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.session_id}
                    className="group border-b border-gray-50 last:border-b-0 hover:bg-gray-50/40 cursor-pointer"
                    onClick={() => setDetailRow(s)}
                  >
                    <td className="px-5 py-2">
                      <span
                        className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${STAGE_BADGE_CLASS[s.furthest_stage]}`}
                      >
                        {getStageLabel(s.furthest_stage, variant)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {s.submitter ? (
                        s.submitter_link_id ? (
                          <a
                            href={`/admin/care-seekers/${s.submitter_link_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-gray-900 underline-offset-2 hover:underline hover:text-gray-700"
                            title="Open care seeker profile (new tab)"
                          >
                            {s.submitter}
                          </a>
                        ) : (
                          <span className="font-medium text-gray-900">{s.submitter}</span>
                        )
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
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-700 hover:text-gray-900 underline-offset-2 hover:underline truncate inline-block max-w-[280px]"
                        >
                          {s.provider_id}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    {!VARIANTS_WITHOUT_CARE_NEED.has(variant) && (
                      <td className="px-3 py-2 text-gray-600">
                        {careNeedLabel(s.care_need_selected) ?? <span className="text-gray-300">—</span>}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right tabular-nums text-gray-500 whitespace-nowrap">
                      {formatRelativeTime(s.first_seen)}
                    </td>
                    <td className="px-2 py-2 w-8 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteError(null); setPendingDelete(s); }}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-gray-300 hover:text-red-500"
                        aria-label="Delete this session"
                        title="Delete this session and its data"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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

      {/* Delete confirmation modal — fixed-position so it overlays the
          rest of the admin page; backed by a soft scrim. Renders the
          row's identifying details + cascade scope so the operator
          can verify before nuking. Inline error stays in the modal so
          a backend failure doesn't lose the operator's context. */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-session-title"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3
              id="delete-session-title"
              className="text-base font-semibold text-gray-900 mb-3"
            >
              Delete this session?
            </h3>
            <dl className="text-sm text-gray-700 space-y-1.5 mb-4">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Submitter</dt>
                <dd className="text-gray-900 break-all">
                  {pendingDelete.submitter ?? (
                    <span className="font-mono text-[12px] text-gray-500">
                      {pendingDelete.session_id.slice(0, 8)}…
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Arm</dt>
                <dd className="text-gray-900">{variant}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Stage</dt>
                <dd className="text-gray-900">
                  {getStageLabel(pendingDelete.furthest_stage, variant)}
                </dd>
              </div>
              {pendingDelete.provider_id && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-gray-400">Page</dt>
                  <dd className="text-gray-700 break-all">
                    {pendingDelete.provider_id}
                  </dd>
                </div>
              )}
            </dl>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-5">
              {cascadeSummary(variant, pendingDelete.furthest_stage)} This
              cannot be undone.
            </p>
            {deleteError && (
              <p className="text-[12px] text-red-600 mb-3">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setPendingDelete(null); setDeleteError(null); }}
                disabled={deleting}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer — fetches the full session timeline + arm-specific
          submission detail when opened. Stays mounted in the analytics
          page so closing returns the operator to the same drill-in
          state (filter, scroll, expanded variant). */}
      {detailRow && (
        <SessionDetailDrawer
          sessionId={detailRow.session_id}
          variant={variant}
          stage={detailRow.furthest_stage}
          providerId={detailRow.provider_id}
          firstSeen={detailRow.first_seen}
          onClose={() => setDetailRow(null)}
        />
      )}
    </div>
  );
}
