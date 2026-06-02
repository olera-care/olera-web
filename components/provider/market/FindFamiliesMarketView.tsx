"use client";

import { useEffect, useState } from "react";
import MarketDiagnostic, { type MarketDiagnosticData } from "./MarketDiagnostic";

/**
 * Find Families — "Your Market" default experience.
 *
 * For ~99.9% of providers (75k providers, ~100 live leads) there are no local families
 * actively searching, so the market diagnostic IS the page. When local leads DO exist
 * (the edge case), a compact urgency strip pins on top and links to the full leads view.
 */
export default function FindFamiliesMarketView({
  city, state, category, localLeadCount = 0, onViewLeads,
}: {
  city: string;
  state: string;
  category: string;
  localLeadCount?: number;
  onViewLeads?: () => void;
}) {
  const [data, setData] = useState<MarketDiagnosticData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    if (!city) { setStatus("unavailable"); return; }
    let cancelled = false;
    const qs = new URLSearchParams({ city, state: state || "", careType: category || "" });
    fetch(`/api/provider/market-diagnostic?${qs.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j?.available && j?.data) { setData(j.data); setStatus("ready"); }
        else setStatus("unavailable");
      })
      .catch(() => { if (!cancelled) setStatus("unavailable"); });
    return () => { cancelled = true; };
  }, [city, state, category]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-display mb-0.5 lg:mb-1">Find families</h1>
          <p className="text-sm lg:text-[15px] text-gray-500">Your local market and how to win clients in it</p>
        </div>

        {/* Edge case: live local leads — pin on top with urgency */}
        {localLeadCount > 0 && (
          <button
            type="button"
            onClick={onViewLeads}
            className="w-full mb-7 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4 text-left transition-colors hover:bg-amber-50"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-medium text-stone-900">
                {localLeadCount} {localLeadCount === 1 ? "family is" : "families are"} looking near you right now
              </span>
              <span className="block text-[13px] text-stone-500">First to reach out is 3× more likely to connect.</span>
            </span>
            <span className="text-[13px] font-semibold text-amber-700">See them →</span>
          </button>
        )}

        {status === "loading" && (
          <div className="max-w-3xl animate-pulse space-y-6">
            <div className="h-10 w-2/3 rounded-lg bg-stone-100" />
            <div className="grid grid-cols-3 gap-5">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-stone-100" />)}
            </div>
            <div className="h-40 rounded-xl bg-stone-100" />
          </div>
        )}

        {status === "unavailable" && (
          <div className="max-w-xl rounded-2xl border border-stone-200/70 bg-white/50 px-6 py-10 text-center">
            <p className="font-display text-xl text-stone-900">Building your market report</p>
            <p className="mt-2 text-[14px] text-stone-500">
              We&apos;re putting together a read on {city || "your area"} — the local demand, your competition, and
              your best referral sources. Check back shortly.
            </p>
          </div>
        )}

        {status === "ready" && data && <MarketDiagnostic data={data} />}
      </div>
    </div>
  );
}
