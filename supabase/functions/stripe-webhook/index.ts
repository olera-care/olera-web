// Stripe webhook receiver for MedJobs Pro subscription activation.
//
// Runs on Supabase Edge Functions (Deno). Replaces the Vercel route
// `app/api/stripe/webhook/route.ts` for production use — Vercel's Bot
// Protection edge layer blocks Stripe's GCP-origin webhook POSTs with 403,
// and after multiple days of firewall config attempts we could not route
// around it reliably. Supabase Edge Functions are not behind that layer.
//
// Scope:
//   - checkout.session.completed (metadata.product === "medjobs") → activate MedJobs Pro
//   - checkout.session.completed (metadata.product === "adboost") → activate Ad Boost plan
//   - customer.subscription.updated (metadata.product === "adboost") → sync plan_status
//   - customer.subscription.deleted → deactivate (MedJobs by customer, Ad Boost by subscription)
//
// Other event types are acknowledged (200) but not processed.
//
// Deploy: see ./README.md
//
// Environment variables (auto-injected by Supabase for Edge Functions):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Environment variables (set manually via `supabase secrets set`):
//   STRIPE_SECRET_KEY            — sk_live_... (used only if future event types
//                                  need to call Stripe API; current handlers don't)
//   STRIPE_WEBHOOK_SECRET        — whsec_... from Stripe Dashboard → webhook endpoint
//   STRIPE_WEBHOOK_SECRET_TEST   — optional whsec_... for a TEST-MODE endpoint
//                                  pointing at this same function, so staging can
//                                  run test-mode checkouts while prod stays live.
//                                  Verification tries live first, then test.

import Stripe from "npm:stripe@20.3.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
// Optional second signing secret for a test-mode endpoint (staging checkouts).
const webhookSecretTest = Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Fail loudly at startup if required config is missing. The error surfaces
// in Supabase Function Logs and every request returns 500 until fixed.
if (!webhookSecret) {
  console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
}
if (!supabaseUrl || !serviceRoleKey) {
  console.error("[stripe-webhook] Supabase service role credentials not configured");
}

