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
 * Why it looks the way it does. Airbnb is the reference and it is strict about
 * this: their in-context card is an icon, "Have a question?", and one button.
 * Five words. They never explain what Airbnb is inside a nudge, because that
 * belongs on its own surface. Their trust signal is "Free cancellation" — two
 * words, accent colour, next to the price.
 *
 * So the grant story is one accent line, not a paragraph, and the headline is
 * what the provider GETS rather than who we are. The full version lives on
 * /provider/boost, which is where the button goes. Type is sized like a message
 * (19px headline, 15px body, near-black) rather than like fine print, and it
 * sits on plain ground with air around it, so it reads as something said to you
 * rather than a fourth box in a column of boxes.
 *
 * What it deliberately does NOT do: name ad platforms. A provider who has just
 * answered a family's question is not in the market for a channel strategy, and
 * a list of logos here reads as an interruption to sell. The channels live on
 * /provider/boost, which is where the action lands.
 */

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
  const rootRef = useRef<HTMLDivElement>(null);
  const scrolledIntoView = useRef(false);
  const resolved = hasEverRequested !== null && hasEverRequested !== undefined;

  // Being in the right place is not the same as being seen. The nudge renders
  // under the section that was just saved, and if that section happens to end
  // near the bottom of the viewport the whole thing lands below the fold — the
  // provider saves, nothing appears, and they scroll away. So when it mounts
  // off-screen, bring it into view. `block: "center"` rather than "nearest",
  // because nearest parks it flush against the bottom edge where it is still
  // easy to miss. When it is already comfortably visible this does nothing,
  // which is the common case on the Q&A and connections pages.
  useEffect(() => {
    if (!resolved || scrolledIntoView.current) return;
    const el = rootRef.current;
    if (!el || typeof window === "undefined") return;
    scrolledIntoView.current = true;

    // One frame of slack: on the dashboard the edit modal has just closed and
    // may still be releasing a body scroll lock. Measuring into that races it.
    const frame = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top >= 0 && rect.bottom <= window.innerHeight) return; // already seen
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [resolved]);

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
      ref={rootRef}
      className="px-1 scroll-mt-24"
      style={{ animation: "card-enter 0.25s ease-out both" }}
    >
      <h3 className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-gray-900">
        {opener}
      </h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-gray-700">
        {neverHadOne
          ? "First campaign on us. $50 of ads, free."
          : "We run the ads. You keep the families."}
      </p>

      <p className="mt-2 text-[13px] font-medium text-primary-700">
        Funded by the National Institute on Aging
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
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
          className="inline-flex items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-[15px] font-semibold text-white transition-transform active:scale-[0.98]"
        >
          {neverHadOne ? "Start my free campaign" : "See what we'd run"}
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
          className="text-[15px] font-medium text-gray-500 underline-offset-4 hover:underline"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
