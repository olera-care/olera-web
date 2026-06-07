import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams, isSuppressedRecipient } from "@/lib/email";
import { isUndeliverable } from "@/lib/email-verification";
import { familyNudgeEmail } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";
import { calculateFamilyCompleteness } from "@/lib/admin/profile-completeness";

/**
 * POST /api/admin/nudge-family
 *
 * Sends a reminder email to a family to complete their profile.
 * Admin-only endpoint with 24h cooldown per connection.
 *
 * Body: { connection_id: string, family_profile_id: string }
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
  let body: { connection_id?: string; family_profile_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { connection_id, family_profile_id } = body;
  if (!connection_id || !family_profile_id) {
    return NextResponse.json(
      { error: "connection_id and family_profile_id are required" },
      { status: 400 }
    );
  }

  // Fetch connection with profile data
  const { data: connection, error: fetchError } = await db
    .from("connections")
    .select(
      `
      id,
      type,
      from_profile_id,
      to_profile_id,
      metadata,
      from_profile:business_profiles!connections_from_profile_id_fkey(
        id,
        display_name,
        email,
        phone,
        image_url,
        city,
        description,
        care_types,
        metadata
      ),
      to_profile:business_profiles!connections_to_profile_id_fkey(
        id,
        display_name,
        email,
        phone,
        image_url,
        city,
        description,
        care_types,
        metadata
      )
    `
    )
    .eq("id", connection_id)
    .single();

  if (fetchError || !connection) {
    console.error("[nudge-family] Connection not found:", fetchError);
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

  if (!familyProfile?.email?.trim()) {
    return NextResponse.json(
      { error: "Family has no email address" },
      { status: 400 }
    );
  }

  // Check cooldown (using family_nudged_at in metadata)
  const meta = (connection.metadata as Record<string, unknown>) ?? {};
  const lastFamilyNudgedAt = meta.family_nudged_at as string | undefined;

  if (lastFamilyNudgedAt) {
    const timeSinceNudge = Date.now() - new Date(lastFamilyNudgedAt).getTime();
    if (timeSinceNudge < NUDGE_COOLDOWN_MS) {
      const hoursRemaining = Math.ceil(
        (NUDGE_COOLDOWN_MS - timeSinceNudge) / (60 * 60 * 1000)
      );
      return NextResponse.json(
        {
          error: `This family was already nudged recently. Please wait ${hoursRemaining} hour(s).`,
          family_nudged_at: lastFamilyNudgedAt,
        },
        { status: 429 }
      );
    }
  }

  // Calculate profile completeness
  const completeness = calculateFamilyCompleteness(familyProfile, familyProfile.email);

  const siteUrl = getSiteUrl();
  const familyName = familyProfile.display_name || "Care Seeker";
  const providerName = providerProfile?.display_name || "the provider";
  const subject = `Complete your profile to help ${providerName} respond`;
  const fromAddress = "Olera <noreply@olera.care>";

  // Build profile URL (without tracking for preview, with tracking for actual send)
  const profileUrl = isPreview
    ? `${siteUrl}/portal/profile`
    : appendTrackingParams(`${siteUrl}/portal/profile`, null);

  // Build email HTML
  const html = familyNudgeEmail({
    unsubscribeId: familyProfile.id,
    familyName,
    providerName,
    missingFields: completeness.missingFields.slice(0, 5), // Max 5 fields
    completionPercent: completeness.percentage,
    profileUrl,
  });

  // If preview mode, return email details without sending
  if (isPreview) {
    // Check if email would be suppressed
    let warning: string | null = null;
    const suppressed = await isSuppressedRecipient(familyProfile.email);
    const undeliverable = await isUndeliverable(familyProfile.email);

    if (suppressed) {
      warning = "This email may be suppressed due to prior bounces or spam complaints on record.";
    } else if (undeliverable) {
      warning = "This email may be suppressed because the address was verified as invalid/undeliverable.";
    }

    return NextResponse.json({
      preview: true,
      from: fromAddress,
      to: familyProfile.email,
      subject,
      html,
      warning,
    });
  }

  // Reserve email log ID for tracking (only when actually sending)
  const emailLogId = await reserveEmailLogId({
    to: familyProfile.email,
    subject,
    emailType: "family_nudge",
    recipientType: "family",
    metadata: {
      connection_id,
      family_profile_id,
      nudged_by: user.email,
      completion_percent: completeness.percentage,
    },
  });

  // Update profileUrl with tracking params for actual send
  const trackedProfileUrl = appendTrackingParams(
    `${siteUrl}/portal/profile`,
    emailLogId
  );

  // Rebuild email HTML with tracked URL for actual send
  const trackedHtml = familyNudgeEmail({
    unsubscribeId: familyProfile.id,
    familyName,
    providerName,
    missingFields: completeness.missingFields.slice(0, 5),
    completionPercent: completeness.percentage,
    profileUrl: trackedProfileUrl,
  });

  // Send email with tracked HTML
  const { success, error: sendError } = await sendEmail({
    to: familyProfile.email,
    subject,
    html: trackedHtml,
    emailType: "family_nudge",
    recipientType: "family",
    metadata: {
      connection_id,
      family_profile_id,
      nudged_by: user.email,
      completion_percent: completeness.percentage,
    },
    emailLogId: emailLogId ?? undefined,
  });

  if (!success) {
    console.error("[nudge-family] Email send failed:", sendError);
    return NextResponse.json(
      { error: "Failed to send nudge email" },
      { status: 500 }
    );
  }

  // Update connection metadata with nudge info
  const nudgedAt = new Date().toISOString();
  const updatedMeta = {
    ...meta,
    family_nudged_at: nudgedAt,
    family_nudged_by: user.email,
    family_nudge_count: ((meta.family_nudge_count as number) || 0) + 1,
  };

  const { error: updateError } = await db
    .from("connections")
    .update({ metadata: updatedMeta })
    .eq("id", connection_id);

  if (updateError) {
    console.error("[nudge-family] Failed to update connection metadata:", updateError);
    // Don't fail the request - email was sent successfully
  }

  return NextResponse.json({
    success: true,
    family_nudged_at: nudgedAt,
    family_email: familyProfile.email,
  });
}
