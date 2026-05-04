"use client";

/**
 * InboxCheckPanel — persistent recurring nudge.
 *
 * Always visible on the Queued tab. Tracks a "last checked" timestamp
 * in localStorage; if it's been more than 4 hours (or never checked
 * this session), the panel auto-expands and shows an amber "Overdue"
 * treatment. Otherwise it stays collapsed in a neutral blue.
 *
 * The panel does NOT hide itself for the day. Admins can mark it
 * checked any time, and the timer resets — the goal is to keep the
 * inbox-check loop ambient throughout the workday rather than a
 * one-and-done morning task.
 *
 * No DB-backed task; per-admin localStorage is sufficient given the
 * 1-2 admin team size.
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

const LAST_CHECKED_KEY = "student-outreach-inbox-last-checked";
const RECHECK_INTERVAL_HOURS = 4;
const RECHECK_INTERVAL_MS = RECHECK_INTERVAL_HOURS * 3600_000;

export function InboxCheckPanel({ rows, onAfterMark, onError }: Props) {
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Hydrate last-checked timestamp from localStorage on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_CHECKED_KEY);
      const t = stored ? parseInt(stored, 10) : NaN;
      const value = isNaN(t) ? null : t;
      setLastChecked(value);
      // Auto-expand if overdue (or never checked).
      const overdue = value === null || Date.now() - value > RECHECK_INTERVAL_MS;
      if (overdue) setExpanded(true);
    } catch {
      setExpanded(true);
    }
  }, []);

  // Tick "now" every minute so the relative-time labels stay fresh and
  // the overdue state can flip naturally without a page reload.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const overdue =
    lastChecked === null || now - lastChecked > RECHECK_INTERVAL_MS;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stampChecked = () => {
    const t = Date.now();
    try {
      localStorage.setItem(LAST_CHECKED_KEY, String(t));
    } catch { /* ignore */ }
    setLastChecked(t);
    setExpanded(false);
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
      stampChecked(); // marking engaged counts as checking the inbox
      onAfterMark();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Bulk engaged failed");
    } finally {
      setSubmitting(false);
      setTimeout(() => setProgress(null), 1500);
    }
  };

  const tone = overdue
    ? "border-amber-300 bg-amber-50/70"
    : "border-blue-200 bg-blue-50/40";
  const headerLabelTone = overdue ? "text-amber-900" : "text-blue-900";

  const lastCheckedLabel = lastChecked
    ? `last checked ${formatRelative(lastChecked, now)}`
    : "not checked yet today";

  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 ${tone}`}>
      <button
        onClick={() => setExpanded((s) => !s)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className={`text-sm font-semibold ${headerLabelTone}`}>
          📬 Inbox check
          {overdue && <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">overdue</span>}
          <span className="ml-2 text-xs font-normal text-gray-600">
            {rows.length} mid-cadence · {lastCheckedLabel}
          </span>
        </span>
        <span className={`text-xs ${headerLabelTone}`}>{expanded ? "Hide ▾" : "Open ▸"}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          <p className={`text-xs ${headerLabelTone}`}>
            Open <code>{getReplyToHint()}</code> in your mail client. Check off any stakeholder
            who replied. Then click <strong>Mark inbox checked</strong> to reset the 4-hour timer.
          </p>

          {rows.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-200 bg-white px-3 py-3 text-center text-xs text-gray-500">
              No stakeholders mid-cadence right now. Nothing to triage — but the timer still
              applies if any new sends fire later today.
            </p>
          ) : (
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
                          ? `last email ${formatRelative(new Date(r.last_email_sent_at).getTime(), now)}`
                          : "no emails sent yet"}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className={`text-xs ${headerLabelTone}`}>
              {selected.size > 0
                ? `${selected.size} selected`
                : "Select any who replied, then click below"}
              {progress && ` · ${progress.done}/${progress.total} processed`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={stampChecked}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Mark inbox checked
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
  return "outreach@olera.care";
}

function formatRelative(epochMs: number, nowMs: number): string {
  const ms = nowMs - epochMs;
  if (ms < 0) return "just now";
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}
