"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Provider-facing analytics teaser card shown on the onboard page.
 *
 * Replaces/augments the "Get more reviews" CTA with pipeline-opportunity
 * framing that's coherent with the moment (provider just saw "someone asked
 * a question about you" — natural continuation is "here's the rest of the
 * iceberg," not "go cold-message your customers").
 *
 * Phase 1B · plan task 6. Three render variants by traffic tier:
 *   - low     — pipeline-opportunity framing dominant (small personal numbers
 *               would undercut; lead with local demand instead)
 *   - medium  — personal count + context
 *   - high    — personal count + delta + top source
 *
 * Fails silently: if fetch errors, returns null. This is the right behavior
 * on a provider-owned page where the viewer might not actually be signed in
 * yet (auto-sign-in is still backgrounded) or isn't the owner.
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
  tier: Tier;
  tier_thresholds: { low_max: number; medium_max: number };
  reviews_state: { count: number; has_reviews: boolean; last_review_at: string | null };
}

interface AnalyticsTeaserCardProps {
  expectedSlug: string;
  variant?: "card" | "inline"; // card = own white card; inline = slot inside parent card
}

export default function AnalyticsTeaserCard({ expectedSlug, variant = "card" }: AnalyticsTeaserCardProps) {
  // Onboard-page auto-sign-in happens after first paint. Without waiting for
  // auth to resolve, the first fetch returns 401 and the card silently
  // hides forever (only deps was expectedSlug). Re-fetch when user.id
  // becomes available.
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    // Don't fetch until auth state has resolved — avoids the first-load
    // race where the call goes out before the session cookie is set.
    if (authLoading) return;
    if (!userId) {
      // Not signed in. Render nothing; reviews card carries.
      setLoading(false);
      setErrored(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrored(false);
    fetch("/api/provider/analytics?window=30d", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json: AnalyticsResponse) => {
        if (cancelled) return;
        // Only show the card if the signed-in provider's profile matches
        // the onboard page's slug. Prevents cross-provider drift (signed in
        // as owner of provider Y while visiting provider X's onboard page).
        if (json.provider_id !== expectedSlug) {
          setErrored(true);
          return;
        }
        setData(json);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expectedSlug, userId, authLoading]);

  // Silent failure: not signed in, not the owner, or fetch error.
  // The reviews card downstream still renders, so nothing is lost.
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
  const { tier, views, pipeline_opportunity, sources, city, state, category } = data;

  // Headline varies by tier — low leads with pipeline opportunity (kinder to
  // providers with thin personal numbers); medium/high lead with personal count.
  const headline = buildHeadline(tier, views, pipeline_opportunity, { city, state, category });
  const subline = buildSubline(tier, views, pipeline_opportunity, sources, { city, state, category });

  const sparkline = tier !== "low" && views.trend.length > 1
    ? <Sparkline trend={views.trend} />
    : null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"
          aria-hidden
        />
        <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">
          Your page, right now
        </p>
      </div>

      <p className="text-[22px] leading-snug font-display font-semibold text-gray-900 tracking-tight">
        {headline}
      </p>

      {subline && (
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">{subline}</p>
      )}

      {sparkline}

      <a
        href="/provider"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 mt-4 group"
      >
        See your dashboard
        <svg
          className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </a>
    </div>
  );
}

interface ProfileLoc {
  city: string | null;
  state: string | null;
  category: string | null;
}

function buildHeadline(
  tier: Tier,
  views: AnalyticsResponse["views"],
  pipeline: AnalyticsResponse["pipeline_opportunity"],
  loc: ProfileLoc,
): string {
  if (tier === "low") {
    // Sparse personal data — lead with market opportunity if we have it.
    if (pipeline && pipeline.local_demand_count > 0) {
      const n = pipeline.local_demand_count;
      const families = n === 1 ? "family" : "families";
      return `${n.toLocaleString()} ${families} searched ${pipelinePhrase(pipeline.scope, loc)} this month.`;
    }
    // No cohort data. Fall back: show personal count if any, else patient copy.
    if (views.this_period > 0) {
      const n = views.this_period;
      return `${n.toLocaleString()} ${n === 1 ? "family" : "families"} viewed your page this month.`;
    }
    return "Your traffic is just getting started.";
  }

  // medium + high — lead with personal count
  const n = views.this_period;
  const families = n === 1 ? "family" : "families";
  return `${n.toLocaleString()} ${families} viewed your page this month.`;
}

