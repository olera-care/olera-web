"use client";

/**
 * useMedJobsRefresh — shared refresh contract across MedJobs surfaces.
 *
 * v9.0 Phase 0: minimal scaffold. A page registers its `refetch`
 * callback when it mounts; mutations triggered from anywhere in the
 * MedJobs surface (drawer actions, modal completions, dedicated pages)
 * call `refreshAll()` to invalidate every registered listener.
 *
 * Phase 1 will use this from dedicated left-menu pages so that an
 * action taken from /admin/medjobs/replies (e.g. marking a row as
 * Partner) refreshes both the Replies list AND the In Basket tab
 * counts AND the Partners list — matching the cache-invalidation
 * concern flagged during planning.
 *
 * Implementation note: this is a module-level subscriber set, not React
 * Context. Pages on different routes don't share a Provider; a global
 * pub/sub keeps the contract simple. Each registered callback fires
 * on every refresh — pages that aren't currently mounted are a no-op
 * because their cleanup unregisters them.
 */

import { useEffect } from "react";

type Listener = () => void | Promise<void>;

const listeners = new Set<Listener>();

/**
 * Register a refetch callback for the lifetime of a component. The
 * callback fires whenever any other MedJobs surface calls
 * `refreshMedJobs()`.
 */
export function useMedJobsRefresh(refetch: Listener): void {
  useEffect(() => {
    listeners.add(refetch);
    return () => {
      listeners.delete(refetch);
    };
  }, [refetch]);
}

/**
 * Trigger every currently-registered MedJobs refetch listener.
 * Errors in individual listeners are swallowed so one failing surface
 * doesn't prevent the others from refreshing.
 */
export function refreshMedJobs(): void {
  for (const listener of listeners) {
    try {
      const result = listener();
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch((err) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[useMedJobsRefresh] listener error:", err);
          }
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[useMedJobsRefresh] listener error:", err);
      }
    }
  }
}
