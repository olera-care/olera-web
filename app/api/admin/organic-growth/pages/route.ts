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
  const [currentResult, priorResult, trendResult, earliestResult] = await Promise.all([
    db.rpc("get_growth_page_performance", { p_from: from, p_to: to, p_limit: 60 }),
    db.rpc("get_growth_page_performance", { p_from: priorFrom, p_to: priorTo, p_limit: 60 }),
    db.rpc("get_growth_category_trend", { p_from: from, p_to: to }),
    db.from("growth_page_metrics").select("week_start").order("week_start", { ascending: true }).limit(1).maybeSingle(),
  ]);
  const error = currentResult.error || priorResult.error || trendResult.error || earliestResult.error;
  if (error) {
    console.error("[organic-growth/pages]", error);
    return NextResponse.json({ error: "Page intelligence is not connected yet. Apply migration 173." }, { status: 503 });
  }

  const current = ((currentResult.data || []) as PerformanceRow[]).map(normalize);
  const previous = ((priorResult.data || []) as PerformanceRow[]).map(normalize);
  const previousByPage = new Map(previous.map((row) => [`${row.page_category}:${row.page_path}`, row]));
  const currentKeys = new Set(current.map((row) => `${row.page_category}:${row.page_path}`));
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
    };
  });

  return NextResponse.json({
    range: { from, to, prior_from: priorFrom, prior_to: priorTo },
    available_from: earliestResult.data?.week_start || null,
    has_prior_data: previous.length > 0,
    categories,
    pages: [
      ...current.map((row) => {
        const prior = previousByPage.get(`${row.page_category}:${row.page_path}`);
        return {
          ...row,
          previous_organic_users: prior?.organic_users || 0,
          previous_search_clicks: prior?.search_clicks || 0,
          previous_search_impressions: prior?.search_impressions || 0,
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
        })),
    ],
    trend: ((trendResult.data || []) as TrendRow[]).map((row) => ({
      week_start: row.week_start,
      page_category: row.page_category,
      organic_users: numeric(row.organic_users) || 0,
      search_clicks: numeric(row.search_clicks) || 0,
      search_impressions: numeric(row.search_impressions) || 0,
    })),
  });
}
