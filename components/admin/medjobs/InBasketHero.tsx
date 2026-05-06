"use client";

/**
 * v9.0 Phase 7 Commit D: In Basket hero panel.
 *
 * Three-element KPI strip rendered above the In Basket search/filter
 * row. Always shows the same three KPIs regardless of active tab:
 *   - Inbox Cleared %  → today's log count vs. remaining inbox size
 *   - Logs Today       → distinct operational steps logged today
 *   - Streak           → consecutive business days (Mon-Fri) with ≥1 log
 *
 * Powered by /api/admin/medjobs/inbox-stats. Refetches when the parent
 * triggers useMedJobsRefresh; otherwise idle.
 */

import { useCallback, useEffect, useState } from "react";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

interface InboxStats {
  inbox_cleared_pct: number;
  logs_today: number;
  streak_days: number;
}

export function InBasketHero() {
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/medjobs/inbox-stats");
      if (!res.ok) {
        setStats(null);
      } else {
        const data = (await res.json()) as InboxStats;
        setStats(data);
      }
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);
  useMedJobsRefresh(refetch);

  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <Tile
        label="Inbox cleared"
        value={stats ? `${stats.inbox_cleared_pct}%` : loading ? "…" : "—"}
        title="Of all the operational work that came through today, how much has been logged."
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
  title,
}: {
  label: string;
  value: string;
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
    </div>
  );
}