/**
 * Scope-aware "for X near/in Y" phrase used after "[N] families searched ...".
 *
 *   near + city  → "for assisted living near Austin"
 *   near (no city) → "for assisted living near you"
 *   state        → "for assisted living in Texas" (last-resort fallback)
 *   no scope     → "in your area" (defensive; shouldn't render)
 *
 * `near` is geographic-radius based (30 or 60 miles) — drive-time relevant
 * to actual care decisions, not administrative geography.
 */
function pipelinePhrase(scope: "near" | "state", loc: ProfileLoc): string {
  const cat = loc.category ? humanizeCategoryLabel(loc.category).toLowerCase() : "senior care";
  if (scope === "near") {
    return loc.city ? `for ${cat} near ${loc.city}` : `for ${cat} near you`;
  }
  if (scope === "state") {
    const place = humanizeStateLabel(loc.state);
    return place ? `for ${cat} in ${place}` : `for ${cat} in your state`;
  }
  return "in your area";
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

function buildSubline(
  tier: Tier,
  views: AnalyticsResponse["views"],
  pipeline: AnalyticsResponse["pipeline_opportunity"],
  sources: Record<string, number>,
  loc: ProfileLoc,
): string | null {
  if (tier === "low") {
    if (pipeline && pipeline.local_demand_count > 0) {
      const reached = pipeline.reached_your_page_count;
      if (reached === 0) {
        return "None have reached your page yet. This is the tip of the iceberg — we'll show you more as it grows.";
      }
      return `${reached.toLocaleString()} ${reached === 1 ? "has" : "have"} reached your page so far. This is the tip of the iceberg.`;
    }
    // No cohort data — don't make promises we can't back up.
    if (views.this_period > 0) {
      return "Early traffic. We'll show trends as they build.";
    }
    return "We'll surface families finding you as traffic builds.";
  }

  // medium / high — delta + context
  const parts: string[] = [];
  if (views.delta_pct !== null && Number.isFinite(views.delta_pct)) {
    if (views.delta_pct > 0) parts.push(`Up ${views.delta_pct}% vs. last month.`);
    else if (views.delta_pct < 0) parts.push(`Down ${Math.abs(views.delta_pct)}% vs. last month.`);
    else parts.push("Flat vs. last month.");
  }

  if (tier === "high") {
    const top = topSource(sources);
    if (top) parts.push(`Top source: ${top}.`);
  } else if (pipeline && pipeline.local_demand_count > views.this_period) {
    parts.push(
      `Out of ${pipeline.local_demand_count.toLocaleString()} families who searched ${pipelinePhrase(pipeline.scope, loc)}.`,
    );
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

function topSource(sources: Record<string, number>): string | null {
  const entries = Object.entries(sources).filter(([k]) => k !== "direct" && k !== "internal");
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const [name, count] = entries[0];
  if (count === 0) return null;
  const labels: Record<string, string> = { search: "Google search", other: "external sites" };
  return labels[name] ?? name;
}

/**
 * Tiny inline sparkline for medium/high tier.
 * No axes, no tooltips — just a visual cadence hint. The dashboard gets the
 * real chart.
 */
function Sparkline({ trend }: { trend: { date: string; count: number }[] }) {
  const width = 140;
  const height = 28;
  const max = Math.max(1, ...trend.map((p) => p.count));
  const n = trend.length;
  const points = trend.map((p, i) => {
    const x = n === 1 ? width / 2 : (i / (n - 1)) * width;
    const y = height - (p.count / max) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg
      width={width}
      height={height}
      className="mt-3"
      aria-hidden
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#047857"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
