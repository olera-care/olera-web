import { getOrCreateSessionId } from "./session";

export type EnrichmentStep = 1 | 2 | 3 | 4 | 5 | 6;

export const ENRICHMENT_STEP_NAMES: Record<EnrichmentStep, string> = {
  1: "recipient",    // Who needs care?
  2: "timeline",     // How soon?
  3: "careType",     // What type of care?
  4: "careNeed",     // What help is needed?
  5: "payment",      // How will you pay?
  6: "details",      // Name, phone, location
};

interface EnrichmentEventParams {
  providerId: string;
  ctaVariant?: string | null;
  ctaSurface?: "desktop" | "mobile";
}

/**
 * Track when user enters the enrichment flow (after email submission)
 */
export function trackEnrichmentStarted(params: EnrichmentEventParams): void {
  fireEnrichmentEvent("enrichment_started", {
    ...params,
    step: 1,
    step_name: ENRICHMENT_STEP_NAMES[1],
  });
}

/**
 * Track when user completes a specific enrichment step
 */
export function trackEnrichmentStepCompleted(
  step: EnrichmentStep,
  params: EnrichmentEventParams
): void {
  fireEnrichmentEvent("enrichment_step_completed", {
    ...params,
    step,
    step_name: ENRICHMENT_STEP_NAMES[step],
  });
}

/**
 * Track when user skips from a specific step (saves partial data)
 */
export function trackEnrichmentStepSkipped(
  step: EnrichmentStep,
  params: EnrichmentEventParams,
  completedSteps: EnrichmentStep[]
): void {
  fireEnrichmentEvent("enrichment_step_skipped", {
    ...params,
    step,
    step_name: ENRICHMENT_STEP_NAMES[step],
    completed_steps: completedSteps,
    completed_count: completedSteps.length,
  });
}

/**
 * Track when user completes all 6 enrichment steps
 */
export function trackEnrichmentCompleted(params: EnrichmentEventParams): void {
  fireEnrichmentEvent("enrichment_completed", {
    ...params,
    step: 6,
    step_name: ENRICHMENT_STEP_NAMES[6],
  });
}

/**
 * Track when user clicks "Go live" in the enrichment flow (step 7)
 */
export function trackEnrichmentGoLive(params: EnrichmentEventParams): void {
  fireEnrichmentEvent("enrichment_profile_published", {
    ...params,
    step: 7,
    step_name: "goLive",
    source: "enrichment_flow",
  });
}

/**
 * Track when user clicks "Maybe later" on the Go Live step
 */
export function trackEnrichmentGoLiveSkipped(params: EnrichmentEventParams): void {
  fireEnrichmentEvent("enrichment_go_live_skipped", {
    ...params,
    step: 7,
    step_name: "goLive",
    source: "enrichment_flow",
  });
}

function fireEnrichmentEvent(
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
      related_provider_id: metadata.providerId,
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
