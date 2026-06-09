import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { connectionRequestEmail } from "@/lib/email-templates";
import { generateLeadClaimUrl, generateProviderPortalUrl } from "@/lib/claim-tokens";
import { getSiteUrl } from "@/lib/site-url";

/**
 * POST /api/admin/connections/[id]/edit-email
 *
 * Edit provider email with sequence restart:
 * 1. Update business_profiles.email (override)
 * 2. Store old email in metadata.previous_emails[]
 * 3. Increment metadata.email_version
 * 4. Reset sequence: followup_stage=0, email_sent_at=now, clear stopped fields
 * 5. Send Day 0 email immediately
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: connectionId } = await params;
    const body = await request.json();
    const newEmail = body.newEmail?.trim();

    // Validation
    if (!newEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const db = getServiceClient();
    const siteUrl = getSiteUrl();

    // Fetch connection with both profiles
    const { data: conn, error: fetchError } = await db
      .from("connections")
      .select(`
        id, type, created_at, from_profile_id, to_profile_id, message, metadata,
        from_profile:business_profiles!connections_from_profile_id_fkey(display_name, care_types, metadata),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, slug, source_provider_id, email)
      `)
      .eq("id", connectionId)
      .eq("type", "inquiry")
      .maybeSingle();

    if (fetchError || !conn) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const fromProfile = Array.isArray(conn.from_profile) ? conn.from_profile[0] : conn.from_profile;
    const toProfile = Array.isArray(conn.to_profile) ? conn.to_profile[0] : conn.to_profile;

    if (!toProfile?.id) {
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    const oldEmail = toProfile.email?.trim() || null;

    if (oldEmail === newEmail) {
      return NextResponse.json({ error: "New email is the same as current email" }, { status: 400 });
    }

    // Update business_profiles.email
    const { error: updateError } = await db
      .from("business_profiles")
      .update({ email: newEmail })
      .eq("id", toProfile.id);

    if (updateError) {
      console.error("[edit-email] Failed to update business_profiles:", updateError);
      return NextResponse.json({ error: "Failed to update provider email" }, { status: 500 });
    }

    // Prepare metadata for later update
    const meta = (conn.metadata || {}) as Record<string, unknown>;
    const previousEmails = (meta.previous_emails as Array<{ email: string; changed_at: string; changed_by: string }>) || [];
    const emailVersion = ((meta.email_version as number) || 1) + 1;
    const now = new Date().toISOString();

    if (oldEmail) {
      previousEmails.push({
        email: oldEmail,
        changed_at: now,
        changed_by: `admin:${admin.id}`,
      });
    }

    // Prepare email data
    const familyName = fromProfile?.display_name || "A family";
    const careTypes = fromProfile?.care_types as string[] | null;
    const careType = careTypes?.[0] || null;
    const providerName = toProfile.display_name || "Provider";
    const providerSlug = toProfile.slug || toProfile.source_provider_id || toProfile.id;

    // Get care recipient from family metadata
    const familyMeta = (fromProfile?.metadata as Record<string, unknown>) || {};
    const relationshipRaw = familyMeta.relationship_to_recipient as string | undefined;
    const careRecipientMap: Record<string, string | null> = {
      parent: "their parent",
      spouse: "their spouse",
      grandparent: "their grandparent",
      myself: "themselves",
      other: null,
    };
    const careRecipient = relationshipRaw
      ? (careRecipientMap[relationshipRaw] !== undefined ? careRecipientMap[relationshipRaw] : null)
      : null;

    // Get provider city from olera-providers if available
    let city: string | null = null;
    if (toProfile.source_provider_id) {
      const { data: iosProvider } = await db
        .from("olera-providers")
        .select("city")
        .eq("provider_id", toProfile.source_provider_id)
        .maybeSingle();
      city = iosProvider?.city || null;
    }

    // Send Day 0 email
    const emailLogId = await reserveEmailLogId({
      to: newEmail,
      subject: `${familyName} is interested in your care services`,
      emailType: "connection_request",
      recipientType: "provider",
      providerId: providerSlug,
      metadata: {
        connection_id: connectionId,
        email_version: emailVersion,
        sent_by: `admin:${admin.id}`,
        is_email_edit_resend: true,
      },
    });

    const claimUrl = generateLeadClaimUrl(providerSlug, newEmail, connectionId, siteUrl);
    const viewUrl = appendTrackingParams(claimUrl, emailLogId);
    const manageListingUrl = generateProviderPortalUrl(providerSlug, newEmail, "manage", siteUrl);
    const settingsUrl = generateProviderPortalUrl(providerSlug, newEmail, "settings", siteUrl);

    const html = connectionRequestEmail({
      providerName,
      familyName,
      careType,
      city,
      careRecipient,
      viewUrl,
      manageListingUrl,
      settingsUrl,
    });

    const { success, error: sendError } = await sendEmail({
      to: newEmail,
      subject: `${familyName} is interested in your care services`,
      html,
      emailType: "connection_request",
      recipientType: "provider",
      providerId: providerSlug,
      metadata: {
        connection_id: connectionId,
        email_version: emailVersion,
        sent_by: `admin:${admin.id}`,
        is_email_edit_resend: true,
      },
      emailLogId: emailLogId ?? undefined,
    });

    if (!success) {
      console.error("[edit-email] Failed to send Day 0 email:", sendError);
      // Rollback business_profiles update
      await db.from("business_profiles").update({ email: oldEmail }).eq("id", toProfile.id);
      return NextResponse.json({
        success: false,
        error: "Failed to send email notification",
      }, { status: 500 });
    }

    // Email sent successfully - now update connection metadata
    const updatedMeta = {
      ...meta,
      email_version: emailVersion,
      previous_emails: previousEmails,
      email_sent_at: now,
      followup_stage: 0,
      followup_sent_at: null,
      followup_sent_by: null,
      followup_stopped_at: null,
      followup_stopped_reason: null,
      needs_call: false,
      nudged_at: null,
    };

    const { error: metaError } = await db
      .from("connections")
      .update({ metadata: updatedMeta })
      .eq("id", connectionId);

    if (metaError) {
      console.error("[edit-email] Failed to update connection metadata:", metaError);
      // Email was sent but metadata update failed - log warning but don't fail
      // Admin can manually check sequence status
      console.warn(`[edit-email] Connection ${connectionId} email sent to ${newEmail} but metadata not updated`);

      return NextResponse.json({
        success: true,
        warning: "Email updated but sequence state may be inconsistent. Check connection status.",
        emailVersion,
        oldEmail,
        newEmail,
      });
    }

    console.log(
      `[edit-email] Successfully edited email for connection ${connectionId}: ` +
      `${oldEmail || "(none)"} → ${newEmail} (v${emailVersion}). Day 0 email sent.`
    );

    return NextResponse.json({
      success: true,
      emailVersion,
      oldEmail,
      newEmail,
    });
  } catch (err) {
    console.error("[edit-email] Fatal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
