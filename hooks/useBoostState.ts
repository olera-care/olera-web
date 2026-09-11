"use client";

import { useState, useEffect } from "react";
import {
  getCachedBoostState,
  cacheBoostState,
  type BoostStateResponse,
} from "@/lib/ad-boost/boost-state";

/**
 * The provider's full ad-boost state, cache-first.
 *
 * `useHasActiveBoostRequest` already fetches this exact endpoint but returns
 * only a boolean and -- worth knowing -- never calls `cacheBoostState`, so the
 * response is discarded and the next consumer pays for it again. This hook
 * keeps the payload and warms the shared cache, which also makes
 * /provider/boost paint instantly when the provider clicks through from the
 * dashboard instead of showing its loader.
 *
 * Returns `null` while unknown. Errors resolve to a state with no request
 * rather than throwing: a dashboard card is not worth breaking a page over.
 */
export function useBoostState(): BoostStateResponse | null {
  const [state, setState] = useState<BoostStateResponse | null>(() => getCachedBoostState());

  useEffect(() => {
    if (state) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/provider/ad-boost/request", { credentials: "include" });
        if (!res.ok) return; // not eligible / not signed in -- card simply stays hidden
        const data = (await res.json()) as BoostStateResponse;
        cacheBoostState(data);
        if (!cancelled) setState(data);
      } catch {
        // Best effort. The card renders nothing and the page is unaffected.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state]);

  return state;
}
