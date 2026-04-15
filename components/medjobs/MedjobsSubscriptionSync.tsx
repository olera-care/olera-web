"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Auto-syncs MedJobs subscription state from Stripe whenever a logged-in
 * provider's profile has a Stripe customer ID but no active flag yet.
 *
 * This replaces the fragile `?upgraded=true` URL-param detection. It
 * catches every case where the paywall should be lifted but isn't:
 *
 *   - User pays on Stripe, returns to the app (any page, any URL)
 *   - User pays, closes the tab, returns in a new session hours later
 *   - User pays but the webhook delivery fails or is delayed
 *   - User's DB flag was cleared and needs a re-sync
 *
 * How it works: when the user's profiles load, look for a provider
 * profile that has `medjobs_stripe_customer_id` set but doesn't yet
 * have `medjobs_subscription_active: true`. If found, call
 * /api/medjobs/verify-subscription — it queries Stripe and writes the
 * flag if there's an active subscription. Then refresh auth context
 * so paywall-gated UI re-evaluates.
 *
 * Rate-limited via module-level state:
 *   - Success: stop querying this session (activation is permanent)
 *   - "No subscription": 30s backoff before re-querying (keeps Stripe
 *     API usage sane for users who have a customer_id but never paid)
 *
 * Safe to mount on multiple pages — the rate limit guards against
 * double-firing.
 */

// Module-level state, persists across component mounts/navigations in
// the same JS context (resets on full page reload).
let activationCompleted = false;
let lastNoSubCheck = 0;
const NO_SUB_BACKOFF_MS = 30_000;

export default function MedjobsSubscriptionSync() {
  const { profiles, refreshAccountData } = useAuth();

  useEffect(() => {
    if (activationCompleted) return;
    if (!profiles || profiles.length === 0) return;

    // Find a provider profile that looks like it paid but the flag
    // hasn't caught up yet.
    const stale = profiles.find((p) => {
      if (p.type !== "organization" && p.type !== "caregiver") return false;
      const meta = (p.metadata ?? {}) as Record<string, unknown>;
      return (
        !!meta.medjobs_stripe_customer_id &&
        meta.medjobs_subscription_active !== true
      );
    });

    if (!stale) return;

    // Backoff between "no subscription" results — avoid hammering
    // Stripe on every page render for customers who never completed
    // payment.
    if (Date.now() - lastNoSubCheck < NO_SUB_BACKOFF_MS) return;

    console.log(
      "[MedjobsSubscriptionSync] stale profile detected, verifying with Stripe",
      { profileId: stale.id }
    );

    (async () => {
      try {
        const res = await fetch("/api/medjobs/verify-subscription", {
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.activated === true) {
          console.log(
            "[MedjobsSubscriptionSync] activated:",
            data.subscriptionId
          );
          activationCompleted = true;
          await refreshAccountData();
        } else {
          console.log("[MedjobsSubscriptionSync] no active subscription:", {
            status: res.status,
            body: data,
          });
          lastNoSubCheck = Date.now();
        }
      } catch (err) {
        console.warn("[MedjobsSubscriptionSync] verify failed:", err);
        lastNoSubCheck = Date.now();
      }
    })();
  }, [profiles, refreshAccountData]);

  return null;
}
