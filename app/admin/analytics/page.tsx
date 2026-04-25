"use client";

import { useEffect, useState } from "react";
import PulseHeader from "@/components/admin/PulseHeader";
import {
  resolveRange,
  rangeLabel,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";

interface WindowedCounts {
  page_view: number;
  search_click: number;
  benefits_started: number;
  lead_received: number;
  review_received: number;
  question_received: number;
  benefits_completed: number;
  matches_activated: number;
}

interface SummaryResponse {
  windowed: {
    range: { from: string | null; to: string | null };
    counts: WindowedCounts;
    unique_sessions_page_view: number;
  };
  botRejects: { count: number; date: string };
  topProviders: Array<{
    provider_id: string;
    raw_views_7d: number;
    unique_sessions_7d: number;
    last_seen: string;
  }>;
  latestEvents: Array<{
    id: string;
    provider_id: string;
    event_type: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>;
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<DateRangeValue>({
    preset: "7d",
    customFrom: "",
    customTo: "",
  });
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const { from, to } = resolveRange(range);
    const params = new URLSearchParams();
    if (from) params.set("date_from", from);
    if (to) params.set("date_to", to);
    const qs = params.toString();
    fetch(`/api/admin/analytics/summary${qs ? `?${qs}` : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <div>
      <PulseHeader
        title="Analytics"
        kpiSuffix="page views"
        statsPath="/api/admin/analytics/views/stats"
        range={range}
        onRangeChange={setRange}
      />

      <WindowedCard summary={summary} loading={loading} range={range} />
      <TopProvidersCard summary={summary} loading={loading} />
      <LatestEventsCard summary={summary} loading={loading} />

      <p className="mt-6 text-xs text-gray-400">
        Phase 0 sanity-check view. Counts shown here are raw — aggregation
        tables (provider_page_view_stats, city_category_view_benchmarks) are
        populated nightly at 8 AM UTC by /api/cron/aggregate-provider-views.
      </p>
    </div>
  );
}

function WindowedCard({
  summary,
  loading,
  range,
}: {
  summary: SummaryResponse | null;
  loading: boolean;
  range: DateRangeValue;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 mb-6">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">{rangeLabel(range)}</h2>
        <BotBadge summary={summary} />
      </div>
      {loading ? (
        <div className="h-40 rounded-lg bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse" />
      ) : !summary ? (
        <p className="text-sm text-gray-400">Failed to load.</p>
      ) : (
        <div className="space-y-6">
          <Section label="Discovery">
            <Stat label="Page views" value={summary.windowed.counts.page_view} />
            <Stat label="Unique sessions" value={summary.windowed.unique_sessions_page_view} />
            <Stat label="Card clicks" value={summary.windowed.counts.search_click} />
          </Section>
          <Section label="Engagement">
            <Stat label="Questions" value={summary.windowed.counts.question_received} />
            <Stat label="Leads" value={summary.windowed.counts.lead_received} />
            <Stat label="Reviews" value={summary.windowed.counts.review_received} />
          </Section>
          <Section label="Families">
            <Stat label="Benefits started" value={summary.windowed.counts.benefits_started} />
            <Stat label="Benefits finished" value={summary.windowed.counts.benefits_completed} />
            <Stat label="Profiles published" value={summary.windowed.counts.matches_activated} />
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-3">
        {label}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums text-gray-900">
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function BotBadge({ summary }: { summary: SummaryResponse | null }) {
  if (!summary) return null;
  return (
    <div
      className="text-xs text-gray-500 tabular-nums"
      title="Per-instance counter (in-memory). Resets at UTC midnight. Undercounts across multi-region deploys."
    >
      Bot rejects today:{" "}
      <span className="font-medium text-gray-700">{summary.botRejects.count.toLocaleString()}</span>
    </div>
  );
}

function TopProvidersCard({ summary, loading }: { summary: SummaryResponse | null; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Top providers (last 7 days)
      </h2>
      {loading ? (
        <div className="h-32 rounded-lg bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse" />
      ) : !summary || summary.topProviders.length === 0 ? (
        <p className="text-sm text-gray-400">No page views logged yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-6 py-2 font-medium">Provider (slug)</th>
                <th className="px-6 py-2 font-medium tabular-nums text-right">Raw views</th>
                <th className="px-6 py-2 font-medium tabular-nums text-right">Unique sessions</th>
                <th className="px-6 py-2 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {summary.topProviders.map((p) => (
                <tr key={p.provider_id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-2.5">
                    <a
                      href={`/provider/${p.provider_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline"
                    >
                      {p.provider_id}
                    </a>
                  </td>
                  <td className="px-6 py-2.5 tabular-nums text-right text-gray-900">
                    {p.raw_views_7d.toLocaleString()}
                  </td>
                  <td className="px-6 py-2.5 tabular-nums text-right text-gray-900">
                    {p.unique_sessions_7d.toLocaleString()}
                  </td>
                  <td className="px-6 py-2.5 text-gray-500">{formatRelative(p.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LatestEventsCard({ summary, loading }: { summary: SummaryResponse | null; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Latest 50 events</h2>
      {loading ? (
        <div className="h-48 rounded-lg bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse" />
      ) : !summary || summary.latestEvents.length === 0 ? (
        <p className="text-sm text-gray-400">No events yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-6 py-2 font-medium">When</th>
                <th className="px-6 py-2 font-medium">Event</th>
                <th className="px-6 py-2 font-medium">Provider</th>
                <th className="px-6 py-2 font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {summary.latestEvents.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 last:border-0 align-top">
                  <td className="px-6 py-2 text-gray-500 whitespace-nowrap">
                    {formatRelative(e.created_at)}
                  </td>
                  <td className="px-6 py-2">
                    <EventBadge type={e.event_type} />
                  </td>
                  <td className="px-6 py-2 font-mono text-xs text-gray-700 break-all max-w-xs">
                    {e.provider_id}
                  </td>
                  <td className="px-6 py-2 font-mono text-[11px] text-gray-500 break-all max-w-md">
                    {summarizeMetadata(e.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EventBadge({ type }: { type: string }) {
  const tone = EVENT_TONE[type] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${tone}`}>
      {type}
    </span>
  );
}

const EVENT_TONE: Record<string, string> = {
  page_view: "bg-emerald-50 text-emerald-700",
  search_click: "bg-sky-50 text-sky-700",
  cta_click_public: "bg-violet-50 text-violet-700",
  benefits_started: "bg-teal-50 text-teal-700",
  lead_received: "bg-amber-50 text-amber-700",
  review_received: "bg-yellow-50 text-yellow-800",
  question_received: "bg-blue-50 text-blue-700",
  email_click: "bg-gray-100 text-gray-600",
  one_click_access: "bg-gray-100 text-gray-600",
  reviews_cta_clicked: "bg-pink-50 text-pink-700",
  contact_revealed: "bg-orange-50 text-orange-700",
  suspicious_claim: "bg-rose-50 text-rose-700",
  lead_opened: "bg-gray-100 text-gray-600",
  question_responded: "bg-gray-100 text-gray-600",
  review_viewed: "bg-gray-100 text-gray-600",
};

function summarizeMetadata(meta: Record<string, unknown> | null): string {
  if (!meta || Object.keys(meta).length === 0) return "—";
  const keys = Object.keys(meta).slice(0, 4);
  const parts = keys.map((k) => {
    const v = meta[k];
    const display =
      typeof v === "string"
        ? v.length > 40
          ? `${v.slice(0, 37)}…`
          : v
        : typeof v === "number" || typeof v === "boolean"
        ? String(v)
        : Array.isArray(v)
        ? `[${v.length}]`
        : "{…}";
    return `${k}: ${display}`;
  });
  const more = Object.keys(meta).length - keys.length;
  return parts.join(", ") + (more > 0 ? `, +${more}` : "");
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
