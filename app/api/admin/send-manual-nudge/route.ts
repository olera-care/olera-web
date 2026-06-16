import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams, isSuppressedRecipient } from "@/lib/email";
import { isUndeliverable } from "@/lib/email-verification";
import { providerManualNudgeEmail } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";
import { generateLeadClaimUrl } from "@/lib/claim-tokens";

/**
 * POST /api/admin/send-manual-nudge
 *
 * Sends a manual nudge email to a provider in "Needs Follow-up" status.
 * This is sent by admin for leads that have gone through the full automated
 * sequence (Day 0, 1, 3, 5) with no response after 10+ days.
 *
 * Generates HMAC-signed magic link for one-click provider access.
 * Admin-only endpoint with 24h cooldown per connection.
 *
 * Body: { connection_id: string }
 */

const NUDGE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  // Admin auth check
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await getAdminUser(user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getServiceClient();

  // Check if this is a preview request
  const { searchParams } = new URL(req.url);
  const isPreview = searchParams.get("preview") === "true";

  // Parse body
  let body: { connection_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { connection_id } = body;
  if (!connection_id) {
    return NextResponse.json(
      { error: "connection_id is required" },
      { status: 400 }
    );
  }

  // Fetch connection with provider and family profile
  const { data: connection, error: fetchError } = await db
    .from("connections")
    .select(
      `
      id,
      type,
      from_profile_id,
      to_profile_id,
      message,
      metadata,
      created_at,
      from_profile:business_profiles!connections_from_profile_id_fkey(id, display_name, slug, source_provider_id, email, city, care_types, metadata),
      to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, slug, source_provider_id, email, city, care_types, metadata)
    `
    )
    .eq("id", connection_id)
    .single();

  if (fetchError || !connection) {
    console.error("[send-nudge] Connection not found:", fetchError);
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  // Normalize joined relations and resolve family/provider based on connection type
  // - inquiry: from=family, to=provider
  // - request (Matches): from=provider, to=family
  const fromProfile = Array.isArray(connection.from_profile)
    ? connection.from_profile[0]
    : connection.from_profile;
  const toProfile = Array.isArray(connection.to_profile)
    ? connection.to_profile[0]
    : connection.to_profile;

  const isInquiry = connection.type === "inquiry";
  const familyProfile = isInquiry ? fromProfile : toProfile;
  const providerProfile = isInquiry ? toProfile : fromProfile;

  // Check provider email - first from business_profiles, then fallback to olera-providers
  let providerEmail = providerProfile?.email?.trim() || null;
  if (!providerEmail && providerProfile?.source_provider_id) {
    const { data: iosProvider } = await db
      .from("olera-providers")
      .select("email")
      .eq("provider_id", providerProfile.source_provider_id)
      .not("deleted", "is", true)
      .maybeSingle();
    providerEmail = iosProvider?.email?.trim() || null;
  }

  if (!providerEmail) {
    return NextResponse.json(
      { error: "Provider has no email address" },
      { status: 400 }
    );
  }

  // Check if provider is admin-archived (no emails sent to them)
  const providerMeta = (providerProfile?.metadata as Record<string, unknown>) ?? {};
  if (providerMeta.admin_archived === true) {
    return NextResponse.json(
      { error: "This provider is archived. No emails can be sent to them." },
      { status: 400 }
    );
  }

  // Check cooldown
  const meta = (connection.metadata as Record<string, unknown>) ?? {};
  const lastNudgedAt = meta.nudged_at as string | undefined;

  if (lastNudgedAt) {
    const timeSinceNudge = Date.now() - new Date(lastNudgedAt).getTime();
    if (timeSinceNudge < NUDGE_COOLDOWN_MS) {
      const hoursRemaining = Math.ceil(
        (NUDGE_COOLDOWN_MS - timeSinceNudge) / (60 * 60 * 1000)
      );
      return NextResponse.json(
        {
          error: `This provider was already nudged recently. Please wait ${hoursRemaining} hour(s).`,
          nudged_at: lastNudgedAt,
        },
        { status: 429 }
      );
    }
  }

  // Calculate days since inquiry
  const daysSinceInquiry = Math.floor(
    (Date.now() - new Date(connection.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Count total pending leads for this provider
  const providerProfileId = isInquiry ? connection.to_profile_id : connection.from_profile_id;
  const { count: pendingLeadsCount } = await db
    .from("connections")
    .select("*", { count: "exact", head: true })
    .eq("to_profile_id", providerProfileId)  // Always query TO provider for inquiries
    .eq("type", "inquiry")
    .eq("status", "pending")  // Only count leads actually waiting for response
    .is("metadata->archived", null);

  const leadCount = pendingLeadsCount || 1;
  if (!pendingLeadsCount) {
    console.warn("[send-manual-nudge] Lead count is 0, defaulting to 1. Connection:", connection_id);
  }

  const siteUrl = getSiteUrl();
  const providerSlug = providerProfile.slug || providerProfile.source_provider_id || "";
  const providerName = providerProfile.display_name || "Your Organization";
  const familyName = familyProfile?.display_name || "A family";
  const fromAddress = "Olera <noreply@olera.care>";
  // providerEmail already resolved above with olera-providers fallback

  // Extract provider city from profile
  const providerCity = (providerProfile as { city?: string | null }).city || null;

  // Dynamic subject line based on lead count and family name
  const safeFamilyName = familyName && familyName !== "A family" ? familyName.split(" ")[0] : null;
  const subject = leadCount === 1
    ? (safeFamilyName
        ? `Quick check-in about ${safeFamilyName}`
        : "Quick check-in: a family is waiting")
    : "Quick check-in: your Olera page + families waiting";

  // Generate HMAC-signed magic link for one-click provider access
  // Routes to /api/claim-lead which authenticates provider and redirects to /provider/connections
  // If connection_id is provided, it will be included as a query param to highlight that specific lead
  const magicLinkUrl = generateLeadClaimUrl(
    providerSlug,
    providerEmail,
    connection_id,  // Pass raw connection ID (not a URL path)
    siteUrl
  );

  // For preview, use magic link without tracking; for send, add tracking params
  const viewUrl = isPreview
    ? magicLinkUrl
    : appendTrackingParams(magicLinkUrl, null);

  // Build email HTML using manual nudge template
  const html = providerManualNudgeEmail({
    providerName,
    familyName,
    city: providerCity,
    leadCount,
    viewUrl,
    providerSlug,
  });

  // If preview mode, return email details without sending
  if (isPreview) {
    // Check if email would be suppressed
    let warning: string | null = null;
    const suppressed = await isSuppressedRecipient(providerProfile.email);
    const undeliverable = await isUndeliverable(providerProfile.email);

    if (suppressed) {
      warning = "This email may be suppressed due to prior bounces or spam complaints on record.";
    } else if (undeliverable) {
      warning = "This email may be suppressed because the address was verified as invalid/undeliverable.";
    }

    return NextResponse.json({
      preview: true,
      from: fromAddress,
      to: providerProfile.email,
      subject,
      html,
      warning,
    });
  }

  // Reserve email log ID for tracking (only when actually sending)
  const emailLogId = await reserveEmailLogId({
    to: providerProfile.email,
    subject,
    emailType: "provider_manual_nudge",
    recipientType: "provider",
    providerId: providerSlug,
    metadata: {
      connection_id,
      nudged_by: user.email,
      days_since_inquiry: daysSinceInquiry,
      manual_nudge: true,
    },
  });

  // Update viewUrl with tracking params for actual send
  const trackedViewUrl = appendTrackingParams(magicLinkUrl, emailLogId);

  // Rebuild email HTML with tracked URL for actual send
  const trackedHtml = providerManualNudgeEmail({
    providerName,
    familyName,
    city: providerCity,
    leadCount,
    viewUrl: trackedViewUrl,
    providerSlug,
  });

  // Send email with tracked HTML
  const { success, error: sendError } = await sendEmail({
    to: providerProfile.email,
    subject,
    html: trackedHtml,
    emailType: "provider_manual_nudge",
    recipientType: "provider",
    providerId: providerSlug,
    metadata: {
      connection_id,
      nudged_by: user.email,
      days_since_inquiry: daysSinceInquiry,
      manual_nudge: true,
    },
    emailLogId: emailLogId ?? undefined,
  });

  if (!success) {
    console.error("[send-manual-nudge] Email send failed:", sendError);
    return NextResponse.json(
      { error: "Failed to send manual nudge email" },
      { status: 500 }
    );
  }

  // Update connection metadata with manual nudge info
  const nudgedAt = new Date().toISOString();
  const updatedMeta = {
    ...meta,
    manual_nudged_at: nudgedAt, // Track manual nudges separately
    manual_nudged_by: user.email,
    manual_nudge_count: ((meta.manual_nudge_count as number) || 0) + 1,
    // Also update general nudge tracking for cooldown
    nudged_at: nudgedAt,
    nudged_by: user.email,
    nudge_count: ((meta.nudge_count as number) || 0) + 1,
  };

  const { error: updateError } = await db
    .from("connections")
    .update({ metadata: updatedMeta })
    .eq("id", connection_id);

  if (updateError) {
    console.error("[send-manual-nudge] Failed to update connection metadata:", updateError);
    // Don't fail the request - email was sent successfully
  }

  return NextResponse.json({
    success: true,
    manual_nudged_at: nudgedAt,
    provider_email: providerProfile.email,
  });
}
