"use client";

/**
 * v9.0 Phase 7 Commit J: In Basket hero panel.
 *
 * Three-element KPI strip rendered above the In Basket tab bar.
 * Always shows the same three KPIs regardless of active tab:
 *   - Queued Logs   → total active queue size with an unread/read
 *                     breakdown sub-line
 *   - Logs Today    → distinct operational steps logged today
 *   - Streak        → consecutive business days (Mon-Fri) with ≥1 log
 *
 * Powered by /api/admin/medjobs/in-basket-stats. Refetches when the
 * parent triggers useMedJobsRefresh; otherwise idle.
 *
 * Operational philosophy: surface queue health, not inbox-zero. The
 * earlier "In Basket Cleared %" framed work as elimination; "Queued
 * Logs" frames it as a continuous backlog where steady throughput
 * matters more than zeroing out.
 */

import { useCallback, useEffect, useState } from "react";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

interface InBasketStats {
  queued_logs_unread: number;
  queued_logs_read: number;
  logs_today: number;
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

  const queuedTotal = stats
    ? stats.queued_logs_unread + stats.queued_logs_read
    : null;
  const queuedSub = stats
    ? `${stats.queued_logs_unread} unread · ${stats.queued_logs_read} read`
    : null;

  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <Tile
        label="Queued logs"
        value={queuedTotal != null ? String(queuedTotal) : loading ? "…" : "—"}
        sub={queuedSub ?? undefined}
        title="Active items still in the queue. Unread items lead, then read-but-undone — work top-down."
      />
      <Tile
        label="Logs today"
        value={stats ? String(stats.logs_today) : loading ? "…" : "—"}
        title="Touchpoints + custom-step completions logged so far today."
      />
      <Tile
        label="Streak"
        value={stats ? streakLabel(stats.streak_days) : loading ? "…" : "—"}
        title="Consecutive business days (Mon-Fri) with at least one logged step. Weekends are skipped, not breaking."
      />
    </div>
  );
}

function streakLabel(days: number): string {
  if (days <= 0) return "—";
  if (days === 1) return "1 day";
  return `${days} days`;
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
