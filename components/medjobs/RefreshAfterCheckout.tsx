"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Standard post-Stripe-checkout refresh. The webhook has already set
 * the subscription flag server-side by the time the user returns — this
 * component just nudges the auth context to re-read the DB so the UI
 * reflects the new state without requiring a manual page reload.
 *
 * Mount on any page that can be a Stripe `returnUrl` destination.
 *
 * This is the standard Stripe SaaS pattern — NOT a workaround for
 * broken webhooks. It exists because webhook delivery happens
 * server-side and the client's in-memory auth state is unaware until
 * we explicitly refresh it.
 */
export default function RefreshAfterCheckout() {
  const { refreshAccountData } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") !== "true") return;
    done.current = true;

    // Strip the marker so refresh doesn't re-trigger
    params.delete("upgraded");
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);

    refreshAccountData().catch(() => {
      // Non-blocking — user can manually reload if this fails
    });
  }, [refreshAccountData]);

  return null;
}
