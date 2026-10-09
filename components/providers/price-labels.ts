import type { PriceSource } from "@/components/providers/PriceEstimate";

/**
 * One rule for how a provider's price is labelled, wherever it appears: the
 * hero, the request card, the phone bar, compare and guide cards. Every surface
 * gets the price and its source from the provider page, so they cannot drift.
 *
 *   provider_reported  — the agency's own rate (entered on its claimed account)
 *   regional_estimate  — Olera's CareScout/Genworth area estimate, never the agency's
 *   contact_only       — the agency chose not to publish; show no number
 */

/** A string that is an actual amount, not "Contact for pricing" or empty. */
export function isShowablePrice(price: string | null | undefined): price is string {
  if (!price) return false;
  return price.trim().toLowerCase() !== "contact for pricing";
}

/** The line under a price that says what it is. */
export function priceCaption(source: PriceSource | undefined): string | null {
  switch (source) {
    case "provider_reported":
      return "This provider's own rate";
    case "contact_only":
      return null;
    default:
      return "Area estimate — not this provider's actual price";
  }
}

/** Short form for tight spaces such as the phone bar. */
export function priceInline(price: string, source: PriceSource | undefined): string {
  return source === "provider_reported" ? price : `${price} estimated`;
}

/** Header over a compare or guide price ("Est. Hourly" vs "Hourly"). */
export function priceHeaderPrefix(source: PriceSource | undefined): string {
  return source === "provider_reported" ? "" : "Est. ";
}
