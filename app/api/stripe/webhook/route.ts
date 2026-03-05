import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Use the service role key for webhook processing (bypasses RLS)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase admin credentials not configured");
  }
  return createClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const msg =
      err && typeof err === "object" && "message" in err
        ? (err as { message: string }).message
        : "Unknown error";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const accountId = session.metadata?.account_id;
        if (!accountId) break;

        // Retrieve the subscription to get period and trial dates
        const stripe = getStripe();
        const subscriptionId = session.subscription as string;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        const updateData: Record<string, unknown> = {
          plan: "pro",
          status: sub.status === "trialing" ? "trialing" : "active",
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          billing_cycle:
            session.metadata?.billing_cycle === "annual"
              ? "annual"
              : "monthly",
          current_period_ends_at: new Date(
            sub.items.data[0]?.current_period_end
              ? sub.items.data[0].current_period_end * 1000
              : Date.now()
          ).toISOString(),
        };

        if (sub.trial_end) {
          updateData.trial_ends_at = new Date(sub.trial_end * 1000).toISOString();
        }

        await supabase
          .from("memberships")
          .update(updateData)
          .eq("account_id", accountId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const { data: membership } = await supabase
          .from("memberships")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!membership) break;

        let status: string;
        switch (subscription.status) {
          case "trialing":
            status = "trialing";
            break;
          case "active":
            status = "active";
            break;
          case "past_due":
            status = "past_due";
            break;
          case "canceled":
          case "unpaid":
            status = "canceled";
            break;
          default:
            status = "free";
        }

        await supabase
          .from("memberships")
          .update({
            status,
            current_period_ends_at: new Date(
              subscription.items.data[0]?.current_period_end
                ? subscription.items.data[0].current_period_end * 1000
                : Date.now()
            ).toISOString(),
          })
          .eq("id", membership.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await supabase
          .from("memberships")
          .update({
            status: "free",
            plan: "free",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          await supabase
            .from("memberships")
            .update({ status: "past_due" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Return 200 to prevent Stripe from retrying — log the error for debugging
  }

  return NextResponse.json({ received: true });
}
