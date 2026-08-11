"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricTrendChart } from "@/components/admin/PulseHeader";

interface GrowthWeek {
  week_start: string;
  week_end: string;
  source: "google_supabase" | "airtable_legacy";
  collected_at: string;
  ga4: {
    overview: { total_users: number; sessions: number; engagement_rate: number; page_views: number };
    channels: Record<string, number>;
  };
  gsc: { performance: { clicks: number; impressions: number; ctr: number; position: number } } | null;
  marketplace: {
    inquiries: number;
    questions_asked: number;
    benefits_completed: number;
    providers_answering_questions: number;
    organic_users_to_inquiry_rate_directional: number | null;
  };
  source_status: { ga4: string; gsc: string; supabase: string };
  anomalies: Array<{ label: string; change: number }>;
}

interface GrowthResponse {
  reporting_timezone: string;
  weeks: GrowthWeek[];
}

type MetricKey = "total_users" | "organic_users" | "search_clicks" | "inquiries";

const METRICS: Array<{
  key: MetricKey;
  label: string;
  value: (week: GrowthWeek) => number | null;
  source: string;
}> = [
  { key: "total_users", label: "Total users", value: (week) => week.ga4.overview.total_users, source: "GA4" },
  { key: "organic_users", label: "Organic search", value: (week) => week.ga4.channels["Organic Search"] ?? null, source: "GA4" },
  { key: "search_clicks", label: "Search clicks", value: (week) => week.gsc?.performance.clicks ?? null, source: "Search Console" },
  { key: "inquiries", label: "Inquiries", value: (week) => week.marketplace.inquiries, source: "Olera" },
];

function delta(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function Delta({ value }: { value: number | null }) {
  if (value == null) return <span className="text-gray-400">No comparison</span>;
  const rounded = Math.round(Math.abs(value));
  if (rounded === 0) return <span className="text-gray-400">Flat week over week</span>;
  return (
    <span className={value > 0 ? "text-emerald-700" : "text-rose-600"}>
      {value > 0 ? "↑" : "↓"} {rounded}% week over week
    </span>
  );
}

function formatWeek(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export default function GrowthOverview() {
  const [data, setData] = useState<GrowthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<MetricKey>("total_users");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/analytics/growth?weeks=26", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Growth history unavailable");
        return response.json() as Promise<GrowthResponse>;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const metric = METRICS.find((item) => item.key === selected) || METRICS[0];
  const weeks = data?.weeks || [];
  const latest = weeks.at(-1) || null;
  const prior = weeks.at(-2) || null;
  const series = useMemo(
    () => weeks
      .slice(-12)
      .map((week) => ({ date: week.week_start, count: metric.value(week) }))
      .filter((point): point is { date: string; count: number } => point.count != null),
    [metric, weeks],
  );

  if (loading) {
    return <div className="mb-10 h-[430px] animate-pulse rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white" />;
  }

  if (failed) {
    return (
      <section className="mb-10 rounded-3xl border border-amber-200 bg-amber-50/50 px-6 py-5">
        <p className="font-medium text-gray-900">Growth history is not connected yet</p>
        <p className="mt-1 text-sm text-gray-600">Apply migration 172 and run the first weekly collection. Product analytics below remains available.</p>
      </section>
    );
  }

  if (!latest) {
    return (
      <section className="mb-10 rounded-3xl border border-gray-100 bg-white px-6 py-8">
        <p className="font-medium text-gray-900">Growth is ready for its first week</p>
        <p className="mt-1 text-sm text-gray-500">The pipeline is connected. Run <code className="rounded bg-gray-100 px-1.5 py-0.5">/metrics</code> to collect GA4, Search Console, and marketplace outcomes.</p>
      </section>
    );
  }

  const selectedValue = metric.value(latest);
  const selectedDelta = delta(selectedValue, prior ? metric.value(prior) : null);
  const latestAnomaly = latest.anomalies?.[0];

  return (
    <section className="mb-12">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Growth</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live sources
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Reach, intent, and marketplace response in one weekly view.</p>
        </div>
        <p className="text-xs text-gray-400">
          Week ending {formatWeek(latest.week_end)} · refreshed {new Date(latest.collected_at).toLocaleDateString()}
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
          <div className="flex flex-wrap gap-2">
            {METRICS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelected(item.key)}
                className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                  selected === item.key
                    ? "bg-gray-950 text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-400">{metric.label} · {metric.source}</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-gray-950">{selectedValue == null ? "—" : selectedValue.toLocaleString()}</p>
              <p className="mt-1.5 text-xs font-medium"><Delta value={selectedDelta} /></p>
            </div>
            {latestAnomaly ? (
              <p className="max-w-sm rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900">
                <span className="font-semibold">Worth a look:</span> {latestAnomaly.label} moved {Math.abs(Math.round(latestAnomaly.change * 100))}% this week.
              </p>
            ) : (
              <p className="text-xs text-gray-400">12 completed weeks · Sunday through Saturday</p>
            )}
          </div>

          <div className="mt-5">
            <MetricTrendChart series={series} bucket="week" loading={false} timeZone="UTC" />
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 lg:grid-cols-4 lg:divide-y-0">
          <Signal label="Organic search" value={latest.ga4.channels["Organic Search"] || 0} prior={prior?.ga4.channels["Organic Search"] ?? null} source="GA4" />
          <Signal label="Search clicks" value={latest.gsc?.performance.clicks ?? null} prior={prior?.gsc?.performance.clicks ?? null} source="Search Console" />
          <Signal label="Inquiries" value={latest.marketplace.inquiries} prior={prior?.marketplace.inquiries ?? null} source="Olera" />
          <Signal label="Providers answering" value={latest.marketplace.providers_answering_questions} prior={prior?.marketplace.providers_answering_questions ?? null} source="Olera" />
        </div>
      </div>
    </section>
  );
}

function Signal({ label, value, prior, source }: { label: string; value: number | null; prior: number | null; source: string }) {
  const movement = delta(value, prior);
  return (
    <div className="min-w-0 px-5 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-gray-500">{label}</p>
        <span className="text-[10px] text-gray-300">{source}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-xl font-semibold tabular-nums text-gray-900">{value == null ? "—" : value.toLocaleString()}</p>
        {movement != null && (
          <span className={`text-[11px] font-medium ${movement >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {movement >= 0 ? "+" : ""}{Math.round(movement)}%
          </span>
        )}
      </div>
    </div>
  );
}
