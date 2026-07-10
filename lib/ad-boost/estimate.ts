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
 * Monetization model (2026-07-06 plan of record — Notion "Ad Boost Monetization
 * + Budget-Step UX — Handoff"):
 *  - The $50 stop is a FREE one-time intro campaign Olera covers ("First
 *    campaign"), gated on the existing eligibility (verified + 70% complete).
 *  - Paid tiers are named by outcome (Starter / Growth / Scale) and priced flat
 *    and ALL-IN: ad spend + setup + management bundled. Never itemize a service
 *    fee, never per-lead pricing.
 *  - The risk-reversal is the zero-inquiry-month guarantee (see
 *    /managed-ads-terms), surfaced here via BUDGET_TRUST_STRIP.
 *  - The apply flow does NOT ask the provider to pick a paid tier (2026-07-10:
 *    every real request chose the free/cheapest stop, so the pick was pure
 *    friction). Every request starts as the free intro; paid tiers appear on
 *    the apply step only as a quiet non-interactive preview. The wrap-up moment
 *    (results in hand) is the only payment ask.
 *
 * The honesty model: as the budget rises, the estimate shifts from REACH framing
 * ($50 = "You're live", NO number) to a LEAD range. The provider feels "more
 * spend -> real leads" without a lecture. Scale's blurb carries the "steady flow
 * honestly starts here" anchor; BUDGET_ESTIMATE_CAVEAT bridges to the live
 * `delivered` counter (the truthful payoff that justifies not promising leads
 * upfront).
 */

export type BudgetStop = {
  /** Whole dollars per month. The $50 stop is the free intro Olera covers. */
  value: number;
  /** Tier name — the outcome ladder (First campaign / Starter / Growth / Scale). */
  name: string;
  /** Full label for the summary / review / facts rows, e.g. "Starter · $150/mo". */
  label: string;
  /** Big amount on the card (e.g. "$150") — kept short so it never clips. */
  amount: string;
  /** Small descriptor beside the amount (e.g. "/mo", "on us"). */
  sublabel: string;
  /** Optional one-or-two-word quiet chip (outlined, never a filled banner). */
  chip?: string;
  /** "reach" promises visibility (no lead count); "leads" gives a range. */
  kind: "reach" | "leads";
  /** The BIG focal line. Leads -> a range ("2–4"); reach -> a short phrase. */
  headline: string;
  /** Unit shown beside a leads range (omitted for reach). */
  unit?: string;
  /** One honest sentence on the picker card — who this tier is for. */
  blurb: string;
  /** Supporting one-liner under the outcome headline. */
  estimate: string;
};

/** Where steady, consistent lead flow honestly begins (the anchor in the copy). */
export const STEADY_LEADS_THRESHOLD = 600;

/** Sensible default so the budget step opens with its payoff already visible. */
export const DEFAULT_BUDGET = 150;

export const BUDGET_STOPS: BudgetStop[] = [
  {
    value: 50,
    name: "First campaign",
    label: "First campaign (on us)",
    amount: "$50",
    sublabel: "on us",
    kind: "reach",
    headline: "You're live",
    blurb: "One time, on us. We run about $50 of ads to your page so you can see what families do.",
    estimate: "Local families start seeing your page.",
  },
  {
    value: 150,
    name: "Starter",
    label: "Starter · $150/mo",
    amount: "$150",
    sublabel: "/mo",
    chip: "Most chosen",
    kind: "leads",
    headline: "1–2",
    unit: "inquiries / mo",
    blurb: "Keep the ads running and learn what families respond to.",
    estimate: "Enough to learn what families respond to.",
  },
  {
    value: 300,
    name: "Growth",
    label: "Growth · $300/mo",
    amount: "$300",
    sublabel: "/mo",
    kind: "leads",
    headline: "2–4",
    unit: "inquiries / mo",
    blurb: "More hours in front of families who are searching right now.",
    estimate: "A steady read on what your market sends.",
  },
  {
    value: STEADY_LEADS_THRESHOLD,
    name: "Scale",
    label: "Scale · $600+/mo",
    amount: "$600+",
    sublabel: "/mo",
    kind: "leads",
    headline: "4–8",
    unit: "inquiries / mo",
    blurb: "Where steady weekly inquiries begin. Most agencies run at this level.",
    estimate: "Consistent flow, month over month.",
  },
];

/** The exact dollar values a request may carry (POST validation allowlist). */
export const BUDGET_VALUES: number[] = BUDGET_STOPS.map((s) => s.value);

/** Intro under the first-campaign step heading — what the intro is, no plan ask. */
export const INTRO_STEP_LINE =
  "We run about $50 of ads to your page so you can see what families actually do. No card, and no plan to pick today.";

/** The paid-tier preview footer — how continuing works, decided at the wrap-up. */
export const PAID_PREVIEW_LINE =
  "When your first campaign wraps, your results land right here and you choose whether to keep going. Paid plans are all-in: ad spend, setup, and management together, with no contract. Nothing switches on its own.";

/** Shown once near the estimate. Verbatim bridge to the live `delivered` counter. */
export const BUDGET_ESTIMATE_CAVEAT =
  "Estimates, not promises. Results vary with your market and how fast you respond. We show you exactly what your campaign delivers.";

/** The de-risk stat strip beside the picker (Robinhood-style: value big, label tiny).
 *  "Free zero-inquiry months" is the guarantee — defined on /managed-ads-terms. */
export const BUDGET_TRUST_STRIP: { value: string; label: string }[] = [
  { value: "$0", label: "due today" },
  { value: "Anytime", label: "cancel or pause" },
  { value: "Free", label: "zero-inquiry months" },
];

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
