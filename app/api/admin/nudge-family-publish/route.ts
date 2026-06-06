import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { goLiveReminderEmail } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";

/**
 * POST /api/admin/nudge-family-publish
 *
 * Sends a reminder email to a family to publish their profile.
 * Used when family profile is complete (≥80%) but not published.
 * Reuses the existing goLiveReminderEmail template.
 *
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
      from_profile_id,
      to_profile_id,
      metadata,
      from_profile:business_profiles!connections_from_profile_id_fkey(
        id,
        display_name,
        email,
        city,
        state,
        care_types
      ),
      to_profile:business_profiles!connections_to_profile_id_fkey(display_name)
    `
    )
    .eq("id", connection_id)
    .single();

  if (fetchError || !connection) {
    console.error("[nudge-family-publish] Connection not found:", fetchError);
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  // Normalize joined relations
  const fromProfile = Array.isArray(connection.from_profile)
    ? connection.from_profile[0]
    : connection.from_profile;
  const toProfile = Array.isArray(connection.to_profile)
    ? connection.to_profile[0]
    : connection.to_profile;

  if (!fromProfile?.email?.trim()) {
    return NextResponse.json(
      { error: "Family has no email address" },
      { status: 400 }
    );
  }

  // Check cooldown (using family_publish_nudged_at in metadata)
  const meta = (connection.metadata as Record<string, unknown>) ?? {};
  const lastPublishNudgedAt = meta.family_publish_nudged_at as string | undefined;

  if (lastPublishNudgedAt) {
    const timeSinceNudge = Date.now() - new Date(lastPublishNudgedAt).getTime();
    if (timeSinceNudge < NUDGE_COOLDOWN_MS) {
      const hoursRemaining = Math.ceil(
        (NUDGE_COOLDOWN_MS - timeSinceNudge) / (60 * 60 * 1000)
      );
      return NextResponse.json(
        {
          error: `This family was already nudged to publish recently. Please wait ${hoursRemaining} hour(s).`,
          family_publish_nudged_at: lastPublishNudgedAt,
        },
        { status: 429 }
      );
    }
  }

  const siteUrl = getSiteUrl();
  const familyName = fromProfile.display_name?.split(/\s+/)[0] || "there";
  const city = fromProfile.city || "your area";
  const providerName = toProfile?.display_name || "the provider";

  // Count providers in the family's area (simplified - just use a reasonable number)
  // The goLiveReminderEmail can work without this, but it's nice to have
  let providerCount: number | undefined;
  if (fromProfile.city && fromProfile.state) {
    const { count } = await db
      .from("olera-providers")
      .select("provider_id", { count: "exact", head: true })
      .eq("state", fromProfile.state)
      .ilike("city", fromProfile.city)
      .or("deleted.is.null,deleted.eq.false")
      .limit(1);
    providerCount = count ?? undefined;
  }

  // Reserve email log ID for tracking
  const subject = providerCount
    ? `${providerCount} providers in ${city} are looking for families like yours`
    : `Providers in ${city} are looking for families like yours`;

  const emailLogId = await reserveEmailLogId({
    to: fromProfile.email,
    subject,
    emailType: "go_live_reminder",
    recipientType: "family",
    metadata: {
      connection_id,
      family_profile_id,
      nudged_by: user.email,
      context: "admin_nudge_publish",
      provider_name: providerName,
    },
  });

  // Build profile URL with tracking
  const matchesUrl = appendTrackingParams(
    `${siteUrl}/portal/profile`,
    emailLogId
  );

  // Build and send email using existing goLiveReminderEmail template
  const html = goLiveReminderEmail({
    unsubscribeId: family_profile_id,
    familyName,
    matchesUrl,
    city,
    providerCount,
    // topProviders omitted for simplicity - the email works without them
  });

  const { success, error: sendError } = await sendEmail({
    to: fromProfile.email,
    subject,
    html,
    emailType: "go_live_reminder",
    recipientType: "family",
    metadata: {
      connection_id,
      family_profile_id,
      nudged_by: user.email,
      context: "admin_nudge_publish",
    },
    emailLogId: emailLogId ?? undefined,
  });

  if (!success) {
    console.error("[nudge-family-publish] Email send failed:", sendError);
    return NextResponse.json(
      { error: "Failed to send nudge email" },
      { status: 500 }
    );
  }

  // Update connection metadata with nudge info
  const nudgedAt = new Date().toISOString();
  const updatedMeta = {
    ...meta,
    family_publish_nudged_at: nudgedAt,
    family_publish_nudged_by: user.email,
    family_publish_nudge_count: ((meta.family_publish_nudge_count as number) || 0) + 1,
  };

  const { error: updateError } = await db
    .from("connections")
    .update({ metadata: updatedMeta })
    .eq("id", connection_id);

  if (updateError) {
    console.error("[nudge-family-publish] Failed to update connection metadata:", updateError);
    // Don't fail the request - email was sent successfully
  }

  return NextResponse.json({
    success: true,
    family_publish_nudged_at: nudgedAt,
    family_email: fromProfile.email,
  });
}
