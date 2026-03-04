import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * POST /api/stripe/link-customer
 *
 * Links an existing Stripe customer to the current user's account.
 * Used for migrating existing subscribers to this platform.
 *
 * Body:
 * - stripeCustomerId: The Stripe customer ID (cus_xxx) to link
 *
 * The endpoint will:
 * 1. Verify the Stripe customer exists
 * 2. Fetch their current subscription status
 * 3. Update the membership record with all Stripe data
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { stripeCustomerId } = body as { stripeCustomerId: string };

    if (!stripeCustomerId || !stripeCustomerId.startsWith("cus_")) {
      return NextResponse.json(
        { error: "Invalid Stripe customer ID" },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get account
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Verify the Stripe customer exists and fetch their data
    const stripe = getStripe();

    let customer: Awaited<ReturnType<typeof stripe.customers.retrieve>>;
    try {
      customer = await stripe.customers.retrieve(stripeCustomerId);
    } catch {
      return NextResponse.json(
        { error: "Stripe customer not found" },
        { status: 404 }
      );
    }

    if ((customer as { deleted?: boolean }).deleted) {
      return NextResponse.json(
        { error: "Stripe customer has been deleted" },
        { status: 410 }
      );
    }

    // Check if this customer is already linked to another account
    const adminSupabase = getAdminSupabase();
    const { data: existingLink } = await adminSupabase
      .from("memberships")
      .select("account_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (existingLink && existingLink.account_id !== account.id) {
      return NextResponse.json(
        { error: "This Stripe customer is already linked to another account" },
        { status: 409 }
      );
    }

    // Fetch the customer's active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 1,
    });

    const subscription = subscriptions.data[0];

    // Fetch payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: "card",
    });

    // Build the membership update
    const updateData: Record<string, unknown> = {
      stripe_customer_id: stripeCustomerId,
      has_payment_method: paymentMethods.data.length > 0,
    };

    if (subscription) {
      updateData.stripe_subscription_id = subscription.id;

      // Map subscription status
      switch (subscription.status) {
        case "trialing":
          updateData.status = "trialing";
          updateData.plan = "pro";
          break;
        case "active":
          updateData.status = "active";
          updateData.plan = "pro";
          break;
        case "past_due":
          updateData.status = "past_due";
          updateData.plan = "pro";
          break;
        case "canceled":
        case "unpaid":
          updateData.status = "canceled";
          updateData.plan = "free";
          break;
        default:
          updateData.status = "free";
          updateData.plan = "free";
      }

      // Set period dates
      if (subscription.items.data[0]?.current_period_end) {
        updateData.current_period_ends_at = new Date(
          subscription.items.data[0].current_period_end * 1000
        ).toISOString();
      }

      if (subscription.trial_end) {
        updateData.trial_ends_at = new Date(
          subscription.trial_end * 1000
        ).toISOString();
      }

      // Determine billing cycle from price
      const priceId = subscription.items.data[0]?.price?.id;
      if (priceId) {
        if (priceId === process.env.STRIPE_PRICE_ANNUAL) {
          updateData.billing_cycle = "annual";
        } else if (priceId === process.env.STRIPE_PRICE_MONTHLY) {
          updateData.billing_cycle = "monthly";
        }
        // Note: Legacy prices won't match, billing_cycle stays null
      }
    } else {
      // No subscription - set to free
      updateData.status = "free";
      updateData.plan = "free";
    }

    // Update the membership using admin client (bypasses RLS)
    const { error: updateError } = await adminSupabase
      .from("memberships")
      .update(updateData)
      .eq("account_id", account.id);

    if (updateError) {
      console.error("[link-customer] DB update failed:", updateError);
      return NextResponse.json(
        { error: "Failed to update membership" },
        { status: 500 }
      );
    }

    // Update Stripe customer metadata to link back to our account
    await stripe.customers.update(stripeCustomerId, {
      metadata: {
        ...((customer as { metadata?: Record<string, string> }).metadata || {}),
        account_id: account.id,
        linked_at: new Date().toISOString(),
      },
    });

    console.log(
      `[link-customer] Linked customer ${stripeCustomerId} to account ${account.id}`,
      { status: updateData.status, plan: updateData.plan }
    );

    return NextResponse.json({
      success: true,
      status: updateData.status,
      plan: updateData.plan,
      hasSubscription: !!subscription,
      hasPaymentMethod: paymentMethods.data.length > 0,
    });
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? (err as { message: string }).message
        : "Internal server error";
    console.error("[link-customer] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Admin Supabase client for bypassing RLS
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase admin credentials not configured");
  }
  return createAdminClient(url, serviceKey);
}
