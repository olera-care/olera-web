"use client";

/**
 * v9.0 Phase 7 Commit E: In Basket hero panel.
 *
 * Three-element KPI strip rendered above the In Basket search/filter
 * row. Always shows the same three KPIs regardless of active tab:
 *   - In Basket Cleared %  → today's log count vs. remaining queue size
 *   - Logs Today           → distinct operational steps logged today
 *   - Streak               → consecutive business days (Mon-Fri) with ≥1 log
 *
 * Powered by /api/admin/medjobs/in-basket-stats. Refetches when the
 * parent triggers useMedJobsRefresh; otherwise idle.
 *
 * Operational philosophy: the hero surfaces queue health, not
 * inbox-zero. The 100% target is intentionally unattainable on a
 * busy day — the goal is sustainable throughput, not clearing all
 * work.
 */

import { useCallback, useEffect, useState } from "react";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

interface InBasketStats {
  in_basket_cleared_pct: number;
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

  useEffect(() => { void refetch(); }, [refetch]);
  useMedJobsRefresh(refetch);

  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <Tile
        label="In Basket cleared"
        value={stats ? `${stats.in_basket_cleared_pct}%` : loading ? "…" : "—"}
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
