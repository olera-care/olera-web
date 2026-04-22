"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * /portal/analytics
 *
 * Persistent provider-facing analytics dashboard. Phase 1C of the analytics
 * initiative (plan: plans/provider-analytics-phase-1-surfaces-plan.md task 10).
 *
 * Owner-gated: organization / caregiver profiles only. Non-owners see a
 * friendly redirect.
 *
 * Sections:
 *   - Header      title + period picker
 *   - Pipeline    "X families searched your area" banner (big, warm framing)
 *   - KPIs        views / cta clicks / questions / leads / reviews
 *   - Trend       line chart of page_views over the selected window
 *   - Sources     bar breakdown (direct / search / internal / other)
 *   - Funnel      horizontal bars views → cta_clicks → questions → leads
 *   - Peer        optional card shown only when cohort_size >= 5
 */

type Tier = "low" | "medium" | "high";

interface AnalyticsResponse {
  provider_id: string;
  provider_name: string;
  city: string | null;
  state: string | null;
  category: string | null;
  window: string;
  views: {
    this_period: number;
    prior_period: number;
    delta_pct: number | null;
    lifetime: number;
    trend: { date: string; count: number }[];
    bucket: string;
  };
  funnel: {
    page_view: number;
    cta_clicks: number;
    questions_received: number;
    leads_received: number;
    reviews_received: number;
  };
  sources: Record<string, number>;
  peer_context: {
    cohort_description: string;
    cohort_size: number;
    avg_views: number;
    p50_views: number;
    p90_views: number;
    as_of_date: string;
  } | null;
  pipeline_opportunity: {
    description: string;
    local_demand_count: number;
    reached_your_page_count: number;
  } | null;
  tier: Tier;
  reviews_state: { count: number; has_reviews: boolean; last_review_at: string | null };
}

type Window = "7d" | "30d" | "90d";
const WINDOW_LABELS: Record<Window, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export default function PortalAnalyticsPage() {
  const router = useRouter();
  const { profiles, isLoading: authLoading } = useAuth();
  const [windowParam, setWindowParam] = useState<Window>("30d");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const providerProfile = useMemo(
    () => profiles.find((p) => p.type === "organization" || p.type === "caregiver") ?? null,
    [profiles],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!providerProfile) return;

    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);
    fetch(`/api/provider/analytics?window=${windowParam}`, { credentials: "include" })
      .then((r) => {
        if (r.status === 401) throw new Error("Please sign in to view your analytics.");
        if (!r.ok) throw new Error("Couldn't load analytics right now.");
        return r.json();
      })
      .then((json: AnalyticsResponse) => {
        if (!cancelled) setData(json);
      })
      .catch((err: Error) => {
        if (!cancelled) setErrorMessage(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [windowParam, authLoading, providerProfile]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!providerProfile) {
    return (
      <div className="min-h-screen bg-[#F7F5F0]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Provider account required
          </h2>
          <p className="text-gray-500 mb-6">
            Analytics is available for organization and caregiver accounts.
          </p>
          <button
            onClick={() => router.push("/portal/profile")}
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Back to your profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Header
          providerName={data?.provider_name ?? providerProfile.display_name ?? "Your page"}
          location={[data?.city, data?.state].filter(Boolean).join(", ")}
          windowParam={windowParam}
          onWindowChange={setWindowParam}
        />

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {errorMessage}
          </div>
        )}

        {loading && !data ? (
          <LoadingSkeleton />
        ) : data ? (
          <>
            <PipelineBanner data={data} />
            <KpiGrid data={data} />
            <TrendCard trend={data.views.trend} />
            <SourcesCard sources={data.sources} />
            <FunnelCard funnel={data.funnel} />
            {data.peer_context && <PeerCard ctx={data.peer_context} />}
            <Footer />
          </>
        ) : null}
      </div>
    </div>
  );
}

