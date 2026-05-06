"use client";

/**
 * v9.0 Phase 7 Commit K: In Basket hero panel.
 *
 * Three-element KPI strip rendered above the In Basket tab bar.
 * Always shows the same three KPIs regardless of active tab; updates
 * live as admins work the queue (drawer mark_read, log actions, and
 * task completions all fire the shared refresh signal).
 *
 *   Queued                — total active unfinished operational
 *                            workload across all entity types, with
 *                            an unread/read sub-line.
 *   Logs Completed Today  — distinct steps logged today, with a
 *                            sub-breakdown by type (calls / meetings
 *                            / replies / etc.).
 *   Streak                — consecutive business days with ≥1 log,
 *                            with a one-line description of the rule.
 *
 * Powered by /api/admin/medjobs/in-basket-stats (single round-trip
 * for all three).
 */

import { useCallback, useEffect, useState } from "react";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

interface InBasketStats {
  queued_unread: number;
  queued_read: number;
  logs_today: number;
  logs_today_breakdown: {
    calls: number;
    emails: number;
    meetings: number;
    replies: number;
    other: number;
  };
  streak_days: number;
}

export function InBasketHero() {
  const [stats, setStats] = useState<InBasketStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/medjobs/in-basket-stats");
      if (!res.ok) {
        setStats(null);
      } else {
        const data = (await res.json()) as InBasketStats;
        setStats(data);
      }
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);
  useMedJobsRefresh(refetch);

  const queuedTotal = stats ? stats.queued_unread + stats.queued_read : null;
  const queuedSub = stats
    ? `${stats.queued_unread} unread · ${stats.queued_read} read`
    : null;

  const logsBreakdownSub = stats ? formatLogBreakdown(stats.logs_today_breakdown) : null;

  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <Tile
        label="Queued"
        value={queuedTotal != null ? String(queuedTotal) : loading ? "…" : "—"}
        sub={queuedSub ?? undefined}
        title="Total active unfinished operational workload across all entity types — student outreach, partner relationships, entity tasks. Unread items get bold treatment in their lists; queue position is recency, not urgency."
      />
      <Tile
        label="Logs completed today"
        value={stats ? String(stats.logs_today) : loading ? "…" : "—"}
        sub={logsBreakdownSub ?? undefined}
        title="Touchpoints + custom-step completions logged so far today. Breakdown shows where the work landed."
      />
      <Tile
        label="Streak"
        value={stats ? streakLabel(stats.streak_days) : loading ? "…" : "—"}
        sub="Consecutive business days hitting your log goal (target: 50/day)."
        title="Mon–Fri days with at least one logged step. Weekends are skipped, not streak-breaking. The 50/day target is directional for now — the streak counts any business day with at least one log."
      />
    </div>
  );
}

function streakLabel(days: number): string {
  if (days <= 0) return "—";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function formatLogBreakdown(b: InBasketStats["logs_today_breakdown"]): string | null {
  // Show only non-zero buckets, in a fixed canonical order so the
  // line reads consistently across days.
  const parts: string[] = [];
  if (b.calls > 0) parts.push(`${b.calls} call${b.calls === 1 ? "" : "s"}`);
  if (b.meetings > 0) parts.push(`${b.meetings} meeting${b.meetings === 1 ? "" : "s"}`);
  if (b.replies > 0) parts.push(`${b.replies} repl${b.replies === 1 ? "y" : "ies"}`);
  if (b.emails > 0) parts.push(`${b.emails} email${b.emails === 1 ? "" : "s"}`);
  if (b.other > 0) parts.push(`${b.other} other`);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function Tile({
  label,
  value,
  sub,
  title,
}: {
  label: string;
  value: string;
  sub?: string;
  title: string;
}) {
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white px-4 py-3"
      title={title}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-500">{sub}</p>}
    </div>
  );
}
