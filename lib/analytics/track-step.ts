// Fire-and-forget client helper for the benefits intake per-step funnel.
// Posts to /api/benefits/track-step with keepalive so events survive
// page navigations during the intake flow.
//
// Errors are swallowed — analytics must never block the UX.

export type BenefitsStepEvent =
  | "benefits_entry_viewed"
  | "benefits_step_viewed"
  | "benefits_step_completed";

export interface TrackBenefitsEventPayload {
  event: BenefitsStepEvent;
  sessionId: string;
  stateCode: string | null;
  stateName: string | null;
  providerName: string | null;
  providerSlug: string | null;
  variant: string;
  stepNumber?: number;
  stepName?: string;
  timeOnStepMs?: number;
}

export function trackBenefitsEvent(payload: TrackBenefitsEventPayload): void {
  try {
    fetch("/api/benefits/track-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      console.error("[trackBenefitsEvent] fetch failed:", err);
    });
  } catch (err) {
    console.error("[trackBenefitsEvent] threw:", err);
  }
}
