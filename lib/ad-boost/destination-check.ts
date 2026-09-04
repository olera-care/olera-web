/**
 * Ad Boost destination coherence gate (plan gate G4).
 *
 * An Ad Boost flight buys clicks that land on a provider's Olera page. If that
 * page contradicts itself, the money is spent before the family ever reaches a
 * decision. This gate is the automated half of "destination coherent" -- it is
 * meant to run BEFORE a flight is allowed to launch, not as a post-mortem.
 *
 * It exists because of a real case: Graceful Homecare took 134 Nextdoor clicks
 * at $0.37 to a page whose header showed a regional hourly benchmark while her
 * own service rows read "$30 per month". Zero inquiries resulted. Nothing in
 * the system was capable of noticing.
 *
 * DESIGN NOTE -- unusual units are not errors.
 * A home-care agency quoting a daily live-in rate, a clinic quoting per visit,
 * or an agency quoting a flat assessment fee are all legitimate. We therefore
 * never require a provider's unit to equal the category default. We require
 * only that unusual units are UNAMBIGUOUS: readable, internally consistent,
 * and not silently compared against a benchmark expressed in a different unit.
 */

import {
  getPricingConfig,
  normalizeRateType,
  summarizeProviderRates,
  type RateUnit,
} from "@/lib/pricing-config";

export type FindingSeverity = "blocker" | "warning";

export interface DestinationFinding {
  code: string;
  severity: FindingSeverity;
  message: string;
}

export interface DestinationCheckInput {
  slug: string;
  category: string | null | undefined;
  state?: string | null;
  metadata: {
    contact_for_pricing?: boolean;
    price_range?: string | null;
    price_min?: number | null;
    price_max?: number | null;
    price_unit?: string | null;
    hourly_rate_min?: number | null;
    hourly_rate_max?: number | null;
    pricing_details?: Array<{
      service?: string;
      rate?: unknown;
      rateMin?: unknown;
      rateMax?: unknown;
      rateType?: string | null;
    }> | null;
  } | null;
}

export interface DestinationCheckResult {
  slug: string;
  passes: boolean;
  /** What the public page will show as its headline price source. */
  priceSource: "provider_reported" | "regional_estimate" | "contact_only";
  findings: DestinationFinding[];
}

function hasOwnHeadlinePrice(m: NonNullable<DestinationCheckInput["metadata"]>): boolean {
  return Boolean(
    m.price_range ||
      m.price_min != null ||
      m.price_max != null ||
      (m.hourly_rate_min != null && m.hourly_rate_max != null),
  );
}

/**
 * Evaluate one provider page's pricing coherence.
 *
 * `passes` is false only when a BLOCKER is present. Warnings are surfaced for
 * an operator to accept deliberately -- they describe a page that is honest
 * but weak, not one that is wrong.
 */
