import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import type { GrowthPageCategory } from "@/lib/growth/types";

type PerformanceRow = {
  page_path: string;
  page_category: GrowthPageCategory;
  organic_users: number | string;
  organic_sessions: number | string;
  search_clicks: number | string;
  search_impressions: number | string;
  search_ctr: number | string;
  search_position: number | string | null;
  category_organic_users: number | string;
  category_organic_sessions: number | string;
  category_search_clicks: number | string;
  category_search_impressions: number | string;
  weeks_present: number | string;
  first_week: string;
  last_week: string;
};

type TrendRow = {
  week_start: string;
  page_category: GrowthPageCategory;
  organic_users: number | string;
  search_clicks: number | string;
  search_impressions: number | string;
};

type AttributionPageRow = {
  page_path: string;
  page_category: GrowthPageCategory;
  tracked_organic_visits: number | string;
  cta_views: number | string;
  cta_engagements: number | string;
  lead_starts: number | string;
  unique_families: number | string;
  opportunities: number | string;
  direct_leads: number | string;
  assisted_leads: number | string;
  contact_intents: number | string;
};

type AttributionSummaryRow = Omit<AttributionPageRow,
  "page_path" | "page_category" | "cta_views" | "lead_starts"
> & { scope: "all" | GrowthPageCategory };

const EMPTY_ATTRIBUTION = {
  tracked_organic_visits: 0,
  cta_views: 0,
  cta_engagements: 0,
  lead_starts: 0,
  unique_families: 0,
  opportunities: 0,
  direct_leads: 0,
  assisted_leads: 0,
  contact_intents: 0,
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function inclusiveDays(from: string, to: string) {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000) + 1;
}

