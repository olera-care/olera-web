import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { OUTREACH_STAGES, type OutreachStage } from "../route";

/**
 * POST /api/admin/provider-outreach/re-engage
 *
 * Process a re-engage action for a provider in the re_engage stage.
 * This handles both manual "Re-engage now" button presses and
 * will later be called by the automated 30-day re-engage function.
 *
 * Request body:
 *   - provider_id: string (required)
 *
 * Action logic:
 *   - If cycle_number = 1:
 *       - Increment cycle_number to 2
 *       - Reset resend_count and no_answer_count to 0
 *       - Clear due_date
 *       - Move to "not_contacted" stage (Ready tab, since they have email)
 *       - Log "cycle_started" touchpoint
 *
 *   - If cycle_number = 2:
 *       - Move to "not_interested" stage (soft terminal)
 *       - Set notes to "unresponsive_after_two_cycles"
 *       - Log "cycle_exhausted" touchpoint
 *       - NO system-wide sync (soft terminal still receives questions/connections)
 */

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { provider_id } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();
    const nowIso = new Date().toISOString();
    const adminEmail = user.email ?? adminUser.id;

    // Get current tracking record
    const { data: tracking, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage, cycle_number, city, state")
      .eq("provider_id", provider_id)
      .single();

    if (trackingError || !tracking) {
      return NextResponse.json({ error: "Provider not found in tracking" }, { status: 404 });
    }

    // Verify provider is in re_engage stage
    if (tracking.stage !== "re_engage") {
      return NextResponse.json(
        { error: `Provider must be in Re-Engage stage. Current stage: ${tracking.stage}` },
        { status: 400 }
      );
    }

    const currentCycle = tracking.cycle_number ?? 1;

    if (currentCycle === 1) {
      // ── Cycle 1 → Start Cycle 2 ──
      // Move to not_contacted (will appear in Ready tab since they have email)
      // Reset counters, increment cycle

      const { error: updateError } = await db
        .from("provider_outreach_tracking")
        .update({
          stage: "not_contacted" as OutreachStage,
          stage_changed_at: nowIso,
          cycle_number: 2,
          resend_count: 0,
          no_answer_count: 0,
          due_date: null,
          re_engage_entered_at: null, // Clear since they're leaving re_engage
          updated_at: nowIso,
        })
        .eq("id", tracking.id);

      if (updateError) {
        console.error("[re-engage] Update error:", updateError);
        return NextResponse.json({ error: "Failed to update tracking record" }, { status: 500 });
      }

      // Log touchpoints
      const touchpointRows = [
        {
          provider_id,
          touchpoint_type: "cycle_started",
          details: {
            cycle: 2,
            previous_stage: "re_engage",
            new_stage: "not_contacted",
            trigger: "manual_re_engage",
          },
          admin_user_id: adminUser.id,
          created_at: nowIso,
        },
        {
          provider_id,
          touchpoint_type: "stage_changed",
          details: {
            old_stage: "re_engage",
            new_stage: "not_contacted",
            trigger: "re_engage_cycle_start",
            cycle: 2,
          },
          admin_user_id: adminUser.id,
          created_at: nowIso,
        },
      ];

      const { error: touchpointError } = await db
        .from("provider_outreach_touchpoints")
        .insert(touchpointRows);

      if (touchpointError) {
        console.error("[re-engage] Touchpoint insert error:", touchpointError);
        // Non-fatal
      }

      return NextResponse.json({
        success: true,
        action: "cycle_started",
        new_cycle: 2,
        new_stage: "not_contacted",
        message: "Provider moved to Ready for cycle 2",
      });

    } else {
      // ── Cycle 2 → Not Interested (soft terminal) ──
      // Two cycles exhausted, move to soft terminal state
      // Provider stops receiving outreach but can still get questions/connections

      const terminalReason = "unresponsive_after_two_cycles";

      const { error: updateError } = await db
        .from("provider_outreach_tracking")
        .update({
          stage: "not_interested" as OutreachStage,
          stage_changed_at: nowIso,
          notes: terminalReason,
          re_engage_entered_at: null,
          updated_at: nowIso,
        })
        .eq("id", tracking.id);

      if (updateError) {
        console.error("[re-engage] Update error:", updateError);
        return NextResponse.json({ error: "Failed to update tracking record" }, { status: 500 });
      }

      // Log touchpoints
      const touchpointRows = [
        {
          provider_id,
          touchpoint_type: "cycle_exhausted",
          details: {
            cycles_completed: 2,
            reason: terminalReason,
            terminal_stage: "not_interested",
            trigger: "manual_re_engage",
          },
          admin_user_id: adminUser.id,
          created_at: nowIso,
        },
        {
          provider_id,
          touchpoint_type: "stage_changed",
          details: {
            old_stage: "re_engage",
            new_stage: "not_interested",
            trigger: "re_engage_cycle_exhausted",
            reason: terminalReason,
          },
          admin_user_id: adminUser.id,
          created_at: nowIso,
        },
      ];

      const { error: touchpointError } = await db
        .from("provider_outreach_touchpoints")
        .insert(touchpointRows);

      if (touchpointError) {
        console.error("[re-engage] Touchpoint insert error:", touchpointError);
        // Non-fatal
      }

      // NO system-wide archive sync for not_interested (soft terminal)
      // Questions and connections still flow to this provider

      return NextResponse.json({
        success: true,
        action: "soft_terminal",
        reason: terminalReason,
        new_stage: "not_interested",
        message: "Provider moved to Not Interested after 2 cycles without response",
      });
    }
  } catch (err) {
    console.error("[re-engage] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
