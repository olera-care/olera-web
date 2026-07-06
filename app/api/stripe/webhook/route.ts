/**
 * DEPRECATED FOR PRODUCTION — kept as backup and for local dev.
 *
 * The production Stripe webhook receiver is now the Supabase Edge Function at
 * `supabase/functions/stripe-webhook/index.ts`. Stripe no longer sends events
 * to this URL — Vercel's Bot Protection edge layer blocks Stripe's GCP-origin
 * POSTs with 403 regardless of Custom Bypass / System Bypass firewall rules
 * (see April 2026 debugging notes). Supabase Edge Functions are not behind
 * that layer, so we route webhooks there.
 *
 * WHEN EDITING: mirror any changes to the Supabase function at
 * `supabase/functions/stripe-webhook/index.ts` until one is deleted.
 *
 * LOCAL DEV: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
 * still works against this route. No firewall issues locally.
 *
 * ROLLBACK: if the Supabase function fails, re-enable this endpoint in the
 * Stripe Dashboard (URL `https://olera.care/api/stripe/webhook`) and disable
 * the Supabase endpoint. No code changes required.
 */
import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { sendEmail } from "@/lib/email";
import { sendSlackAlert } from "@/lib/slack";
import { providerSubscriptionConfirmationEmail } from "@/lib/medjobs-email-templates";

/** Map a Stripe subscription status onto ad_campaign_requests.plan_status.
 *  Values must stay inside the DB CHECK: active | past_due | canceled.
 *  Mirrors supabase/functions/stripe-webhook/index.ts. */
async function syncAdBoostPlanStatus(
  supabase: ReturnType<typeof getAdminClient>,
  subscriptionId: string,
  stripeStatus: string,
) {
  const planStatus =
    stripeStatus === "active" || stripeStatus === "trialing"
      ? "active"
      : stripeStatus === "past_due"
        ? "past_due"
        : stripeStatus === "canceled" || stripeStatus === "unpaid"
          ? "canceled"
          : null;
  if (!planStatus) return;
  await supabase
    .from("ad_campaign_requests")
    .update({ plan_status: planStatus, updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
}

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

        // Ad Boost paid plan (Phase 2): activate the campaign request row.
        // Mirrors supabase/functions/stripe-webhook/index.ts (the prod path).
        if (session.metadata?.product === "adboost" && session.metadata?.request_id) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : (session.subscription as Stripe.Subscription | null)?.id ?? null;
          const { data: row } = await supabase
            .from("ad_campaign_requests")
            .update({
              plan_status: "active",
              plan_value: Number(session.metadata.plan_value) || null,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id:
                typeof session.customer === "string"
                  ? session.customer
                  : (session.customer?.id ?? null),
              subscribed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", session.metadata.request_id)
            .select("id, display_name, provider_slug")
            .maybeSingle();
          if (row) {
            await sendSlackAlert(
              `:moneybag: Ad Boost conversion: *${row.display_name ?? row.provider_slug ?? row.id}* subscribed at $${session.metadata.plan_value}/mo`,
            );
          } else {
            console.error(
              "[stripe/webhook] Ad Boost activation: request not found",
              session.metadata.request_id,
            );
          }
          break;
        }

        // Handle MedJobs-specific subscription
        if (session.metadata?.product === "medjobs" && session.metadata?.profile_id) {
          const profileId = session.metadata.profile_id;
          const subscriptionId = session.subscription as string;
          const { error: rpcError } = await supabase.rpc("merge_profile_metadata", {
            p_profile_id: profileId,
            p_updates: {
              medjobs_subscription_active: true,
              medjobs_subscription_id: subscriptionId,
              medjobs_stripe_customer_id: session.customer as string,
            },
          });
          if (rpcError) {
            console.error("[stripe/webhook] merge_profile_metadata RPC failed:", rpcError);
            // Fallback: direct update if RPC fails
            const { data: profile } = await supabase
              .from("business_profiles")
              .select("metadata")
              .eq("id", profileId)
              .single();
            if (profile) {
              const meta = (profile.metadata || {}) as Record<string, unknown>;
              meta.medjobs_subscription_active = true;
              meta.medjobs_subscription_id = subscriptionId;
              meta.medjobs_stripe_customer_id = session.customer as string;
              await supabase.from("business_profiles").update({ metadata: meta }).eq("id", profileId);
              console.log("[stripe/webhook] Fallback direct update succeeded for", profileId);
            }
          }

          // Send subscription confirmation email
          try {
            const { data: providerProfile } = await supabase
              .from("business_profiles")
              .select("display_name, email")
              .eq("id", profileId)
              .single();

            const providerEmail = providerProfile?.email || session.customer_email;
            if (providerEmail) {
              await sendEmail({
                to: providerEmail,
                subject: "Welcome to MedJobs Pro!",
                html: providerSubscriptionConfirmationEmail({
                  providerName: providerProfile?.display_name || "there",
                }),
                emailType: "medjobs_subscription_confirmation",
              });
              console.log("[stripe/webhook] Subscription confirmation email sent to", providerEmail);
            }
          } catch (emailErr) {
            // Non-blocking — don't fail the webhook if email fails
            console.error("[stripe/webhook] Failed to send confirmation email:", emailErr);
          }

          break;
        }

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

        // Ad Boost subs carry product metadata (set at checkout); sync their
        // plan_status and stop — they have no membership row.
        if (subscription.metadata?.product === "adboost") {
          await syncAdBoostPlanStatus(supabase, subscription.id, subscription.status);
          break;
        }

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

        if (subscription.metadata?.product === "adboost") {
          await syncAdBoostPlanStatus(supabase, subscription.id, "canceled");
          break;
        }

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        // Handle MedJobs subscription cancellation
        const { data: medjobsProfiles } = await supabase
          .from("business_profiles")
          .select("id, metadata")
          .filter("metadata->>medjobs_stripe_customer_id", "eq", customerId);
        if (medjobsProfiles?.length) {
          for (const p of medjobsProfiles) {
            const { error: rpcError } = await supabase.rpc("merge_profile_metadata", {
              p_profile_id: p.id,
              p_updates: {
                medjobs_subscription_active: false,
                medjobs_subscription_id: null,
              },
            });
            if (rpcError) {
              console.error("[stripe/webhook] cancellation RPC failed:", rpcError);
              const meta = ((p as { metadata?: unknown }).metadata || {}) as Record<string, unknown>;
              meta.medjobs_subscription_active = false;
              meta.medjobs_subscription_id = null;
              await supabase.from("business_profiles").update({ metadata: meta }).eq("id", p.id);
            }
          }
        }

        // Handle general subscription cancellation
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
