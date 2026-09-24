import { getOrCreateSessionId } from "./session";
import { isPreviewMode } from "./preview-mode";

export type BenefitsEnrichmentStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const BENEFITS_ENRICHMENT_STEP_NAMES: Record<BenefitsEnrichmentStep, string> = {
  1: "recipient",    // Who needs care?
  2: "timeline",     // How soon?
  3: "payment",      // How will you pay?
  4: "phone",        // Want this by text? (stays at this depth — the one ask
                     // the dialogue can't continue without; facts go AFTER)
  5: "age",          // How old is the person needing care?
  6: "medicaid",     // Do they have Medicaid? (skipped when payment=medicaid)
  7: "income",       // Monthly household income band
};

interface BenefitsEnrichmentEventParams {
  programId: string;
  stateCode: string;
  profileId?: string;
  ctaSurface?: "desktop" | "mobile";
  /** Program-card flow experiment arm ("control" | "three_tap"), stored as
   *  metadata.card_flow on every event so the arms can be compared. */
  cardFlow?: string | null;
}

/**
 * A three_tap step or action that has no slot in the numbered 1-7 control
 * flow. Reuses the existing event types (no new event_type values, so no DB
 * CHECK migration) and carries the detail in metadata.step_name. `step` is
 * deliberately absent so the admin enrichment funnel, which counts numbered
 * steps, is not skewed by these.
 */
export type BenefitsNamedStep =
  | "household_size"
  | "income_vs_limit"
  | "call_tapped"
  | "text_me_opened"
  | "more_questions_opened"
  | "plan_opened";

export function trackBenefitsNamedStep(
  stepName: BenefitsNamedStep,
  kind: "completed" | "skipped",
  params: BenefitsEnrichmentEventParams,
  extra?: Record<string, unknown>,
): void {
  fireBenefitsEnrichmentEvent(
    kind === "completed" ? "benefits_enrichment_step_completed" : "benefits_enrichment_step_skipped",
    { ...params, ...(extra || {}), step_name: stepName },
  );
}

/**
 * Track when user enters the benefits enrichment flow (after email submission)
 */
export function trackBenefitsEnrichmentStarted(params: BenefitsEnrichmentEventParams): void {
  fireBenefitsEnrichmentEvent("benefits_enrichment_started", {
    ...params,
    step: 1,
    step_name: BENEFITS_ENRICHMENT_STEP_NAMES[1],
  });
}

/**
 * Track when user completes a specific benefits enrichment step
 */
export function trackBenefitsEnrichmentStepCompleted(
  step: BenefitsEnrichmentStep,
  params: BenefitsEnrichmentEventParams
): void {
  fireBenefitsEnrichmentEvent("benefits_enrichment_step_completed", {
    ...params,
    step,
    step_name: BENEFITS_ENRICHMENT_STEP_NAMES[step],
  });
}

/**
 * Track when user skips a specific step
 */
export function trackBenefitsEnrichmentStepSkipped(
  step: BenefitsEnrichmentStep,
  params: BenefitsEnrichmentEventParams,
  completedSteps: BenefitsEnrichmentStep[]
): void {
  fireBenefitsEnrichmentEvent("benefits_enrichment_step_skipped", {
    ...params,
    step,
    step_name: BENEFITS_ENRICHMENT_STEP_NAMES[step],
    completed_steps: completedSteps,
    completed_count: completedSteps.length,
  });
}

/**
 * Track when user completes all benefits enrichment steps (answered or skipped)
 */
export function trackBenefitsEnrichmentCompleted(
  params: BenefitsEnrichmentEventParams,
  completedSteps: BenefitsEnrichmentStep[],
  extra?: Record<string, unknown>,
): void {
  fireBenefitsEnrichmentEvent("benefits_enrichment_completed", {
    ...params,
    ...(extra || {}),
    completed_steps: completedSteps,
    total_answered: completedSteps.length,
  });
}

function fireBenefitsEnrichmentEvent(
  eventType: string,
  metadata: Record<string, unknown>
): void {
  // Admin preview (?preview_arm=) walks the card without polluting the funnel.
  if (isPreviewMode()) return;
  const sessionId = getOrCreateSessionId();
  // cardFlow → card_flow, the key every other surface uses.
  const { cardFlow, ...rest } = metadata as { cardFlow?: unknown } & Record<string, unknown>;
  metadata = { ...rest, card_flow: typeof cardFlow === "string" ? cardFlow : null };

  // Fire and forget - don't block UI
  fetch("/api/activity/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actor_type: "anonymous",
      related_provider_id: metadata.programId,
      event_type: eventType,
      session_id: sessionId,
      metadata: {
        ...metadata,
        session_id: sessionId,
      },
    }),
  }).catch(() => {
    // Silent fail - analytics should never break UX
  });
}