function Header({
  providerName,
  location,
  windowParam,
  onWindowChange,
}: {
  providerName: string;
  location: string;
  windowParam: Window;
  onWindowChange: (w: Window) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
          Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {providerName}
          {location && <span className="text-gray-400"> · {location}</span>}
        </p>
      </div>
      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 self-start sm:self-auto">
        {(["7d", "30d", "90d"] as Window[]).map((w) => (
          <button
            key={w}
            onClick={() => onWindowChange(w)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              windowParam === w
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {WINDOW_LABELS[w]}
          </button>
        ))}
      </div>
    </div>
  );
}

function PipelineBanner({ data }: { data: AnalyticsResponse }) {
  const p = data.pipeline_opportunity;
  // Hide the banner if there's no cohort demand — a "0 families searched"
  // banner is a deflating empty state. The KPI grid carries the load instead.
  if (!p || p.local_demand_count === 0) return null;
  return (
    <div className="rounded-2xl bg-white border border-gray-100 px-6 py-6 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
        <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">
          Families near you
        </p>
      </div>
      <p className="text-[26px] font-display font-semibold text-gray-900 leading-snug tracking-tight">
        {p.local_demand_count.toLocaleString()}{" "}
        {p.local_demand_count === 1 ? "family" : "families"} searched for{" "}
        {humanCategory(data.category)?.toLowerCase() ?? "care"} near{" "}
        {data.city ?? "you"} this month.
      </p>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        {p.reached_your_page_count === 0
          ? "None have reached your page yet. This is your top-of-funnel opportunity."
          : `${p.reached_your_page_count.toLocaleString()} ${p.reached_your_page_count === 1 ? "has" : "have"} reached your page.`}
      </p>
    </div>
  );
}

function KpiGrid({ data }: { data: AnalyticsResponse }) {
  const { views, funnel, reviews_state } = data;
  const cells: Array<{ label: string; value: number; sub?: string }> = [
    {
      label: "Page views",
      value: views.this_period,
      sub: views.delta_pct === null ? undefined : deltaLabel(views.delta_pct),
    },
    { label: "CTA clicks", value: funnel.cta_clicks },
    { label: "Questions", value: funnel.questions_received },
    { label: "Leads", value: funnel.leads_received },
    { label: "Reviews", value: reviews_state.count },
    { label: "Lifetime views", value: views.lifetime },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl bg-white border border-gray-100 px-5 py-4"
        >
          <div className="text-2xl font-semibold tabular-nums text-gray-900">
            {c.value.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          {c.sub && (
            <div className="text-[11px] text-gray-400 mt-0.5">{c.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function deltaLabel(delta: number): string {
  if (delta === 0) return "flat vs. prior";
  if (delta > 0) return `up ${delta}% vs. prior`;
  return `down ${Math.abs(delta)}% vs. prior`;
}

const CHART_HEIGHT = 140;
const CHART_PAD_TOP = 16;
const CHART_PAD_BOTTOM = 6;

function TrendCard({ trend }: { trend: { date: string; count: number }[] }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!container) return;
    setWidth(container.offsetWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(Math.round(w));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [container]);

  const hasData = trend.length > 1 && trend.some((p) => p.count > 0);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 px-6 py-5 mb-6">
      <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-3">
        Views over time
      </p>
      <div
        ref={setContainer}
        className="relative w-full"
        style={{ height: CHART_HEIGHT }}
      >
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-300">
            No activity in this window yet
          </div>
        )}
        {hasData && width > 0 && (
          <TrendSvg trend={trend} width={width} height={CHART_HEIGHT} />
        )}
      </div>
    </div>
  );
}

function TrendSvg({
  trend,
  width,
  height,
}: {
  trend: { date: string; count: number }[];
  width: number;
  height: number;
}) {
  const realMax = trend.reduce((m, p) => Math.max(m, p.count), 0);
  const scaleMax = Math.max(1, niceCeiling(realMax));
  const innerH = height - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const n = trend.length;
  const points = trend.map((p, i) => {
    const x = (i / (n - 1)) * width;
    const ratio = Math.min(1, p.count / scaleMax);
    const y = CHART_PAD_TOP + innerH - ratio * innerH;
    return { x, y };
  });
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < n; i++) {
    d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  }
  const area = `${d} L ${points[n - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`;
  return (
    <svg width={width} height={height} className="block" aria-hidden>
      <defs>
        <linearGradient id="portal-pulse-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1={0}
        x2={width}
        y1={CHART_PAD_TOP}
        y2={CHART_PAD_TOP}
        stroke="#e5e7eb"
        strokeDasharray="3 3"
      />
      <path d={area} fill="url(#portal-pulse-fill)" />
      <path
        d={d}
        fill="none"
        stroke="#047857"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function niceCeiling(value: number): number {
  if (value <= 0) return 10;
  const target = value * 1.5;
  const exp = Math.floor(Math.log10(target));
  const pow = Math.pow(10, exp);
  const normalized = target / pow;
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const nice = steps.find((s) => s >= normalized) ?? 10;
  return Math.round(nice * pow);
}

function SourcesCard({ sources }: { sources: Record<string, number> }) {
  const entries = Object.entries(sources).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((a, [, v]) => a + v, 0);
  const labels: Record<string, string> = {
    direct: "Direct / bookmark",
    search: "Search engines",
    internal: "Within Olera",
    other: "Other sites",
  };
  const tones: Record<string, string> = {
    direct: "bg-gray-300",
    search: "bg-emerald-500",
    internal: "bg-sky-400",
    other: "bg-amber-400",
  };
  return (
    <div className="rounded-2xl bg-white border border-gray-100 px-6 py-5 mb-6">
      <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-4">
        Where views come from
      </p>
      <div className="space-y-3">
        {entries
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => {
            const pct = total === 0 ? 0 : Math.round((v / total) * 100);
            return (
              <div key={k}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{labels[k] ?? k}</span>
                  <span className="tabular-nums text-gray-500">
                    {v.toLocaleString()} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full ${tones[k] ?? "bg-gray-300"} rounded-full`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function FunnelCard({
  funnel,
}: {
  funnel: AnalyticsResponse["funnel"];
}) {
  const stages: Array<{ label: string; value: number }> = [
    { label: "Page views", value: funnel.page_view },
    { label: "CTA clicks", value: funnel.cta_clicks },
    { label: "Questions", value: funnel.questions_received },
    { label: "Leads", value: funnel.leads_received },
  ];
  // Use the largest value as the bar denominator so no bar renders > 100%
  // wide. In a healthy funnel page_view is the max; but page_view tracking
  // is brand-new (Phase 0 launch), and historic question/lead counts can
  // exceed it. Visual cap prevents the absurd 900% bar without distorting
  // the absolute counts in the value labels.
  const denom = Math.max(...stages.map((s) => s.value));
  if (denom === 0) return null;

  // Detect the inverted state — historic events outnumber current views.
  // Usually means tracking just turned on; show a small note so the
  // viewer understands why the funnel doesn't look like a funnel.
  const inverted = stages.some((s, i) => i > 0 && s.value > stages[0].value);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 px-6 py-5 mb-6">
      <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-4">
        Engagement summary
      </p>
      <div className="space-y-3">
        {stages.map((s) => {
          const pct = Math.round((s.value / denom) * 100);
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">{s.label}</span>
                <span className="tabular-nums text-gray-500">
                  {s.value.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(pct, s.value > 0 ? 4 : 0))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-4 leading-relaxed">
        {inverted
          ? "Page-view tracking is brand-new — historic question and lead counts may temporarily exceed views as the dataset catches up."
          : "We don't close deals for you yet — this is your top-of-funnel pipeline. Family contacts that convert to residents happen off-platform."}
      </p>
    </div>
  );
}

function PeerCard({
  ctx,
}: {
  ctx: NonNullable<AnalyticsResponse["peer_context"]>;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 px-6 py-5 mb-6">
      <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-3">
        Your cohort
      </p>
      <p className="text-sm text-gray-700 leading-relaxed">
        {ctx.cohort_description.charAt(0).toUpperCase() +
          ctx.cohort_description.slice(1)}{" "}
        — {ctx.cohort_size} providers. Average{" "}
        <span className="font-semibold text-gray-900 tabular-nums">
          {Math.round(ctx.avg_views).toLocaleString()}
        </span>{" "}
        views per provider in this window.
      </p>
      <p className="text-xs text-gray-400 mt-2">
        As of {new Date(ctx.as_of_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
      Numbers refresh continuously. Peer cohort averages refresh nightly.
    </p>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 rounded-2xl bg-white border border-gray-100 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 rounded-2xl bg-white border border-gray-100 animate-pulse"
          />
        ))}
      </div>
      <div className="h-36 rounded-2xl bg-white border border-gray-100 animate-pulse" />
    </div>
  );
}

function humanCategory(category: string | null): string | null {
  if (!category) return null;
  const map: Record<string, string> = {
    assisted_living: "Assisted living",
    memory_care: "Memory care",
    nursing_home: "Nursing homes",
    home_care_agency: "Home care",
    home_health_care: "Home health care",
    independent_living: "Independent living",
  };
  return map[category] ?? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
