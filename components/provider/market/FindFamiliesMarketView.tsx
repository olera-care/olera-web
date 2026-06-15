"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import MarketDiagnostic, { type MarketDiagnosticData } from "./MarketDiagnostic";
import MarketLoading from "./MarketLoading";
import type { SelfRank } from "@/lib/market-diagnostic/self-rank";
import { trackProviderEvent } from "@/lib/analytics/track-provider-event";

/**
 * Find Families — "Your Market" default experience.
 *
 * For ~99.9% of providers (75k providers, ~100 live leads) there are no local families
 * actively searching, so the market diagnostic IS the page. When a real published
 * care-seeker exists within the provider's catchment (the rare cherry), the caller
 * passes it in via `pinned` and it renders on top of the diagnostic.
 */
export default function FindFamiliesMarketView({
  city, state, category, providerName, providerSlug, providerPlaceId, providerSourceId, pinned,
}: {
  city: string;
  state: string;
  category: string;
  providerName?: string;
  /** Provider slug — the activity tracking key for your_market_* events. */
  providerSlug?: string;
  /** The viewing provider's Google place_id (from metadata) — powers the self-rank overlay. */
  providerPlaceId?: string;
  /** olera-providers link (source_provider_id) — higher-coverage server-side place_id fallback. */
  providerSourceId?: string;
  /** Optional "family near you" section, rendered above the market diagnostic. */
  pinned?: ReactNode;
}) {
  const [data, setData] = useState<MarketDiagnosticData | null>(null);
  const [self, setSelf] = useState<SelfRank | null>(null);
  const [status, setStatus] = useState<"loading" | "building" | "ready" | "unavailable">("loading");
  const [longRunning, setLongRunning] = useState(false);
  // "uncovered" = this area isn't in our city dataset, so the report is NOT coming — show honest
  // copy instead of the "check back shortly" we use for a transient/computing state.
  const [uncovered, setUncovered] = useState(false);

  useEffect(() => {
    if (!city) { setUncovered(true); setStatus("unavailable"); return; }
    let cancelled = false;
    const startedAt = Date.now();
    const POLL_MS = 3000;
    const MAX_POLL_MS = 4 * 60 * 1000; // stop hammering after ~4 min; the degrade copy says "check back"
    const qs = new URLSearchParams({ city, state: state || "", careType: category || "" });
    if (providerPlaceId) qs.set("placeId", providerPlaceId);
    if (providerSourceId) qs.set("sourceProviderId", providerSourceId);
    let timer: ReturnType<typeof setTimeout> | undefined;

    // First visit to a cold city computes in the background (~60-90s); poll until it flips ready.
    const poll = async () => {
      try {
        const r = await fetch(`/api/provider/market-diagnostic?${qs.toString()}`);
        const j = await r.json();
        if (cancelled) return;
        if (j?.status === "ready" && j?.data) { setData(j.data); setSelf(j.self ?? null); setStatus("ready"); return; }
        if (j?.status === "unavailable") { setUncovered(j?.reason === "uncovered"); setStatus("unavailable"); return; }
        setStatus("building"); // building — keep polling, soften copy after ~20s
        if (Date.now() - startedAt > 20000) setLongRunning(true);
        if (Date.now() - startedAt < MAX_POLL_MS) timer = setTimeout(poll, POLL_MS);
      } catch {
        if (cancelled) return;
        if (Date.now() - startedAt < MAX_POLL_MS) timer = setTimeout(poll, POLL_MS);
        else setStatus("unavailable");
      }
    };
    poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [city, state, category, providerPlaceId, providerSourceId]);

  // Fire one your_market_viewed event per visit, once the diagnostic settles
  // (ready = covered; unavailable+uncovered = not covered). We wait for the
  // outcome so `covered` is accurate rather than firing on the loading frame.
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (!providerSlug || hasTrackedView.current) return;
    if (status !== "ready" && status !== "unavailable") return;
    hasTrackedView.current = true;
    trackProviderEvent(providerSlug, "your_market_viewed", {
      provider_name: providerName,
      city: city || null,
      state: state || null,
      covered: !(status === "unavailable" && uncovered),
    });
  }, [status, uncovered, providerSlug, providerName, city, state]);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-vanilla-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Rare cherry: a real published care-seeker within the catchment, pinned on top. */}
        {pinned}

        {(status === "loading" || status === "building") && (
          <MarketLoading city={city} longRunning={longRunning} />
        )}

        {status === "unavailable" && (
          <div className="max-w-xl rounded-2xl border border-stone-200/70 bg-white/50 px-6 py-10 text-center">
            {uncovered ? (
              <>
                <p className="font-display text-xl text-stone-900">We&apos;re not in {city || "your area"} yet</p>
                <p className="mt-2 text-[14px] text-stone-500">
                  Your market isn&apos;t in our coverage yet — we&apos;re expanding fast. In the meantime,{" "}
                  <Link href="/provider" className="font-medium text-[#199087] underline-offset-2 hover:underline">polish your profile</Link>{" "}
                  so families see your best.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-xl text-stone-900">Building your market report</p>
                <p className="mt-2 text-[14px] text-stone-500">
                  We&apos;re putting together a read on {city || "your area"} — the local demand, your competition, and
                  your best referral sources. Check back shortly.
                </p>
              </>
            )}
          </div>
        )}

        {status === "ready" && data && <MarketDiagnostic data={data} interactive providerName={providerName} providerSlug={providerSlug} self={self} />}
      </div>
    </div>
  );
}