// Match main codebase's Stripe API version (lib/stripe.ts) so event shapes
// and any future API calls are consistent.
const stripe = new Stripe(stripeSecret, { apiVersion: "2026-01-28.clover" });
const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req) => {
  // Stripe only sends POST. Everything else is 405.
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!signature || !webhookSecret) {
    console.error("[stripe-webhook] Missing signature header or webhook secret");
    return new Response(
      JSON.stringify({ error: "Missing signature or webhook secret" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  // Verify signature. Deno requires the async variant because crypto is
  // async in Web Crypto API. Live secret first; if a test-mode secret is
  // configured (staging checkouts), fall back to it — an event only ever
  // verifies against the secret of the endpoint that delivered it.
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (liveErr) {
    if (!webhookSecretTest) {
      const msg = liveErr instanceof Error ? liveErr.message : "Unknown error";
      console.error("[stripe-webhook] Signature verification failed:", msg);
      return new Response(
        JSON.stringify({ error: "Invalid signature", detail: msg }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecretTest,
      );
      console.log("[stripe-webhook] Verified with TEST-mode secret");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(
        "[stripe-webhook] Signature verification failed (live + test):",
        msg,
      );
      return new Response(
        JSON.stringify({ error: "Invalid signature", detail: msg }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
  }

  console.log(`[stripe-webhook] Received event ${event.id} type=${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Ad Boost paid plan (Phase 2, 2026-07-06): activate the campaign row.
        if (session.metadata?.product === "adboost") {
          if (!session.metadata?.request_id) {
            console.error(
              `[stripe-webhook] Ad Boost checkout session ${session.id} missing request_id metadata`,
            );
            throw new Error(
              `Ad Boost session ${session.id} missing required request_id metadata`,
            );
          }
          const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;
          const customerId = typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;
          await activateAdBoostPlan(
            session.metadata.request_id,
            Number(session.metadata.plan_value) || null,
            subscriptionId,
            customerId,
          );
          break;
        }

        // Only MedJobs beyond this point. Other checkout sessions are logged
        // and ignored — keeps scope narrow per product decision 2026-04-15.
        if (session.metadata?.product !== "medjobs") {
          console.log(
            `[stripe-webhook] Ignoring non-medjobs checkout session ${session.id} (product=${session.metadata?.product ?? "<none>"})`,
          );
          break;
        }

        // MedJobs session but missing profile_id — this indicates a bug in
        // /api/medjobs/checkout, not a normal case. Log loudly and return 500
        // so Stripe retries and the failure stays visible in Stripe Dashboard.
        if (!session.metadata?.profile_id) {
          console.error(
            `[stripe-webhook] MedJobs checkout session ${session.id} missing profile_id metadata`,
          );
          throw new Error(
            `MedJobs session ${session.id} missing required profile_id metadata`,
          );
        }

        const profileId = session.metadata.profile_id;
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;
        const customerId = typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;

        await activateMedjobs(profileId, subscriptionId, customerId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        // Only Ad Boost subs carry this metadata (set in subscription_data at
        // checkout). MedJobs/portal subs are handled by their own flows.
        if (subscription.metadata?.product === "adboost") {
          await syncAdBoostPlanStatus(subscription.id, subscription.status);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

        if (subscription.metadata?.product === "adboost") {
          await syncAdBoostPlanStatus(subscription.id, "canceled");
        } else {
          await deactivateMedjobsByCustomer(customerId);
        }
        break;
      }

      default:
        console.log(
          `[stripe-webhook] Event type ${event.type} not handled (acknowledged)`,
        );
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(
      `[stripe-webhook] Handler error for event ${event.id}:`,
      msg,
      stack,
    );
    // Return 500 so Stripe retries. This is intentional — we want visibility
    // and retry semantics, not silent swallowing.
    return new Response(
      JSON.stringify({ error: "Handler error", detail: msg }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ received: true, event_id: event.id }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});

/** Activate an Ad Boost paid plan on its campaign request row, and ping Slack
 *  (a conversion is the business event this whole funnel exists for). */
async function activateAdBoostPlan(
  requestId: string,
  planValue: number | null,
  subscriptionId: string | null,
  customerId: string | null,
) {
  const { data: row, error } = await supabase
    .from("ad_campaign_requests")
    .update({
      plan_status: "active",
      plan_value: planValue,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      subscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select("id, display_name, provider_slug")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Ad Boost activation failed for request ${requestId}: ${error.message}`,
    );
  }
  if (!row) {
    // A bad request_id should stay visible in Stripe (retry + dashboard error).
    throw new Error(`Ad Boost activation: request ${requestId} not found`);
  }

  console.log(
    `[stripe-webhook] Ad Boost plan activated for request ${requestId} ($${planValue}/mo, sub=${subscriptionId})`,
  );

  // Best-effort Slack ping — never fail the webhook over it. Requires
  // SLACK_WEBHOOK_URL via `supabase secrets set` (optional).
  const slackUrl = Deno.env.get("SLACK_WEBHOOK_URL");
  if (slackUrl) {
    try {
      await fetch(slackUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: `:moneybag: Ad Boost conversion: *${
            row.display_name ?? row.provider_slug ?? requestId
          }* subscribed at $${planValue}/mo`,
        }),
      });
    } catch (slackErr) {
      console.error("[stripe-webhook] Slack ping failed:", slackErr);
    }
  }
}

/** Map a Stripe subscription status onto the campaign row's plan_status.
 *  Values must stay inside the DB CHECK: active | past_due | canceled. */
async function syncAdBoostPlanStatus(
  subscriptionId: string,
  stripeStatus: string,
) {
  const planStatus = stripeStatus === "active" || stripeStatus === "trialing"
    ? "active"
    : stripeStatus === "past_due"
    ? "past_due"
    : stripeStatus === "canceled" || stripeStatus === "unpaid"
    ? "canceled"
    : null;

  if (!planStatus) {
    console.log(
      `[stripe-webhook] Ad Boost sub ${subscriptionId} status ${stripeStatus} not mapped; ignoring`,
    );
    return;
  }

  const { data: rows, error } = await supabase
    .from("ad_campaign_requests")
    .update({ plan_status: planStatus, updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId)
    .select("id, display_name, provider_slug");

  if (error) {
    throw new Error(
      `Ad Boost plan sync failed for sub ${subscriptionId}: ${error.message}`,
    );
  }
  console.log(
    `[stripe-webhook] Ad Boost sub ${subscriptionId} -> plan_status=${planStatus}`,
  );

  // Cancellations and failed payments are ops events too — ping Slack
  // (best-effort, same optional secret as the conversion ping).
  const row = rows?.[0];
  if (row && (planStatus === "canceled" || planStatus === "past_due")) {
    const slackUrl = Deno.env.get("SLACK_WEBHOOK_URL");
    if (slackUrl) {
      const icon = planStatus === "canceled" ? ":octagonal_sign:" : ":warning:";
      const verb = planStatus === "canceled" ? "canceled their plan" : "payment past due";
      try {
        await fetch(slackUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: `${icon} Ad Boost: *${row.display_name ?? row.provider_slug ?? row.id}* ${verb}`,
          }),
        });
      } catch (slackErr) {
        console.error("[stripe-webhook] Slack ping failed:", slackErr);
      }
    }
  }
}

/** Set medjobs_subscription_active=true on business_profiles.metadata. */
async function activateMedjobs(
  profileId: string,
  subscriptionId: string | null,
  customerId: string | null,
) {
  const updates = {
    medjobs_subscription_active: true,
    medjobs_subscription_id: subscriptionId,
    medjobs_stripe_customer_id: customerId,
  };

  const { error: rpcError } = await supabase.rpc("merge_profile_metadata", {
    p_profile_id: profileId,
    p_updates: updates,
  });

  if (rpcError) {
    console.error(
      `[stripe-webhook] merge_profile_metadata RPC failed for profile ${profileId}:`,
      rpcError,
    );
    // Fallback: direct merge on metadata JSONB column.
    const { data: profile, error: fetchErr } = await supabase
      .from("business_profiles")
      .select("metadata")
      .eq("id", profileId)
      .single();

    if (fetchErr || !profile) {
      throw new Error(
        `Fallback fetch failed for profile ${profileId}: ${fetchErr?.message ?? "not found"}`,
      );
    }

    const meta = (profile.metadata ?? {}) as Record<string, unknown>;
    const merged = { ...meta, ...updates };
    const { error: updateErr } = await supabase
      .from("business_profiles")
      .update({ metadata: merged })
      .eq("id", profileId);

    if (updateErr) {
      throw new Error(
        `Fallback update failed for profile ${profileId}: ${updateErr.message}`,
      );
    }
    console.log(
      `[stripe-webhook] Fallback direct update succeeded for profile ${profileId}`,
    );
    return;
  }

  console.log(
    `[stripe-webhook] Activated medjobs subscription for profile ${profileId} (sub=${subscriptionId})`,
  );
}

/** Set medjobs_subscription_active=false for all profiles with this customer. */
async function deactivateMedjobsByCustomer(customerId: string) {
  const { data: profiles, error: selectErr } = await supabase
    .from("business_profiles")
    .select("id, metadata")
    .filter("metadata->>medjobs_stripe_customer_id", "eq", customerId);

  if (selectErr) {
    throw new Error(
      `Deactivation select failed for customer ${customerId}: ${selectErr.message}`,
    );
  }

  if (!profiles || profiles.length === 0) {
    console.log(
      `[stripe-webhook] No medjobs profiles found for customer ${customerId}; nothing to deactivate`,
    );
    return;
  }

  const updates = {
    medjobs_subscription_active: false,
    medjobs_subscription_id: null,
  };

  for (const p of profiles) {
    const { error: rpcError } = await supabase.rpc("merge_profile_metadata", {
      p_profile_id: p.id,
      p_updates: updates,
    });

    if (rpcError) {
      console.error(
        `[stripe-webhook] deactivation RPC failed for profile ${p.id}:`,
        rpcError,
      );
      const meta = (p.metadata ?? {}) as Record<string, unknown>;
      const merged = { ...meta, ...updates };
      const { error: updateErr } = await supabase
        .from("business_profiles")
        .update({ metadata: merged })
        .eq("id", p.id);
      if (updateErr) {
        throw new Error(
          `Deactivation fallback update failed for profile ${p.id}: ${updateErr.message}`,
        );
      }
    }

    console.log(
      `[stripe-webhook] Deactivated medjobs subscription for profile ${p.id}`,
    );
  }
}
