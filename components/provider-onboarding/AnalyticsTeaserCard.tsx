"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { marketGateEnabled } from "@/lib/market-gate";

/**
 * Teaser card on the onboard page — the door to /provider.
 *
 * This card is the alpha-and-omega of the Phase 2 funnel: most of the value
 * we built lives behind the CTA here. Copy optimized 2026-04-23 for long-tail
 * honesty (most providers have a few views, not 47) with loss framing where
 * the data earns it.
 *
 * Three render cases, driven by what the API returned:
 *   1. Cohort present (pipeline_opportunity with local_demand_count ≥ 1)
 *      → "N families searched for {category} near {city}. R reached your page."
 *   2. No cohort, ≥1 view this period
 *      → "V families visited your page this month. One asked the question..."
 *   3. No cohort, 0 views (rare — activity may not be logged yet, or question
 *      came from a non-page entry point)
 *      → "You just got a real question. It won't be the last."
 *
 * Instrumented: one impression event per mount, one click event on CTA.
 * Lets us compute CTR per case before we iterate further.
 */

type TeaserCase = "has_cohort" | "views_only" | "zero_views";

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
  funnel: Record<string, number>;
  sources: Record<string, number>;
  peer_context: unknown;
  pipeline_opportunity: {
    scope: "near" | "state";
    radius_miles?: number | null;
    description: string;
    local_demand_count: number;
    reached_your_page_count: number;
  } | null;
  tier: "low" | "medium" | "high";
  tier_thresholds: { low_max: number; medium_max: number };
  reviews_state: { count: number; has_reviews: boolean; last_review_at: string | null };
}

interface AnalyticsTeaserCardProps {
  expectedSlug: string;
  variant?: "card" | "inline"; // card = own white card; inline = slot inside parent card
}

