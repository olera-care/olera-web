import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/reset-to-ready
 *
 * Reset a provider from Follow-Up (needs_call) or Alternative Channels (re_engage)
 * back to Ready (not_contacted). Used when admin finds a new email (via Apollo or
 * manual edit) and wants to restart the outreach sequence.
 *
 * Body:
 *   - provider_id: string (required)
 *   - email_source: "organization" | "decision_maker" (required)
 *   - use_apollo_email?: boolean - If true, copy apollo_contact.email to olera-providers.email
 *
 * Actions:
 *   1. Change stage from needs_call/re_engage to not_contacted
 *   2. Set email_source
 *   3. Clear Follow-Up related fields (due_date, needs_call_reason, etc.)
 *   4. Optionally copy Apollo email to main email field
 *   5. Log touchpoint
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
      .select("id, stage, apollo_contact")
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
    // Allowed: needs_call (Follow Up) or re_engage (Alternative Channels)
    const allowedStages = ["needs_call", "re_engage"];
    if (!allowedStages.includes(tracking.stage)) {
      return NextResponse.json(
        { error: `Provider is in '${tracking.stage}' stage, cannot reset to Ready` },
        { status: 400 }
      );
    }

    // If use_apollo_email, verify Apollo contact exists
    const apolloContact = tracking.apollo_contact as { email?: string } | null;
    if (use_apollo_email && !apolloContact?.email) {
      return NextResponse.json(
        { error: "No Apollo contact email available" },
        { status: 400 }
      );
    }

    // Update tracking record: reset to not_contacted, clear follow-up and re_engage fields
    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update({
        stage: "not_contacted",
        stage_changed_at: new Date().toISOString(),
        email_source: email_source,
        // Clear follow-up related fields (needs_call stage)
        due_date: null,
        needs_call_reason: null,
        no_answer_count: 0,
        resend_count: 0,
        // Clear alternative channels fields (re_engage stage)
        re_engage_channel: null,
        re_engage_entered_at: null,
        // Keep apollo_contact (useful reference)
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
        previous_stage: "needs_call",
        new_stage: "not_contacted",
        email_source: email_source,
        used_apollo_email: use_apollo_email || false,
        email_update_failed: emailUpdateFailed,
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