export function checkDestination(input: DestinationCheckInput): DestinationCheckResult {
  const findings: DestinationFinding[] = [];
  const m = input.metadata ?? {};
  const categoryUnit: RateUnit = input.category ? getPricingConfig(input.category).unit : "month";
  const details = Array.isArray(m.pricing_details) ? m.pricing_details : [];

  // --- Unit readability, per priced row -------------------------------------
  // Only rows carrying an actual number matter. An empty rate with a stray
  // rateType is untidy but invisible to families, so it is a warning.
  const pricedRows = details.filter(
    (r) => String(r.rateMin ?? r.rate ?? "").replace(/[^0-9.]/g, "").length > 0,
  );
  const emptyRowsWithUnit = details.filter(
    (r) =>
      String(r.rateMin ?? r.rate ?? "").replace(/[^0-9.]/g, "").length === 0 &&
      String(r.rateType ?? "").trim().length > 0,
  );

  if (emptyRowsWithUnit.length > 0) {
    findings.push({
      code: "empty_row_with_unit",
      severity: "warning",
      message: `${emptyRowsWithUnit.length} service row(s) carry a rate unit but no price. Harmless today; they will publish a wrong unit the moment someone enters a number.`,
    });
  }

  const unreadable = pricedRows.filter((r) => normalizeRateType(r.rateType) === null);
  if (unreadable.length > 0) {
    findings.push({
      code: "unreadable_unit",
      severity: "blocker",
      message: `${unreadable.length} priced service row(s) have an unrecognized rate unit (${unreadable
        .map((r) => JSON.stringify(r.rateType ?? null))
        .join(", ")}). A family cannot tell what the number means.`,
    });
  }

  // --- Unit consistency across priced rows -----------------------------------
  const units = new Set<RateUnit>();
  for (const r of pricedRows) {
    const u = normalizeRateType(r.rateType);
    if (u) units.add(u);
  }

  if (units.size > 1) {
    findings.push({
      code: "mixed_units",
      severity: "blocker",
      message: `Service rows mix rate units (${[...units].join(", ")}). Two prices in different units sitting side by side read as a contradiction.`,
    });
  }

  // --- Unusual units must be deliberate, not accidental ----------------------
  // Explicit handling, per the rule that daily/visit/flat rates are legitimate.
  if (units.size === 1) {
    const unit = [...units][0];
    if (unit !== categoryUnit) {
      findings.push({
        code: "unusual_unit",
        severity: "warning",
        message: `Rates are quoted per ${unit} while ${input.category ?? "this category"} is normally priced per ${categoryUnit}. Legitimate for live-in, per-visit or flat-fee models — confirm it is intentional. This page's price must not be compared against the regional benchmark, which is per ${categoryUnit}.`,
      });
    }
  }

  // --- Magnitude sanity, per stated unit -------------------------------------
  // Distinct from "unusual unit". This does not care which unit a provider
  // chose; it asks whether the NUMBER is possible in the unit they chose.
  // $30/month for home care is not an unusual billing model, it is an hourly
  // rate wearing the wrong label -- and it is the exact shape that sent 134
  // paid Nextdoor clicks to a page quoting monthly care for the price of lunch.
  const PLAUSIBLE: Partial<Record<RateUnit, { min: number; max: number }>> = {
    hour: { min: 8, max: 250 },
    day: { min: 60, max: 2_000 },
    month: { min: 500, max: 40_000 },
    visit: { min: 15, max: 2_000 },
    // flat: deliberately unbounded — a flat fee can be almost anything.
  };

  for (const r of pricedRows) {
    const unit = normalizeRateType(r.rateType);
    if (!unit) continue; // already reported as unreadable
    const bounds = PLAUSIBLE[unit];
    if (!bounds) continue;
    const value = Number(String(r.rateMin ?? r.rate ?? "").replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(value) || value <= 0) continue;
    if (value < bounds.min || value > bounds.max) {
      findings.push({
        code: "implausible_rate_for_unit",
        severity: "blocker",
        message: `"${r.service ?? "service"}" is listed at $${value.toLocaleString()} per ${unit}, outside the plausible range ($${bounds.min.toLocaleString()}–$${bounds.max.toLocaleString()} per ${unit}). Almost always a rate saved against the wrong unit.`,
      });
    }
  }

  // --- Which source will the page publish? ------------------------------------
  let priceSource: DestinationCheckResult["priceSource"];
  if (m.contact_for_pricing === true) {
    priceSource = "contact_only";
  } else if (hasOwnHeadlinePrice(m)) {
    priceSource = "provider_reported";
  } else if (summarizeProviderRates(details, input.category)) {
    priceSource = "provider_reported";
  } else if (input.state) {
    priceSource = "regional_estimate";
  } else {
    priceSource = "contact_only";
  }

  // --- Header vs rows disagreement -------------------------------------------
  // The Graceful case: a regional hourly header above the provider's own rows.
  if (priceSource === "regional_estimate" && pricedRows.length > 0) {
    findings.push({
      code: "benchmark_over_own_rates",
      severity: "blocker",
      message:
        "The headline price will be a regional market average even though this provider publishes their own service rates. Families see two different numbers and cannot tell which is the provider's.",
    });
  }

  if (priceSource === "regional_estimate") {
    findings.push({
      code: "no_provider_price",
      severity: "warning",
      message:
        "This provider publishes no price, so the page shows an area benchmark labelled \"Typical in this area\". Buying clicks to a page with no real price is weaker than buying clicks to one with a price.",
    });
  }

  if (priceSource === "contact_only" && m.contact_for_pricing !== true) {
    findings.push({
      code: "no_price_at_all",
      severity: "warning",
      message: "The page will show no price and the provider has not explicitly chosen \"Contact for pricing\".",
    });
  }

  return {
    slug: input.slug,
    passes: !findings.some((f) => f.severity === "blocker"),
    priceSource,
    findings,
  };
}
