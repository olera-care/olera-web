// Deterministic arm assignment for the program-page card flow test
// (ProgramBenefitsCard: the bottom sheet on mobile, the right rail on desktop).
//
// The program page, the "Check my eligibility" button and the email step are
// identical in both arms. The arm only decides what happens AFTER the email
// is saved:
//   control   — today's seven questions (who, when, pay, phone, age,
//               Medicaid, income), ending in "Sent. Check your inbox."
//   three_tap — who it's for, household size, one income question against
//               the page's own income table, then an answer screen that ends
//               with the call for the program they came for.
//
// Same shape as the other experiments (intake, cta, mobile nav): a canonical
// list, a default weight map used when the experiment_weights row is missing,
// and a weighted, version-namespaced djb2 bucket so a dial change reshuffles
// returning visitors in one cut. Sticky per visitor via the olera session id.

export const PROGRAM_CARD_FLOWS = ["control", "three_tap"] as const;

export type ProgramCardFlow = (typeof PROGRAM_CARD_FLOWS)[number];

/** 50/50 until TJ moves the dial in /admin/analytics. */
export const PROGRAM_CARD_FLOW_DEFAULT_WEIGHTS: Record<ProgramCardFlow, number> = {
  control: 50,
  three_tap: 50,
};

export type ProgramCardFlowWeightMap = Partial<Record<ProgramCardFlow, number>>;

/** Query param that forces an arm, for previews and QA: ?card_flow=three_tap */
export const PROGRAM_CARD_FLOW_PARAM = "card_flow";

export function isProgramCardFlow(v: unknown): v is ProgramCardFlow {
  return typeof v === "string" && (PROGRAM_CARD_FLOWS as readonly string[]).includes(v);
}

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/**
 * Weighted assignment. Missing keys are 0 (dark); the sum is normalized, and
 * an all-zero map falls back to an equal split rather than going dark.
 * `version` is namespaced into the hash (with the experiment name, so this
 * split is uncorrelated with the other experiments on the same session id).
 */
export function assignProgramCardFlowWeighted(
  sessionId: string,
  weights: ProgramCardFlowWeightMap,
  version: number,
): ProgramCardFlow {
  const total = PROGRAM_CARD_FLOWS.reduce((sum, v) => sum + Math.max(0, weights[v] ?? 0), 0);
  if (total <= 0) return PROGRAM_CARD_FLOWS[djb2(sessionId) % PROGRAM_CARD_FLOWS.length];

  const r = djb2(`${sessionId}:program_card_flow:v${version}`) / 0x1_0000_0000;
  const target = r * total;
  let cumulative = 0;
  for (const v of PROGRAM_CARD_FLOWS) {
    cumulative += Math.max(0, weights[v] ?? 0);
    if (target < cumulative) return v;
  }
  for (let i = PROGRAM_CARD_FLOWS.length - 1; i >= 0; i--) {
    if ((weights[PROGRAM_CARD_FLOWS[i]] ?? 0) > 0) return PROGRAM_CARD_FLOWS[i];
  }
  return PROGRAM_CARD_FLOWS[0];
}