export default function AnalyticsTeaserCard({ expectedSlug, variant = "card" }: AnalyticsTeaserCardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  // Fire the fetch on mount using the session cookie — don't gate on
  // client-side AuthProvider state. AuthProvider has its own retry storm
  // (5s timeout × multiple retries ≈ 10-15s) that has nothing to do with
  // whether the session cookie is already set and the API will work.
  //
  // On transient 401: stay in loading state so the effect re-run (triggered
  // when userId / authLoading finally flips) gets a chance to retry with a
  // warm cookie. Only mark terminally errored once auth has resolved and
  // the user is either not signed in or has no session.
  useEffect(() => {
    let cancelled = false;
    setErrored(false);

    fetch("/api/provider/analytics?window=30d", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json: AnalyticsResponse) => {
        if (cancelled) return;
        if (json.provider_id !== expectedSlug) {
          setErrored(true);
          setLoading(false);
          return;
        }
        setData(json);
        setLoading(false);
      })
      .catch((status) => {
        if (cancelled) return;
        // 401 while auth is still resolving: keep the skeleton visible; the
        // next effect re-run (userId flip) will retry.
        if (status === 401 && authLoading) return;
        setErrored(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [expectedSlug, userId, authLoading]);

  if (errored || (!loading && !data)) return null;

  const wrap = (content: React.ReactNode) =>
    variant === "card" ? (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-3">{content}</div>
    ) : (
      <div className="border-t border-gray-100 mt-4 pt-4">{content}</div>
    );

  if (loading || !data) {
    return wrap(
      <div className="animate-pulse">
        <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
        <div className="h-7 w-64 bg-gray-100 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-100 rounded" />
      </div>,
    );
  }

  return wrap(<TeaserBody data={data} />);
}

function TeaserBody({ data }: { data: AnalyticsResponse }) {
  const firedImpression = useRef(false);
  const copy = resolveCopy(data);

  // Gated dogfood: funnel the high-engagement post-Q&A moment straight into
  // "Growth" (the diagnostic) instead of the generic dashboard.
  const toMarket = marketGateEnabled({ displayName: data.provider_name });
  const ctaHref = toMarket ? "/provider/growth" : "/provider";
  const ctaLabel = toMarket ? "See your market" : copy.cta;

  // Fire one impression event per mount, once we've rendered real content.
  // Guarded by a ref so Strict Mode / re-renders don't double-count.
  useEffect(() => {
    if (firedImpression.current) return;
    firedImpression.current = true;
    trackEvent("analytics_teaser_impression", data, copy.case);
  }, [data, copy.case]);

  const handleCtaClick = () => {
    trackEvent("analytics_teaser_cta_clicked", data, copy.case);
    // Don't preventDefault — let the anchor navigate. keepalive on the POST
    // means the request survives the navigation.
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
        <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">This month</p>
      </div>

      <p className="text-[22px] leading-snug font-display font-semibold text-gray-900 tracking-tight">
        {copy.headline}
      </p>

      <p className="mt-2 text-sm text-gray-500 leading-relaxed">{copy.subline}</p>

      <Link
        href={ctaHref}
        onClick={handleCtaClick}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 mt-4 group"
      >
        {ctaLabel}
        <svg
          className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}

interface ResolvedCopy {
  case: TeaserCase;
  headline: string;
  subline: string;
  cta: string;
}

function resolveCopy(data: AnalyticsResponse): ResolvedCopy {
  const { views, pipeline_opportunity, city, state, category } = data;
  const cohort = pipeline_opportunity && pipeline_opportunity.local_demand_count > 0 ? pipeline_opportunity : null;

  // Case 1 — has cohort data
  if (cohort) {
    const n = cohort.local_demand_count;
    const reached = cohort.reached_your_page_count;
    const families = n === 1 ? "family" : "families";
    const scopePhrase = pipelinePhrase(cohort.scope, { city, state, category });
    const headline = `${n.toLocaleString()} ${families} searched ${scopePhrase}.`;
    const subline =
      reached === 0
        ? "None have reached your page yet. Your page is how they decide."
        : `${reached.toLocaleString()} reached your page. Your page is how they decide.`;
    return {
      case: "has_cohort",
      headline,
      subline,
      cta: "See what they're looking for",
    };
  }

  // Case 2 — no cohort, ≥1 view.
  // Kept notification-type-agnostic: the onboard page renders the teaser for
  // question, lead, AND review notifications, and also in the post-answered
  // state — "one asked the question you're here to answer" was wrong for all
  // those cases except fresh-question-no-answer-yet.
  if (views.this_period >= 1) {
    const v = views.this_period;
    const families = v === 1 ? "family" : "families";
    const headline = `${v.toLocaleString()} ${families} visited your page this month.`;
    const subline =
      v === 1
        ? "They reached out. Your page is how they decide."
        : "One reached out. The rest are still deciding.";
    return {
      case: "views_only",
      headline,
      subline,
      cta: "See your visitors",
    };
  }

  // Case 3 — no cohort, 0 views (rare). Also notification-type-agnostic.
  return {
    case: "zero_views",
    headline: "Someone reached out. It won't be the last.",
    subline: "Your dashboard catches every visit, question, and review as it happens.",
    cta: "See what's coming",
  };
}

function pipelinePhrase(
  scope: "near" | "state",
  loc: { city: string | null; state: string | null; category: string | null },
): string {
  const cat = loc.category ? humanizeCategoryLabel(loc.category).toLowerCase() : "senior care";
  if (scope === "near") {
    return loc.city ? `for ${cat} near ${loc.city} this month` : `for ${cat} near you this month`;
  }
  const place = humanizeStateLabel(loc.state);
  return place ? `for ${cat} in ${place} this month` : `for ${cat} in your state this month`;
}

function humanizeCategoryLabel(category: string | null): string {
  if (!category) return "Care";
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

function humanizeStateLabel(state: string | null): string | null {
  if (!state) return null;
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
  return map[state.toUpperCase()] ?? state;
}

/**
 * Fire-and-forget event tracking. `keepalive: true` ensures the POST survives
 * CTA navigation; no await so render stays synchronous.
 */
function trackEvent(
  eventType: "analytics_teaser_impression" | "analytics_teaser_cta_clicked",
  data: AnalyticsResponse,
  teaserCase: TeaserCase,
) {
  try {
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({
        actor_type: "provider",
        provider_id: data.provider_id,
        event_type: eventType,
        metadata: {
          // provider_name is read server-side for Slack alert formatting.
          provider_name: data.provider_name,
          case: teaserCase,
          views_this_period: data.views.this_period,
          cohort_size: data.pipeline_opportunity?.local_demand_count ?? null,
          reached_count: data.pipeline_opportunity?.reached_your_page_count ?? null,
          cohort_scope: data.pipeline_opportunity?.scope ?? null,
          tier: data.tier,
        },
      }),
    }).catch(() => {
      /* fire-and-forget */
    });
  } catch {
    /* fire-and-forget */
  }
}
