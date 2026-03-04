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

// Trial extension config - can be toggled via env var
const TRIAL_EXTENSION_ENABLED = process.env.STRIPE_TRIAL_EXTENSION_ENABLED !== "false";
const TRIAL_EXTENSION_DAYS = 30;

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
    console.error("[Stripe Webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // ─── Idempotency Check ───────────────────────────────────────────────────
  // Check if we've already processed this event
  const { data: existingEvent } = await supabase
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .single();

  if (existingEvent) {
    console.log(`[Stripe Webhook] Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Record the event as processed (do this before processing to prevent race conditions)
  const { error: insertError } = await supabase
    .from("stripe_webhook_events")
    .insert({ event_id: event.id, event_type: event.type });

  if (insertError) {
    // If insert fails due to duplicate, another worker got it first
    if (insertError.code === "23505") {
      console.log(`[Stripe Webhook] Event ${event.id} already processed (race), skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[Stripe Webhook] Failed to record event:", insertError);
  }

  // ─── Event Handlers ──────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase);
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;
      }

      case "invoice.payment_succeeded": {
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;
      }

      case "invoice.payment_failed": {
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;
      }

      case "payment_method.attached": {
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod, supabase);
        break;
      }

      case "payment_method.detached": {
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod, supabase);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Handler error for ${event.type}:`, err);
    // Return 200 to prevent Stripe from retrying — we've logged the error
    // The event is already recorded, so retries would be skipped anyway
  }

  return NextResponse.json({ received: true });
}

// ─── Handler Functions ─────────────────────────────────────────────────────

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof getAdminClient>
) {
  const accountId = session.metadata?.account_id;
  if (!accountId) {
    console.warn("[Stripe Webhook] checkout.session.completed: No account_id in metadata");
    return;
  }

  const stripe = getStripe();
  const subscriptionId = session.subscription as string;
  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  const updateData: Record<string, unknown> = {
    plan: "pro",
    status: sub.status === "trialing" ? "trialing" : "active",
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscriptionId,
    billing_cycle:
      session.metadata?.billing_cycle === "annual" ? "annual" : "monthly",
    current_period_ends_at: new Date(
      sub.items.data[0]?.current_period_end
        ? sub.items.data[0].current_period_end * 1000
        : Date.now()
    ).toISOString(),
  };

  if (sub.trial_end) {
    updateData.trial_ends_at = new Date(sub.trial_end * 1000).toISOString();
  }

  // Check if payment method was collected during checkout
  if (session.payment_status === "paid" || sub.default_payment_method) {
    updateData.has_payment_method = true;
  }

  const { error } = await supabase
    .from("memberships")
    .update(updateData)
    .eq("account_id", accountId);

  if (error) {
    console.error("[Stripe Webhook] checkout.session.completed: DB update failed:", error);
    throw error;
  }

  console.log(`[Stripe Webhook] checkout.session.completed: Updated membership for account ${accountId}`);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof getAdminClient>
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!membership) {
    console.warn(`[Stripe Webhook] subscription.updated: No membership found for customer ${customerId}`);
    return;
  }

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

  const updateData: Record<string, unknown> = {
    status,
    current_period_ends_at: new Date(
      subscription.items.data[0]?.current_period_end
        ? subscription.items.data[0].current_period_end * 1000
        : Date.now()
    ).toISOString(),
  };

  // Update trial_ends_at if present
  if (subscription.trial_end) {
    updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
  }

  const { error } = await supabase
    .from("memberships")
    .update(updateData)
    .eq("id", membership.id);

  if (error) {
    console.error("[Stripe Webhook] subscription.updated: DB update failed:", error);
    throw error;
  }

  console.log(`[Stripe Webhook] subscription.updated: Status=${status} for customer ${customerId}`);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof getAdminClient>
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const { error } = await supabase
    .from("memberships")
    .update({
      status: "free",
      plan: "free",
      stripe_subscription_id: null,
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("[Stripe Webhook] subscription.deleted: DB update failed:", error);
    throw error;
  }

  console.log(`[Stripe Webhook] subscription.deleted: Reset to free for customer ${customerId}`);
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof getAdminClient>
) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) {
    console.warn("[Stripe Webhook] invoice.payment_succeeded: No customer ID");
    return;
  }

  // Only process subscription invoices
  if (!invoice.parent?.subscription_details?.subscription) {
    console.log("[Stripe Webhook] invoice.payment_succeeded: Non-subscription invoice, skipping");
    return;
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, status")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!membership) {
    console.warn(`[Stripe Webhook] invoice.payment_succeeded: No membership for customer ${customerId}`);
    return;
  }

  // If status was past_due, payment succeeded so set to active
  const updateData: Record<string, unknown> = {
    has_payment_method: true, // Payment succeeded means they have a valid payment method
  };

  if (membership.status === "past_due") {
    updateData.status = "active";
  }

  const { error } = await supabase
    .from("memberships")
    .update(updateData)
    .eq("id", membership.id);

  if (error) {
    console.error("[Stripe Webhook] invoice.payment_succeeded: DB update failed:", error);
    throw error;
  }

  console.log(`[Stripe Webhook] invoice.payment_succeeded: Payment confirmed for customer ${customerId}`);
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof getAdminClient>
) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) {
    console.warn("[Stripe Webhook] invoice.payment_failed: No customer ID");
    return;
  }

  const { error } = await supabase
    .from("memberships")
    .update({ status: "past_due" })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("[Stripe Webhook] invoice.payment_failed: DB update failed:", error);
    throw error;
  }

  console.log(`[Stripe Webhook] invoice.payment_failed: Set past_due for customer ${customerId}`);
}

async function handlePaymentMethodAttached(
  paymentMethod: Stripe.PaymentMethod,
  supabase: ReturnType<typeof getAdminClient>
) {
  const customerId =
    typeof paymentMethod.customer === "string"
      ? paymentMethod.customer
      : paymentMethod.customer?.id;

  if (!customerId) {
    console.warn("[Stripe Webhook] payment_method.attached: No customer ID");
    return;
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, status, trial_ends_at, trial_extended, stripe_subscription_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!membership) {
    console.warn(`[Stripe Webhook] payment_method.attached: No membership for customer ${customerId}`);
    return;
  }

  const updateData: Record<string, unknown> = {
    has_payment_method: true,
  };

  // ─── Trial Extension Logic ─────────────────────────────────────────────
  // If user is in trial and hasn't extended yet, extend by 30 days
  if (
    TRIAL_EXTENSION_ENABLED &&
    membership.status === "trialing" &&
    !membership.trial_extended &&
    membership.stripe_subscription_id
  ) {
    try {
      const stripe = getStripe();

      // Calculate new trial end date
      const currentTrialEnd = membership.trial_ends_at
        ? new Date(membership.trial_ends_at)
        : new Date();
      const newTrialEnd = new Date(currentTrialEnd);
      newTrialEnd.setDate(newTrialEnd.getDate() + TRIAL_EXTENSION_DAYS);

      // Update the subscription in Stripe
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        trial_end: Math.floor(newTrialEnd.getTime() / 1000),
      });

      updateData.trial_ends_at = newTrialEnd.toISOString();
      updateData.trial_extended = true;

      console.log(`[Stripe Webhook] payment_method.attached: Extended trial by ${TRIAL_EXTENSION_DAYS} days for customer ${customerId}`);
    } catch (err) {
      console.error("[Stripe Webhook] payment_method.attached: Failed to extend trial:", err);
      // Don't throw - still update has_payment_method
    }
  }

  const { error } = await supabase
    .from("memberships")
    .update(updateData)
    .eq("id", membership.id);

  if (error) {
    console.error("[Stripe Webhook] payment_method.attached: DB update failed:", error);
    throw error;
  }

  console.log(`[Stripe Webhook] payment_method.attached: Updated payment method status for customer ${customerId}`);
}

async function handlePaymentMethodDetached(
  paymentMethod: Stripe.PaymentMethod,
  supabase: ReturnType<typeof getAdminClient>
) {
  // Note: customer may be null when payment method is detached
  const customerId =
    typeof paymentMethod.customer === "string"
      ? paymentMethod.customer
      : paymentMethod.customer?.id;

  if (!customerId) {
    // This is expected when payment method is fully detached
    console.log("[Stripe Webhook] payment_method.detached: No customer ID (already detached)");
    return;
  }

  // Check if customer has any other payment methods
  const stripe = getStripe();
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  const hasOtherPaymentMethods = paymentMethods.data.length > 0;

  if (!hasOtherPaymentMethods) {
    const { error } = await supabase
      .from("memberships")
      .update({ has_payment_method: false })
      .eq("stripe_customer_id", customerId);

    if (error) {
      console.error("[Stripe Webhook] payment_method.detached: DB update failed:", error);
      throw error;
    }

    console.log(`[Stripe Webhook] payment_method.detached: No payment methods remaining for customer ${customerId}`);
  } else {
    console.log(`[Stripe Webhook] payment_method.detached: Customer ${customerId} still has ${paymentMethods.data.length} payment method(s)`);
  }
}
