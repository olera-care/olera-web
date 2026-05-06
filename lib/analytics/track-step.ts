// Fire-and-forget client helper for the benefits intake per-step funnel.
// Posts to /api/benefits/track-step with keepalive so events survive
// page navigations during the intake flow.
//
// Errors are swallowed — analytics must never block the UX.

import { isPreviewMode } from "./preview-mode";

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
  /** V3: which care-need card the user picked at step 1. Lets the admin
   *  funnel break out per-card pickup rates. Only set on
   *  `benefits_step_completed` for stepName === "care-need". */
  careNeedSelected?: string | null;
  /** Path of the page the module was mounted on. Provider pages leave this
   *  null (routing is implied by providerSlug); editorial mounts pass
   *  `/caregiver-support/{slug}`. Used downstream to segment funnel by
   *  entry page. */
  entrySource?: string | null;
}

export function trackBenefitsEvent(payload: TrackBenefitsEventPayload): void {
  // Admin preview mode: skip all benefits-funnel events so admin
  // inspection of an arm doesn't pollute the A/B funnel.
  if (isPreviewMode()) return;
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
