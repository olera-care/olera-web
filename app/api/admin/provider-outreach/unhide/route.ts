import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/unhide
 *
 * Un-hide a provider that was previously removed from outreach view.
 *
 * This:
 *   1. Sets admin_hidden = false
 *   2. Resets stage to "not_contacted" (so they appear in Ready tab)
 *   3. Clears smartlead_data (stale from previous enrollment)
 *
 * Why reset to not_contacted? When a provider is hidden from "in_sequence":
 *   - Their SmartLead lead was paused
 *   - Their pending tasks were deleted
 * Simply unhiding them would leave them in a broken state. Resetting to
 * not_contacted ensures they can be properly re-launched through normal flow.
 *
 * Body:
 *   - provider_id: string (required)
 *
 * Effect: Provider reappears in Ready tab, ready to be re-launched.
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

    // Check if tracking record exists and is hidden
    const { data: tracking, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage, city, state, admin_hidden")
      .eq("provider_id", provider_id)
      .maybeSingle();

    if (trackingError) {
      console.error("[provider-outreach/unhide] Tracking query error:", trackingError);
      return NextResponse.json({ error: "Failed to query tracking" }, { status: 500 });
    }

    if (!tracking) {
      return NextResponse.json({ error: "Provider not found in outreach tracking" }, { status: 404 });
    }

    // Already visible? Return success (idempotent)
    if (tracking.admin_hidden !== true) {
      return NextResponse.json({
        success: true,
        provider_id,
        stage: tracking.stage,
        already_visible: true,
      });
    }

    const oldStage = tracking.stage;

    // Unhide and reset to not_contacted for clean re-launch
    // Clear smartlead_data since it's stale (lead was paused, tasks deleted)
    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update({
        admin_hidden: false,
        stage: "not_contacted",
        stage_changed_at: nowIso,
        smartlead_data: null,
      })
      .eq("id", tracking.id);

    if (updateError) {
      console.error("[provider-outreach/unhide] Update error:", updateError);
      return NextResponse.json({ error: "Failed to unhide provider" }, { status: 500 });
    }

    // Log touchpoint
    const { error: touchpointError } = await db
      .from("provider_outreach_touchpoints")
      .insert({
        provider_id,
        touchpoint_type: "stage_changed",
        details: {
          old_stage: oldStage,
          new_stage: "not_contacted",
          unhidden: true,
          admin_hidden: false,
          reset_reason: "Unhide resets to Ready for clean re-launch",
          city: tracking.city,
          state: tracking.state,
        },
        admin_user_id: adminUser.id,
        created_at: nowIso,
      });

    if (touchpointError) {
      console.error("[provider-outreach/unhide] Touchpoint insert error:", touchpointError);
      // Continue anyway - unhiding succeeded
    }

    // Log audit action
    await logAuditAction({
      adminUserId: adminUser.id,
      action: "unhide_provider_from_outreach",
      targetType: "provider_outreach",
      targetId: provider_id,
      details: {
        provider_id,
        old_stage: oldStage,
        new_stage: "not_contacted",
        city: tracking.city,
        state: tracking.state,
      },
    });

    return NextResponse.json({
      success: true,
      provider_id,
      old_stage: oldStage,
      stage: "not_contacted",
    });
  } catch (err) {
    console.error("[provider-outreach/unhide] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