function numeric(value: number | string | null) {
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalize(row: PerformanceRow) {
  return {
    page_path: row.page_path,
    page_category: row.page_category,
    organic_users: numeric(row.organic_users) || 0,
    organic_sessions: numeric(row.organic_sessions) || 0,
    search_clicks: numeric(row.search_clicks) || 0,
    search_impressions: numeric(row.search_impressions) || 0,
    search_ctr: numeric(row.search_ctr) || 0,
    search_position: numeric(row.search_position),
    category_organic_users: numeric(row.category_organic_users) || 0,
    category_organic_sessions: numeric(row.category_organic_sessions) || 0,
    category_search_clicks: numeric(row.category_search_clicks) || 0,
    category_search_impressions: numeric(row.category_search_impressions) || 0,
    weeks_present: numeric(row.weeks_present) || 0,
    first_week: row.first_week,
    last_week: row.last_week,
  };
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!(await getAdminUser(user.id))) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const from = request.nextUrl.searchParams.get("from") || "";
  const to = request.nextUrl.searchParams.get("to") || "";
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to || inclusiveDays(from, to) > 2_000) {
    return NextResponse.json({ error: "Provide a valid reporting range of 2,000 days or fewer." }, { status: 400 });
  }

  const days = inclusiveDays(from, to);
  const priorTo = addDays(from, -1);
  const priorFrom = addDays(priorTo, -(days - 1));
  const db = getServiceClient();
  const [
    currentResult,
    priorResult,
    trendResult,
    priorTrendResult,
    earliestResult,
    attributionPagesResult,
    attributionSummaryResult,
    attributionStartResult,
  ] = await Promise.all([
    db.rpc("get_growth_page_performance", { p_from: from, p_to: to, p_limit: 60 }),
    db.rpc("get_growth_page_performance", { p_from: priorFrom, p_to: priorTo, p_limit: 60 }),
    db.rpc("get_growth_category_trend", { p_from: from, p_to: to }),
    db.rpc("get_growth_category_trend", { p_from: priorFrom, p_to: priorTo }),
    db.from("growth_page_metrics").select("week_start").order("week_start", { ascending: true }).limit(1).maybeSingle(),
    db.rpc("get_growth_attribution_pages", { p_from: from, p_to: to }),
    db.rpc("get_growth_attribution_summary", { p_from: from, p_to: to }),
    db.from("growth_attribution_events")
      .select("occurred_at")
      .eq("event_type", "page_landed")
      .eq("traffic_channel", "organic_search")
      .order("occurred_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  const error = currentResult.error || priorResult.error || trendResult.error || priorTrendResult.error || earliestResult.error;
  if (error) {
    console.error("[organic-growth/pages]", error);
    return NextResponse.json({ error: "Page intelligence is not connected yet. Apply migration 173." }, { status: 503 });
  }

  const current = ((currentResult.data || []) as PerformanceRow[]).map(normalize);
  const previous = ((priorResult.data || []) as PerformanceRow[]).map(normalize);
  const currentTrend = (trendResult.data || []) as TrendRow[];
  const priorTrend = (priorTrendResult.data || []) as TrendRow[];
  const currentWeeks = new Set(currentTrend.map((row) => row.week_start)).size;
  const priorWeeks = new Set(priorTrend.map((row) => row.week_start)).size;
  // Sparse historical backfills are useful baselines, but not valid equivalent-
  // period comparisons. Require matching weekly coverage before presenting
  // movement, Rising, Falling, or new-entrant signals.
  const hasPriorData = previous.length > 0 && currentWeeks > 0 && priorWeeks === currentWeeks;
  const previousByPage = new Map(previous.map((row) => [`${row.page_category}:${row.page_path}`, row]));
  const currentKeys = new Set(current.map((row) => `${row.page_category}:${row.page_path}`));
  const performanceKeys = new Set([
    ...currentKeys,
    ...previous.map((row) => `${row.page_category}:${row.page_path}`),
  ]);
  const attributionReady = !attributionPagesResult.error && !attributionSummaryResult.error && !attributionStartResult.error;
  const attributionPages = attributionReady
    ? (attributionPagesResult.data || []) as AttributionPageRow[]
    : [];
  const attributionByPage = new Map(attributionPages.map((row) => [row.page_path, {
    tracked_organic_visits: numeric(row.tracked_organic_visits) || 0,
    cta_views: numeric(row.cta_views) || 0,
    cta_engagements: numeric(row.cta_engagements) || 0,
    lead_starts: numeric(row.lead_starts) || 0,
    unique_families: numeric(row.unique_families) || 0,
    opportunities: numeric(row.opportunities) || 0,
    direct_leads: numeric(row.direct_leads) || 0,
    assisted_leads: numeric(row.assisted_leads) || 0,
    contact_intents: numeric(row.contact_intents) || 0,
  }]));
  const attributionSummary = new Map(
    (attributionReady ? (attributionSummaryResult.data || []) as AttributionSummaryRow[] : []).map((row) => [row.scope, {
      ...EMPTY_ATTRIBUTION,
      tracked_organic_visits: numeric(row.tracked_organic_visits) || 0,
      cta_engagements: numeric(row.cta_engagements) || 0,
      unique_families: numeric(row.unique_families) || 0,
      opportunities: numeric(row.opportunities) || 0,
      direct_leads: numeric(row.direct_leads) || 0,
      assisted_leads: numeric(row.assisted_leads) || 0,
      contact_intents: numeric(row.contact_intents) || 0,
    }]),
  );
  const categories = (["provider", "benefit", "editorial"] as GrowthPageCategory[]).map((category) => {
    const currentRow = current.find((row) => row.page_category === category);
    const previousRow = previous.find((row) => row.page_category === category);
    return {
      category,
      organic_users: currentRow?.category_organic_users || 0,
      organic_sessions: currentRow?.category_organic_sessions || 0,
      search_clicks: currentRow?.category_search_clicks || 0,
      search_impressions: currentRow?.category_search_impressions || 0,
      previous_organic_users: previousRow?.category_organic_users || 0,
      previous_search_clicks: previousRow?.category_search_clicks || 0,
      previous_search_impressions: previousRow?.category_search_impressions || 0,
      ...(attributionSummary.get(category) || EMPTY_ATTRIBUTION),
    };
  });

  return NextResponse.json({
    range: { from, to, prior_from: priorFrom, prior_to: priorTo },
    available_from: earliestResult.data?.week_start || null,
    has_prior_data: hasPriorData,
    coverage: { current_weeks: currentWeeks, prior_weeks: priorWeeks },
    attribution: {
      status: attributionReady ? "collecting" : "pending",
      available_from: attributionReady && attributionStartResult.data?.occurred_at
        ? attributionStartResult.data.occurred_at
        : null,
      summary: attributionSummary.get("all") || EMPTY_ATTRIBUTION,
    },
    categories,
    pages: [
      ...current.map((row) => {
        const prior = previousByPage.get(`${row.page_category}:${row.page_path}`);
        return {
          ...row,
          previous_organic_users: prior?.organic_users || 0,
          previous_search_clicks: prior?.search_clicks || 0,
          previous_search_impressions: prior?.search_impressions || 0,
          ...(attributionByPage.get(row.page_path) || EMPTY_ATTRIBUTION),
        };
      }),
      // Keep pages that disappeared from the current top sets so the Falling
      // view can reveal a real loss instead of silently dropping the page.
      ...previous
        .filter((row) => !currentKeys.has(`${row.page_category}:${row.page_path}`))
        .map((row) => ({
          ...row,
          organic_users: 0,
          organic_sessions: 0,
          search_clicks: 0,
          search_impressions: 0,
          search_ctr: 0,
          search_position: null,
          previous_organic_users: row.organic_users,
          previous_search_clicks: row.search_clicks,
          previous_search_impressions: row.search_impressions,
          ...(attributionByPage.get(row.page_path) || EMPTY_ATTRIBUTION),
        })),
      // A page can create a confirmed family while sitting outside the GA4 /
      // Search Console top sets. Outcome-producing pages must never disappear
      // merely because the traffic query is intentionally capped.
      ...attributionPages
        .filter((row) => !performanceKeys.has(`${row.page_category}:${row.page_path}`))
        .map((row) => ({
          page_path: row.page_path,
          page_category: row.page_category,
          organic_users: 0,
          organic_sessions: 0,
          search_clicks: 0,
          search_impressions: 0,
          search_ctr: 0,
          search_position: null,
          category_organic_users: 0,
          category_organic_sessions: 0,
          category_search_clicks: 0,
          category_search_impressions: 0,
          weeks_present: 0,
          first_week: from,
          last_week: to,
          previous_organic_users: 0,
          previous_search_clicks: 0,
          previous_search_impressions: 0,
          ...(attributionByPage.get(row.page_path) || EMPTY_ATTRIBUTION),
        })),
    ],
    trend: currentTrend.map((row) => ({
      week_start: row.week_start,
      page_category: row.page_category,
      organic_users: numeric(row.organic_users) || 0,
      search_clicks: numeric(row.search_clicks) || 0,
      search_impressions: numeric(row.search_impressions) || 0,
    })),
  });
}
