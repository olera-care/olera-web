import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local to enable payments."
    );
  }

  stripeInstance = new Stripe(key, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });

  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Price IDs for subscription plans.
 * Set these in .env.local once you create the products in your Stripe dashboard.
 */
export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || "",
  annual: process.env.STRIPE_PRICE_ANNUAL || "",
  medjobs_monthly: process.env.STRIPE_PRICE_MEDJOBS_MONTHLY || "",
};
