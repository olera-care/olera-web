/**
 * Managed Ads — budget stops + lead/reach estimate model (TUNABLE).
 *
 * This is the single source of truth for the budget step on /provider/boost.
 * The numbers below are conservative INDUSTRY benchmarks for non-medical home
 * care lead-gen (June 2026 research) — NOT Olera first-party data, which is too
 * thin this early to anchor on. The moment the pilot produces a real
 * spend -> `delivered` ratio, replace the band + per-stop copy here and the UI
 * needs no changes.
 *
 * Why these numbers (sources in plans/managed-ads-budget-step-plan.md §9):
 *  - Non-medical home care is *local personal-services* economics, NOT assisted
 *    living facilities (whose $250-$700 CPL does NOT apply here).
 *  - Home-care search CPC ~$6-$18; realistic effective CPL ~$80-$150 (optimized
 *    best case ~$40-$55). Click->lead ~8-15%, and the conversion happens on the
 *    Olera provider page, so page completeness *is* the conversion rate.
 *  - $50-$300 are micro-budgets — an order of magnitude below the ~$1,500/mo the
 *    specialists call "minimum viable" — so they run at the WORSE end of CPL with
 *    lumpy volume. The copy reflects that honestly: low budgets promise
 *    visibility, not a lead count.
 *
 * The honesty model: as the budget rises, the estimate shifts from REACH language
 * (no lead count) to LEAD language (a range). The provider feels "more spend ->
 * real leads" without being lectured. The whole "you must spend for real leads"
 * message is BUDGET_HONEST_LINE + BUDGET_ESTIMATE_CAVEAT — two lines, no warning
 * paragraph. The caveat hands off to the live `delivered` counter (the truthful
 * payoff that justifies not promising leads upfront).
 */

export type BudgetStop = {
  /** Whole dollars per month. The $50 stop is the intro Olera covers. */
  value: number;
  /** Pill label, e.g. "$150/mo". */
  label: string;
  /** Small qualifier under the label (e.g. "on us", "Recommended for steady leads"). */
  note?: string;
  /** The single quiet marker — the steady-leads anchor. */
  recommended?: boolean;
  /** "reach" stops promise visibility (no lead count); "leads" stops give a range. */
  kind: "reach" | "leads";
  /** The estimate line shown in the summary when this stop is selected. */
  estimate: string;
};

/** Where steady, consistent lead flow honestly begins (the anchor in the copy). */
export const STEADY_LEADS_THRESHOLD = 600;

export const BUDGET_STOPS: BudgetStop[] = [
  {
    value: 50,
    label: "$50",
    note: "on us",
    kind: "reach",
    estimate: "You're live — local families start seeing your page.",
  },
  {
    value: 150,
    label: "$150/mo",
    kind: "leads",
    estimate: "A few inquiries a month — enough to learn what families respond to.",
  },
  {
    value: 300,
    label: "$300/mo",
    kind: "leads",
    estimate: "Roughly 2–5 inquiries a month.",
  },
  {
    value: STEADY_LEADS_THRESHOLD,
    label: "$600+/mo",
    note: "Recommended for steady leads",
    recommended: true,
    kind: "leads",
    estimate: "Steady, consistent inquiries — the level most agencies run for real flow.",
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
