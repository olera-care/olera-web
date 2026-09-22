"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { trackProviderEvent } from "@/lib/analytics/track-provider-event";
import { useManagedAdsVariant, isManagedAdsPreviewMode } from "@/hooks/use-managed-ads-variant";

/**
 * The shared Managed Ads nudge — one card, one set of words, wherever we pitch
 * inside the product (after a profile edit, after answering a question).
 *
 * Why it says what it says. The measured problem with the strips this replaces
 * was not tone, it was that they never answered the question a provider
 * actually has: who is this company and what is the catch. 164 providers saw
 * the post-question strip, 9 clicked and only 2 dismissed it — they were not
 * refusing the offer, they were not registering that one had been made. So the
 * card leads with who Olera is, then why that makes us different from the lead
 * brokers who have been calling them for years, then the offer.
 *
 * What it deliberately does NOT do: name ad platforms. A provider who has just
 * answered a family's question is not in the market for a channel strategy, and
 * a list of logos here reads as an interruption to sell. The channels live on
 * /provider/boost, which is where the CTA lands.
 */

/** The grant-funded story, in the order a provider needs it. Plain strings
 *  rather than JSX so apostrophes need no escaping and the copy stays greppable. */
const STORY = [
  "Olera is a research company funded by the National Institute on Aging.",
  "We're not investor-backed, and we don't resell families to other agencies. We're trying to show that a good provider and a family looking for care can find each other without a middleman taking a cut.",
];

export type ManagedAdsNudgeSource = "post_edit" | "post_question" | "leads_page";

export default function ManagedAdsNudgeCard({
  source,
  opener,
  hasEverRequested,
  providerSlug,
  providerName,
  onDismiss,
}: {
  /** Analytics source + touchpoint. Unchanged from the strips this replaces, so
   *  the surface leaderboard keeps a continuous series across the rewrite. */
  source: ManagedAdsNudgeSource;
  /** The one context-specific line: what they just did. */
  opener: string;
  /** Whether this provider has EVER had a campaign, including ended ones. The
   *  free-intro line renders only when this is explicitly false. Telling a
   *  provider whose flight already ended that "the first campaign is on us" is
   *  false, and it lands on exactly the people the team is re-approaching. When
   *  the answer is unknown (still loading, or the lookup failed) the line is
   *  omitted rather than guessed. */
  hasEverRequested?: boolean | null;
  providerSlug: string;
  providerName?: string;
  onDismiss: () => void;
}) {
  const assignedVariant = useManagedAdsVariant(providerSlug);
  const firedView = useRef(false);

  useEffect(() => {
    if (!providerSlug || !assignedVariant || firedView.current || isManagedAdsPreviewMode()) return;
    firedView.current = true;
    trackProviderEvent(providerSlug, "managed_ads_pitch_viewed", {
      provider_name: providerName,
      source,
      managed_ads_variant: assignedVariant,
    });
    trackProviderEvent(providerSlug, "ads_touchpoint_viewed", {
      touchpoint: source,
      provider_name: providerName,
    });
  }, [assignedVariant, providerName, providerSlug, source]);

  return (
    <div
      className="mb-6 rounded-2xl border border-primary-100/70 bg-primary-50/50 px-5 py-5"
      style={{ animation: "card-enter 0.25s ease-out both" }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{opener}</p>
        <button
          type="button"
          onClick={() => {
            if (providerSlug) {
              trackProviderEvent(providerSlug, "ads_touchpoint_dismissed", {
                touchpoint: source,
                provider_name: providerName,
              });
            }
            onDismiss();
          }}
          aria-label="Dismiss"
          className="-mr-1.5 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white/60 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-2.5 max-w-[62ch] space-y-2.5">
        {STORY.map((line) => (
          <p key={line} className="text-sm leading-relaxed text-gray-600">
            {line}
          </p>
        ))}
      </div>

      {hasEverRequested === false && (
        <p className="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <span className="text-primary-600" aria-hidden="true">&#10038;</span>
          <span>
            So the first campaign is on us:{" "}
            <span className="font-medium text-primary-600">$50 of ads, free</span>
          </span>
        </p>
      )}

      <Link
        href="/provider/boost"
        onClick={() => {
          if (providerSlug) {
            trackProviderEvent(providerSlug, "managed_ads_cta_clicked", {
              provider_name: providerName,
              source,
              managed_ads_variant: assignedVariant ?? "direct_reach",
            });
            trackProviderEvent(providerSlug, "ads_touchpoint_clicked", {
              touchpoint: source,
              provider_name: providerName,
            });
          }
        }}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:gap-2.5 active:scale-[0.98]"
      >
        {hasEverRequested === false ? "Start my free campaign" : "See what we'd run for you"}
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}
