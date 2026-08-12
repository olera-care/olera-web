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
 * POST /api/admin/directory/send-claim-link
 *
 * Send the claim link email to any provider in the directory.
 * This is a standalone action that works independently of the Provider Outreach system.
 *
 * Uses the same nudge email template and Resend delivery as Provider Outreach,
 * but doesn't require the provider to be in provider_outreach_tracking.
 *
 * Request body:
 *   - provider_id: string (required) - The provider's UUID from olera-providers
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

    // Fetch provider data from olera-providers
    const { data: provider, error: providerError } = await db
      .from("olera-providers")
      .select("provider_id, slug, provider_name, email, city, state, provider_category")
      .eq("provider_id", provider_id)
      .single();

    if (providerError || !provider) {
      console.error("[directory/send-claim-link] Failed to fetch provider:", providerError);
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (!provider.email) {
      return NextResponse.json({ error: "Provider has no email address" }, { status: 400 });
    }

    if (!provider.slug) {
      return NextResponse.json({ error: "Provider has no slug (required for claim link)" }, { status: 400 });
    }

    // Check if provider is already claimed
    const { data: claimedBp } = await db
      .from("business_profiles")
      .select("id")
      .eq("source_provider_id", provider_id)
      .not("account_id", "is", null)
      .maybeSingle();

    if (claimedBp) {
      return NextResponse.json(
        { error: "Provider has already claimed their profile" },
        { status: 400 }
      );
    }

    // Check if email is suppressed (invalid, catch-all, bounced, unsubscribed)
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
        { error: "Email address is suppressed (invalid, catch-all, or unsubscribed)" },
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
        trigger: "directory_send_claim_link",
        admin_user_id: adminUser.id,
      },
    });

    if (!sendResult.success) {
      console.error("[directory/send-claim-link] Email send failed:", sendResult.error);
      return NextResponse.json(
        { error: sendResult.error || "Failed to send email" },
        { status: 500 }
      );
    }

    console.log("[directory/send-claim-link] Email sent to:", provider.email, "provider:", provider.provider_name);

    return NextResponse.json({
      success: true,
      email_sent: true,
      email_log_id: sendResult.emailLogId,
    });
  } catch (err) {
    console.error("[directory/send-claim-link] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
