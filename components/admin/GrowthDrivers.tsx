"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpenText,
  Building2,
  ChevronRight,
  HeartHandshake,
  MousePointerClick,
  Sparkles,
  Users,
} from "lucide-react";

type Category = "provider" | "benefit" | "editorial";
type View = "top" | "rising" | "falling" | "opportunities";

interface CategoryPerformance {
  category: Category;
  organic_users: number;
  organic_sessions: number;
  search_clicks: number;
  search_impressions: number;
  previous_organic_users: number;
  previous_search_clicks: number;
  previous_search_impressions: number;
  tracked_organic_visits: number;
  cta_engagements: number;
  unique_families: number;
  opportunities: number;
  direct_leads: number;
  assisted_leads: number;
  contact_intents: number;
}

interface PagePerformance {
  page_path: string;
  page_category: Category;
  organic_users: number;
  organic_sessions: number;
  search_clicks: number;
  search_impressions: number;
  search_ctr: number;
  search_position: number | null;
  previous_organic_users: number;
  previous_search_clicks: number;
  previous_search_impressions: number;
  weeks_present: number;
  tracked_organic_visits: number;
  cta_views: number;
  cta_engagements: number;
  lead_starts: number;
  unique_families: number;
  opportunities: number;
  direct_leads: number;
  assisted_leads: number;
  contact_intents: number;
}

interface TrendPoint {
  week_start: string;
  page_category: Category;
  organic_users: number;
}

interface DriversResponse {
  available_from: string | null;
  has_prior_data: boolean;
  categories: CategoryPerformance[];
  pages: PagePerformance[];
  trend: TrendPoint[];
  attribution: {
    status: "collecting" | "pending";
    available_from: string | null;
    summary: AttributionMetrics;
  };
}

interface AttributionMetrics {
  tracked_organic_visits: number;
  cta_views: number;
  cta_engagements: number;
  lead_starts: number;
  unique_families: number;
  opportunities: number;
  direct_leads: number;
  assisted_leads: number;
  contact_intents: number;
}

const CATEGORY_META = {
  provider: {
    label: "Provider pages",
    shortLabel: "Providers",
    description: "Local care discovery",
    icon: Building2,
    accent: "text-teal-700",
    iconBg: "bg-teal-50",
    line: "#0f8a72",
  },
  benefit: {
    label: "Benefits pages",
    shortLabel: "Benefits",
    description: "Programs and eligibility",
    icon: HeartHandshake,
    accent: "text-sky-700",
    iconBg: "bg-sky-50",
    line: "#1677a8",
  },
  editorial: {
    label: "Editorial",
    shortLabel: "Editorial",
    description: "Caregiver guidance",
    icon: BookOpenText,
    accent: "text-violet-700",
    iconBg: "bg-violet-50",
    line: "#7c5cbf",
  },
} satisfies Record<Category, {
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Building2;
  accent: string;
  iconBg: string;
  line: string;
}>;

const VIEWS: Array<{ value: View; label: string }> = [
  { value: "top", label: "Top pages" },
  { value: "rising", label: "Rising" },
  { value: "falling", label: "Falling" },
  { value: "opportunities", label: "Opportunities" },
];

