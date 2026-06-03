import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
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

  // Reserve email log ID for tracking
  const emailLogId = await reserveEmailLogId({
    to: familyProfile.email,
    subject: `Complete your profile to help ${providerName} respond`,
    emailType: "family_nudge",
    recipientType: "family",
    metadata: {
      connection_id,
      family_profile_id,
      nudged_by: user.email,
      completion_percent: completeness.percentage,
    },
  });

  // Build profile URL with tracking
  const profileUrl = appendTrackingParams(
    `${siteUrl}/portal/profile`,
    emailLogId
  );

  // Build and send email
  const html = familyNudgeEmail({
    familyName,
    providerName,
    missingFields: completeness.missingFields.slice(0, 5), // Max 5 fields
    completionPercent: completeness.percentage,
    profileUrl,
  });

  const { success, error: sendError } = await sendEmail({
    to: familyProfile.email,
    subject: `Complete your profile to help ${providerName} respond`,
    html,
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
