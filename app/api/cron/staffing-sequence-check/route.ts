import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";

/**
 * GET /api/cron/staffing-sequence-check
 *
 * Runs hourly. Auto-transitions providers from `sequencing` → `needs_call`
 * when their email sequence is complete.
 *
 * This ensures providers who don't respond to emails are moved to the
 * calling queue for manual follow-up.
 *
 * Transition criteria (either condition):
 * 1. email2_sent_at is set AND > 3 days ago (normal flow with webhooks)
 * 2. sequence_started_at > 6 days ago AND email2_sent_at is null (fallback for mock mode or webhook failures)
 *
 * The fallback handles:
 * - Mock mode testing (no real Resend API, no webhooks)
 * - Webhook delivery failures
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("staffing-sequence-check", async () => {
  try {
    const db = getServiceClient();
    const now = new Date().toISOString();

    // Time thresholds
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();

    // Query 1: Normal flow - email2_sent_at is set and > 3 days ago
    const { data: normalFlow, error: normalError } = await db
      .from("staffing_outreach")
      .select("id, provider_id, batch_id")
      .eq("status", "sequencing")
      .not("email2_sent_at", "is", null)
      .lt("email2_sent_at", threeDaysAgo);

    if (normalError) {
      console.error("[cron/staffing-sequence-check] Normal flow query error:", normalError);
      return NextResponse.json({ error: normalError.message }, { status: 500 });
    }

    // Query 2: Fallback - sequence_started_at > 6 days ago but email2_sent_at is null
    // This handles mock mode and webhook failures
    const { data: fallbackFlow, error: fallbackError } = await db
      .from("staffing_outreach")
      .select("id, provider_id, batch_id")
      .eq("status", "sequencing")
      .is("email2_sent_at", null)
      .not("sequence_started_at", "is", null)
      .lt("sequence_started_at", sixDaysAgo);

    if (fallbackError) {
      console.error("[cron/staffing-sequence-check] Fallback query error:", fallbackError);
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }

    // Combine and deduplicate results
    const allIds = new Set<string>();
    const readyToTransition: Array<{ id: string; provider_id: string; batch_id: string }> = [];

    for (const row of [...(normalFlow ?? []), ...(fallbackFlow ?? [])]) {
      if (!allIds.has(row.id)) {
        allIds.add(row.id);
        readyToTransition.push(row);
      }
    }

    if (readyToTransition.length === 0) {
      console.log("[cron/staffing-sequence-check] No providers ready for transition");
      return NextResponse.json({ status: "ok", transitioned: 0 });
    }

    console.log(
      `[cron/staffing-sequence-check] Found ${readyToTransition.length} providers ready for transition`,
      { normalFlow: normalFlow?.length ?? 0, fallbackFlow: fallbackFlow?.length ?? 0 }
    );

    // Update each provider to needs_call status
    const outreachIds = readyToTransition.map((r) => r.id);

    const { error: updateError } = await db
      .from("staffing_outreach")
      .update({
        status: "needs_call",
        next_action_due_at: now, // Set to now so it appears in "Needs Call" tab immediately
        updated_at: now,
      })
      .in("id", outreachIds);

    if (updateError) {
      console.error("[cron/staffing-sequence-check] Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Insert touchpoints for audit trail
    // Track which path triggered the transition for debugging
    const normalFlowIds = new Set((normalFlow ?? []).map((r) => r.id));
    const touchpoints = readyToTransition.map((r) => ({
      outreach_id: r.id,
      type: "sequence_completed",
      notes: normalFlowIds.has(r.id)
        ? "Auto-transitioned after Email 2 + 3 days"
        : "Auto-transitioned via fallback (6 days since sequence start)",
      payload: {
        triggered_by: "cron",
        previous_status: "sequencing",
        new_status: "needs_call",
        transition_path: normalFlowIds.has(r.id) ? "normal" : "fallback",
      },
      created_at: now,
    }));

    const { error: touchpointError } = await db
      .from("staffing_touchpoints")
      .insert(touchpoints);

    if (touchpointError) {
      // Log but don't fail - the status update was successful
      console.error("[cron/staffing-sequence-check] Touchpoint insert error:", touchpointError);
    }

    console.log(
      `[cron/staffing-sequence-check] Transitioned ${readyToTransition.length} providers to needs_call`
    );

    return NextResponse.json({
      status: "ok",
      transitioned: readyToTransition.length,
      outreachIds,
    });
  } catch (err) {
    console.error("[cron/staffing-sequence-check] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  });
}
