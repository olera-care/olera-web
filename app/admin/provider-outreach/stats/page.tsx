"use client";

import { useEffect, useState } from "react";
import DateRangePopover, { type DateRangeValue } from "@/components/admin/DateRangePopover";
import { OperationsStatBox } from "@/components/admin/medjobs/OperationsStatBox";

/**
 * Provider Outreach · Stats — the analytic overview hub.
 * Copied from MedJobs Stats page structure. One tile per entity with
 * headline numbers and links to dedicated pages.
 *
 * Stub: fetches from provider-outreach API routes (return zeroes until
 * the pipeline tables exist). Reuses the shared OperationsStatBox component.
 */

interface Summary {
  providers: number;
  contacted: number;
  meetings: number;
  partners: number;
}

interface DailyLog {
  date: string;
  count: number;
}

interface InBasketStats {
  logs_today: number;
  logs_today_breakdown: { calls: number; emails: number; meetings: number; replies: number; other: number };
  daily_logs: DailyLog[];
  streak_days: number;
  streak_target: number;
}

export default function ProviderOutreachStatsPage() {
  const [range, setRange] = useState<DateRangeValue>({
    preset: "30d",
    customFrom: "",
    customTo: "",
  });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [inBasket, setInBasket] = useState<InBasketStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/provider-outreach/operations-summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setSummary(d))
      .catch(() => !cancelled && setSummary(null));
    fetch("/api/admin/provider-outreach/in-basket-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setInBasket(d))
      .catch(() => !cancelled && setInBasket(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const logsSeries = inBasket?.daily_logs ? inBasket.daily_logs.slice(-30) : undefined;

  return (
    <div>
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Provider Outreach · Stats</h1>
        <DateRangePopover value={range} onChange={setRange} />
      </header>

      {inBasket ? (
        <StreakTracker
          days={inBasket.daily_logs.slice(-14)}
          target={inBasket.streak_target}
          streak={inBasket.streak_days}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <OperationsStatBox
          title="Providers"
          href="/admin/provider-outreach/in-basket?tab=providers"
          range={range}
          value={summary?.providers ?? null}
          unit="in pipeline"
        />
        <OperationsStatBox
          title="Contacted"
          href="/admin/provider-outreach/in-basket?tab=calls"
          range={range}
          value={summary?.contacted ?? null}
          unit="reached out"
        />
        <OperationsStatBox
          title="Logs"
          href="/admin/provider-outreach/in-basket"
          range={range}
          series={logsSeries}
          value={inBasket?.logs_today ?? null}
          unit="logged today"
          accent="gray"
          cta="View all logs"
        />
        <OperationsStatBox
          title="Calls"
          href="/admin/provider-outreach/in-basket?tab=calls"
          range={range}
          value={0}
        />
        <OperationsStatBox
          title="Emails"
          href="/admin/provider-outreach/in-basket?tab=emails"
          range={range}
          value={0}
        />
        <OperationsStatBox
          title="Meetings"
          href="/admin/provider-outreach/in-basket?tab=meetings"
          range={range}
          value={0}
        />
      </div>
    </div>
  );
}

function StreakTracker({
  days,
  target,
  streak,
}: {
  days: DailyLog[];
  target: number;
  streak: number;
}) {
  if (days.length === 0) return null;
  const scaleMax = Math.max(target, ...days.map((d) => d.count), 1);
  const targetPct = (target / scaleMax) * 100;

  return (
    <div className="mb-6 rounded-2xl border border-gray-100 bg-white px-5 py-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Log streak
        </span>
        <span className="text-xs text-gray-500">
          {streak === 0 ? "no active streak" : `${streak} day${streak === 1 ? "" : "s"}`} · target{" "}
          <span className="tabular-nums text-gray-700">{target}</span>/day
        </span>
      </div>
      <div className="relative mt-3 flex items-end gap-1" style={{ height: 48 }}>
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-gray-300"
          style={{ bottom: `${targetPct}%` }}
          aria-hidden
        />
        {days.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} log${d.count === 1 ? "" : "s"}`}
            className="flex-1 rounded-sm"
            style={{
              height: `${Math.max(3, (d.count / scaleMax) * 100)}%`,
              backgroundColor: d.count >= target ? "#10b981" : "#d1d5db",
            }}
          />
        ))}
      </div>
    </div>
  );
}
