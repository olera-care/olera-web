"use client";

import Link from "next/link";
import { trackProviderEvent } from "@/lib/analytics/track-provider-event";

/**
 * Managed Ads call-to-action → /provider/boost. Shared across the provider
 * surfaces that should pitch paid lead-gen: Find Families (both the un-gated
 * marketplace empty states and the gated market-diagnostic view). Find Families
 * is the empty shelf for ~99% of providers, so the ads pitch is the natural
 * answer here — "not enough families showing up on their own? we'll go get them."
 *
 * - `banner`: slim, always-on, sits near the top of a page.
 * - `empty`:  prominent block for empty states (the high-intent moment).
 */
export default function ManagedAdsCTA({
  variant,
  tone = "default",
  providerSlug,
  providerName,
}: {
  variant: "banner" | "empty";
  /** "more" reframes the banner for providers who already have a lead or two. */
  tone?: "default" | "more";
  providerSlug?: string;
  providerName?: string;
}) {
  const trackClick = () => {
    if (providerSlug) {
      trackProviderEvent(providerSlug, "managed_ads_cta_clicked", {
        provider_name: providerName,
        source: "ff_banner",
      });
    }
  };

  if (variant === "banner") {
    return (
      <Link
        href="/provider/boost"
        onClick={trackClick}
        className="group flex items-center justify-between gap-3 rounded-2xl border border-primary-100/70 bg-primary-50/40 px-4 py-3 transition-colors hover:bg-primary-50/70"
      >
        <p className="text-sm text-gray-700 leading-snug">
          <span className="font-semibold text-gray-900">
            {tone === "more" ? "Want even more families?" : "Want us to bring families to you?"}
          </span>{" "}
          Get a simple launch plan for the ads we&apos;d run in your market.
        </p>
        <span className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 transition-all group-hover:gap-2">
          See plan
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/provider/boost"
      onClick={trackClick}
      className="group mx-auto mb-8 block max-w-xl rounded-2xl border border-primary-100/70 bg-primary-50/50 p-5 text-left transition-colors hover:bg-primary-50/80"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
            Managed Ads
          </p>
          <h4 className="mt-1.5 text-[16px] font-semibold text-gray-900 leading-snug">
            See the launch plan we&apos;d run for your market.
          </h4>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            Pick timing and budget, then we&apos;ll review the plan with you before anything goes live.
          </p>
        </div>
        <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white transition-transform group-hover:translate-x-0.5">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
