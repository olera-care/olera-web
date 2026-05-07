"use client";

/**
 * Side drawer that opens when an operator clicks a row in the variant
 * drill-in. Fetches the detail endpoint at
 * /api/admin/analytics/variant-sessions/[session_id] and renders:
 *
 *   - Header (session prefix, arm, stage, time)
 *   - Submission detail block (email, page, arm-specific extras)
 *   - Event timeline (chronological seeker_activity + provider_activity)
 *
 * Lives in the analytics page rather than navigating elsewhere, so the
 * operator never loses their place in the variant table.
 */

import { useEffect, useState } from "react";

type Stage = "impression" | "started" | "care_need" | "submitted";

interface TimelineEvent {
  event_type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  source: "seeker_activity" | "provider_activity";
}

interface SubmissionDetail {
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  care_types?: string[] | null;
  timeline?: string | null;
  relationship?: string | null;
  account_id?: string | null;
  target_providers?: Array<{ id: string; name: string; slug: string | null }> | null;
  question_text?: string | null;
}

interface DetailResponse {
  session_id: string;
  variant: string;
  events: TimelineEvent[];
  submission?: SubmissionDetail;
}

const STAGE_LABEL: Record<Stage, string> = {
  impression: "Impression",
  started: "Started",
  care_need: "Care need ✓",
  submitted: "Submitted",
};

const STAGE_BADGE_CLASS: Record<Stage, string> = {
  impression: "bg-gray-100 text-gray-600",
  started: "bg-amber-50 text-amber-800",
  care_need: "bg-blue-50 text-blue-800",
  submitted: "bg-emerald-50 text-emerald-800",
};

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "ASAP",
  within_1_month: "Within 1 month",
  within_3_months: "Within 3 months",
  exploring: "Exploring",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export default function SessionDetailDrawer({
  sessionId,
  variant,
  stage,
  providerId,
  firstSeen,
  onClose,
}: {
  sessionId: string;
  variant: string;
  stage: Stage;
  providerId: string | null;
  firstSeen: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ variant });
    fetch(`/api/admin/analytics/variant-sessions/${encodeURIComponent(sessionId)}?${params.toString()}`)
      .then(async (r) => {
        if (cancelled) return;
        if (!r.ok) {
          setError(`Failed to load detail (${r.status})`);
          setLoading(false);
          return;
        }
        const json = (await r.json()) as DetailResponse;
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Network error — try again");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, variant]);

  // Esc-to-close convenience.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submission = data?.submission;
  const events = data?.events ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-drawer-title"
      onClick={(e) => {
        // Click on scrim closes; clicks inside the panel don't bubble out.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h3
              id="session-drawer-title"
              className="text-base font-semibold text-gray-900"
            >
              Session detail
            </h3>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STAGE_BADGE_CLASS[stage]}`}
              >
                {STAGE_LABEL[stage]}
              </span>
              <span className="text-[11px] text-gray-500">{variant}</span>
              <span className="text-[11px] text-gray-400">·</span>
              <span className="text-[11px] text-gray-400">{formatRelative(firstSeen)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 -mr-2"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Identity block */}
          <section>
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">
              Identity
            </div>
            <dl className="text-sm space-y-1.5">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-gray-400">Session</dt>
                <dd className="text-gray-700 font-mono text-[12px] break-all">{sessionId}</dd>
              </div>
              {providerId && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-gray-400">Page</dt>
                  <dd>
                    <a
                      href={`/provider/${providerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-gray-900 underline-offset-2 hover:underline break-all"
                    >
                      /provider/{providerId}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Loading / error / submission detail */}
          {loading ? (
            <div className="text-sm text-gray-400">Loading detail…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : submission ? (
            <section>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">
                Submission
              </div>
              <dl className="text-sm space-y-1.5">
                {submission.email && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-400">Email</dt>
                    <dd className="text-gray-900 font-medium break-all">{submission.email}</dd>
                  </div>
                )}
                {submission.phone && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-400">Phone</dt>
                    <dd className="text-gray-900">{submission.phone}</dd>
                  </div>
                )}
                {(submission.city || submission.state) && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-400">Location</dt>
                    <dd className="text-gray-900">
                      {[submission.city, submission.state].filter(Boolean).join(", ")}
                    </dd>
                  </div>
                )}
                {submission.relationship && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-400">Relationship</dt>
                    <dd className="text-gray-900">{submission.relationship}</dd>
                  </div>
                )}
                {submission.timeline && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-400">Timeline</dt>
                    <dd className="text-gray-900">
                      {TIMELINE_LABELS[submission.timeline] ?? submission.timeline}
                    </dd>
                  </div>
                )}
                {submission.care_types && submission.care_types.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-400">Care types</dt>
                    <dd className="text-gray-900">{submission.care_types.join(", ")}</dd>
                  </div>
                )}
                {submission.question_text && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-400">Question</dt>
                    <dd className="text-gray-900 italic">&ldquo;{submission.question_text}&rdquo;</dd>
                  </div>
                )}
                {submission.target_providers && submission.target_providers.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-400">Compared</dt>
                    <dd className="space-y-0.5">
                      {submission.target_providers.map((p) => (
                        <div key={p.id}>
                          <a
                            href={`/provider/${p.slug ?? p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-gray-900 underline-offset-2 hover:underline break-all"
                          >
                            {p.name}
                          </a>
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
                {submission.account_id && (
                  <div className="pt-2 mt-2 border-t border-gray-100">
                    <a
                      href={`/admin/care-seekers/${submission.account_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
                    >
                      Open full profile in care-seekers ↗
                    </a>
                  </div>
                )}
              </dl>
            </section>
          ) : null}

          {/* Event timeline */}
          {!loading && (
            <section>
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">
                Events ({events.length})
              </div>
              {events.length === 0 ? (
                <div className="text-sm text-gray-400">No events found for this session.</div>
              ) : (
                <ol className="space-y-2.5 text-sm">
                  {events.map((ev, i) => (
                    <li key={`${ev.created_at}-${ev.event_type}-${i}`} className="flex gap-3">
                      <div className="w-1 shrink-0 self-stretch bg-gray-200 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-mono text-[12px] text-gray-900 break-all">
                            {ev.event_type}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {ev.source === "provider_activity" ? "provider" : "family"}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 tabular-nums mt-0.5">
                          {formatTimestamp(ev.created_at)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