function change(current: number, previous: number) {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function Change({ current, previous, hasPriorData }: { current: number; previous: number; hasPriorData: boolean }) {
  if (!hasPriorData) return <span className="text-gray-400">Baseline</span>;
  const movement = change(current, previous);
  if (movement == null) {
    return current > 0 ? <span className="text-teal-700">New</span> : <span className="text-gray-400">—</span>;
  }
  const rounded = Math.round(movement);
  return (
    <span className={rounded >= 0 ? "text-emerald-700" : "text-rose-600"}>
      {rounded >= 0 ? "+" : ""}{rounded}%
    </span>
  );
}

function opportunityFor(page: PagePerformance, hasPriorData: boolean) {
  const movement = change(page.organic_users, page.previous_organic_users);
  if (
    page.search_impressions >= 100 &&
    page.search_position != null &&
    page.search_position <= 10 &&
    page.search_ctr < 0.02
  ) return { label: "CTR opportunity", tone: "amber" as const, priority: 5 };
  if (
    page.search_impressions >= 100 &&
    page.search_position != null &&
    page.search_position > 4 &&
    page.search_position <= 15
  ) return { label: "Nearly there", tone: "sky" as const, priority: 4 };
  if (hasPriorData && movement != null && movement <= -20 && page.previous_organic_users >= 5) {
    return { label: "Losing momentum", tone: "rose" as const, priority: 3 };
  }
  if (hasPriorData && page.previous_organic_users === 0 && page.organic_users >= 10) {
    return { label: "New entrant", tone: "violet" as const, priority: 2 };
  }
  if (hasPriorData && movement != null && movement >= 25 && page.organic_users >= 10) {
    return { label: "Rising quickly", tone: "emerald" as const, priority: 1 };
  }
  return null;
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <div className="h-9" />;
  const width = 116;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - 3 - ((value - min) / spread) * (height - 6);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} className="h-9 w-[116px] overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function pageTitle(path: string) {
  const segments = path.split("/").filter(Boolean);
  const slug = segments.at(-1) || "Olera";
  if (path === "/benefits") return "Benefits hub";
  if (path === "/senior-benefits") return "Senior benefits hub";
  if (path === "/caregiver-support") return "Caregiver support";
  try {
    return decodeURIComponent(slug)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return slug.replace(/[-_]+/g, " ");
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

function conversionRate(families: number, visits: number) {
  return visits > 0 ? families / visits : null;
}

function formatRate(value: number | null) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;
}

export default function GrowthDrivers({
  from,
  to,
  collapsed,
  onToggle,
}: {
  from: string;
  to: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [data, setData] = useState<DriversResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [selectedPagePath, setSelectedPagePath] = useState<string | null>(null);
  const [view, setView] = useState<View>("top");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetch(`/api/admin/organic-growth/pages?from=${from}&to=${to}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Page intelligence unavailable");
        return response.json() as Promise<DriversResponse>;
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
  }, [from, to]);

  const leadingCategory = useMemo(() => {
    const categories = [...(data?.categories || [])];
    const hasAttribution = (data?.attribution.summary.tracked_organic_visits || 0) > 0;
    return categories.sort((a, b) => hasAttribution
      ? b.unique_families - a.unique_families || b.opportunities - a.opportunities || b.organic_users - a.organic_users
      : b.organic_users - a.organic_users)[0]?.category || "provider";
  }, [data]);
  const activeCategory = selected || leadingCategory;
  const hasPriorData = data?.has_prior_data ?? false;
  const categories = data?.categories || [];
  const trackedUsers = categories.reduce((sum, item) => sum + item.organic_users, 0);
  const attributionHasData = (data?.attribution.summary.tracked_organic_visits || 0) > 0;
  const pages = useMemo(() => {
    const matching = (data?.pages || []).filter((page) => page.page_category === activeCategory);
    if (view === "rising") {
      if (!hasPriorData) return [];
      return matching
        .filter((page) =>
          (change(page.organic_users, page.previous_organic_users) || 0) > 0 ||
          (page.previous_organic_users === 0 && page.organic_users >= 10),
        )
        .sort((a, b) => (b.organic_users - b.previous_organic_users) - (a.organic_users - a.previous_organic_users));
    }
    if (view === "falling") {
      if (!hasPriorData) return [];
      return matching
        .filter((page) => (change(page.organic_users, page.previous_organic_users) || 0) < 0)
        .sort((a, b) => (a.organic_users - a.previous_organic_users) - (b.organic_users - b.previous_organic_users));
    }
    if (view === "opportunities") {
      return matching
        .filter((page) => opportunityFor(page, hasPriorData))
        .sort((a, b) => (opportunityFor(b, hasPriorData)?.priority || 0) - (opportunityFor(a, hasPriorData)?.priority || 0));
    }
    return matching.sort((a, b) => attributionHasData
      ? b.unique_families - a.unique_families || b.opportunities - a.opportunities || b.organic_users - a.organic_users
      : b.organic_users - a.organic_users || b.search_clicks - a.search_clicks);
  }, [activeCategory, attributionHasData, data, hasPriorData, view]);
  const visiblePages = expanded ? pages : pages.slice(0, 6);
  const lead = categories.find((item) => item.category === leadingCategory);
  const leadShare = lead && trackedUsers > 0 ? Math.round((lead.organic_users / trackedUsers) * 100) : 0;
  const leadMovement = lead ? change(lead.organic_users, lead.previous_organic_users) : null;

  useEffect(() => {
    setExpanded(false);
    setSelectedPagePath(null);
  }, [activeCategory, view, from, to]);

  if (loading) {
    return <div className="mt-6 h-[460px] animate-pulse rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white" />;
  }

  if (failed) {
    return (
      <section className="mt-6 rounded-3xl border border-gray-100 bg-white px-6 py-7">
        <p className="text-sm font-semibold text-gray-900">Growth drivers are ready to connect</p>
        <p className="mt-1 text-sm text-gray-500">Apply migration 173, then backfill the Google-backed weeks to activate page intelligence.</p>
      </section>
    );
  }

  if (!data || !pages.length && !(data.pages || []).length) {
    return (
      <section className="mt-6 rounded-3xl border border-gray-100 bg-white px-6 py-7">
        <p className="text-sm font-semibold text-gray-900">No page-level history in this range</p>
        <p className="mt-1 text-sm text-gray-500">
          {data?.available_from
            ? `Detailed page intelligence begins ${formatDate(data.available_from)}. Choose a more recent range.`
            : "The next page-metrics collection will establish the baseline."}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
      <div className={`${collapsed ? "" : "border-b border-gray-100"} px-5 py-5 sm:px-7 sm:py-6`}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="flex w-full items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          <ChevronRight className={`mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform ${collapsed ? "" : "rotate-90"}`} />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2.5">
              <span className="text-base font-semibold tracking-tight text-gray-950">Growth drivers</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-[10px] font-medium text-teal-700">
                <Sparkles className="h-3 w-3" /> Outcome view
              </span>
            </span>
            <span className="mt-1 block text-sm text-gray-500">What is creating organic demand—and where to invest next.</span>
          </span>
          {data.available_from && from < data.available_from && (
            <span className="hidden max-w-xs text-xs leading-relaxed text-gray-400 sm:block sm:text-right">
              Page detail available from {formatDate(data.available_from)}
            </span>
          )}
        </button>

        {!collapsed && <>

        {data.attribution.status === "collecting" ? (
          <OutcomeStrip
            metrics={data.attribution.summary}
            availableFrom={data.attribution.available_from}
          />
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-3">
            <p className="text-sm font-medium text-gray-800">Lead attribution is ready to activate</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Apply migration 174 to connect organic visits to confirmed families. Traffic intelligence below remains available in the meantime.
            </p>
          </div>
        )}

        {lead && attributionHasData ? (
          <p className="mt-4 rounded-2xl bg-teal-50/60 px-4 py-3 text-sm leading-relaxed text-gray-700">
            <span className="font-semibold text-gray-900">{CATEGORY_META[leadingCategory].label}</span> generated the most confirmed families in this period: {lead.unique_families.toLocaleString()} from {lead.tracked_organic_visits.toLocaleString()} attributable organic visits ({formatRate(conversionRate(lead.unique_families, lead.tracked_organic_visits))}).
          </p>
        ) : lead && (
          <p className="mt-5 rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-700">
            <span className="font-semibold text-gray-900">{CATEGORY_META[leadingCategory].label}</span> led tracked organic discovery with {lead.organic_users.toLocaleString()} users and {leadShare}% of traffic across these three drivers
            {leadMovement == null ? "." : `, ${leadMovement >= 0 ? "up" : "down"} ${Math.abs(Math.round(leadMovement))}% versus the preceding period.`}
          </p>
        )}

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {categories.map((category) => {
            const meta = CATEGORY_META[category.category];
            const Icon = meta.icon;
            const active = activeCategory === category.category;
            const share = trackedUsers > 0 ? Math.round((category.organic_users / trackedUsers) * 100) : 0;
            const values = (data.trend || [])
              .filter((point) => point.page_category === category.category)
              .map((point) => point.organic_users);
            return (
              <button
                key={category.category}
                type="button"
                onClick={() => setSelected(category.category)}
                className={`group rounded-2xl border p-4 text-left transition-all duration-200 ${
                  active
                    ? "border-gray-300 bg-gray-50/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                    : "border-gray-100 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.iconBg} ${meta.accent}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <MiniSparkline values={values} color={meta.line} />
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{meta.label}</p>
                    {attributionHasData ? (
                      <>
                        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-gray-950">{category.unique_families.toLocaleString()}</p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          Confirmed families · {formatRate(conversionRate(category.unique_families, category.tracked_organic_visits))} conversion
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-gray-950">{category.organic_users.toLocaleString()}</p>
                        <p className="mt-0.5 text-[11px] text-gray-400">GA4 organic users · {share}% of tracked</p>
                      </>
                    )}
                  </div>
                  {attributionHasData ? (
                    <span className="pb-0.5 text-right text-[11px] leading-relaxed text-gray-400">
                      {category.opportunities.toLocaleString()} opportunities<br />{category.organic_users.toLocaleString()} GA4 users
                    </span>
                  ) : (
                    <span className="pb-0.5 text-xs font-semibold tabular-nums"><Change current={category.organic_users} previous={category.previous_organic_users} hasPriorData={hasPriorData} /></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        </>}
      </div>

      {!collapsed && <div className="px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.11em] text-gray-400">{CATEGORY_META[activeCategory].shortLabel}</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-gray-950">Pages shaping this period</h3>
          </div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-gray-50 p-1">
            {VIEWS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setView(item.value)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === item.value ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 hidden grid-cols-[minmax(0,1fr)_92px_72px_84px_86px_20px] gap-3 border-b border-gray-100 px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400 md:grid">
          <span>Page</span>
          <span className="text-right">GA4 users</span>
          <span className="text-right">Families</span>
          <span className="text-right">Opportunities</span>
          <span className="text-right">Conversion</span>
          <span />
        </div>

        {visiblePages.length ? (
          <ol className="divide-y divide-gray-50">
            {visiblePages.map((page, index) => {
              const opportunity = opportunityFor(page, hasPriorData);
              const isSelected = selectedPagePath === page.page_path;
              return (
                <li key={page.page_path}>
                  <button
                    type="button"
                    aria-expanded={isSelected}
                    onClick={() => setSelectedPagePath(isSelected ? null : page.page_path)}
                    className={`group grid w-full gap-3 rounded-xl px-2 py-4 text-left transition-colors md:grid-cols-[minmax(0,1fr)_92px_72px_84px_86px_20px] md:items-center md:gap-3 ${isSelected ? "bg-gray-50" : "hover:bg-gray-50/70"}`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 w-5 shrink-0 text-[10px] tabular-nums text-gray-300">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800" title={pageTitle(page.page_path)}>{pageTitle(page.page_path)}</p>
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <p className="truncate text-[11px] text-gray-400" title={page.page_path}>{page.page_path}</p>
                          {opportunity && <OpportunityBadge label={opportunity.label} tone={opportunity.tone} />}
                        </div>
                      </div>
                    </div>
                    <MetricCell label="GA4 organic users" value={page.organic_users.toLocaleString()} />
                    <MetricCell label="Confirmed families" value={attributionHasData ? page.unique_families.toLocaleString() : "—"} />
                    <MetricCell label="Opportunities" value={attributionHasData ? page.opportunities.toLocaleString() : "—"} />
                    <MetricCell
                      label="Visit conversion"
                      value={attributionHasData ? formatRate(conversionRate(page.unique_families, page.tracked_organic_visits)) : "—"}
                    />
                    <ChevronRight className={`hidden h-4 w-4 text-gray-300 transition-transform md:block ${isSelected ? "rotate-90" : ""}`} />
                  </button>
                  {isSelected && <PageOutcomeDetail page={page} />}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="rounded-2xl bg-gray-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-gray-700">Nothing to flag here</p>
            <p className="mt-1 text-xs text-gray-400">Try another view or category.</p>
          </div>
        )}

        {pages.length > 6 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-3 w-full rounded-xl py-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            {expanded ? "Show less" : `View all ${pages.length} pages`}
          </button>
        )}
      </div>}
    </section>
  );
}

function OutcomeStrip({ metrics, availableFrom }: { metrics: AttributionMetrics; availableFrom: string | null }) {
  const rate = conversionRate(metrics.unique_families, metrics.tracked_organic_visits);
  const items = [
    { label: "Attributed visits", value: metrics.tracked_organic_visits.toLocaleString(), detail: "Organic landings we can join" },
    { label: "Confirmed families", value: metrics.unique_families.toLocaleString(), detail: "Deduplicated people" },
    { label: "Opportunities", value: metrics.opportunities.toLocaleString(), detail: "Provider + benefits leads" },
    { label: "Visit → family", value: formatRate(rate), detail: "Confirmed conversion" },
  ];
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50">
      <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 lg:grid-cols-4 lg:divide-y-0">
        {items.map((item) => (
          <div key={item.label} className="bg-white/70 px-4 py-3.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">{item.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-gray-950">{item.value}</p>
            <p className="mt-0.5 text-[10px] text-gray-400">{item.detail}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1 px-4 py-2.5 text-[11px] text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <span>{metrics.direct_leads.toLocaleString()} direct + {metrics.assisted_leads.toLocaleString()} assisted opportunity credits</span>
        <span>{availableFrom ? `Collection began ${formatDate(availableFrom)}` : "Waiting for the first attributable organic visit"}</span>
      </div>
    </div>
  );
}

function PageOutcomeDetail({ page }: { page: PagePerformance }) {
  const funnel = [
    { label: "Organic visits", value: page.tracked_organic_visits },
    { label: "CTA engaged", value: page.cta_engagements },
    { label: "Lead started", value: page.lead_starts },
    { label: "Families", value: page.unique_families },
  ];
  return (
    <div className="mb-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-900">How this page turns attention into help</p>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
            The funnel shows actions on this page; assisted credits finish on a later Olera page within seven days.
          </p>
        </div>
        <a
          href={page.page_path}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          View page <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {funnel.map((step, index) => (
          <div key={step.label} className="relative rounded-xl bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <p className="text-[10px] font-medium text-gray-400">{step.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">{step.value.toLocaleString()}</p>
            {index < funnel.length - 1 && <ChevronRight className="absolute -right-2.5 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 rounded-full bg-gray-50 text-gray-300 sm:block" />}
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <DetailSignal icon={Users} label="Opportunity credit" value={`${page.direct_leads} direct · ${page.assisted_leads} assisted`} />
        <DetailSignal icon={MousePointerClick} label="Contact intent" value={`${page.contact_intents} phone or official-link clicks`} />
        <DetailSignal icon={Sparkles} label="Visit conversion" value={formatRate(conversionRate(page.unique_families, page.tracked_organic_visits))} />
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-gray-400">
        Contact intent is useful demand, but it is not counted as a lead. GA4 users can be higher than attributed visits because historical and non-joinable traffic remains visible in the table.
      </p>
    </div>
  );
}

function DetailSignal({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
      <div className="min-w-0">
        <p className="text-[9px] font-medium uppercase tracking-[0.07em] text-gray-400">{label}</p>
        <p className="mt-0.5 text-[11px] font-medium text-gray-700">{value}</p>
      </div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs tabular-nums text-gray-700 md:justify-end md:text-right">
      <span className="text-[10px] font-medium uppercase text-gray-400 md:hidden">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function OpportunityBadge({ label, tone }: { label: string; tone: "amber" | "sky" | "rose" | "violet" | "emerald" }) {
  const classes = {
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
    emerald: "bg-emerald-50 text-emerald-700",
  }[tone];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${classes}`}>{label}</span>;
}
