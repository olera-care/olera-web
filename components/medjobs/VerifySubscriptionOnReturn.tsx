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
 *
 * TEMPORARY: verbose logging at each step to diagnose why the effect
 * wasn't firing on staging despite the component being on the page.
 */
export default function VerifySubscriptionOnReturn() {
  // Render-time log — proves the component is actually rendered in the tree
  if (typeof window !== "undefined") {
    console.log("[VerifySubscriptionOnReturn] RENDERED");
  }

  const { refreshAccountData } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    console.log("[VerifySubscriptionOnReturn] useEffect fired");
    if (hasRun.current) {
      console.log("[VerifySubscriptionOnReturn] already ran, skipping");
      return;
    }
    if (typeof window === "undefined") {
      console.log("[VerifySubscriptionOnReturn] no window (SSR), skipping");
      return;
    }
    const search = window.location.search;
    const params = new URLSearchParams(search);
    console.log(
      "[VerifySubscriptionOnReturn] checking URL:",
      { href: window.location.href, search, upgraded: params.get("upgraded") }
    );
    if (params.get("upgraded") !== "true") {
      console.log("[VerifySubscriptionOnReturn] no ?upgraded=true, skipping");
      return;
    }
    hasRun.current = true;
    console.log("[VerifySubscriptionOnReturn] ACTIVATING — calling verify-subscription");

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
        console.log(
          "[VerifySubscriptionOnReturn] verify response:",
          { status: res.status, body: data }
        );
        if (!res.ok || data?.activated !== true) {
          console.warn(
            "[VerifySubscriptionOnReturn] did not activate:",
            { status: res.status, body: data }
          );
        } else {
          console.log("[VerifySubscriptionOnReturn] activated:", data.subscriptionId);
        }
        await refreshAccountData();
        console.log("[VerifySubscriptionOnReturn] refreshAccountData complete");
      } catch (err) {
        console.warn("[VerifySubscriptionOnReturn] fetch failed:", err);
      }
    })();
  }, [refreshAccountData]);

  return null;
}
