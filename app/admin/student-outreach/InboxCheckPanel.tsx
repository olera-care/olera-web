"use client";

/**
 * InboxCheckPanel — synthetic top-of-Queued task.
 *
 * Always shown above the Queued list. Lists every row currently in
 * `outreach_sent` (within the active filter scope) with the last
 * email-sent timestamp. Admin reads their inbox externally, then comes
 * back, checks any rows that replied, and clicks "Mark selected as
 * engaged" — the bulk-engaged endpoint cancels those rows' pending
 * email tasks.
 */

import { useEffect, useState } from "react";
import { STAKEHOLDER_TYPE_LABELS, type StakeholderType } from "@/lib/student-outreach/types";

export interface InboxCheckRow {
  outreach_id: string;
  organization_name: string;
  campus_name: string;
  stakeholder_type: StakeholderType;
  last_email_sent_at: string | null;
}

interface Props {
  rows: InboxCheckRow[];
  onAfterMark: () => void;
  onError: (msg: string) => void;
}

const DISMISS_KEY = "student-outreach-inbox-dismissed-on";

export function InboxCheckPanel({ rows, onAfterMark, onError }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Hide for the rest of the session if admin clicks "none replied today".
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISS_KEY);
      const today = new Date().toISOString().slice(0, 10);
      setDismissed(stored === today);
    } catch { /* ignore */ }
  }, []);

  if (dismissed) return null;
  if (rows.length === 0) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString().slice(0, 10));
    } catch { /* ignore */ }
    setDismissed(true);
  };

  const submitBulk = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Mark ${selected.size} stakeholder${selected.size === 1 ? "" : "s"} as engaged? This cancels their remaining email cadence.`)) {
      return;
    }
    setSubmitting(true);
    setProgress({ done: 0, total: selected.size });
    try {
      const res = await fetch("/api/admin/student-outreach/bulk-engaged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreach_ids: Array.from(selected), notes: "via inbox check" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Bulk engaged failed");
      setProgress({ done: data.processed, total: data.processed });
      setSelected(new Set());
      onAfterMark();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Bulk engaged failed");
    } finally {
      setSubmitting(false);
      setTimeout(() => setProgress(null), 1500);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/40 px-4 py-3">
      <button
        onClick={() => setExpanded((s) => !s)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold text-blue-900">
          📬 Daily inbox check · {rows.length} stakeholder{rows.length === 1 ? "" : "s"} mid-cadence
        </span>
        <span className="text-xs text-blue-700">{expanded ? "Hide ▾" : "Open ▸"}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-blue-900">
            Read your inbox. Check any stakeholder who replied — we'll mark them engaged and stop
            the auto-cadence. Replies route to <code>{getReplyToHint()}</code>.
          </p>
          <ul className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-blue-100 bg-white p-2">
            {rows.map((r) => {
              const checked = selected.has(r.outreach_id);
              return (
                <li key={r.outreach_id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-blue-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(r.outreach_id)}
                    />
                    <span className="flex-1 text-sm">
                      <span className="font-medium text-gray-900">{r.organization_name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {r.campus_name} · {STAKEHOLDER_TYPE_LABELS[r.stakeholder_type]}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-500">
                      {r.last_email_sent_at
                        ? `last email ${formatRelative(r.last_email_sent_at)}`
                        : "no emails sent yet"}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs text-blue-900">
              {selected.size > 0
                ? `${selected.size} selected`
                : "Tip: select all who replied, then click below"}
              {progress && ` · ${progress.done}/${progress.total} processed`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={dismiss}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Done — none replied today
              </button>
              <button
                onClick={submitBulk}
                disabled={submitting || selected.size === 0}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Marking…" : `Mark ${selected.size} as engaged`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getReplyToHint(): string {
  // Mirrors the env var. Falls back to a sensible default for the hint.
  return "outreach@olera.care";
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}
