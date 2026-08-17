import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { pauseLeadInCampaign } from "@/lib/smartlead";

/**
 * POST /api/admin/provider-outreach/reset-to-ready
 *
 * Reset a provider from In Sequence (in_sequence), Follow-Up (needs_call), or
 * Alternative Channels (re_engage) back to Ready (not_contacted). Used when admin
 * finds a new email (via Apollo, phone call, or manual edit) and wants to restart
 * the outreach sequence fresh.
 *
 * Body:
 *   - provider_id: string (required)
 *   - email_source: "organization" | "decision_maker" (required)
 *   - use_apollo_email?: boolean - If true, copy apollo_contact.email to olera-providers.email
 *
 * Actions:
 *   1. If in_sequence: Cancel pending tasks and pause SmartLead campaign
 *   2. Change stage to not_contacted
 *   3. Set email_source
 *   4. Clear Follow-Up and re_engage related fields
 *   5. Clear sequence-related fields (sequence_started_at, smartlead_data)
 *   6. Optionally copy Apollo email to main email field
 *   7. Log touchpoint
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
    const { provider_id, email_source, use_apollo_email } = body;

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (!email_source || !["organization", "decision_maker"].includes(email_source)) {
      return NextResponse.json(
        { error: "email_source must be 'organization' or 'decision_maker'" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Get existing tracking record
    const { data: tracking, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, stage, apollo_contact, smartlead_data")
      .eq("provider_id", provider_id)
      .maybeSingle();

    if (trackingError) {
      console.error("[reset-to-ready] Error fetching tracking:", trackingError);
      return NextResponse.json({ error: "Failed to fetch tracking record" }, { status: 500 });
    }

    if (!tracking) {
      return NextResponse.json({ error: "Provider not found in outreach tracking" }, { status: 404 });
    }

    // Verify provider is in a stage that can be reset to Ready
    // Allowed: in_sequence, needs_call (Follow Up), or re_engage (Alternative Channels)
    const allowedStages = ["in_sequence", "needs_call", "re_engage"];
    if (!allowedStages.includes(tracking.stage)) {
      return NextResponse.json(
        { error: `Provider is in '${tracking.stage}' stage, cannot reset to Ready` },
        { status: 400 }
      );
    }

    // ── If resetting from in_sequence, clean up active sequence ──
    if (tracking.stage === "in_sequence") {
      // 1. Delete pending tasks to prevent stale emails from firing
      const { error: deleteTasksError, count: deletedCount } = await db
        .from("provider_outreach_tasks")
        .delete({ count: "exact" })
        .eq("tracking_id", tracking.id)
        .eq("status", "pending");

      if (deleteTasksError) {
        console.error("[reset-to-ready] Error deleting pending tasks:", deleteTasksError);
        // Non-fatal - continue with reset
      } else if (deletedCount && deletedCount > 0) {
        console.log(`[reset-to-ready] Deleted ${deletedCount} pending task(s) for provider ${provider_id}`);
      }

      // 2. Pause SmartLead campaign if active
      const smartleadData = tracking.smartlead_data as {
        campaign_id?: number;
        lead_id?: number;
        lead_email?: string;
      } | null;

      if (smartleadData?.campaign_id && smartleadData?.lead_id) {
        try {
          const pauseResult = await pauseLeadInCampaign(
            smartleadData.campaign_id,
            smartleadData.lead_id
          );
          if (pauseResult.ok) {
            console.log(`[reset-to-ready] Paused SmartLead lead ${smartleadData.lead_id} in campaign ${smartleadData.campaign_id}`);
          } else {
            console.error(`[reset-to-ready] Failed to pause SmartLead lead:`, pauseResult.error);
          }
        } catch (err) {
          console.error("[reset-to-ready] Error pausing SmartLead lead:", err);
          // Non-fatal - continue with reset
        }
      }
    }

    // If use_apollo_email, verify Apollo contact exists
    const apolloContact = tracking.apollo_contact as { email?: string } | null;
    if (use_apollo_email && !apolloContact?.email) {
      return NextResponse.json(
        { error: "No Apollo contact email available" },
        { status: 400 }
      );
    }

    // Update tracking record: reset to not_contacted, clear all stage-specific fields
    const previousStage = tracking.stage;
    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update({
        stage: "not_contacted",
        stage_changed_at: new Date().toISOString(),
        email_source: email_source,
        // Clear sequence fields (in_sequence stage)
        sequence_started_at: null,
        smartlead_data: null,
        // Clear follow-up related fields (needs_call stage)
        due_date: null,
        needs_call_reason: null,
        no_answer_count: 0,
        resend_count: 0,
        // Clear alternative channels fields (re_engage stage)
        re_engage_channel: null,
        re_engage_entered_at: null,
        // Reset confirmation so admin re-verifies before relaunching
        confirmed_at: null,
        confirmed_by: null,
        // Keep apollo_contact (useful reference for next attempt)
        // Keep notes (preserve history)
      })
      .eq("id", tracking.id);

    if (updateError) {
      console.error("[reset-to-ready] Error updating tracking:", updateError);
      return NextResponse.json({ error: "Failed to update tracking record" }, { status: 500 });
    }

    // If use_apollo_email, update the provider's email
    let emailUpdateFailed = false;
    if (use_apollo_email && apolloContact?.email) {
      const { error: emailError } = await db
        .from("olera-providers")
        .update({ email: apolloContact.email })
        .eq("provider_id", provider_id);

      if (emailError) {
        console.error("[reset-to-ready] Error updating provider email:", emailError);
        emailUpdateFailed = true;
        // Non-fatal - stage was already updated, but we'll warn the client
      }
    }

    // Log touchpoint
    await db.from("provider_outreach_touchpoints").insert({
      provider_id: provider_id,
      touchpoint_type: "reset_to_ready",
      admin_user_id: adminUser.id,
      details: {
        previous_stage: previousStage,
        new_stage: "not_contacted",
        email_source: email_source,
        used_apollo_email: use_apollo_email || false,
        email_update_failed: emailUpdateFailed,
        sequence_cancelled: previousStage === "in_sequence",
      },
    });

    return NextResponse.json({
      success: true,
      email_source: email_source,
      ...(emailUpdateFailed && {
        warning: "Provider was moved to Ready, but failed to copy Apollo email. Please manually update the email.",
      }),
    });
  } catch (error) {
    console.error("[reset-to-ready] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
