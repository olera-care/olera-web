"use client";

import Link from "next/link";
import type { ProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";

/**
 * Sidebar summary — Wispr-style typographic stat block.
 *
 * Replaces the old Traffic + Reviews bordered cards with a single borderless
 * column. Numbers do the work; quiet labels sit underneath. Sits directly on
 * the cream page background, no card shell — mirrors Wispr Flow's dashboard
 * sidebar ("12.2K total words / 121 wpm / 5 day streak"). The point is that
 * the surface ISN'T a surface — it's typography on the page.
 *
 * Lifetime views are demoted to a small meta line under the views number —
 * and hidden entirely when they exactly equal this period's views (the
 * "4 ... 4" duplication new providers were seeing). Once lifetime diverges
 * from this period (i.e., the provider has any history at all), the line
 * appears as quiet supporting context.
 */

interface Props {
  data: ProviderDashboardV2Data;
}

export default function SidebarSummary({ data }: Props) {
  const { views, reviews, window } = data;
  const periodLabel = windowPeriodLabel(window);
  const priorLabel = windowPriorLabel(window);

  return (
    <div className="space-y-5 lg:pl-2">
      <ViewsBlock
        thisPeriod={views.thisPeriod}
        priorPeriod={views.priorPeriod}
        deltaPct={views.deltaPct}
        lifetime={views.lifetime}
        periodLabel={periodLabel}
        priorLabel={priorLabel}
      />

      <ReviewsBlock
        count={reviews.count}
        avgRating={reviews.avgRating}
        oleraCount={reviews.oleraCount}
      />

      <div className="pt-4 border-t border-gray-200/70 space-y-2.5">
        <Link
          href="/portal/analytics"
          className="block text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          See full traffic report →
        </Link>
        <Link
          href="/provider/reviews"
          className="block text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          {reviews.count > 0 ? "Invite another review →" : "Invite a past client →"}
        </Link>
      </div>
    </div>
  );
}

function ViewsBlock({
  thisPeriod,
  priorPeriod,
  deltaPct,
  lifetime,
  periodLabel,
  priorLabel,
}: {
  thisPeriod: number;
  priorPeriod: number;
  deltaPct: number | null;
  lifetime: number;
  periodLabel: string;
  priorLabel: string;
}) {
  const showDelta = deltaPct !== null && priorPeriod > 0;
  const direction: "up" | "down" | "flat" =
    deltaPct === null || deltaPct === 0 ? "flat" : deltaPct > 0 ? "up" : "down";

  // Hide lifetime when it's identical to this period — Aggie's "4 ... 4"
  // duplication. Once the numbers diverge by any amount, surface lifetime
  // as a small meta line.
  const showLifetime = lifetime > thisPeriod;

  return (
    <div>
      <p className="font-display text-[36px] md:text-[40px] font-semibold text-gray-900 leading-none tabular-nums">
        {thisPeriod.toLocaleString()}
      </p>
      <p className="text-sm text-gray-500 mt-1.5">
        {thisPeriod === 1 ? "view" : "views"} {periodLabel}
        {showDelta && (
          <>
            <span className="mx-1.5 text-gray-300">·</span>
            <span
              className={
                direction === "up"
                  ? "text-emerald-700"
                  : direction === "down"
                    ? "text-gray-500"
                    : "text-gray-400"
              }
            >
              {direction === "flat"
                ? "flat"
                : `${direction === "up" ? "↑" : "↓"} ${Math.abs(deltaPct ?? 0)}% vs. ${priorLabel}`}
            </span>
          </>
        )}
      </p>
      {showLifetime && (
        <p className="text-xs text-gray-400 mt-1 tabular-nums">
          {lifetime.toLocaleString()} since joining
        </p>
      )}
    </div>
  );
}

function ReviewsBlock({
  count,
  avgRating,
  oleraCount,
}: {
  count: number;
  avgRating: number | null;
  oleraCount: number;
}) {
  if (count === 0 || avgRating === null) {
    return (
      <div>
        <p className="font-display text-[22px] font-semibold text-gray-900 leading-none">—</p>
        <p className="text-sm text-gray-500 mt-1.5">no reviews yet</p>
      </div>
    );
  }

  const rounded = Math.round(avgRating);
  const stars = "★".repeat(rounded) + "☆".repeat(Math.max(0, 5 - rounded));
  const noun = count === 1 ? "review" : "reviews";

  return (
    <div>
      <p className="font-display text-[22px] font-semibold text-gray-900 leading-none tabular-nums">
        {avgRating.toFixed(1)}
      </p>
      <p className="text-sm text-gray-500 mt-1.5">
        <span className="text-amber-500">{stars}</span>
        <span className="mx-1.5 text-gray-300">·</span>
        {count} {noun}
        {oleraCount > 0 && oleraCount < count && (
          <span className="text-gray-400"> ({oleraCount} on Olera)</span>
        )}
      </p>
    </div>
  );
}

function windowPeriodLabel(window: ProviderDashboardV2Data["window"]): string {
  if (window === "7d") return "this week";
  if (window === "90d") return "in 90 days";
  return "this month";
}

function windowPriorLabel(window: ProviderDashboardV2Data["window"]): string {
  if (window === "7d") return "last week";
  if (window === "90d") return "prior 90 days";
  return "last month";
}
