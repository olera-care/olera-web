"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MetricTrendChart } from "@/components/admin/PulseHeader";
import DateRangePopover, {
  dateRangeFromSearchParams,
  type DateRangePresetOption,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";
import GrowthDrivers from "@/components/admin/GrowthDrivers";

interface GrowthWeek {
  week_start: string;
  week_end: string;
  source: "google_supabase" | "airtable_legacy";
  collected_at: string;
  ga4: {
    overview: { total_users: number; sessions: number; engagement_rate: number; page_views: number };
    channels: Record<string, number>;
    organic?: {
      sources: Array<{ source_medium: string; users: number; sessions: number }>;
      landing_pages: Array<{ path: string; users: number; sessions: number }>;
    };
  };
  gsc: {
    performance: { clicks: number; impressions: number; ctr: number; position: number };
    top_queries?: Array<{ label: string; clicks: number; impressions: number; ctr: number; position: number }>;
    top_pages?: Array<{ label: string; clicks: number; impressions: number; ctr: number; position: number }>;
    query_mix?: {
      branded_clicks: number;
      non_branded_clicks: number;
      branded_impressions: number;
      non_branded_impressions: number;
      classified_click_coverage: number | null;
    };
  } | null;
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

const GROWTH_RANGE_PRESETS: DateRangePresetOption[] = [
  { label: "All time", value: "all" },
  { label: "Last 12 weeks", value: "12w" },
  { label: "Last 6 months", value: "6m" },
  { label: "Last 12 months", value: "1y" },
];

const DEFAULT_GROWTH_RANGE: DateRangeValue = {
  preset: "12w",
  customFrom: "",
  customTo: "",
};

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

function weeksInRange(allWeeks: GrowthWeek[], range: DateRangeValue) {
  if (range.preset === "custom") {
    if (!range.customFrom) return allWeeks;
    const to = range.customTo || range.customFrom;
    return allWeeks.filter((week) => week.week_end >= range.customFrom && week.week_start <= to);
  }
  if (range.preset === "all") return allWeeks;
  const count = range.preset === "12w" ? 12 : range.preset === "6m" ? 26 : 52;
  return allWeeks.slice(-count);
}

function continuousSeries(weeks: GrowthWeek[], value: (week: GrowthWeek) => number | null) {
  const points: Array<{ date: string; count: number }> = [];
  for (let index = weeks.length - 1; index >= 0; index -= 1) {
    const count = value(weeks[index]);
    if (count == null) break;
    points.unshift({ date: weeks[index].week_start, count });
  }
  return points;
}

export default function GrowthOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<GrowthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<MetricKey>("total_users");
  const range = useMemo(
    () => dateRangeFromSearchParams(searchParams, DEFAULT_GROWTH_RANGE, GROWTH_RANGE_PRESETS),
    [searchParams],
  );

  const setRange = useCallback((next: DateRangeValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    if (next.preset === DEFAULT_GROWTH_RANGE.preset) params.delete("range");
    else params.set("range", next.preset);
    if (next.preset === "custom") {
      params.set("range", "custom");
      if (next.customFrom) params.set("from", next.customFrom);
      if (next.customTo) params.set("to", next.customTo);
    }
    const query = params.toString();
    router.replace(query ? `/admin/organic-growth?${query}` : "/admin/organic-growth", { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/organic-growth?weeks=260", { cache: "no-store" })
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
  const allWeeks = useMemo(() => data?.weeks || [], [data]);
  const weeks = useMemo(() => weeksInRange(allWeeks, range), [allWeeks, range]);
  const latest = weeks.at(-1) || null;
  const prior = weeks.at(-2) || null;
  const series = useMemo(
    () => continuousSeries(weeks, metric.value),
    [metric, weeks],
  );

  if (loading) {
    return <div className="mb-10 h-[430px] animate-pulse rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white" />;
  }

  if (failed) {
    return (
      <section className="mb-10 rounded-3xl border border-amber-200 bg-amber-50/50 px-6 py-5">
        <p className="font-medium text-gray-900">Growth history is not connected yet</p>
        <p className="mt-1 text-sm text-gray-600">Apply migration 172 and run the first weekly collection.</p>
      </section>
    );
  }

  if (!latest && allWeeks.length > 0) {
    return (
      <section className="mb-12">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Organic Growth</h1>
            <p className="mt-1 text-sm text-gray-500">Reach, intent, and marketplace response in one weekly view.</p>
          </div>
          <DateRangePopover
            value={range}
            onChange={setRange}
            presets={GROWTH_RANGE_PRESETS}
            ariaLabel="Growth reporting range"
          />
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white px-6 py-10 text-center">
          <p className="font-medium text-gray-900">No completed weeks in this range</p>
          <p className="mt-1 text-sm text-gray-500">Choose a wider reporting window or include dates from February 2023 onward.</p>
          <button
            type="button"
            onClick={() => setRange(DEFAULT_GROWTH_RANGE)}
            className="mt-4 rounded-full bg-gray-950 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-black"
          >
            Show the latest 12 weeks
          </button>
        </div>
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
  const allSourcesLive = latest.source === "google_supabase"
    && latest.source_status.ga4 === "available"
    && latest.source_status.gsc === "available"
    && latest.source_status.supabase === "available";
  const sourceBadge = latest.source === "airtable_legacy"
    ? { label: "Legacy history", classes: "bg-gray-100 text-gray-600", dot: "bg-gray-400" }
    : allSourcesLive
      ? { label: "Live sources", classes: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" }
      : { label: "Source gap", classes: "bg-amber-50 text-amber-700", dot: "bg-amber-500" };

  return (
    <section className="mb-12">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Organic Growth</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${sourceBadge.classes}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sourceBadge.dot}`} />
              {sourceBadge.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Reach, intent, and marketplace response in one weekly view.</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <DateRangePopover
            value={range}
            onChange={setRange}
            presets={GROWTH_RANGE_PRESETS}
            ariaLabel="Growth reporting range"
          />
          <p className="text-xs text-gray-400">
            Week ending {formatWeek(latest.week_end)} · refreshed {new Date(latest.collected_at).toLocaleDateString()}
          </p>
        </div>
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
            <div className="max-w-sm sm:text-right">
              {latestAnomaly && (
                <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-left text-xs leading-relaxed text-amber-900">
                  <span className="font-semibold">Worth a look:</span> {latestAnomaly.label} moved {Math.abs(Math.round(latestAnomaly.change * 100))}% this week.
                </p>
              )}
              <p className={`${latestAnomaly ? "mt-2" : ""} text-xs text-gray-400`}>
                {weeks.length} completed {weeks.length === 1 ? "week" : "weeks"} · Sunday through Saturday
                {series.length < weeks.length ? ` · ${series.length} recent with ${metric.source} data` : ""}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <MetricTrendChart series={series} bucket="week" loading={false} timeZone="UTC" />
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 lg:grid-cols-4 lg:divide-y-0">
          <Signal label="Organic search" value={latest.ga4.channels["Organic Search"] ?? null} prior={prior?.ga4.channels["Organic Search"] ?? null} source="GA4" />
          <Signal label="Search clicks" value={latest.gsc?.performance.clicks ?? null} prior={prior?.gsc?.performance.clicks ?? null} source="Search Console" />
          <Signal label="Inquiries" value={latest.marketplace.inquiries} prior={prior?.marketplace.inquiries ?? null} source="Olera" />
          <Signal label="Providers answering" value={latest.marketplace.providers_answering_questions} prior={prior?.marketplace.providers_answering_questions ?? null} source="Olera" />
        </div>
      </div>

      <GrowthDrivers from={weeks[0].week_start} to={latest.week_end} />

      <OrganicAcquisition latest={latest} prior={prior} />
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

function OrganicAcquisition({ latest, prior }: { latest: GrowthWeek; prior: GrowthWeek | null }) {
  const organic = latest.ga4.organic;
  const search = latest.gsc;
  if (!organic && !search?.top_queries?.length) {
    return (
      <div className="mt-6 rounded-3xl border border-gray-100 bg-white px-6 py-5">
        <p className="text-sm font-medium text-gray-900">Organic acquisition</p>
        <p className="mt-1 text-sm text-gray-500">
          {latest.source === "airtable_legacy"
            ? "This legacy week preserves Airtable headlines but predates detailed source, query, and landing-page collection."
            : "Detailed sources, search intent, and landing pages will appear with the next weekly collection."}
        </p>
      </div>
    );
  }

  const sources = (organic?.sources || []).filter((row) => row.users > 0).slice(0, 6);
  const queries = (search?.top_queries || []).filter((row) => row.label).slice(0, 6);
  const maxSource = Math.max(...sources.map((row) => row.users), 1);
  const mix = search?.query_mix;
  const classifiedClicks = (mix?.branded_clicks || 0) + (mix?.non_branded_clicks || 0);
  const nonBrandedShare = classifiedClicks > 0 ? (mix?.non_branded_clicks || 0) / classifiedClicks : null;
  const organicUsers = latest.ga4.channels["Organic Search"] ?? null;
  const priorOrganicUsers = prior?.ga4.channels["Organic Search"] ?? null;
  const organicMovement = delta(organicUsers, priorOrganicUsers);
  const clickMovement = delta(search?.performance.clicks ?? null, prior?.gsc?.performance.clicks ?? null);
  const conversion = latest.marketplace.organic_users_to_inquiry_rate_directional;

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
      <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold tracking-tight text-gray-950">Organic acquisition</h2>
              <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-medium text-teal-700">Updated weekly</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Where search traffic starts, what people need, and where they enter Olera.</p>
          </div>
          {conversion != null && (
            <div className="rounded-xl bg-gray-50 px-3.5 py-2.5 sm:text-right">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">Directional outcome</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{(conversion * 100).toFixed(2)}% organic users → inquiry</p>
            </div>
          )}
        </div>

        <p className="mt-5 rounded-2xl bg-teal-50/60 px-4 py-3 text-sm leading-relaxed text-gray-700">
          {organicStory(organicMovement, clickMovement)}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 lg:grid-cols-4">
          <OrganicHealth label="Search clicks" value={search?.performance.clicks ?? null} movement={clickMovement} />
          <OrganicHealth label="Impressions" value={search?.performance.impressions ?? null} />
          <OrganicHealth label="Search CTR" value={search ? `${(search.performance.ctr * 100).toFixed(1)}%` : null} />
          <OrganicHealth label="Average position" value={search ? search.performance.position.toFixed(1) : null} note="Lower is better" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-gray-100">
        <div className="px-5 py-5 sm:px-7">
          <PanelHeading title="Search sources" detail="GA4 users" />
          {sources.length ? (
            <div className="mt-4 space-y-3.5">
              {sources.map((row) => (
                <div key={row.source_medium}>
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="truncate font-medium text-gray-700">{sourceLabel(row.source_medium)}</span>
                    <span className="tabular-nums text-gray-500">{row.users.toLocaleString()}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.max(3, (row.users / maxSource) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyBreakdown />}

          {nonBrandedShare != null && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">Non-branded discovery</span>
                <span className="font-semibold text-gray-900">{Math.round(nonBrandedShare * 100)}%</span>
              </div>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="bg-teal-500" style={{ width: `${nonBrandedShare * 100}%` }} />
                <div className="bg-gray-300" style={{ width: `${(1 - nonBrandedShare) * 100}%` }} />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                Share of classified clicks that did not include “Olera.” Search Console exposed query text for {mix?.classified_click_coverage == null ? "an unknown share" : `${Math.round(mix.classified_click_coverage * 100)}%`} of total clicks.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-5 sm:px-7 lg:border-t-0">
          <PanelHeading title="What people searched" detail="Search Console" />
          {queries.length ? (
            <ol className="mt-3 divide-y divide-gray-50">
              {queries.map((row, index) => (
                <li key={`${row.label}-${index}`} className="flex items-center gap-3 py-2.5">
                  <span className="w-4 shrink-0 text-[10px] tabular-nums text-gray-300">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700" title={row.label}>{row.label}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-gray-400">{row.clicks.toLocaleString()} clicks</span>
                </li>
              ))}
            </ol>
          ) : <EmptyBreakdown />}
        </div>

      </div>
    </div>
  );
}

function OrganicHealth({ label, value, movement, note }: { label: string; value: number | string | null; movement?: number | null; note?: string }) {
  return (
    <div className="bg-white px-4 py-3.5">
      <p className="text-[11px] font-medium text-gray-400">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <p className="text-lg font-semibold tabular-nums text-gray-900">{typeof value === "number" ? value.toLocaleString() : value ?? "—"}</p>
        {movement != null && <span className={`text-[10px] font-medium ${movement >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{movement >= 0 ? "+" : ""}{Math.round(movement)}%</span>}
      </div>
      {note && <p className="mt-0.5 text-[10px] text-gray-300">{note}</p>}
    </div>
  );
}

function PanelHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-xs font-semibold text-gray-900">{title}</h3>
      <span className="text-[10px] text-gray-300">{detail}</span>
    </div>
  );
}

function EmptyBreakdown() {
  return <p className="mt-4 text-xs text-gray-400">No detailed rows for this week.</p>;
}

function sourceLabel(value: string) {
  const [source] = value.split(" / ");
  if (!source) return value;
  return source.charAt(0).toUpperCase() + source.slice(1);
}

function organicStory(organicMovement: number | null, clickMovement: number | null) {
  if (organicMovement == null && clickMovement == null) {
    return "The first complete week is now the baseline. Next Tuesday will add the first week-over-week organic comparison.";
  }
  const organic = movementStory("Organic users", organicMovement);
  const clicks = movementStory("search clicks", clickMovement);
  return `${organic}, while ${clicks}. Use Growth drivers above to locate the pages creating the movement, then use source and query detail here to understand demand.`;
}

function movementStory(label: string, movement: number | null) {
  if (movement == null) return `${label} have no clean prior comparison`;
  const rounded = Math.round(movement);
  if (rounded === 0) return `${label} were flat`;
  return `${label} ${rounded > 0 ? "grew" : "fell"} ${Math.abs(rounded)}%`;
}
