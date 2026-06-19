import { getOrCreateSessionId } from "./session";

export type BenefitsEnrichmentStep = 1 | 2 | 3;

export const BENEFITS_ENRICHMENT_STEP_NAMES: Record<BenefitsEnrichmentStep, string> = {
  1: "recipient",    // Who needs care?
  2: "timeline",     // How soon?
  3: "payment",      // How will you pay?
};

interface BenefitsEnrichmentEventParams {
  programId: string;
  stateCode: string;
  profileId?: string;
  ctaSurface?: "desktop" | "mobile";
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
 * Track when user completes all 3 benefits enrichment steps (answered or skipped)
 */
export function trackBenefitsEnrichmentCompleted(
  params: BenefitsEnrichmentEventParams,
  completedSteps: BenefitsEnrichmentStep[]
): void {
  fireBenefitsEnrichmentEvent("benefits_enrichment_completed", {
    ...params,
    completed_steps: completedSteps,
    total_answered: completedSteps.length,
  });
}

function fireBenefitsEnrichmentEvent(
  eventType: string,
  metadata: Record<string, unknown>
): void {
  const sessionId = getOrCreateSessionId();

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
