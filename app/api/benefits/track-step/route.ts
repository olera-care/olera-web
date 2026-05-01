import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Per-step funnel events for the embedded benefits intake on provider pages.
// Mirrors /api/benefits/track-start (sibling route): writes to provider_activity
// keyed on providerSlug, gated on providerSlug && sessionId, fire-and-forget.
//
// Three event types:
//   - benefits_entry_viewed  → fires once when BenefitsDiscoveryModule mounts
//   - benefits_step_viewed   → fires on each step mount (step_number, step_name)
//   - benefits_step_completed → fires on each step submit (+ time_on_step_ms)
//
// Deliberately NO Slack alert — these would flood #ai-product-development.
// benefits_started keeps its alert as the "real" signal.

type StepEvent = "benefits_entry_viewed" | "benefits_step_viewed" | "benefits_step_completed";

const VALID_EVENTS: ReadonlySet<StepEvent> = new Set([
  "benefits_entry_viewed",
  "benefits_step_viewed",
  "benefits_step_completed",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getServiceDb(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event: string = body.event;
    if (!VALID_EVENTS.has(event as StepEvent)) {
      // Unknown event type — swallow rather than 4xx; analytics must never block UX.
      return NextResponse.json({ ok: true });
    }

    const sessionId: string | null = body.sessionId || null;
    const stateCode: string | null = body.stateCode || null;
    const stateName: string | null = body.stateName || null;
    const providerName: string | null = body.providerName || null;
    const providerSlug: string | null = body.providerSlug || null;
    const stepNumber: number | null = typeof body.stepNumber === "number" ? body.stepNumber : null;
    const stepName: string | null = body.stepName || null;
    const timeOnStepMs: number | null = typeof body.timeOnStepMs === "number" ? body.timeOnStepMs : null;
    const variant: string | null = body.variant || null;
    // V3 per-card pickup tracking — only present on benefits_step_completed
    // for stepName === "care-need". Lets the admin funnel break out which of
    // the four cards is actually pulling clicks.
    const careNeedSelected: string | null = body.careNeedSelected || null;

    const db = getServiceDb();
    if (db && providerSlug && sessionId) {
      db.from("provider_activity").insert({
        provider_id: providerSlug,
        profile_id: null,
        event_type: event,
        metadata: {
          session_id: sessionId,
          state: stateCode,
          state_name: stateName,
          provider_name: providerName,
          step_number: stepNumber,
          step_name: stepName,
          time_on_step_ms: timeOnStepMs,
          variant,
          care_need_selected: careNeedSelected,
        },
      }).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.error(`[track-step] ${event} insert failed:`, error);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track-step] Error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
