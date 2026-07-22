"use client";

/**
 * Provider Outreach In Basket hero panel.
 * Exact copy of MedJobs InBasketHero, pointed at the provider-outreach API.
 */

import { useCallback, useEffect, useState } from "react";
import { useProviderOutreachRefresh } from "@/hooks/useProviderOutreachRefresh";

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

interface TabCounts {
  [key: string]: number;
}

const QUEUED_KEYS = ["providers", "contacted", "calls", "replies", "meetings"] as const;

function sumQueued(counts: TabCounts | null | undefined): number {
  if (!counts) return 0;
  return QUEUED_KEYS.reduce((acc, k) => acc + (counts[k] ?? 0), 0);
}

export function InBasketHero({
  tabCounts,
  tabUnreadCounts,
}: {
  tabCounts: TabCounts | null;
  tabUnreadCounts: TabCounts | null;
}) {
  const [stats, setStats] = useState<InBasketStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/in-basket-stats");
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
  useProviderOutreachRefresh(refetch);

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
        value={queuedTotal != null ? String(queuedTotal) : "..."}
        sub={queuedSub ?? undefined}
        title="Total work across the Provider Outreach In Basket surfaces."
      />
      <Tile
        label="Logs completed today"
        value={stats ? String(stats.logs_today) : loading ? "..." : "--"}
        sub={logsBreakdownSub ?? undefined}
        title="Touchpoints logged so far today."
      />
      <Tile
        label="Streak"
        value={stats ? streakLabel(stats.streak_days) : loading ? "..." : "--"}
        sub={`Consecutive business days hitting ${target} logs. Weekends skipped.`}
        title={`Mon-Fri days at or above the ${target}-logs daily target.`}
      />
    </div>
  );
}

function streakLabel(days: number): string {
  if (days <= 0) return "--";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function formatLogBreakdown(b: InBasketStats["logs_today_breakdown"]): string | null {
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
