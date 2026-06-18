"use client";

import { useEffect, useState } from "react";
import DateRangePopover, { type DateRangeValue } from "@/components/admin/DateRangePopover";
import { OperationsStatBox } from "@/components/admin/medjobs/OperationsStatBox";
import { KIND_LABELS } from "@/lib/student-outreach/types";
import type { StakeholderType } from "@/lib/student-outreach/types";

/**
 * MedJobs · Stats — the analytic overview hub. One tile per entity, each with a
 * headline number, delta + sparkline over the selected range, and a link to the
 * full dedicated page. A flat tile grid (no group titles); the natural row order
 * keeps the funnel up top with Logs in the top-right. The dedicated list pages
 * (Prospects, Calls, Emails, Meetings, Clients, Partners, Candidates, Logs) are
 * reached from here rather than the sidebar.
 */

interface Breakdown {
  total: number;
  by_type: Record<StakeholderType, number>;
}
interface Summary {
  provider_prospects: number;
  partner_prospects: Breakdown;
  partners: Breakdown;
}
interface DailyLog {
  date: string;
  count: number;
}
interface InBasketStats {
  logs_today: number;
  logs_today_breakdown: { calls: number; emails: number; meetings: number; replies: number; other: number };
  daily_logs: DailyLog[];
}

const CHIP_ORDER: StakeholderType[] = ["student_org", "dept_head", "advisor", "professor"];

function SubtypeChips({ by_type }: { by_type: Record<StakeholderType, number> }) {
  const parts = CHIP_ORDER.filter((k) => by_type[k] > 0);
  if (parts.length === 0) return null;
  return (
    <p className="text-[11px] leading-relaxed text-gray-500">
      {parts.map((k, i) => (
        <span key={k}>
          {i > 0 ? " · " : ""}
          {KIND_LABELS[k]} <span className="tabular-nums text-gray-700">{by_type[k]}</span>
        </span>
      ))}
    </p>
  );
}

function LogsChips({ b }: { b: InBasketStats["logs_today_breakdown"] }) {
  const shown: Array<[string, number]> = (
    [
      ["calls", b.calls],
      ["emails", b.emails],
      ["mtgs", b.meetings],
    ] as Array<[string, number]>
  ).filter(([, n]) => n > 0);
  if (shown.length === 0) return null;
  return (
    <p className="text-[11px] leading-relaxed text-gray-500">
      {shown.map(([label, n], i) => (
        <span key={label}>
          {i > 0 ? " · " : ""}
          {label} <span className="tabular-nums text-gray-700">{n}</span>
        </span>
      ))}
    </p>
  );
}

export default function MedJobsStatsPage() {
  const [range, setRange] = useState<DateRangeValue>({
    preset: "30d",
    customFrom: "",
    customTo: "",
  });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [clientsTotal, setClientsTotal] = useState<number | null>(null);
  const [candidatesTotal, setCandidatesTotal] = useState<number | null>(null);
  const [inBasket, setInBasket] = useState<InBasketStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Each fetch is independent so one failure doesn't blank the whole board.
    fetch("/api/admin/medjobs/operations-summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setSummary(d))
      .catch(() => !cancelled && setSummary(null));
    fetch("/api/admin/medjobs/clients")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setClientsTotal(d?.total ?? (d?.rows?.length ?? null)))
      .catch(() => !cancelled && setClientsTotal(null));
    fetch("/api/admin/student-outreach/candidates")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setCandidatesTotal(d?.rows?.length ?? null))
      .catch(() => !cancelled && setCandidatesTotal(null));
    fetch("/api/admin/medjobs/in-basket-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setInBasket(d))
      .catch(() => !cancelled && setInBasket(null));
    return () => {
      cancelled = true;
    };
  }, []);

  // Last ~30 business days for the Logs tile sparkline.
  const logsSeries = inBasket?.daily_logs ? inBasket.daily_logs.slice(-30) : undefined;

  return (
    <div>
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">MedJobs · Stats</h1>
        <DateRangePopover value={range} onChange={setRange} />
      </header>

      {/* Flat tile grid — row order keeps the funnel up top with Logs top-right. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <OperationsStatBox
          title="Provider Prospects"
          href="/admin/medjobs/in-basket?tab=providers"
          range={range}
          value={summary?.provider_prospects ?? null}
          unit="in catchment"
        />
        <OperationsStatBox
          title="Partner Prospects"
          href="/admin/medjobs/prospects"
          range={range}
          metric="prospects_added"
          value={summary?.partner_prospects.total ?? null}
          chips={summary ? <SubtypeChips by_type={summary.partner_prospects.by_type} /> : null}
        />
        <OperationsStatBox
          title="Logs"
          href="/admin/medjobs/logs"
          range={range}
          series={logsSeries}
          value={inBasket?.logs_today ?? null}
          unit="logged today"
          accent="gray"
          cta="View all logs →"
          chips={inBasket ? <LogsChips b={inBasket.logs_today_breakdown} /> : null}
        />

        <OperationsStatBox title="Calls" href="/admin/medjobs/calls" range={range} metric="calls_made" unit="in range" />
        <OperationsStatBox title="Emails" href="/admin/medjobs/replies" range={range} metric="replies" unit="in range" />
        <OperationsStatBox title="Meetings" href="/admin/medjobs/meetings" range={range} metric="meetings_activity" unit="in range" />

        <OperationsStatBox
          title="Clients"
          href="/admin/medjobs/clients"
          range={range}
          metric="clients"
          value={clientsTotal}
        />
        <OperationsStatBox
          title="Partners"
          href="/admin/medjobs/partners"
          range={range}
          metric="partners_added"
          value={summary?.partners.total ?? null}
          chips={summary ? <SubtypeChips by_type={summary.partners.by_type} /> : null}
        />
        <OperationsStatBox
          title="Candidates"
          href="/admin/medjobs/candidates"
          range={range}
          metric="candidates"
          value={candidatesTotal}
        />
      </div>
    </div>
  );
}
