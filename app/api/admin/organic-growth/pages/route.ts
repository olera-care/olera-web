import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import { classifyOrganicPage, normalizeOrganicPagePath } from "@/lib/analytics/content-pages";
import type { GrowthPageCategory } from "@/lib/growth/types";
import { resolveCanonicalProviderKeys, resolveSlugsForRawIds } from "@/lib/provider-id-variants";

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

type ProviderInquiryRow = {
  id: string;
  to_profile_id: string;
  metadata: Record<string, unknown> | null;
};

type BenefitsLeadRow = {
  id: string;
  metadata: Record<string, unknown> | null;
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

type ServiceClient = ReturnType<typeof getServiceClient>;

async function getProviderInquiries(db: ServiceClient, from: string, toExclusive: string) {
  const rows: ProviderInquiryRow[] = [];
  for (let offset = 0; ; offset += 1_000) {
    const result = await db
      .from("connections")
      .select("id, to_profile_id, metadata")
      .eq("type", "inquiry")
      .gte("created_at", `${from}T00:00:00Z`)
      .lt("created_at", `${toExclusive}T00:00:00Z`)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + 999);
    if (result.error) return { rows: [], error: result.error };
    const batch = (result.data || []) as ProviderInquiryRow[];
    rows.push(...batch);
    if (batch.length < 1_000) return { rows, error: null };
  }
}

async function getBenefitsLeads(db: ServiceClient, from: string, toExclusive: string) {
  const rows: BenefitsLeadRow[] = [];
  for (let offset = 0; ; offset += 1_000) {
    const result = await db
      .from("seeker_activity")
      .select("id, metadata")
      .eq("event_type", "benefits_completed")
      .gte("created_at", `${from}T00:00:00Z`)
      .lt("created_at", `${toExclusive}T00:00:00Z`)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + 999);
    if (result.error) return { rows: [], error: result.error };
    const batch = (result.data || []) as BenefitsLeadRow[];
    rows.push(...batch);
    if (batch.length < 1_000) return { rows, error: null };
  }
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
  const toExclusive = addDays(to, 1);
  const db = getServiceClient();
  const [
    currentResult,
    priorResult,
    trendResult,
    priorTrendResult,
    earliestResult,
    providerInquiriesResult,
    benefitsLeadsResult,
  ] = await Promise.all([
    db.rpc("get_growth_page_performance", { p_from: from, p_to: to, p_limit: 60 }),
    db.rpc("get_growth_page_performance", { p_from: priorFrom, p_to: priorTo, p_limit: 60 }),
    db.rpc("get_growth_category_trend", { p_from: from, p_to: to }),
    db.rpc("get_growth_category_trend", { p_from: priorFrom, p_to: priorTo }),
    db.from("growth_page_metrics").select("week_start").order("week_start", { ascending: true }).limit(1).maybeSingle(),
    getProviderInquiries(db, from, toExclusive),
    getBenefitsLeads(db, from, toExclusive),
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
  // This is intentionally a directional page-to-lead count, not session-level
  // acquisition attribution. Provider inquiries are sourced from the
  // authoritative connections table; benefits completions have carried
  // entry_source since June 2026.
  const leadDataAvailable = !providerInquiriesResult.error && !benefitsLeadsResult.error;
  if (!leadDataAvailable) {
    console.error("[organic-growth/pages] Lead counts unavailable", providerInquiriesResult.error || benefitsLeadsResult.error);
  }
  const providerIds = providerInquiriesResult.rows.map((row) => row.to_profile_id);
  const [providerKeys, providerSlugFallbacks] = await Promise.all([
    resolveCanonicalProviderKeys(db, providerIds),
    resolveSlugsForRawIds(db, providerIds),
  ]);
  const leadsByPage = new Map<string, Set<string>>();
  const addLead = (rawPath: string, leadId: string) => {
    const pagePath = normalizeOrganicPagePath(rawPath);
    if (!pagePath || !classifyOrganicPage(pagePath)) return;
    const ids = leadsByPage.get(pagePath) || new Set<string>();
    ids.add(leadId);
    leadsByPage.set(pagePath, ids);
  };
  for (const row of providerInquiriesResult.rows) {
    // Recommendation inquiries originate elsewhere in the product, so do not
    // present them as leads derived from the provider page.
    if (row.metadata?.source === "matches_recommendation" || row.metadata?.source === "one_tap_intro") continue;
    const slug = providerKeys.get(row.to_profile_id) || providerSlugFallbacks.get(row.to_profile_id) || row.to_profile_id;
    addLead(`/provider/${slug}`, `provider:${row.id}`);
  }
  for (const row of benefitsLeadsResult.rows) {
    const entrySource = typeof row.metadata?.entry_source === "string" ? row.metadata.entry_source : null;
    const providerSlug = typeof row.metadata?.provider_slug === "string" ? row.metadata.provider_slug : null;
    const sourcePage = entrySource || (providerSlug ? `/provider/${providerSlug}` : null);
    if (sourcePage) addLead(sourcePage, `benefits:${row.id}`);
  }
  const leadCount = (pagePath: string) => leadDataAvailable ? (leadsByPage.get(pagePath)?.size || 0) : null;
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
    has_prior_data: hasPriorData,
    coverage: { current_weeks: currentWeeks, prior_weeks: priorWeeks },
    lead_data_available: leadDataAvailable,
    categories,
    pages: [
      ...current.map((row) => {
        const prior = previousByPage.get(`${row.page_category}:${row.page_path}`);
        return {
          ...row,
          previous_organic_users: prior?.organic_users || 0,
          previous_search_clicks: prior?.search_clicks || 0,
          previous_search_impressions: prior?.search_impressions || 0,
          leads: leadCount(row.page_path),
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
          leads: leadCount(row.page_path),
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
