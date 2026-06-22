"use client";

import Link from "next/link";

interface AdsTabProps {
  city?: string;
  familiesInCity?: number | null;
}

export default function AdsTab({
  city,
  familiesInCity,
}: AdsTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8">
      {/* Label */}
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wider text-center mb-3">
        Your move this week
      </p>

      {/* Headline */}
      <h2 className="font-display text-2xl sm:text-[1.75rem] leading-tight text-stone-900 text-center mb-2">
        Put your page in front of local families.
      </h2>

      {/* Subtitle with demand context */}
      <p className="text-sm text-stone-500 text-center mb-6">
        {familiesInCity && familiesInCity > 0
          ? `${familiesInCity.toLocaleString()} ${familiesInCity === 1 ? "family is" : "families are"} actively searching in ${city || "your area"} today.`
          : `Families in ${city || "your area"} are searching for senior care before they ever reach your page.`}
      </p>

      {/* How it works card */}
      <div className="bg-stone-50 rounded-xl p-4 mb-6">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
          How managed ads work
        </p>
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#199087]/10 flex items-center justify-center shrink-0 text-xs font-medium text-[#199087]">
              1
            </span>
            <p className="text-sm text-stone-700">
              Pick your budget and launch week
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#199087]/10 flex items-center justify-center shrink-0 text-xs font-medium text-[#199087]">
              2
            </span>
            <p className="text-sm text-stone-700">
              We run Google + Meta ads, targeting families near you
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#199087]/10 flex items-center justify-center shrink-0 text-xs font-medium text-[#199087]">
              3
            </span>
            <p className="text-sm text-stone-700">
              Families land on your page — you see every visitor and lead
            </p>
          </div>
        </div>
      </div>

      {/* CTA button */}
      <Link
        href="/provider/boost"
        className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-medium py-3.5 rounded-xl transition-colors"
      >
        Build your launch plan
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Link>

      {/* Footer note */}
      <p className="mt-4 text-xs text-stone-400 text-center">
        No charge until you confirm. Your first $50 is on us.
      </p>
    </div>
  );
}
