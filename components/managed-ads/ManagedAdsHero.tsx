import Link from "next/link";
import StartCampaignLink from "@/components/managed-ads/StartCampaignLink";

/**
 * Hero for the public Managed Ads explainer.
 *
 * The claim is specificity, not scale. "We run ads" is what every agency in the
 * provider's inbox says; "we run senior care ads, and here is what that taught
 * us" is the thing only we can say. So the headline names the category and the
 * subhead names the compounding, and neither promises a result — the offer and
 * the honest-limits section carry that weight further down.
 */
export default function ManagedAdsHero({ hasResults }: { hasResults: boolean }) {
  return (
    <section className="bg-vanilla-100">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <span className="inline-flex items-center rounded-full border border-primary-200 bg-white px-3.5 py-1.5 text-text-sm font-semibold text-primary-700">
          Olera Managed Ads
        </span>

        <h1 className="mt-6 max-w-3xl font-serif text-display-md font-bold leading-tight text-gray-900 sm:text-display-lg lg:text-display-xl">
          We run senior care ads for a living.
        </h1>

        <p className="mt-5 max-w-2xl text-text-lg leading-relaxed text-gray-600">
          Not ads in general. Home care and senior living, in one local market at a time, across
          every provider we advertise for. Each campaign starts with what the last one paid to
          learn, which is the part you cannot buy from an agency running your ads alone.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <StartCampaignLink>Start your first campaign</StartCampaignLink>
          {/* #results only exists when the strip has numbers to show, so this
              is gated on the same condition rather than left as an anchor that
              silently goes nowhere. */}
          {hasResults && (
            <Link
              href="#results"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-gray-300 bg-white px-7 py-3 text-text-md font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              See our real numbers
            </Link>
          )}
        </div>

        <p className="mt-4 text-text-sm text-gray-500">
          Your first campaign is on us. No card, no contract, and nothing switches to a paid plan
          on its own.
        </p>

        {/* Deliberately NOT the shared PlatformMarquee. That strip shows
            Facebook, Instagram, YouTube and X, and we have never run a campaign
            on any of them — on a page whose closing section says so out loud,
            the logos would contradict the copy. Name what we actually run. */}
        <div className="mt-10 border-t border-primary-200 pt-6">
          <div className="text-text-xs font-semibold uppercase tracking-wider text-gray-500">
            Where we buy
          </div>
          <p className="mt-2 max-w-2xl text-text-md text-gray-700">
            <span className="font-semibold text-gray-900">Google Search</span> for families
            actively looking, and <span className="font-semibold text-gray-900">Nextdoor</span> for
            the neighborhood feed. Facebook and Instagram are next, and we will publish what they
            do when we have run them.
          </p>
        </div>
      </div>
    </section>
  );
}
