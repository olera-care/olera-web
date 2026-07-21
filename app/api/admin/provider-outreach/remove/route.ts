import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/remove
 *
 * Remove a provider from the outreach system entirely.
 * This deletes the tracking row but does NOT:
 *   - Delete or modify the provider profile in olera-providers
 *   - Archive them system-wide (no business_profiles changes)
 *   - Add to archived_question_providers
 *   - Affect their directory listing
 *
 * Body:
 *   - provider_id: string (required)
 *
 * Effect: Provider disappears from all outreach tabs and counts.
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

    // Get current tracking record to log what we're removing
    const { data: tracking, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage, city, state")
      .eq("provider_id", provider_id)
      .single();

    if (trackingError || !tracking) {
      return NextResponse.json({ error: "Provider not found in outreach tracking" }, { status: 404 });
    }

    const oldStage = tracking.stage;

    // Log the removal event BEFORE deleting (so we have the provider_id reference)
    const { error: touchpointError } = await db
      .from("provider_outreach_touchpoints")
      .insert({
        provider_id,
        touchpoint_type: "removed_from_outreach",
        details: {
          old_stage: oldStage,
          city: tracking.city,
          state: tracking.state,
        },
        admin_user_id: adminUser.id,
        created_at: nowIso,
      });

    if (touchpointError) {
      console.error("[provider-outreach/remove] Touchpoint insert error:", touchpointError);
      // Continue anyway - we want to remove even if logging fails
    }

    // Delete the tracking record
    const { error: deleteError } = await db
      .from("provider_outreach_tracking")
      .delete()
      .eq("id", tracking.id);

    if (deleteError) {
      console.error("[provider-outreach/remove] Delete error:", deleteError);
      return NextResponse.json({ error: "Failed to remove provider from outreach" }, { status: 500 });
    }

    // Log audit action
    await logAuditAction({
      adminUserId: adminUser.id,
      action: "remove_provider_from_outreach",
      targetType: "provider_outreach",
      targetId: provider_id,
      details: {
        provider_id,
        old_stage: oldStage,
        city: tracking.city,
        state: tracking.state,
      },
    });

    return NextResponse.json({
      success: true,
      provider_id,
      old_stage: oldStage,
    });
  } catch (err) {
    console.error("[provider-outreach/remove] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
