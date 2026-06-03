"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Scanning local competitors",
  "Mapping referral sources",
  "Pulling demand & income data",
  "Assembling your playbook",
];

/**
 * Purposeful loading state for "Your Market" — narrates the work being assembled
 * instead of showing blank skeleton blocks. Reframes the wait as intelligence being
 * generated. Doubles as the Phase-2 cache-miss ("building your report") experience.
 */
export default function MarketLoading({ city }: { city?: string }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDone((d) => (d < STEPS.length ? d + 1 : d)), 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center text-center py-20 sm:py-28 px-6">
      {/* Scanning pulse */}
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#199087]/20 animate-ping" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-[#199087]" />
      </span>

      <h2 className="font-display text-[1.6rem] leading-tight text-stone-900 mt-6">
        Building your {city || "local"} market…
      </h2>
      <p className="text-[13px] text-stone-500 mt-2 max-w-xs">
        Live data from Google, the U.S. Census, and Olera&apos;s demand funnel.
      </p>

      <div className="mt-8 space-y-2.5 text-left">
        {STEPS.map((s, i) => {
          const isDone = i < done;
          const isCurrent = i === done;
          return (
            <div
              key={s}
              className={`flex items-center gap-2.5 text-[13.5px] transition-colors duration-300 ${
                isDone || isCurrent ? "text-stone-700" : "text-stone-300"
              }`}
            >
              <span
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full transition-colors ${
                  isDone ? "bg-[#199087]" : "border border-stone-300"
                }`}
              >
                {isDone ? (
                  <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : isCurrent ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#199087] animate-pulse" />
                ) : null}
              </span>
              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}
