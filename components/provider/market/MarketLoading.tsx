"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STEPS = [
  "Scanning local competitors",
  "Mapping referral sources",
  "Pulling demand & income data",
  "Assembling your playbook",
];

/**
 * Purposeful loading state for "Your Market" — narrates the work being assembled
 * instead of showing blank skeleton blocks. Doubles as the Phase-2 cache-miss
 * ("building your report") experience for a cold city (~1–2 min compute).
 *
 * Sets the time expectation up front and hands the provider something useful to do
 * while they wait, so they're never stranded staring at a stalled loader. The last
 * step stays *working* (never auto-checks) because the real compute outlasts the
 * animation — we don't falsely signal "done".
 */
export default function MarketLoading({ city, longRunning = false }: { city?: string; longRunning?: boolean }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    // Check off the first three; leave the last one in progress until the parent
    // swaps in the real result. Never reach STEPS.length → no false "all done".
    const id = setInterval(() => setDone((d) => (d < STEPS.length - 1 ? d + 1 : d)), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 py-10 text-center">
      {/* Calm scanning pulse */}
      <span className="relative flex h-10 w-10 items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#199087]/15 animate-ping [animation-duration:2s]" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-[#199087]" />
      </span>

      <h2 className="mt-6 font-display text-[1.5rem] sm:text-[1.7rem] leading-tight text-stone-900">
        Building your {city || "local"} market…
      </h2>
      <p className="mt-2.5 max-w-sm text-[14px] leading-relaxed text-stone-500">
        We&apos;re pulling this one fresh from Google, the U.S. Census, and Olera&apos;s demand
        funnel — it takes a minute or two.
      </p>

      <div className="mt-7 space-y-2.5 text-left">
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

      {/* Don't make them wait — hand them a productive next step. */}
      <p className="mt-9 max-w-sm text-[13.5px] leading-relaxed text-stone-500">
        {longRunning ? "Still assembling — no need to wait here. " : "No need to wait here — "}
        <Link href="/provider" className="font-medium text-[#199087] underline-offset-2 hover:underline">
          polish your profile
        </Link>{" "}
        so families see your best, and your market will be ready when you come back.
      </p>
    </div>
  );
}
