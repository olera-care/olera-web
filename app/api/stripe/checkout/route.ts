import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured, PRICE_IDS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { billingCycle, returnPath } = body as {
      billingCycle: "monthly" | "annual";
      returnPath?: string;
    };

    // Validate billing cycle
    const priceId =
      billingCycle === "annual" ? PRICE_IDS.annual : PRICE_IDS.monthly;
    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured for this billing cycle" },
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

    // Get account + membership
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

    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("account_id", account.id)
      .single();

    const stripe = getStripe();

    // Reuse existing Stripe customer or create a new one
    let customerId = membership?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { account_id: account.id },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from("memberships")
        .update({ stripe_customer_id: customerId })
        .eq("account_id", account.id);
    }

    // Create checkout session
    const origin = request.nextUrl.origin;
    const successPath = returnPath
      ? `${returnPath}?upgraded=true`
      : "/portal/settings?upgraded=true";
    const cancelPath = returnPath || "/portal/settings";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}${successPath}`,
      cancel_url: `${origin}${cancelPath}`,
      metadata: { account_id: account.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? (err as { message: string }).message
        : "Internal server error";
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
