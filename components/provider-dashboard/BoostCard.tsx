"use client";

import Link from "next/link";
import { AD_BOOST_THRESHOLD } from "@/lib/ad-boost/eligibility";
import { trackProviderEvent } from "@/lib/analytics/track-provider-event";
import PlatformMarquee from "@/components/provider/PlatformMarquee";

/**
 * Dashboard entry point to Managed Ads (/provider/boost). The headline matches
 * the rest of the managed-ads pitch ("Reach families already searching for
 * care."); the one-line subhead is completeness-aware (the 70% gate lives on
 * the boost page, so the card just signals where they stand). A drifting strip
 * of the ad-platform logos gives the card presence — quiet motion, not text.
 *
 * Two layouts: the full `card` lives in the desktop sidebar under the
 * completeness scorecard; the `compact` variant rides inline in the mobile main
 * column (the sidebar is desktop-only, so mobile needs its own entry).
 */
export default function BoostCard({
  completeness,
  compact = false,
  providerSlug,
  providerName,
}: {
  completeness: number;
  compact?: boolean;
  providerSlug?: string;
  providerName?: string;
}) {
  const ready = completeness >= AD_BOOST_THRESHOLD;
  const subline = ready
    ? "You're ready — pick a week, we'll run the ads."
    : `Finish your profile to ${AD_BOOST_THRESHOLD}% to unlock.`;

  const trackClick = () => {
    if (providerSlug) {
      trackProviderEvent(providerSlug, "managed_ads_cta_clicked", {
        provider_name: providerName,
        source: "dashboard_card",
      });
    }
  };

  const arrow = (
    <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white transition-transform group-hover:translate-x-0.5">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
      </svg>
    </span>
  );

  if (compact) {
    return (
      <Link
        href="/provider/boost"
        onClick={trackClick}
        className="group block rounded-2xl border border-primary-100/70 bg-primary-50/40 px-4 py-3.5 transition-colors hover:bg-primary-50/70"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-600">
              Managed Ads
            </p>
            <h3 className="mt-0.5 text-[14px] font-semibold text-gray-900 leading-snug">
              Reach families already searching for care.
            </h3>
          </div>
          {arrow}
        </div>
        <PlatformMarquee compact />
      </Link>
    );
  }

  return (
    <Link
      href="/provider/boost"
      onClick={trackClick}
      className="group block rounded-2xl border border-primary-100/70 bg-primary-50/40 p-5 transition-colors hover:bg-primary-50/70"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
            Managed Ads
          </p>
          <h3 className="mt-1.5 text-[16px] font-semibold text-gray-900 leading-snug">
            Reach families already searching for care.
          </h3>
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{subline}</p>
        </div>
        {arrow}
      </div>
      <PlatformMarquee compact />
    </Link>
  );
}
