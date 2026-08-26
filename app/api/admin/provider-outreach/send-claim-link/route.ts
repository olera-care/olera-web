import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import {
  renderEmail,
  renderVariantEmail,
  previewEmail,
  buildContextFromProvider,
  PROVIDER_OUTREACH_EMAIL_TYPE,
  PROVIDER_OUTREACH_FROM,
  PROVIDER_OUTREACH_REPLY_TO,
} from "@/lib/provider-outreach";

// PDF attachment cache (survives warm Lambda invocations)
let cachedPdfAttachment: { filename: string; content: string; encoding: string; type: string } | null = null;
let pdfFetchAttempted = false;

/**
 * Fetch PDF attachment from public URL.
 * In Vercel, public/ files are served via CDN, not accessible via filesystem.
 * We fetch once and cache in memory for the lifetime of the Lambda instance.
 */
async function getPdfAttachment(): Promise<typeof cachedPdfAttachment> {
  if (cachedPdfAttachment) return cachedPdfAttachment;
  if (pdfFetchAttempted) return null; // Don't retry failed fetches

  pdfFetchAttempted = true;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const pdfUrl = `${baseUrl}/Olera%20for%20Providers.pdf`;
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      console.warn(`[send-claim-link] Failed to fetch PDF: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    cachedPdfAttachment = {
      filename: "Olera for Providers.pdf",
      content: Buffer.from(arrayBuffer).toString("base64"),
      encoding: "base64",
      type: "application/pdf",
    };
    console.log("[send-claim-link] PDF attachment loaded and cached");
    return cachedPdfAttachment;
  } catch (err) {
    console.warn("[send-claim-link] Failed to fetch PDF attachment:", err);
    return null;
  }
}

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
 *   - custom_subject: string (optional) - Custom email subject
 *   - custom_body: string (optional) - Custom email body (markdown supported)
 *
 * When custom_subject or custom_body are provided, the email uses the custom content
 * with the standard Olera footer (signature, unsubscribe links, etc.) auto-appended.
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
    const { provider_id, custom_subject, custom_body } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    // Validate custom content if provided
    const hasCustomContent = custom_subject || custom_body;
    if (hasCustomContent) {
      if (custom_subject && typeof custom_subject !== "string") {
        return NextResponse.json({ error: "custom_subject must be a string" }, { status: 400 });
      }
      if (custom_body && typeof custom_body !== "string") {
        return NextResponse.json({ error: "custom_body must be a string" }, { status: 400 });
      }
    }

    const db = getServiceClient();
    const nowIso = new Date().toISOString();

    // Get current tracking record to verify provider exists in outreach
    const { data: tracking, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage, sequence_started_at, email_source, resend_count")
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

    // Build context for email rendering (needed for footer links)
    const context = buildContextFromProvider({
      provider_id: provider.provider_id,
      name: provider.provider_name,
      email: provider.email,
      city: provider.city,
      state: provider.state,
      category: provider.provider_category,
      slug: provider.slug,
    });

    // Render email - use custom content if provided, otherwise default nudge template
    let rendered;
    const isCustomEmail = !!(custom_subject || custom_body);

    if (isCustomEmail) {
      // Use custom content with standard footer
      // previewEmail gives us editableBody (body without claim_url substituted) for fallback
      const preview = previewEmail("nudge", context);

      // Substitute {claim_url} in custom body if present
      // The compose modal shows {claim_url} as placeholder, we replace it here
      let finalBody = custom_body || preview.editableBody;
      if (finalBody.includes("{claim_url}")) {
        finalBody = finalBody.replace(/\{claim_url\}/g, context.claim_url);
      }

      rendered = renderVariantEmail(
        {
          subject: custom_subject || preview.subject,
          body: finalBody,
        },
        context
      );
    } else {
      // Use default nudge template
      rendered = renderEmail("nudge", context);
    }

    // Fetch PDF attachment (cached after first fetch)
    const pdfAttachment = await getPdfAttachment();

    // Send via Resend with PDF attachment
    const sendResult = await sendEmail({
      to: provider.email,
      from: PROVIDER_OUTREACH_FROM,
      replyTo: PROVIDER_OUTREACH_REPLY_TO,
      subject: rendered.subject,
      html: rendered.html,
      emailType: PROVIDER_OUTREACH_EMAIL_TYPE,
      providerId: provider_id,
      attachments: pdfAttachment ? [pdfAttachment] : undefined,
      metadata: {
        template_key: "nudge",
        trigger: isCustomEmail ? "manual_custom_email" : "manual_send_claim_link",
        from_stage: tracking.stage,
        is_custom: isCustomEmail,
        has_pdf_attachment: !!pdfAttachment,
      },
    });

    if (!sendResult.success) {
      console.error("[send-claim-link] Email send failed:", sendResult.error);
      return NextResponse.json(
        { error: sendResult.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // Update tracking: increment resend_count and set sequence_started_at if needed
    const currentResendCount = (tracking.resend_count as number) ?? 0;
    const updateData: Record<string, unknown> = {
      resend_count: currentResendCount + 1,
      updated_at: nowIso,
    };

    // Set sequence_started_at if not already set, so this provider counts in Sequence Conv.
    // Also set sequenced_with_source for accurate org vs decision-maker conversion tracking.
    if (!tracking.sequence_started_at) {
      updateData.sequence_started_at = nowIso;
      updateData.sequenced_with_source = tracking.email_source || "organization";
    }

    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update(updateData)
      .eq("id", tracking.id);

    if (updateError) {
      // Non-fatal: log but don't fail the request
      console.error("[send-claim-link] Failed to update tracking:", updateError);
    }

    // Log touchpoints
    const touchpointRows = [
      {
        provider_id,
        touchpoint_type: "email_sent",
        details: {
          template_key: "nudge",
          trigger: isCustomEmail ? "manual_custom_email" : "manual_send_claim_link",
          from_stage: tracking.stage,
          email_log_id: sendResult.emailLogId,
          is_custom: isCustomEmail,
          custom_subject: isCustomEmail ? custom_subject : undefined,
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
      resend_count: currentResendCount + 1,
    });
  } catch (err) {
    console.error("[send-claim-link] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/provider-outreach/send-claim-link?provider_id=xxx
 *
 * Preview the default nudge email for a provider.
 * Returns the pre-filled subject and body that admins can customize.
 *
 * Returns:
 *   - subject: string - Default email subject
 *   - body: string - Default email body (plain text with markdown)
 *   - to_email: string - Recipient email address
 *   - provider_name: string - Provider name for display
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const provider_id = searchParams.get("provider_id");

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch provider data
    const { data: provider, error: providerError } = await db
      .from("olera-providers")
      .select("provider_id, slug, provider_name, email, city, state, provider_category")
      .eq("provider_id", provider_id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (!provider.email) {
      return NextResponse.json({ error: "Provider has no email address" }, { status: 400 });
    }

    // Build context for email preview
    const context = buildContextFromProvider({
      provider_id: provider.provider_id,
      name: provider.provider_name,
      email: provider.email,
      city: provider.city,
      state: provider.state,
      category: provider.provider_category,
      slug: provider.slug,
    });

    // Preview the nudge email
    const preview = previewEmail("nudge", context);

    return NextResponse.json({
      subject: preview.subject,
      // Use editableBody which keeps {claim_url} as placeholder (not ugly long URL)
      body: preview.editableBody,
      to_email: provider.email,
      provider_name: provider.provider_name,
    });
  } catch (err) {
    console.error("[send-claim-link/preview] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
