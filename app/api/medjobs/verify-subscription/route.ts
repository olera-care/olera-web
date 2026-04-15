import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe, isStripeConfigured, PRICE_IDS } from "@/lib/stripe";
import type Stripe from "stripe";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/medjobs/verify-subscription
 *
 * Called after returning from Stripe checkout. Looks up the provider's
 * Stripe customer ID, checks Stripe for an active subscription, and
 * updates medjobs_subscription_active in metadata.
 *
 * This is the primary activation path on deployments where webhooks
 * are unreliable (e.g. staging with Vercel Deployment Protection).
 * On properly-configured production it's a belt-and-suspenders backup
 * to the webhook.
 *
 * Robustness notes:
 *  - Lists all customer subscriptions without a price filter, then
 *    validates the price server-side. Prevents silent empty results
 *    when STRIPE_PRICE_MEDJOBS_MONTHLY env var drifts from the actual
 *    live price ID.
 *  - Accepts active, trialing, or incomplete status (Stripe flips
 *    incomplete → active after the first payment settles; verify can
 *    race that transition).
 *  - Retries once after a short delay if the first query returns no
 *    matching subscription — covers the ~1-2s flip window.
 *  - Logs each step to Vercel function logs so future silent failures
 *    aren't silent.
 */
export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = getAdminClient();

    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!account) {
      console.error("[verify-subscription] no account for user", user.id);
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const { data: profile } = await admin
      .from("business_profiles")
      .select("id, metadata")
      .eq("account_id", account.id)
      .in("type", ["organization", "caregiver"])
      .limit(1)
      .maybeSingle();

    if (!profile) {
      console.error("[verify-subscription] no provider profile for account", account.id);
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    const meta = (profile.metadata || {}) as Record<string, unknown>;
    const customerId = meta.medjobs_stripe_customer_id as string | undefined;

    if (!customerId) {
      console.error("[verify-subscription] no stripe customer on profile", profile.id);
      return NextResponse.json(
        { activated: false, reason: "No Stripe customer found on profile" },
        { status: 404 }
      );
    }

    console.log("[verify-subscription] checking Stripe for customer", customerId);

    // Query all the customer's subscriptions without a price filter. We
    // validate the price after-the-fact so a mismatched env var can't
    // silently return empty.
    const stripe = getStripe();
    const medjobsPrice = PRICE_IDS.medjobs_monthly || undefined;

    const findMedjobsSub = async (): Promise<Stripe.Subscription | null> => {
      // No status filter — default Stripe behavior returns active,
      // trialing, past_due, and incomplete (it omits cancelled). That's
      // exactly the set we want. Explicit status: "all" may not be
      // accepted in every Stripe API version so we rely on the default.
      const list = await stripe.subscriptions.list({
        customer: customerId,
        limit: 10,
      });

      const usable = list.data.filter((s) =>
        s.status === "active" || s.status === "trialing" || s.status === "incomplete"
      );

      console.log(
        "[verify-subscription] subscriptions found:",
        list.data.length,
        "usable:",
        usable.length,
        "statuses:",
        list.data.map((s) => s.status).join(",")
      );

      if (usable.length === 0) return null;

      // If we know the expected price, prefer a matching sub. Otherwise
      // take the first usable one — if a user has multiple subscriptions
      // this is a one-customer edge case the team can clean up manually.
      if (medjobsPrice) {
        const matched = usable.find((s) =>
          s.items.data.some((item) => item.price?.id === medjobsPrice)
        );
        if (matched) return matched;
        console.warn(
          "[verify-subscription] no sub matched expected price",
          medjobsPrice,
          "— falling back to first usable sub"
        );
      }
      return usable[0];
    };

    let sub = await findMedjobsSub();

    // One retry to cover Stripe's brief incomplete→active transition
    // immediately after checkout.
    if (!sub) {
      console.log("[verify-subscription] empty on first pass, retrying in 1500ms");
      await new Promise((r) => setTimeout(r, 1500));
      sub = await findMedjobsSub();
    }

    if (!sub) {
      console.error("[verify-subscription] still no sub after retry for customer", customerId);
      return NextResponse.json({
        activated: false,
        reason: "No subscription found for this customer",
        customerId,
      });
    }

    // Write the flag. Try RPC first, fall back to direct update.
    const updates = {
      medjobs_subscription_active: true,
      medjobs_subscription_id: sub.id,
      medjobs_stripe_customer_id: customerId,
    };

    const { error: rpcError } = await admin.rpc("merge_profile_metadata", {
      p_profile_id: profile.id,
      p_updates: updates,
    });

    if (rpcError) {
      console.error("[verify-subscription] RPC failed, using fallback:", rpcError.message);
      const { error: updateError } = await admin
        .from("business_profiles")
        .update({ metadata: { ...meta, ...updates } })
        .eq("id", profile.id);
      if (updateError) {
        console.error("[verify-subscription] fallback update also failed:", updateError.message);
        return NextResponse.json(
          { activated: false, reason: "Could not persist activation" },
          { status: 500 }
        );
      }
    }

    console.log("[verify-subscription] activated", profile.id, "sub", sub.id, "status", sub.status);
    return NextResponse.json({
      activated: true,
      subscriptionId: sub.id,
      status: sub.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[verify-subscription] unexpected error:", msg, stack);
    return NextResponse.json({ error: "Internal error", detail: msg }, { status: 500 });
  }
}
