"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Drop-in, renders-nothing component that handles the post-Stripe-checkout
 * activation flow. Mount it on any page that can be a Stripe `returnUrl`.
 *
 * When the current URL has `?upgraded=true`, it:
 *   1. Clears the query param (so refresh doesn't re-trigger)
 *   2. Calls `/api/medjobs/verify-subscription` to sync paid state
 *   3. Refreshes auth context so the paywall gate re-evaluates
 *
 * Safe to mount on multiple pages. Won't run unless the upgraded param is
 * present, and uses a ref to guarantee a single execution per mount.
 */
export default function VerifySubscriptionOnReturn() {
  const { refreshAccountData } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") !== "true") return;
    hasRun.current = true;

    // Strip ?upgraded=true from the URL
    params.delete("upgraded");
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);

    (async () => {
      try {
        const res = await fetch("/api/medjobs/verify-subscription", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.activated !== true) {
          console.warn(
            "[VerifySubscriptionOnReturn] did not activate:",
            { status: res.status, body: data }
          );
        } else {
          console.log("[VerifySubscriptionOnReturn] activated:", data.subscriptionId);
        }
        await refreshAccountData();
      } catch (err) {
        console.warn("[VerifySubscriptionOnReturn] fetch failed:", err);
      }
    })();
  }, [refreshAccountData]);

  return null;
}
