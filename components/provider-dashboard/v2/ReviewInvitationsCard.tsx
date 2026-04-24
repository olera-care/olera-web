"use client";

import Link from "next/link";
import type { ProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";

/**
 * Pillar D — Review invitations (contextual, not sales-y).
 *
 * Shows what the provider has today (combined rating + count across Olera
 * and Google) plus one gentle contextual line and a single CTA into the
 * existing review request flow at /provider/reviews.
 *
 * Design rule: NEVER frame this as "generate more reviews to get more
 * business." 60-70yo facility operators have been burned by Caring.com /
 * APFM using that exact hook. Keep it honest: here's what families see
 * today, here's a simple way to invite another voice if you want to.
 */

interface Props {
  data: ProviderDashboardV2Data;
}

export default function ReviewInvitationsCard({ data }: Props) {
  const { reviews } = data;
  const { count, avgRating, oleraCount, googleCount, googleRating } = reviews;

  const hook = resolveHook({
    count,
    avgRating,
    oleraCount,
    googleCount,
    googleRating,
  });

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6">
      <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-3">
        Reviews on your page
      </p>

      {count > 0 ? (
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[28px] font-display font-semibold text-gray-900 leading-none">
            {avgRating?.toFixed(1) ?? "—"}
          </span>
          <span className="text-sm text-gray-500">
            {renderStarLine(avgRating)} · {count} {count === 1 ? "review" : "reviews"}
          </span>
        </div>
      ) : (
        <p className="text-[17px] font-display font-semibold text-gray-900 leading-snug mb-1">
          No reviews on your page yet.
        </p>
      )}

      {count > 0 && (oleraCount > 0 || googleCount > 0) && (
        <p className="text-xs text-gray-500 mb-3">
          {formatSourceBreakdown(oleraCount, googleCount, googleRating)}
        </p>
      )}

      <p className="text-sm text-gray-600 leading-relaxed mb-4 mt-3">
        {hook.subline}
      </p>

      <Link
        href="/provider/reviews"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 group"
      >
        {hook.ctaLabel}
        <svg
          className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
    </div>
  );
}

function resolveHook(r: {
  count: number;
  avgRating: number | null;
  oleraCount: number;
  googleCount: number;
  googleRating: number | null;
}): { subline: string; ctaLabel: string } {
  if (r.count === 0) {
    return {
      subline:
        "Families look at reviews to decide who to reach out to. One honest review from a past client goes a long way.",
      ctaLabel: "Invite a past client",
    };
  }
  if (r.oleraCount === 0 && r.googleCount > 0) {
    return {
      subline:
        "Your Google reviews are showing on your Olera page. Reviews left directly on Olera stand out because families know they're verified here.",
      ctaLabel: "Invite an Olera review",
    };
  }
  if (r.count < 5) {
    return {
      subline:
        "You have a foundation. A few more voices helps families feel confident reaching out without needing to ask.",
      ctaLabel: "Invite another review",
    };
  }
  return {
    subline:
      "Strong review count. Keep the cadence up — recent reviews carry more weight than old ones for most families.",
    ctaLabel: "Send a review request",
  };
}

function formatSourceBreakdown(
  oleraCount: number,
  googleCount: number,
  googleRating: number | null,
): string {
  const parts: string[] = [];
  if (oleraCount > 0) parts.push(`${oleraCount} on Olera`);
  if (googleCount > 0) {
    parts.push(
      googleRating !== null
        ? `${googleCount} on Google (${googleRating.toFixed(1)}★)`
        : `${googleCount} on Google`,
    );
  }
  return parts.join(" · ");
}

function renderStarLine(rating: number | null): string {
  if (rating === null) return "";
  const rounded = Math.round(rating);
  return "★".repeat(rounded) + "☆".repeat(Math.max(0, 5 - rounded));
}
