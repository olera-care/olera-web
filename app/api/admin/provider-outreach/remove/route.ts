import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { pauseLeadInCampaign, getLeadByEmail } from "@/lib/smartlead";

/**
 * POST /api/admin/provider-outreach/remove
 *
 * Hide a provider from the outreach system (admin cleanup).
 * This sets admin_hidden = true on the tracking row, or creates one if needed.
 *
 * Does NOT:
 *   - Delete or modify the provider profile in olera-providers
 *   - Archive them system-wide (no business_profiles changes)
 *   - Add to archived_question_providers
 *   - Affect their directory listing
 *
 * Body:
 *   - provider_id: string (required)
 *
 * Effect: Provider disappears from all outreach tabs and counts.
 * The tracking row is preserved for audit trail and SmartLead data.
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

    // Check if tracking record exists
    const { data: tracking, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage, city, state, smartlead_data, admin_hidden")
      .eq("provider_id", provider_id)
      .maybeSingle();

    if (trackingError) {
      console.error("[provider-outreach/remove] Tracking query error:", trackingError);
      return NextResponse.json({ error: "Failed to query tracking" }, { status: 500 });
    }

    let oldStage: string;
    let trackingId: string;
    let city: string | null = null;
    let state: string | null = null;

    if (tracking) {
      // ── Existing tracking row: set admin_hidden = true ──
      oldStage = tracking.stage;
      trackingId = tracking.id;
      city = tracking.city;
      state = tracking.state;

      // Already hidden? Return success (idempotent)
      if (tracking.admin_hidden === true) {
        return NextResponse.json({
          success: true,
          provider_id,
          old_stage: oldStage,
          already_hidden: true,
        });
      }

      // ── Pause SmartLead lead to stop further emails ──
      const smartleadData = tracking.smartlead_data as {
        campaign_id?: number;
        lead_id?: number;
        lead_email?: string;
      } | null;

      if (smartleadData?.campaign_id) {
        try {
          let leadId = smartleadData.lead_id;

          // If no lead_id stored, look it up by email
          if (!leadId && smartleadData.lead_email) {
            const lookup = await getLeadByEmail(smartleadData.lead_email);
            if (lookup.ok && lookup.data?.id) {
              leadId = lookup.data.id;
            }
          }

          if (leadId) {
            const result = await pauseLeadInCampaign(smartleadData.campaign_id, leadId);
            if (result.ok) {
              console.log(`[provider-outreach/remove] Paused SmartLead lead ${leadId} in campaign ${smartleadData.campaign_id}`);
            } else {
              console.warn(`[provider-outreach/remove] Failed to pause SmartLead lead: ${result.error}`);
            }
          } else {
            console.warn(`[provider-outreach/remove] Could not resolve SmartLead lead_id for ${provider_id} (email: ${smartleadData.lead_email})`);
          }
        } catch (err) {
          console.error(`[provider-outreach/remove] Error pausing SmartLead lead:`, err);
          // Non-fatal - continue with hiding
        }
      }

      // ── Clean up pending tasks ──
      const { error: taskCleanupError, count: deletedTaskCount } = await db
        .from("provider_outreach_tasks")
        .delete()
        .eq("tracking_id", trackingId)
        .eq("status", "pending");

      if (taskCleanupError) {
        console.error("[provider-outreach/remove] Task cleanup error:", taskCleanupError);
      } else if (deletedTaskCount && deletedTaskCount > 0) {
        console.log(`[provider-outreach/remove] Cleaned up ${deletedTaskCount} pending task(s)`);
      }

      // ── Set admin_hidden = true ──
      const { error: updateError } = await db
        .from("provider_outreach_tracking")
        .update({ admin_hidden: true })
        .eq("id", trackingId);

      if (updateError) {
        console.error("[provider-outreach/remove] Update error:", updateError);
        return NextResponse.json({ error: "Failed to hide provider from outreach" }, { status: 500 });
      }

    } else {
      // ── No tracking row: create one with admin_hidden = true ──
      // This handles not_contacted providers who were never tracked

      // Get provider details from olera-providers
      const { data: provider, error: providerError } = await db
        .from("olera-providers")
        .select("city, state")
        .eq("provider_id", provider_id)
        .maybeSingle();

      if (providerError) {
        console.error("[provider-outreach/remove] Provider query error:", providerError);
        return NextResponse.json({ error: "Failed to query provider" }, { status: 500 });
      }

      if (!provider) {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      }

      city = provider.city;
      state = provider.state;
      oldStage = "not_contacted";

      // Create tracking row with admin_hidden = true
      const { data: newTracking, error: insertError } = await db
        .from("provider_outreach_tracking")
        .insert({
          provider_id,
          stage: "not_contacted",
          city,
          state,
          admin_hidden: true,
          stage_changed_at: nowIso,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[provider-outreach/remove] Insert error:", insertError);
        return NextResponse.json({ error: "Failed to create tracking record" }, { status: 500 });
      }

      trackingId = newTracking.id;
    }

    // ── Log touchpoint ──
    const { error: touchpointError } = await db
      .from("provider_outreach_touchpoints")
      .insert({
        provider_id,
        touchpoint_type: "stage_changed",
        details: {
          old_stage: oldStage,
          new_stage: null,
          removed_from_outreach: true,
          admin_hidden: true,
          city,
          state,
        },
        admin_user_id: adminUser.id,
        created_at: nowIso,
      });

    if (touchpointError) {
      console.error("[provider-outreach/remove] Touchpoint insert error:", touchpointError);
      // Continue anyway - hiding succeeded
    }

    // ── Log audit action ──
    await logAuditAction({
      adminUserId: adminUser.id,
      action: "hide_provider_from_outreach",
      targetType: "provider_outreach",
      targetId: provider_id,
      details: {
        provider_id,
        old_stage: oldStage,
        city,
        state,
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
