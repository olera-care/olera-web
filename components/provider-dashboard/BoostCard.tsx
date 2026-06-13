"use client";

import Link from "next/link";
import { AD_BOOST_THRESHOLD } from "@/lib/ad-boost/eligibility";

/**
 * Dashboard entry point to Managed Ads (/provider/boost). Tied to profile
 * completeness — the same gate the Boost page enforces — so the invite reads
 * honestly: ready profiles get "we'll bring families to you," thin profiles get
 * "finish your profile to unlock it." Either way the link lands on /provider/boost,
 * which shows the matching state. One warm surface, no nested boxes.
 */
export default function BoostCard({ completeness }: { completeness: number }) {
  const ready = completeness >= AD_BOOST_THRESHOLD;

  return (
    <Link
      href="/provider/boost"
      className="group block rounded-2xl border border-primary-100/70 bg-primary-50/40 p-5 sm:p-6 transition-colors hover:bg-primary-50/70"
      style={{ animation: "card-enter 0.25s ease-out both", animationDelay: "90ms" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
            Managed Ads
          </p>
          <h3 className="mt-1.5 text-[17px] font-semibold text-gray-900 leading-snug">
            {ready
              ? "Your profile's ready — let us bring families to you."
              : "Want more families? We'll run the ads for you."}
          </h3>
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
            {ready
              ? "Pick a week and we'll launch paid Google & Meta ads that send local families straight to your page."
              : `Finish your profile to ${AD_BOOST_THRESHOLD}% and you can have us run paid ads that bring families right to you.`}
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
