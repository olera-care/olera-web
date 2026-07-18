import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { BUDGET_STOPS, budgetStop } from "./estimate";

/**
 * Ad Boost billing — Stripe subscription checkout for the paid monthly plans.
 *
 * Plans are flat and ALL-IN (ad spend + setup + management bundled — never an
 * itemized service fee, never per-lead). Prices are found-or-created in Stripe
 * by lookup_key, so there is no dashboard setup step and no new env vars: the
 * first checkout for a tier creates the product+price once, every later
 * checkout reuses it. Retuning tier amounts in estimate.ts mints new lookup
 * keys automatically (the key embeds the amount).
 *
 * The ONLY place this is called from is the post-intro wrap-up moment
 * (/provider/boost) — the plan of record forbids a payment ask at signup.
 */

/** Paid plan values (the free intro stop is excluded — it is never billable). */
export const PAID_PLAN_VALUES: number[] = BUDGET_STOPS.filter(
  (s) => s.sublabel !== "on us",
).map((s) => s.value);

function lookupKey(planValue: number): string {
  return `adboost_${planValue}_monthly`;
}

/** Find the tier's recurring price by lookup_key, creating product+price on
 *  first use. Idempotent: lookup_keys are unique per Stripe account. */
export async function findOrCreateAdBoostPrice(
  planValue: number,
): Promise<Stripe.Price> {
  const stripe = getStripe();
  const key = lookupKey(planValue);

  const existing = await stripe.prices.list({
    lookup_keys: [key],
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0];

  const stop = budgetStop(planValue);
  const tierName = stop?.name ?? `$${planValue}/mo`;
  return stripe.prices.create({
    currency: "usd",
    unit_amount: planValue * 100,
    recurring: { interval: "month" },
    lookup_key: key,
    // product_data creates the product inline on first use; the price is then
    // permanently discoverable via the lookup_key above.
    product_data: {
      name: `Olera Ad Boost ${tierName}`,
      metadata: { product: "adboost", plan_value: String(planValue) },
    },
  });
}

/** Create the wrap-up checkout session for a campaign request. Returns the
 *  hosted Checkout URL. Activation happens in the Stripe webhook (Edge Function
 *  stripe-webhook + Vercel mirror), keyed on metadata.product === "adboost". */
export async function createAdBoostCheckout(opts: {
  requestId: string;
  providerId: string;
  providerEmail: string | null;
  /** Reuse an existing Stripe customer if the row already has one. */
  stripeCustomerId: string | null;
  planValue: number;
  origin: string;
}): Promise<{ url: string | null; sessionId: string }> {
  const stripe = getStripe();
  const price = await findOrCreateAdBoostPrice(opts.planValue);

  const metadata = {
    product: "adboost",
    request_id: opts.requestId,
    provider_id: opts.providerId,
    plan_value: String(opts.planValue),
  };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    // Reuse the customer when known; otherwise let Checkout collect the email
    // (prefilled when we have one) and create the customer.
    ...(opts.stripeCustomerId
      ? { customer: opts.stripeCustomerId }
      : opts.providerEmail
        ? { customer_email: opts.providerEmail }
        : {}),
    success_url: `${opts.origin}/provider/boost?subscribed=true`,
    cancel_url: `${opts.origin}/provider/boost`,
    // Session metadata drives checkout.session.completed; subscription metadata
    // lets later subscription.updated/deleted events identify Ad Boost subs.
    metadata,
    subscription_data: { metadata },
  });

  return { url: session.url, sessionId: session.id };
}
