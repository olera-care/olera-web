"use client";

/**
 * useProviderOutreachRefresh — shared refresh contract across Provider Outreach surfaces.
 *
 * Exact copy of useMedJobsRefresh, scoped to the Provider Outreach pipeline.
 * Pages register refetch callbacks; mutations call refreshProviderOutreach()
 * to invalidate all listeners.
 */

import { useEffect } from "react";

type Listener = () => void | Promise<void>;

const listeners = new Set<Listener>();

export function useProviderOutreachRefresh(refetch: Listener): void {
  useEffect(() => {
    listeners.add(refetch);
    return () => {
      listeners.delete(refetch);
    };
  }, [refetch]);
}

export function refreshProviderOutreach(): void {
  for (const listener of listeners) {
    try {
      const result = listener();
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch((err) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[useProviderOutreachRefresh] listener error:", err);
          }
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[useProviderOutreachRefresh] listener error:", err);
      }
    }
  }
}
