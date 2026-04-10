import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getStripe, isStripeConfigured, PRICE_IDS } from "@/lib/stripe";

/**
 * POST /api/medjobs/checkout
 *
 * Creates a Stripe Checkout session for MedJobs Provider Access ($50/mo).
 * Stores medjobs_subscription metadata on the provider's business_profiles.
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const priceId = PRICE_IDS.medjobs_monthly;
  if (!priceId) {
    return NextResponse.json({ error: "MedJobs price not configured" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Find provider profile
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: account } = await admin.from("accounts").select("id").eq("user_id", user.id).single();
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const { data: providerProfile } = await admin
      .from("business_profiles")
      .select("id, metadata")
      .eq("account_id", account.id)
      .in("type", ["organization", "caregiver"])
      .limit(1)
      .maybeSingle();

    if (!providerProfile) {
      return NextResponse.json({ error: "Provider profile required" }, { status: 403 });
    }

    const meta = (providerProfile.metadata || {}) as Record<string, unknown>;
    const stripe = getStripe();

    // Reuse existing Stripe customer or create new
    let customerId = meta.medjobs_stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { profile_id: providerProfile.id, account_id: account.id },
      });
      customerId = customer.id;
      // Save customer ID atomically (no read-modify-write race)
      await admin.rpc("merge_profile_metadata", {
        p_profile_id: providerProfile.id,
        p_updates: { medjobs_stripe_customer_id: customerId },
      });
    }

    // Create checkout session
    const origin = request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/medjobs/candidates?upgraded=true`,
      cancel_url: `${origin}/medjobs/candidates`,
      metadata: {
        profile_id: providerProfile.id,
        product: "medjobs",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Internal error";
    console.error("[medjobs/checkout] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
