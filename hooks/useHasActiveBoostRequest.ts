"use client";

import { useState, useEffect } from "react";
import { getCachedBoostState, loadBoostState } from "@/lib/ad-boost/boost-state";

const ACTIVE_STATUSES = ["pending_profile", "requested", "scheduled", "live"];

export type BoostRequestSummary = {
  /** Has a request in pending_profile, requested, scheduled or live. */
  hasActive: boolean | null;
  /** Has EVER requested a campaign, including ended and cancelled ones. The
   *  free-intro copy ("your first campaign is on us") is only true when this is
   *  false — a provider whose flight ended already had theirs. */
  hasEver: boolean | null;
};

/**
 * Both boost-request facts a nudge needs, from one read.
 *
 * First checks the module-level cache (populated by dashboard/matches pages).
 * If cache miss, fetches from the API. Fields are `null` while loading.
 */
export function useBoostRequestSummary(): BoostRequestSummary {
  const [summary, setSummary] = useState<BoostRequestSummary>(() => {
    // Check cache synchronously on mount
    const cached = getCachedBoostState();
    if (cached) {
      const status = cached.request?.status;
      return {
        hasActive: !!status && ACTIVE_STATUSES.includes(status),
        hasEver: !!cached.request,
      };
    }
    return { hasActive: null, hasEver: null }; // Unknown, need to fetch
  });

  useEffect(() => {
    // If we got a cached result, no need to fetch
    if (summary.hasActive !== null) return;

    let cancelled = false;

    async function checkBoostState() {
      // Shares any request already in flight (the dashboard hero prefetches the
      // same endpoint on mount), so this adds no second round trip.
      const data = await loadBoostState();
      if (cancelled) return;
      if (!data) {
        // Lookup failed. Still show the nudge, as before, but WITHOUT the
        // free-intro claim: an unverifiable "your first campaign is on us" is
        // the one thing here we must never say to someone who already had one.
        setSummary({ hasActive: false, hasEver: true });
        return;
      }
      const status = data.request?.status;
      setSummary({
        hasActive: !!status && ACTIVE_STATUSES.includes(status),
        hasEver: !!data.request,
      });
    }

    checkBoostState();
    return () => { cancelled = true; };
  }, [summary.hasActive]);

  return summary;
}

/**
 * Lightweight hook to check if the provider has an active ad boost request.
 *
 * Active states: pending_profile, requested, scheduled, live
 */
export function useHasActiveBoostRequest(): boolean | null {
  return useBoostRequestSummary().hasActive;
}
