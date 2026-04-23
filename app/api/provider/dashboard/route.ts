import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";

/**
 * GET /api/provider/dashboard
 *
 * Unified dashboard endpoint for the Phase 2 provider home-base redesign.
 * Composes analytics + reviews + Q&A + recent activity into one response so
 * the new dashboard can render its new pillars (greeting, activity inbox,
 * cohort context, review invitations, traffic details) in a single fetch.
 *
 * Builds on the Phase 1 /api/provider/analytics endpoint (reuses the cohort
 * widening + views logic via internal helpers when practical) but returns a
 * richer shape. Kept separate so the onboard teaser card can continue to hit
 * /api/provider/analytics without bloating that payload.
 *
 * Auth: authenticated provider only. Returns the caller's own provider data.
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

    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!account) {
      return NextResponse.json({ error: "No account found" }, { status: 400 });
    }

    const { data: profiles } = await supabase
      .from("business_profiles")
      .select("id, slug, source_provider_id, display_name, email, city, state, category, metadata, created_at, updated_at")
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
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const priorStart = new Date(now.getTime() - 2 * windowDays * 24 * 60 * 60 * 1000);

    const providerIdVariants = [profile.slug, profile.id];
    if (profile.source_provider_id) providerIdVariants.push(profile.source_provider_id);

    const db = getServiceClient();

    // Parallel fetch everything we can resolve in one shot.
    const [
      eventsRes,
      oleraReviewsRes,
      googleReviewsRes,
      questionsRes,
      leadsRes,
      oleraGeoRes,
    ] = await Promise.all([
      // All provider_activity events in the prior+current window for delta
      // + activity feed. 20k limit should be ample for a single provider.
      db
        .from("provider_activity")
        .select("id, event_type, created_at, metadata")
        .in("provider_id", providerIdVariants)
        .gte("created_at", priorStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(20000),

      // Reviews from the Olera reviews table (published only).
      db
        .from("reviews")
        .select("id, rating, comment, reviewer_name, created_at, provider_reply, replied_at")
        .in("provider_id", providerIdVariants)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(100),

      // Google review summary — only exists for providers with
      // a source_provider_id linking to olera-providers.
      profile.source_provider_id
        ? db
            .from("olera-providers")
            .select("google_reviews_data, google_rating")
            .eq("provider_id", profile.source_provider_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      // All questions ever received for this provider. We need enough
      // history to compute response rate (90d window) and list recent
      // unanswered items.
      db
        .from("provider_questions")
        .select("id, question, answer, status, asker_name, created_at, answered_at")
        .in("provider_id", providerIdVariants)
        .order("created_at", { ascending: false })
        .limit(500),

      // Leads / connections received.
      db
        .from("connections")
        .select("id, type, status, message, metadata, created_at")
        .eq("to_profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100),

      // Provider's lat/lon for cohort widening (optional).
      profile.source_provider_id
        ? db
            .from("olera-providers")
            .select("lat, lon")
            .eq("provider_id", profile.source_provider_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (eventsRes.error) {
      console.error("[provider/dashboard] events query failed:", eventsRes.error);
      return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
    }

    const events = (eventsRes.data ?? []) as Array<{
      id: string;
      event_type: string;
      created_at: string;
      metadata: Record<string, unknown> | null;
    }>;

    // ── Anonymous page_view filter ──
    const isAnonymousPageView = (e: (typeof events)[number]) =>
      e.event_type === "page_view" &&
      typeof e.metadata?.session_id === "string" &&
      (e.metadata.session_id as string).length > 0;

    const inCurrentWindow = (t: Date) => t >= windowStart && t <= now;
    const inPriorWindow = (t: Date) => t >= priorStart && t < windowStart;

    // ── Views: this period vs prior period ──
    const pageViews = events.filter(isAnonymousPageView).map((e) => new Date(e.created_at));
    const viewsThisPeriod = pageViews.filter(inCurrentWindow).length;
    const viewsPriorPeriod = pageViews.filter(inPriorWindow).length;
    const deltaPct = computeDeltaPct(viewsThisPeriod, viewsPriorPeriod);

    // ── Lifetime views ──
    const { count: lifetimeViewsCount } = await db
      .from("provider_activity")
      .select("id", { count: "exact", head: true })
      .in("provider_id", providerIdVariants)
      .eq("event_type", "page_view");
    const lifetimeViews = lifetimeViewsCount ?? 0;

    // ── Questions: all time + 90d response rate ──
    const questions = (questionsRes.data ?? []) as Array<{
      id: string;
      question: string;
      answer: string | null;
      status: string;
      asker_name: string | null;
      created_at: string;
      answered_at: string | null;
    }>;
    const questionsInNinety = questions.filter(
      (q) => new Date(q.created_at) >= ninetyDaysAgo,
    );
    const answeredInNinety = questionsInNinety.filter((q) => !!q.answer?.trim()).length;
    const unansweredAll = questions.filter((q) => !q.answer?.trim() && q.status !== "archived" && q.status !== "rejected");

    // ── Reviews summary (combined Olera + Google) ──
    const oleraReviews = (oleraReviewsRes.data ?? []) as Array<{
      id: string;
      rating: number;
      comment: string | null;
      reviewer_name: string | null;
      created_at: string;
      provider_reply: string | null;
      replied_at: string | null;
    }>;

    interface GoogleReviewSummary {
      rating?: number | null;
      review_count?: number | null;
    }
    const googleData = (googleReviewsRes as { data: { google_reviews_data: GoogleReviewSummary | null; google_rating: number | null } | null }).data;
    const googleRating = googleData?.google_reviews_data?.rating ?? googleData?.google_rating ?? null;
    const googleCount = googleData?.google_reviews_data?.review_count ?? 0;

    const oleraCount = oleraReviews.length;
    const oleraAvgRating = oleraCount > 0
      ? oleraReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / oleraCount
      : null;

    // Weighted combined rating (by count). If either source is missing, use the other.
    const totalCount = oleraCount + googleCount;
    let combinedAvg: number | null = null;
    if (oleraAvgRating !== null && googleRating !== null && totalCount > 0) {
      combinedAvg = (oleraAvgRating * oleraCount + googleRating * googleCount) / totalCount;
    } else if (oleraAvgRating !== null) {
      combinedAvg = oleraAvgRating;
    } else if (googleRating !== null) {
      combinedAvg = googleRating;
    }

    const reviewsSummary = {
      count: totalCount,
      avgRating: combinedAvg !== null ? Math.round(combinedAvg * 10) / 10 : null,
      oleraCount,
      googleCount,
      googleRating,
    };

    const responseRateSummary = {
      totalQuestions: questionsInNinety.length,
      answeredCount: answeredInNinety,
      windowDays: 90,
    };

    // ── Recent activity feed (merged timeline of interesting events) ──
    // Blends anonymous page_views with question/lead/review events so the
    // provider sees a single "what's happening on my page" stream.
    type ActivityItem = {
      id: string;
      kind: "question" | "question_answered" | "lead" | "review" | "page_view";
      timestamp: string;
      title: string;
      detail?: string;
      actionHref?: string;
      actorName?: string;
    };

    const leads = (leadsRes.data ?? []) as Array<{
      id: string;
      type: string;
      status: string;
      message: unknown;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>;

    const activity: ActivityItem[] = [];

    // Questions (both directions — received + answered)
    for (const q of questions.slice(0, 20)) {
      activity.push({
        id: `q-${q.id}`,
        kind: q.answer?.trim() ? "question_answered" : "question",
        timestamp: q.created_at,
        title: q.answer?.trim()
          ? `You answered a question`
          : `${q.asker_name ?? "A family"} asked a question`,
        detail: q.question.length > 100 ? q.question.slice(0, 100).trimEnd() + "…" : q.question,
        actionHref: `/provider/qna`,
        actorName: q.asker_name ?? undefined,
      });
    }

    // Leads
    for (const lead of leads.slice(0, 10)) {
      activity.push({
        id: `l-${lead.id}`,
        kind: "lead",
        timestamp: lead.created_at,
        title: `New inquiry`,
        detail: typeof lead.message === "string" ? (lead.message.length > 100 ? lead.message.slice(0, 100) + "…" : lead.message) : undefined,
        actionHref: `/provider/connections`,
      });
    }

    // Reviews
    for (const r of oleraReviews.slice(0, 10)) {
      activity.push({
        id: `r-${r.id}`,
        kind: "review",
        timestamp: r.created_at,
        title: `${r.reviewer_name ?? "A family"} left a ${r.rating}★ review`,
        detail: r.comment ? (r.comment.length > 100 ? r.comment.slice(0, 100) + "…" : r.comment) : undefined,
        actionHref: `/provider/reviews`,
        actorName: r.reviewer_name ?? undefined,
      });
    }

    // Page views — include only if sparse enough that they're interesting.
    // At high volume, too noisy; cap contribution to last 10.
    const recentPageViews = events.filter(isAnonymousPageView).slice(0, 10);
    for (const ev of recentPageViews) {
      const meta = ev.metadata as Record<string, unknown> | null;
      const referrer = typeof meta?.referrer === "string" ? meta.referrer : "";
      activity.push({
        id: `v-${ev.id}`,
        kind: "page_view",
        timestamp: ev.created_at,
        title: "A family viewed your page",
        detail: describeReferrer(referrer),
      });
    }

    activity.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const recentActivity = activity.slice(0, 30);

    // ── Cohort widening (geographic radius) for pipeline opportunity ──
    const geoRow = (oleraGeoRes as { data: { lat: number | null; lon: number | null } | null }).data;
    const providerLat = typeof geoRow?.lat === "number" ? geoRow.lat : null;
    const providerLon = typeof geoRow?.lon === "number" ? geoRow.lon : null;

    const cohortTrace: CohortTrace = { steps: [] };
    const cohortDemand: CohortDemandResult = profile.state
      ? await findCohortDemand(db, {
          state: profile.state,
          category: profile.category,
          lat: providerLat,
          lon: providerLon,
          windowStart,
        }, cohortTrace)
      : { scope: null, demand: 0 };
    if (!profile.state) cohortTrace.steps.push({ step: "no-state-on-profile" });

    // ── Greeting signals ──
    // What's meaningful to show at the top? Prioritized:
    //   1. Unanswered questions (action needed — most valuable)
    //   2. Fresh unread leads
    //   3. New reviews since last visit
    //   4. View spike vs. prior period
    //   5. Generic traffic summary as fallback
    const greetingSignals = {
      unansweredQuestions: unansweredAll.length,
      fiveMostRecentUnanswered: unansweredAll.slice(0, 5).map((q) => ({
        id: q.id,
        question: q.question,
        askerName: q.asker_name,
        createdAt: q.created_at,
      })),
      viewsThisPeriod,
      viewsPriorPeriod,
      deltaPct,
      newLeadsThisPeriod: leads.filter((l) => new Date(l.created_at) >= windowStart).length,
    };

    return NextResponse.json({
      profile: {
        id: profile.id,
        slug: profile.slug,
        source_provider_id: profile.source_provider_id,
        display_name: profile.display_name,
        city: profile.city,
        state: profile.state,
        category: profile.category,
      },
      window: windowParam,
      greeting: greetingSignals,
      reviews: reviewsSummary,
      responseRate: responseRateSummary,
      recentActivity,
      views: {
        thisPeriod: viewsThisPeriod,
        priorPeriod: viewsPriorPeriod,
        deltaPct,
        lifetime: lifetimeViews,
      },
      cohort: cohortDemand,
      _debug: {
        profile: {
          state: profile.state,
          category: profile.category,
          source_provider_id: profile.source_provider_id,
        },
        geo: { lat: providerLat, lon: providerLon },
        categoryVariants: mapProfileCategoryToOleraVariants(profile.category),
        cohort: cohortTrace,
      },
    });
  } catch (err) {
    console.error("[provider/dashboard] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function computeDeltaPct(current: number, prior: number): number | null {
  if (prior === 0 && current === 0) return null;
  if (prior === 0) return null;
  return Math.round(((current - prior) / prior) * 100);
}

function describeReferrer(referrer: string): string {
  if (!referrer) return "direct visit";
  if (referrer.startsWith("internal:")) return "from within Olera";
  const host = referrer.toLowerCase();
  if (host.includes("google")) return "from Google search";
  if (host.includes("bing")) return "from Bing search";
  if (host.includes("yahoo")) return "from Yahoo search";
  if (host.includes("duckduckgo")) return "from DuckDuckGo";
  return `from ${referrer}`;
}

// ─── Cohort widening (ported from /api/provider/analytics Phase 1+) ───
// Same shape and logic: 30mi → 60mi → state-with-category, ≥5 providers
// threshold, Postgres bounding-box pre-filter + Haversine refinement in JS.
// Phase 2 TODO: extract this to a shared helper so /dashboard and /analytics
// don't duplicate (currently both inline it; not worth the abstraction until
// a third caller appears).

type CohortScope = "near" | "state";
const COHORT_MIN_PROVIDERS = 5;
const COHORT_LOOKUP_LIMIT = 1000;
const RADIUS_TIERS_MILES = [30, 60] as const;

interface CohortDemandResult {
  scope: CohortScope | null;
  demand: number;
  radiusMiles?: number;
}

interface CohortTrace {
  steps: Array<Record<string, unknown>>;
}

async function findCohortDemand(
  db: ReturnType<typeof getServiceClient>,
  options: {
    state: string;
    category: string | null;
    lat: number | null;
    lon: number | null;
    windowStart: Date;
  },
  trace?: CohortTrace,
): Promise<CohortDemandResult> {
  const { state, category, lat, lon, windowStart } = options;
  const categoryVariants = mapProfileCategoryToOleraVariants(category);

  if (categoryVariants.length === 0) {
    trace?.steps.push({ step: "no-category-variants", rawCategory: category });
  }

  if (lat !== null && lon !== null && categoryVariants.length > 0) {
    for (const radiusMiles of RADIUS_TIERS_MILES) {
      const slugs = await fetchCohortSlugsByRadius(db, {
        state,
        categoryVariants,
        lat,
        lon,
        radiusMiles,
      });
      trace?.steps.push({
        step: "radius",
        radiusMiles,
        slugCount: slugs.length,
        threshold: COHORT_MIN_PROVIDERS,
      });
      if (slugs.length >= COHORT_MIN_PROVIDERS) {
        const demand = await countCohortDemand(db, slugs, windowStart);
        trace?.steps.push({ step: "radius-hit", radiusMiles, demand });
        return { scope: "near", demand, radiusMiles };
      }
    }
  } else {
    trace?.steps.push({
      step: "skip-radius",
      reason: lat === null || lon === null ? "no-geo" : "no-category",
      lat,
      lon,
    });
  }

  if (categoryVariants.length > 0) {
    const slugs = await fetchCohortSlugsInState(db, { state, categoryVariants });
    trace?.steps.push({
      step: "state",
      state,
      slugCount: slugs.length,
      threshold: COHORT_MIN_PROVIDERS,
    });
    if (slugs.length >= COHORT_MIN_PROVIDERS) {
      const demand = await countCohortDemand(db, slugs, windowStart);
      trace?.steps.push({ step: "state-hit", demand });
      return { scope: "state", demand };
    }
  }

  trace?.steps.push({ step: "all-tiers-missed" });
  return { scope: null, demand: 0 };
}

function mapProfileCategoryToOleraVariants(category: string | null): string[] {
  if (!category) return [];
  const map: Record<string, string[]> = {
    assisted_living: ["Assisted Living"],
    memory_care: ["Memory Care"],
    nursing_home: ["Nursing Home"],
    independent_living: ["Independent Living"],
    home_care_agency: ["Home Care (Non-medical)", "Home Care"],
    home_health_agency: ["Home Health Care", "Home Health"],
  };
  return map[category] ?? [];
}

async function fetchCohortSlugsByRadius(
  db: ReturnType<typeof getServiceClient>,
  filter: {
    state: string;
    categoryVariants: string[];
    lat: number;
    lon: number;
    radiusMiles: number;
  },
): Promise<string[]> {
  const latDelta = filter.radiusMiles / 69;
  const lonDelta = filter.radiusMiles / (69 * Math.cos((filter.lat * Math.PI) / 180));

  const { data, error } = await db
    .from("olera-providers")
    .select("slug, lat, lon")
    .eq("state", filter.state)
    .in("provider_category", filter.categoryVariants)
    .not("slug", "is", null)
    .not("deleted", "is", true)
    .gte("lat", filter.lat - latDelta)
    .lte("lat", filter.lat + latDelta)
    .gte("lon", filter.lon - lonDelta)
    .lte("lon", filter.lon + lonDelta)
    .limit(COHORT_LOOKUP_LIMIT);

  if (error) return [];

  return (data ?? [])
    .filter((row: { slug: string | null; lat: number | null; lon: number | null }) => {
      if (!row.slug || row.lat === null || row.lon === null) return false;
      return haversineMiles(filter.lat, filter.lon, row.lat, row.lon) <= filter.radiusMiles;
    })
    .map((row: { slug: string | null }) => row.slug as string);
}

async function fetchCohortSlugsInState(
  db: ReturnType<typeof getServiceClient>,
  filter: { state: string; categoryVariants: string[] },
): Promise<string[]> {
  const { data, error } = await db
    .from("olera-providers")
    .select("slug")
    .eq("state", filter.state)
    .in("provider_category", filter.categoryVariants)
    .not("slug", "is", null)
    .not("deleted", "is", true)
    .limit(COHORT_LOOKUP_LIMIT);
  if (error) return [];
  return (data ?? [])
    .map((row: { slug: string | null }) => row.slug)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}

async function countCohortDemand(
  db: ReturnType<typeof getServiceClient>,
  providerSlugs: string[],
  windowStart: Date,
): Promise<number> {
  if (providerSlugs.length === 0) return 0;
  const { data, error } = await db
    .from("provider_activity")
    .select("metadata")
    .eq("event_type", "page_view")
    .gte("created_at", windowStart.toISOString())
    .in("provider_id", providerSlugs)
    .limit(50000);
  if (error) return 0;
  const sessions = new Set<string>();
  for (const row of (data ?? []) as Array<{ metadata: Record<string, unknown> | null }>) {
    const sid = row.metadata?.session_id;
    if (typeof sid === "string" && sid.length > 0) sessions.add(sid);
  }
  return sessions.size;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
