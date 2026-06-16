/**
 * Managed Ads — budget stops + lead/reach estimate model (TUNABLE).
 *
 * This is the single source of truth for the budget step on /provider/boost.
 * The numbers below are conservative INDUSTRY benchmarks for non-medical home
 * care lead-gen (June 2026 research) — NOT Olera first-party data, which is too
 * thin this early to anchor on. The moment the pilot produces a real
 * spend -> `delivered` ratio, replace the ranges + copy here and the UI needs no
 * changes.
 *
 * Why these numbers (sources in plans/managed-ads-budget-step-plan.md §9):
 *  - Non-medical home care is *local personal-services* economics, NOT assisted
 *    living facilities (whose $250-$700 CPL does NOT apply here).
 *  - Home-care search CPC ~$6-$18; realistic effective CPL ~$80-$150 (optimized
 *    best case ~$40-$55). The per-stop ranges below are budget / $80-$150 CPL,
 *    floored conservatively because micro-budgets run at the worse end with lumpy
 *    volume. Click->lead happens on the Olera page, so completeness = conversion.
 *
 * The honesty model: as the budget rises, the estimate shifts from REACH framing
 * ($50 = "You're live", NO number) to a LEAD range. The provider feels "more
 * spend -> real leads" without a lecture. The whole "you must spend for real
 * leads" message is the recommended-tier marker + BUDGET_HONEST_LINE +
 * BUDGET_ESTIMATE_CAVEAT — which bridges to the live `delivered` counter (the
 * truthful payoff that justifies not promising leads upfront).
 */

export type BudgetStop = {
  /** Whole dollars per month. The $50 stop is the intro Olera covers. */
  value: number;
  /** Full label for the summary / review rows, e.g. "$150/mo". */
  label: string;
  /** Big amount on the card, line 1 (e.g. "$150") — kept short so it never clips. */
  amount: string;
  /** Small descriptor centered under the amount (e.g. "/mo", "on us"). */
  sublabel: string;
  /** The single quiet marker — the steady-leads anchor (renders a pill). */
  recommended?: boolean;
  /** "reach" promises visibility (no lead count); "leads" gives a range. */
  kind: "reach" | "leads";
  /** The BIG focal line. Leads -> a range ("2–4"); reach -> a short phrase. */
  headline: string;
  /** Unit shown beside a leads range (omitted for reach). */
  unit?: string;
  /** Supporting one-liner under the headline. */
  estimate: string;
};

/** Where steady, consistent lead flow honestly begins (the anchor in the copy). */
export const STEADY_LEADS_THRESHOLD = 600;

/** Sensible default so the budget step opens with its payoff already visible. */
export const DEFAULT_BUDGET = 150;

export const BUDGET_STOPS: BudgetStop[] = [
  {
    value: 50,
    label: "$50 (on us)",
    amount: "$50",
    sublabel: "on us",
    kind: "reach",
    headline: "You're live",
    estimate: "Local families start seeing your page.",
  },
  {
    value: 150,
    label: "$150/mo",
    amount: "$150",
    sublabel: "/mo",
    kind: "leads",
    headline: "1–2",
    unit: "inquiries / mo",
    estimate: "Enough to learn what families respond to.",
  },
  {
    value: 300,
    label: "$300/mo",
    amount: "$300",
    sublabel: "/mo",
    kind: "leads",
    headline: "2–4",
    unit: "inquiries / mo",
    estimate: "A steady read on what your market sends.",
  },
  {
    value: STEADY_LEADS_THRESHOLD,
    label: "$600+/mo",
    amount: "$600+",
    sublabel: "/mo",
    recommended: true,
    kind: "leads",
    headline: "4–8",
    unit: "inquiries / mo",
    estimate: "Consistent flow — the level most agencies run for.",
  },
];

/** The exact dollar values a request may carry (POST validation allowlist). */
export const BUDGET_VALUES: number[] = BUDGET_STOPS.map((s) => s.value);

/** The one honest line: factual + social-proofed, NOT a warning. */
export const BUDGET_HONEST_LINE =
  "Your first $50 is on us to get you live. Steady inquiries really begin around $600/mo — that's where most agencies run for consistent leads.";

/** Shown once near the estimate. Verbatim bridge to the live `delivered` counter. */
export const BUDGET_ESTIMATE_CAVEAT =
  "Estimate — actual results vary with your market, budget, and how fast you respond. We'll show you exactly what your campaign delivered.";

/** Look up a stop by its dollar value (null-safe). */
export function budgetStop(value: number | null | undefined): BudgetStop | null {
  if (value == null) return null;
  return BUDGET_STOPS.find((s) => s.value === value) ?? null;
}

/** Human label for a stored budget value (e.g. for the summary / in-motion echo). */
export function budgetLabel(value: number | null | undefined): string | null {
  return budgetStop(value)?.label ?? null;
}

/** Compact estimate for the summary card, e.g. "≈ 2–4 inquiries / mo" or "You're live". */
export function estimateSummary(stop: BudgetStop): string {
  return stop.kind === "leads" ? `≈ ${stop.headline} ${stop.unit}` : stop.headline;
}
