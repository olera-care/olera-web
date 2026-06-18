"use client";

import Link from "next/link";
import PlatformMarquee from "@/components/provider/PlatformMarquee";
import { trackProviderEvent } from "@/lib/analytics/track-provider-event";

/**
 * The Managed Ads pitch — shared between the boost page (above the gate/picker)
 * and the no-leads state of Find Families (the ~99.9% default), so there's one
 * source of truth for the value prop. Headline + platform marquee + the three
 * "you do nothing" pillars, with an optional CTA (Find Families passes one that
 * links to /provider/boost; the boost page omits it because the picker follows).
 */

/** The three reasons this is different from every DIY/agency alternative. */
function ValuePillars() {
  const pillars = [
    {
      title: "Targeted where families look",
      body: "Search, social, and local neighborhood feeds — wherever families are searching for care.",
    },
    {
      title: "Powered by your market",
      body: "We aim the spend at the high-private-pay ZIPs and local demand we already map for you.",
    },
    {
      title: "You do nothing",
      body: "No ad account, no keywords, no agency. We already have your page — we run all of it.",
    },
  ];
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-3">
      {pillars.map((p) => (
        <div key={p.title}>
          <h3 className="text-[15px] font-semibold text-gray-900">{p.title}</h3>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">{p.body}</p>
        </div>
      ))}
    </div>
  );
}

export default function ManagedAdsPitch({
  ctaHref,
  ctaLabel = "Get my launch plan",
  providerSlug,
  providerName,
}: {
  ctaHref?: string;
  ctaLabel?: string;
  /** When set (Find Families no-leads), the CTA click is tracked as a managed-ads CTA. */
  providerSlug?: string;
  providerName?: string;
}) {
  const trackCta = () => {
    if (providerSlug) {
      trackProviderEvent(providerSlug, "managed_ads_cta_clicked", {
        provider_name: providerName,
        source: "ff_pitch",
      });
    }
  };

  return (
    <div>
      <header className="max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50/60 border border-primary-100/60 mb-6">
          <span className="text-sm font-semibold text-primary-700">Managed Ads</span>
        </div>
        <h1 className="text-[clamp(2rem,4.5vw,2.75rem)] font-display font-bold text-gray-900 leading-[1.1] tracking-tight">
          See what we&apos;d run<br />
          <span className="text-primary-600 italic">for your local market</span>.
        </h1>
        <p className="text-lg text-gray-500 mt-5 leading-relaxed">
          We turn local demand into a simple launch plan: where we&apos;d advertise,
          what budget makes sense, and how families get sent to your Olera page.
        </p>
      </header>

      <PlatformMarquee />
      <ValuePillars />

      {ctaHref && (
        <Link
          href={ctaHref}
          onClick={trackCta}
          className="inline-flex items-center gap-2.5 mt-10 px-9 py-3.5 bg-gray-900 hover:bg-gray-800 text-white text-[16px] font-semibold rounded-full active:scale-[0.98] transition-all duration-200"
        >
          {ctaLabel}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}
