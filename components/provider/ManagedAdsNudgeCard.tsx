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
 * Why it looks the way it does. Reference is Perena's in-app programme card:
 * a mark on the left doing the visual work, a short title, three lines of body,
 * one restrained action. The first build was sixty words of prose in a flat
 * tinted rectangle, which reads as a banner ad and lost against the page's own
 * language (white cards, serif headings, hairlines). This one borrows that
 * language: same radius and padding as a section card, a hairline rather than a
 * fill, and the accent carried by one small mark and one teal button rather
 * than by a wash across the whole block.
 *
 * What it deliberately does NOT do: name ad platforms. A provider who has just
 * answered a family's question is not in the market for a channel strategy, and
 * a list of logos here reads as an interruption to sell. The channels live on
 * /provider/boost, which is where the action lands.
 */

export type ManagedAdsNudgeSource = "post_edit" | "post_question" | "leads_page";

/** The mark. Deliberately abstract and Olera's own — never anything that could
 *  read as a federal seal, which would be both false and a different kind of
 *  problem than a long paragraph. */
function NudgeMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 ring-1 ring-inset ring-primary-100"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary-600" fill="none">
        <path
          d="M12 3.5c.9 3.2 1.9 4.3 5.1 5.2-3.2.9-4.2 2-5.1 5.2-.9-3.2-1.9-4.3-5.1-5.2 3.2-.9 4.2-2 5.1-5.2Z"
          fill="currentColor"
        />
        <path
          d="M17.6 14.4c.45 1.6.95 2.15 2.55 2.6-1.6.45-2.1 1-2.55 2.6-.45-1.6-.95-2.15-2.55-2.6 1.6-.45 2.1-1 2.55-2.6Z"
          fill="currentColor"
          opacity="0.55"
        />
      </svg>
    </span>
  );
}

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
   *  false, and it lands on exactly the people the team is re-approaching.
   *  `null` means still resolving, and the card holds until it does rather than
   *  popping an extra line in a beat later. */
  hasEverRequested?: boolean | null;
  providerSlug: string;
  providerName?: string;
  onDismiss: () => void;
}) {
  const assignedVariant = useManagedAdsVariant(providerSlug);
  const firedView = useRef(false);
  const resolved = hasEverRequested !== null && hasEverRequested !== undefined;

  useEffect(() => {
    if (!resolved) return; // don't count an impression for a card not yet shown
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
  }, [assignedVariant, providerName, providerSlug, source, resolved]);

  // Hold until the campaign-history lookup lands, so the card enters once, whole.
  if (!resolved) return null;

  const neverHadOne = hasEverRequested === false;

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"
      style={{ animation: "card-enter 0.25s ease-out both" }}
    >
      <div className="flex gap-4">
        <NudgeMark />

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-gray-900">{opener}</p>
          <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-gray-500">
            Olera is funded by the National Institute on Aging. No investors, no resold
            families, no middleman taking a cut.
            {neverHadOne ? " Your first campaign is on us: $50 of ads, free." : ""}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
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
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-transform hover:gap-2 active:scale-[0.98]"
            >
              {neverHadOne ? "See my free campaign" : "See what we'd run"}
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>

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
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
