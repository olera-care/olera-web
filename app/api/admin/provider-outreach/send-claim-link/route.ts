import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import {
  renderEmail,
  buildContextFromProvider,
  PROVIDER_OUTREACH_EMAIL_TYPE,
  PROVIDER_OUTREACH_FROM,
  PROVIDER_OUTREACH_REPLY_TO,
} from "@/lib/provider-outreach";

/**
 * POST /api/admin/provider-outreach/send-claim-link
 *
 * Send the claim link email to a provider in any stage.
 * This is a standalone action that doesn't change the provider's stage.
 *
 * Unlike record-outcome (which only works from needs_call stage and has a resend limit),
 * this endpoint allows admins to send the claim link whenever needed.
 *
 * Request body:
 *   - provider_id: string (required)
 *
 * Returns:
 *   - success: boolean
 *   - email_sent: boolean
 *   - email_log_id: string (if sent)
 *   - error: string (if failed)
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

    // Get current tracking record to verify provider exists in outreach
    const { data: tracking, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage, sequence_started_at, email_source")
      .eq("provider_id", provider_id)
      .single();

    if (trackingError || !tracking) {
      return NextResponse.json({ error: "Provider not found in tracking" }, { status: 404 });
    }

    // Block sending to archived or claimed providers
    if (tracking.stage === "archived") {
      return NextResponse.json(
        { error: "Cannot send email to archived providers" },
        { status: 400 }
      );
    }

    if (tracking.stage === "claimed") {
      return NextResponse.json(
        { error: "Provider has already claimed their profile" },
        { status: 400 }
      );
    }

    // Fetch provider data for email rendering
    const { data: provider, error: providerError } = await db
      .from("olera-providers")
      .select("provider_id, slug, provider_name, email, city, state, provider_category")
      .eq("provider_id", provider_id)
      .single();

    if (providerError || !provider) {
      console.error("[send-claim-link] Failed to fetch provider:", providerError);
      return NextResponse.json({ error: "Failed to fetch provider data" }, { status: 500 });
    }

    if (!provider.email) {
      return NextResponse.json({ error: "Provider has no email address" }, { status: 400 });
    }

    // Check if email is suppressed (bounced, unsubscribed, etc.)
    const { data: verification } = await db
      .from("email_verifications")
      .select("status")
      .eq("email", provider.email.toLowerCase())
      .maybeSingle();

    const { data: dnc } = await db
      .from("do_not_contact")
      .select("id")
      .eq("email", provider.email.toLowerCase())
      .maybeSingle();

    const isSuppressed =
      verification?.status === "invalid" ||
      verification?.status === "catch-all" ||
      !!dnc;

    if (isSuppressed) {
      return NextResponse.json(
        { error: "Email address is suppressed (bounced or unsubscribed)" },
        { status: 400 }
      );
    }

    // Build context and render nudge email
    const context = buildContextFromProvider({
      provider_id: provider.provider_id,
      name: provider.provider_name,
      email: provider.email,
      city: provider.city,
      state: provider.state,
      category: provider.provider_category,
      slug: provider.slug,
    });

    const rendered = renderEmail("nudge", context);

    // Send via Resend
    const sendResult = await sendEmail({
      to: provider.email,
      from: PROVIDER_OUTREACH_FROM,
      replyTo: PROVIDER_OUTREACH_REPLY_TO,
      subject: rendered.subject,
      html: rendered.html,
      emailType: PROVIDER_OUTREACH_EMAIL_TYPE,
      providerId: provider_id,
      metadata: {
        template_key: "nudge",
        trigger: "manual_send_claim_link",
        from_stage: tracking.stage,
      },
    });

    if (!sendResult.success) {
      console.error("[send-claim-link] Email send failed:", sendResult.error);
      return NextResponse.json(
        { error: sendResult.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // Set sequence_started_at if not already set, so this provider counts in Sequence Conv.
    // Also set sequenced_with_source for accurate org vs decision-maker conversion tracking.
    // This ensures providers who receive manual claim links are tracked for conversion.
    if (!tracking.sequence_started_at) {
      const { error: updateError } = await db
        .from("provider_outreach_tracking")
        .update({
          sequence_started_at: nowIso,
          sequenced_with_source: tracking.email_source || "organization",
        })
        .eq("id", tracking.id);

      if (updateError) {
        // Non-fatal: log but don't fail the request
        console.error("[send-claim-link] Failed to set sequence_started_at:", updateError);
      }
    }

    // Log touchpoints
    const touchpointRows = [
      {
        provider_id,
        touchpoint_type: "email_sent",
        details: {
          template_key: "nudge",
          trigger: "manual_send_claim_link",
          from_stage: tracking.stage,
          email_log_id: sendResult.emailLogId,
        },
        admin_user_id: adminUser.id,
        created_at: nowIso,
      },
    ];

    const { error: touchpointError } = await db
      .from("provider_outreach_touchpoints")
      .insert(touchpointRows);

    if (touchpointError) {
      // Non-fatal: log but don't fail the request
      console.error("[send-claim-link] Touchpoint insert error:", touchpointError);
    }

    console.log("[send-claim-link] Email sent to:", provider.email, "from stage:", tracking.stage);

    return NextResponse.json({
      success: true,
      email_sent: true,
      email_log_id: sendResult.emailLogId,
    });
  } catch (err) {
    console.error("[send-claim-link] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
