// Stripe webhook receiver for MedJobs Pro subscription activation.
//
// Runs on Supabase Edge Functions (Deno). Replaces the Vercel route
// `app/api/stripe/webhook/route.ts` for production use — Vercel's Bot
// Protection edge layer blocks Stripe's GCP-origin webhook POSTs with 403,
// and after multiple days of firewall config attempts we could not route
// around it reliably. Supabase Edge Functions are not behind that layer.
//
// Scope (MVP):
//   - checkout.session.completed (metadata.product === "medjobs") → activate
//   - customer.subscription.deleted                               → deactivate
//
// Other event types are acknowledged (200) but not processed. This matches
// the user's narrowed scope to MedJobs Pro only.
//
// Deploy: see ./README.md
//
// Environment variables (auto-injected by Supabase for Edge Functions):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Environment variables (set manually via `supabase secrets set`):
//   STRIPE_SECRET_KEY       — sk_live_... (used only if future event types
//                             need to call Stripe API; current handlers don't)
//   STRIPE_WEBHOOK_SECRET   — whsec_... from Stripe Dashboard → webhook endpoint

import Stripe from "npm:stripe@20.3.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
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
  // async in Web Crypto API.
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe-webhook] Signature verification failed:", msg);
    return new Response(
      JSON.stringify({ error: "Invalid signature", detail: msg }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  console.log(`[stripe-webhook] Received event ${event.id} type=${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Only handle MedJobs flow in MVP. Other checkout sessions are logged
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

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

        await deactivateMedjobsByCustomer(customerId);
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
