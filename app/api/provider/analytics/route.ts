import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";
import { classifyTier, TIER_THRESHOLDS } from "@/lib/analytics/triage";

/**
 * GET /api/provider/analytics
 *
 * Provider-facing analytics for the authenticated owner's own profile.
 * Single endpoint consumed by both the onboard teaser card and the persistent
 * dashboard (Phase 1 plan tasks 6+, 10+). Handles sparse data gracefully —
 * no negative deltas, no division-by-zero peer ratios, never a naked "0 views"
 * render state.
 *
 * Query params:
 *   window: "7d" | "30d" | "90d"  (default: "30d")
 *
 * Auth: must be authenticated and own the business_profile whose analytics
 * we return. No slug param — we infer from the authenticated session to
 * prevent cross-provider snooping. Admin-override can be added later if
 * support workflows need it.
 *
 * Returns: see plans/provider-analytics-phase-1-surfaces-plan.md task 1 for
 * the full response shape.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Resolve the authenticated user → account → business_profile
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "No account found" }, { status: 400 });
    }

    // `.limit(1)` + take-first rather than `.maybeSingle()` because a user
    // may have >1 business_profile (edge case but observed) and maybeSingle
    // throws in that case.
    const { data: profiles } = await supabase
      .from("business_profiles")
      .select("id, slug, source_provider_id, display_name, city, state, category")
      .eq("account_id", account.id)
      .in("type", ["organization", "caregiver"])
      .limit(1);

    const profile = profiles?.[0];
    if (!profile?.slug) {
      return NextResponse.json({ error: "No provider profile found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const windowParam = (searchParams.get("window") || "30d") as "7d" | "30d" | "90d";
    const windowDays = windowParam === "7d" ? 7 : windowParam === "90d" ? 90 : 30;

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const priorStart = new Date(now.getTime() - 2 * windowDays * 24 * 60 * 60 * 1000);

    // Identifier variants. provider_activity keys on URL slug per the Phase 0
    // canonicalization decision, but legacy providers / unclaimed fallbacks
    // may have used source_provider_id at some point. Query all variants and
    // union in JS.
    const providerIdVariants = [profile.slug, profile.id];
    if (profile.source_provider_id) providerIdVariants.push(profile.source_provider_id);

    const db = getServiceClient();

    const [eventsRes, lifetimeRes, cohortRes, reviewsRes, benchmarkRes] = await Promise.all([
      // All events for this provider in the prior+current window (we need both
      // halves for the delta computation; one query instead of two).
      db
        .from("provider_activity")
        .select("event_type, created_at, metadata")
        .in("provider_id", providerIdVariants)
        .gte("created_at", priorStart.toISOString())
        .order("created_at", { ascending: true })
        .limit(20000),

      // Lifetime anonymous page_view count for this provider.
      db
        .from("provider_activity")
        .select("id", { count: "exact", head: true })
        .in("provider_id", providerIdVariants)
        .eq("event_type", "page_view"),

      // Same (city, category) cohort demand — anonymous page_views +
      // search_clicks in the current window, across ALL providers in the
      // cohort. This is the "47 families searched" number.
      profile.city && profile.state && profile.category
        ? db
            .from("provider_page_view_stats")
            .select("provider_id, raw_view_count, unique_view_count")
            .eq("city", profile.city)
            .eq("state", profile.state)
            .eq("category", profile.category)
            .gte("date", windowStart.toISOString().slice(0, 10))
        : Promise.resolve({ data: [], error: null }),

      // Reviews state.
      db
        .from("reviews")
        .select("id, created_at")
        .in("provider_id", providerIdVariants)
        .eq("status", "published")
        .order("created_at", { ascending: false }),

      // Peer context benchmarks — most recent row per cohort.
      profile.city && profile.state && profile.category
        ? db
            .from("city_category_view_benchmarks")
            .select("avg_views, p50_views, p90_views, provider_count, date")
            .eq("city", profile.city)
            .eq("state", profile.state)
            .eq("category", profile.category)
            .order("date", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (eventsRes.error) {
      console.error("[provider/analytics] events query failed:", eventsRes.error);
      return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
    }

    const events = (eventsRes.data ?? []) as Array<{
      event_type: string;
      created_at: string;
      metadata: Record<string, unknown> | null;
    }>;

    // --- Filter anonymous page_view events by session_id presence ---
    const isAnonymousPageView = (e: (typeof events)[number]) =>
      e.event_type === "page_view" &&
      typeof e.metadata?.session_id === "string" &&
      (e.metadata.session_id as string).length > 0;

    // --- Views: this period, prior period, lifetime, trend ---
    const inCurrentWindow = (t: Date) => t >= windowStart && t <= now;
    const inPriorWindow = (t: Date) => t >= priorStart && t < windowStart;

    const pageViewTimestamps = events
      .filter(isAnonymousPageView)
      .map((e) => new Date(e.created_at));

    const viewsThisPeriod = pageViewTimestamps.filter(inCurrentWindow).length;
    const viewsPriorPeriod = pageViewTimestamps.filter(inPriorWindow).length;
    const deltaPct = computeDeltaPct(viewsThisPeriod, viewsPriorPeriod);

    const bucket: Bucket = resolveBucket(windowStart, now);
    const trend = buildSeries(
      pageViewTimestamps.filter(inCurrentWindow),
      windowStart,
      now,
      bucket,
    );

    const lifetimeViews = lifetimeRes.count ?? 0;

    // --- Funnel: each event type in the current window ---
    const funnelCounts: Record<string, number> = {
      page_view: 0,
      cta_clicks: 0,
      questions_received: 0,
      leads_received: 0,
      reviews_received: 0,
    };
    for (const e of events) {
      const t = new Date(e.created_at);
      if (!inCurrentWindow(t)) continue;
      if (isAnonymousPageView(e)) funnelCounts.page_view += 1;
      else if (e.event_type === "cta_click_public") funnelCounts.cta_clicks += 1;
      else if (e.event_type === "question_received") funnelCounts.questions_received += 1;
      else if (e.event_type === "lead_received") funnelCounts.leads_received += 1;
      else if (e.event_type === "review_received") funnelCounts.reviews_received += 1;
    }

    // --- Sources: bucket page_view referrers ---
    const sources: Record<string, number> = { direct: 0, search: 0, internal: 0, other: 0 };
    for (const e of events) {
      if (!isAnonymousPageView(e)) continue;
      if (!inCurrentWindow(new Date(e.created_at))) continue;
      const ref = typeof e.metadata?.referrer === "string" ? e.metadata.referrer : null;
      sources[classifySource(ref)] += 1;
    }

    // --- Pipeline opportunity (cohort demand) ---
    type CohortRow = { provider_id: string; raw_view_count: number; unique_view_count: number };
    const cohortRows = (cohortRes.data ?? []) as CohortRow[];
    const localDemandCount = cohortRows.reduce((acc, r) => acc + (r.unique_view_count || 0), 0);
    const reachedYourPageCount = cohortRows
      .filter((r) => providerIdVariants.includes(r.provider_id))
      .reduce((acc, r) => acc + (r.unique_view_count || 0), 0);

    // --- Peer context ---
    const benchmarkRow = (benchmarkRes as { data: { avg_views: number | null; p50_views: number | null; p90_views: number | null; provider_count: number; date: string } | null }).data;
    const peerContext = benchmarkRow && benchmarkRow.provider_count >= 5
      ? {
          cohort_description: describeCohort(profile.category, profile.city),
          cohort_size: benchmarkRow.provider_count,
          avg_views: Number(benchmarkRow.avg_views ?? 0),
          p50_views: benchmarkRow.p50_views ?? 0,
          p90_views: benchmarkRow.p90_views ?? 0,
          as_of_date: benchmarkRow.date,
        }
      : null; // cohort too small or no aggregation run yet

    // --- Reviews state ---
    const reviewRows = (reviewsRes.data ?? []) as Array<{ id: string; created_at: string }>;

    const tier = classifyTier(viewsThisPeriod);

    return NextResponse.json({
      provider_id: profile.slug,
      provider_name: profile.display_name,
      city: profile.city,
      state: profile.state,
      category: profile.category,
      window: windowParam,

      views: {
        this_period: viewsThisPeriod,
        prior_period: viewsPriorPeriod,
        delta_pct: deltaPct,
        lifetime: lifetimeViews,
        trend,
        bucket,
      },

      funnel: funnelCounts,
      sources,

      peer_context: peerContext,

      pipeline_opportunity: profile.city && profile.category
        ? {
            description: describePipelineOpportunity(profile.category, profile.city),
            local_demand_count: localDemandCount,
            reached_your_page_count: reachedYourPageCount,
          }
        : null,

      tier,
      tier_thresholds: TIER_THRESHOLDS,

      reviews_state: {
        count: reviewRows.length,
        has_reviews: reviewRows.length > 0,
        last_review_at: reviewRows[0]?.created_at ?? null,
      },
    });
  } catch (err) {
    console.error("[provider/analytics] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function computeDeltaPct(current: number, prior: number): number | null {
  // Null rather than 0 for "no baseline" so the UI can choose how to frame it.
  if (prior === 0 && current === 0) return null;
  if (prior === 0) return null;
  return Math.round(((current - prior) / prior) * 100);
}

function classifySource(referrer: string | null): "direct" | "search" | "internal" | "other" {
  if (!referrer || referrer === "") return "direct";
  if (referrer.startsWith("internal:")) return "internal";
  const host = referrer.toLowerCase();
  if (
    host.includes("google") ||
    host.includes("bing") ||
    host.includes("duckduckgo") ||
    host.includes("yahoo") ||
    host.includes("ecosia")
  ) {
    return "search";
  }
  return "other";
}

function describeCohort(category: string | null, city: string | null): string {
  const cat = humanizeCategory(category);
  if (!city) return `${cat}`;
  return `${cat} in ${city}`;
}

function describePipelineOpportunity(category: string | null, city: string | null): string {
  const cat = humanizeCategory(category);
  if (!city) return `Families searched for ${cat.toLowerCase()} in your area`;
  return `Families searched for ${cat.toLowerCase()} near ${city}`;
}

function humanizeCategory(category: string | null): string {
  if (!category) return "Care providers";
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
