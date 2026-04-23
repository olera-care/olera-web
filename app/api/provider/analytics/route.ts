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

    // Resolve the authenticated user → account → business_profile.
    // `.maybeSingle()` so a missing account returns the friendly 400 below
    // instead of throwing into the generic 500 catch.
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

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

    const [eventsRes, lifetimeRes, reviewsRes, benchmarkRes] = await Promise.all([
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

      // Reviews state.
      db
        .from("reviews")
        .select("id, created_at")
        .in("provider_id", providerIdVariants)
        .eq("status", "published")
        .order("created_at", { ascending: false }),

      // Peer context benchmarks — most recent row per cohort. Stays bound
      // to the (city, state, category) grain because the cron only emits
      // at that grain. Multi-grain benchmarks deferred to Phase 2.
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

    // --- Pipeline opportunity (cohort demand, real-time + adaptive) ---
    // Geographic radius widening: 30mi → 60mi → state (same category).
    // Drive-time semantics, not administrative geography — senior care
    // decisions happen within visiting/dispatch radius. State tier is a
    // last-resort fallback that rarely fires; if the cohort is still
    // sparse there, we let `scope: null` propagate so the UI shows
    // patient copy instead of a misleading "X families in Texas" number.
    const providerGeo = await fetchProviderGeo(db, {
      sourceProviderId: profile.source_provider_id,
      slug: profile.slug,
    });
    const cohortDemand: CohortDemandResult = profile.state
      ? await findCohortDemand(db, {
          state: profile.state,
          category: profile.category,
          lat: providerGeo?.lat ?? null,
          lon: providerGeo?.lon ?? null,
          windowStart,
        })
      : { scope: null, demand: 0 };
    const localDemandCount = cohortDemand.demand;
    const reachedYourPageCount = viewsThisPeriod;

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

      pipeline_opportunity: cohortDemand.scope
        ? {
            scope: cohortDemand.scope,
            radius_miles: cohortDemand.radiusMiles ?? null,
            description: describePipelineOpportunity(cohortDemand.scope, profile.category, profile.city, profile.state),
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

type CohortScope = "near" | "state";

function describePipelineOpportunity(
  scope: CohortScope,
  category: string | null,
  city: string | null,
  state: string | null,
): string {
  const cat = category ? humanizeCategory(category).toLowerCase() : "senior care";
  if (scope === "near" && city) {
    return `Families searched for ${cat} near ${city}`;
  }
  if (scope === "state" && state) {
    return `Families searched for ${cat} in ${humanizeState(state)}`;
  }
  return "Families searched in your area";
}

function humanizeState(state: string): string {
  // Many providers store state as "TX"; expand to full name when we recognize it.
  // Fallback to the raw value (could already be full) if not found.
  const map: Record<string, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
    CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
    FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
    IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
    KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
    MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
    NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
    NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
    OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
    VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
    WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
  };
  const upper = state.toUpperCase();
  return map[upper] ?? state;
}

/**
 * Geographic-radius cohort widening for the pipeline-opportunity number.
 *
 * Senior care decisions happen at drive-time scale (visiting distance for
 * facilities, dispatch radius for home care) — NOT at administrative
 * geography (state). A 30mi-radius cohort is meaningful to a provider; a
 * "state of Texas" cohort is not (Texas is 15hrs end-to-end). This widening
 * mirrors how providers actually think about their market.
 *
 * Tiers (try in order, first one with COHORT_MIN_PROVIDERS members wins):
 *   1. 30mi radius, same category   → scope='near'
 *   2. 60mi radius, same category   → scope='near'
 *   3. Same state, same category    → scope='state' (last resort)
 *
 * If all three are sparse: returns scope=null. Card/dashboard fall back to
 * patient copy ("traffic is just getting started") rather than show a
 * misleading state-level number.
 *
 * State boundary preserved as a hard limit even for radius tiers — provider
 * licensing is state-level and providers think regionally within their
 * state. Cross-state edge cases (El Paso ↔ Las Cruces) deferred to Phase 2.
 *
 * Bounding-box pre-filter in Postgres + Haversine refinement in JS keeps
 * the query fast without PostGIS. At low Phase 1 volume this is cheap.
 */
const COHORT_MIN_PROVIDERS = 5;
const COHORT_LOOKUP_LIMIT = 1000;
const RADIUS_TIERS_MILES = [30, 60] as const;

interface CohortDemandResult {
  scope: CohortScope | null;
  demand: number;
  radiusMiles?: number;
}

interface ProviderGeo {
  lat: number;
  lon: number;
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
): Promise<CohortDemandResult> {
  const { state, category, lat, lon, windowStart } = options;

  // Geographic radius tiers — only available if we have provider lat/lon.
  if (lat !== null && lon !== null && category) {
    for (const radiusMiles of RADIUS_TIERS_MILES) {
      const slugs = await fetchCohortSlugsByRadius(db, {
        state,
        category,
        lat,
        lon,
        radiusMiles,
      });
      if (slugs.length >= COHORT_MIN_PROVIDERS) {
        const demand = await countCohortDemand(db, slugs, windowStart);
        return { scope: "near", demand, radiusMiles };
      }
    }
  }

  // Last-resort: state + category. Rare; usually means provider is in a
  // sparsely served state OR we don't have lat/lon for them.
  if (category) {
    const slugs = await fetchCohortSlugsInState(db, { state, category });
    if (slugs.length >= COHORT_MIN_PROVIDERS) {
      const demand = await countCohortDemand(db, slugs, windowStart);
      return { scope: "state", demand };
    }
  }

  // No tier reached threshold. UI falls to patient copy via scope=null.
  return { scope: null, demand: 0 };
}

/**
 * Look up provider's lat/lon. Tries source_provider_id link first
 * (most claimed providers), then slug match (orphans). Returns null
 * when no geo data is available — caller falls to state-only widening.
 */
async function fetchProviderGeo(
  db: ReturnType<typeof getServiceClient>,
  options: { sourceProviderId: string | null; slug: string | null },
): Promise<ProviderGeo | null> {
  const { sourceProviderId, slug } = options;

  if (sourceProviderId) {
    const { data } = await db
      .from("olera-providers")
      .select("lat, lon")
      .eq("provider_id", sourceProviderId)
      .maybeSingle();
    const row = data as { lat: number | null; lon: number | null } | null;
    if (row && typeof row.lat === "number" && typeof row.lon === "number") {
      return { lat: row.lat, lon: row.lon };
    }
  }

  if (slug) {
    const { data } = await db
      .from("olera-providers")
      .select("lat, lon")
      .eq("slug", slug)
      .maybeSingle();
    const row = data as { lat: number | null; lon: number | null } | null;
    if (row && typeof row.lat === "number" && typeof row.lon === "number") {
      return { lat: row.lat, lon: row.lon };
    }
  }

  return null;
}

async function fetchCohortSlugsByRadius(
  db: ReturnType<typeof getServiceClient>,
  filter: {
    state: string;
    category: string;
    lat: number;
    lon: number;
    radiusMiles: number;
  },
): Promise<string[]> {
  // Bounding-box pre-filter. 1° latitude ≈ 69mi. Longitude varies by
  // latitude (1° lon ≈ 69·cos(lat) miles). Box is conservative; we
  // refine to true radius via Haversine in JS below.
  const latDelta = filter.radiusMiles / 69;
  const lonDelta = filter.radiusMiles / (69 * Math.cos((filter.lat * Math.PI) / 180));

  const { data, error } = await db
    .from("olera-providers")
    .select("slug, lat, lon")
    .eq("state", filter.state)
    .eq("provider_category", filter.category)
    .not("slug", "is", null)
    .not("deleted", "is", true)
    .gte("lat", filter.lat - latDelta)
    .lte("lat", filter.lat + latDelta)
    .gte("lon", filter.lon - lonDelta)
    .lte("lon", filter.lon + lonDelta)
    .limit(COHORT_LOOKUP_LIMIT);

  if (error) {
    console.error("[provider/analytics] radius cohort lookup failed:", error);
    return [];
  }

  // Haversine refinement — bounding box has corners outside the true circle.
  return (data ?? [])
    .filter((row: { slug: string | null; lat: number | null; lon: number | null }) => {
      if (!row.slug || row.lat === null || row.lon === null) return false;
      const distance = haversineMiles(filter.lat, filter.lon, row.lat, row.lon);
      return distance <= filter.radiusMiles;
    })
    .map((row: { slug: string | null }) => row.slug as string);
}

async function fetchCohortSlugsInState(
  db: ReturnType<typeof getServiceClient>,
  filter: { state: string; category: string },
): Promise<string[]> {
  const { data, error } = await db
    .from("olera-providers")
    .select("slug")
    .eq("state", filter.state)
    .eq("provider_category", filter.category)
    .not("slug", "is", null)
    .not("deleted", "is", true)
    .limit(COHORT_LOOKUP_LIMIT);

  if (error) {
    console.error("[provider/analytics] state cohort lookup failed:", error);
    return [];
  }
  return (data ?? [])
    .map((row: { slug: string | null }) => row.slug)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function countCohortDemand(
  db: ReturnType<typeof getServiceClient>,
  providerSlugs: string[],
  windowStart: Date,
): Promise<number> {
  if (providerSlugs.length === 0) return 0;

  // Pull session_id from metadata for distinct-count in JS. The partial index
  // from migration 044 (provider_id, created_at, metadata->>'session_id'
  // WHERE event_type='page_view') keeps this efficient. At low Phase 1 volume
  // this is cheap; Phase 2 may move to a precomputed cohort_demand table.
  const { data, error } = await db
    .from("provider_activity")
    .select("metadata")
    .eq("event_type", "page_view")
    .gte("created_at", windowStart.toISOString())
    .in("provider_id", providerSlugs)
    .limit(50000);

  if (error) {
    console.error("[provider/analytics] cohort demand count failed:", error);
    return 0;
  }

  const sessions = new Set<string>();
  for (const row of (data ?? []) as Array<{ metadata: Record<string, unknown> | null }>) {
    const sid = row.metadata?.session_id;
    if (typeof sid === "string" && sid.length > 0) sessions.add(sid);
  }
  return sessions.size;
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
