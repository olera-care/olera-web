import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/**
 * POST /api/medjobs/billing-portal
 *
 * Creates a Stripe Billing Portal session for the authenticated provider
 * to manage their MedJobs Pro subscription (update payment, cancel, etc.)
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Find provider profile
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const { data: providerProfile } = await admin
      .from("business_profiles")
      .select("id, metadata")
      .eq("account_id", account.id)
      .in("type", ["organization", "caregiver"])
      .limit(1)
      .maybeSingle();

    if (!providerProfile) {
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    const meta = (providerProfile.metadata || {}) as Record<string, unknown>;
    const customerId = meta.medjobs_stripe_customer_id as string | undefined;

    if (!customerId) {
      return NextResponse.json(
        { error: "No subscription found. Please subscribe first." },
        { status: 400 }
      );
    }

    // Create billing portal session
    const stripe = getStripe();
    const origin = request.nextUrl.origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/account/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err && typeof err === "object" && "message" in err
      ? (err as { message: string }).message
      : "Internal error";
    console.error("[medjobs/billing-portal] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
