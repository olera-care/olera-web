"use client";

/**
 * v9.0 Phase 7 Commit K: In Basket hero panel.
 *
 * Three-element KPI strip rendered above the In Basket tab bar.
 *
 *   Queued                — total work across the five In Basket surfaces
 *                            (Providers + Partners + Calls + Emails +
 *                            Meetings), with an unread/read sub-line. Derived
 *                            from the same tab counts the bar shows, so the
 *                            number always matches the sum of the badges.
 *   Logs Completed Today  — distinct steps logged today, with a
 *                            sub-breakdown by type (calls / meetings
 *                            / replies / etc.).
 *   Streak                — consecutive business days at/above the 50/day
 *                            log target.
 *
 * Queued comes from props (the page already fetches tab counts); logs + streak
 * come from /api/admin/medjobs/in-basket-stats.
 */

import { useCallback, useEffect, useState } from "react";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";
import type { TabCounts, TabUnreadCounts } from "@/lib/student-outreach/types";

interface InBasketStats {
  logs_today: number;
  logs_today_breakdown: {
    calls: number;
    emails: number;
    meetings: number;
    replies: number;
    other: number;
  };
  streak_days: number;
  streak_target?: number;
}

// The five In Basket surfaces that make up "Queued".
const QUEUED_KEYS = ["providers", "partner_book", "calls", "replies", "meetings"] as const;

function sumQueued(counts: TabCounts | TabUnreadCounts | null | undefined): number {
  if (!counts) return 0;
  return QUEUED_KEYS.reduce((acc, k) => acc + (counts[k] ?? 0), 0);
}

export function InBasketHero({
  tabCounts,
  tabUnreadCounts,
}: {
  tabCounts: TabCounts | null;
  tabUnreadCounts: TabUnreadCounts | null;
}) {
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

  // Queued = sum of the five surfaces, from the tab counts the page already has.
  const queuedTotal = tabCounts ? sumQueued(tabCounts) : null;
  const queuedUnread = sumQueued(tabUnreadCounts);
  const queuedSub =
    queuedTotal != null
      ? `${queuedUnread} unread · ${Math.max(0, queuedTotal - queuedUnread)} read`
      : null;

  const logsBreakdownSub = stats ? formatLogBreakdown(stats.logs_today_breakdown) : null;
  const target = stats?.streak_target ?? 50;

  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <Tile
        label="Queued"
        value={queuedTotal != null ? String(queuedTotal) : "…"}
        sub={queuedSub ?? undefined}
        title="Total work across the five In Basket surfaces — Providers, Partners, Calls, Emails, Meetings. Equals the sum of the tab badges. Unread items get bold treatment in their lists; queue position is recency, not urgency."
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
        sub={`Consecutive business days hitting ${target} logs. Weekends skipped.`}
        title={`Mon–Fri days at or above the ${target}-logs daily target. Weekends are skipped, not streak-breaking. An in-progress today below target doesn't reset the streak.`}
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
