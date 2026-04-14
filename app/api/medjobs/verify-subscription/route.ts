import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe, isStripeConfigured, PRICE_IDS } from "@/lib/stripe";

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
 * This is the primary activation path — does not depend on webhooks.
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

    // Find the provider profile
    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!account) {
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
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    const meta = (profile.metadata || {}) as Record<string, unknown>;
    const customerId = meta.medjobs_stripe_customer_id as string | undefined;

    if (!customerId) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
    }

    // Check Stripe for active MedJobs subscriptions (filter by price for safety)
    const stripe = getStripe();
    const priceFilter = PRICE_IDS.medjobs_monthly || undefined;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      ...(priceFilter ? { price: priceFilter } : {}),
      limit: 1,
    });

    // Also check for trialing subscriptions
    const trialingSubs = subscriptions.data.length === 0
      ? await stripe.subscriptions.list({
          customer: customerId,
          status: "trialing",
          ...(priceFilter ? { price: priceFilter } : {}),
          limit: 1,
        })
      : { data: [] };

    const activeSub = subscriptions.data[0] || trialingSubs.data[0];

    if (activeSub) {
      // Subscription found — activate
      const updates: Record<string, unknown> = {
        medjobs_subscription_active: true,
        medjobs_subscription_id: activeSub.id,
        medjobs_stripe_customer_id: customerId,
      };

      // Try RPC first, fall back to direct update
      const { error: rpcError } = await admin.rpc("merge_profile_metadata", {
        p_profile_id: profile.id,
        p_updates: updates,
      });

      if (rpcError) {
        console.error("[medjobs/verify-subscription] RPC failed, using fallback:", rpcError);
        await admin
          .from("business_profiles")
          .update({ metadata: { ...meta, ...updates } })
          .eq("id", profile.id);
      }

      return NextResponse.json({ activated: true, subscriptionId: activeSub.id });
    }

    return NextResponse.json({ activated: false, reason: "No active subscription found" });
  } catch (err) {
    console.error("[medjobs/verify-subscription] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
