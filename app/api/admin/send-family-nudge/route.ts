import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { newMessageEmail } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";

/**
 * POST /api/admin/send-family-nudge
 *
 * The family-side mirror of /api/admin/send-nudge. When a provider has
 * replied but the family went quiet, this re-surfaces the provider's reply to
 * the family ("you have an unread message from <provider>") so they re-engage.
 * Admin-only, 24h cooldown per connection.
 *
 * Body: { connection_id: string }
 */

const NUDGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

interface ThreadMsg {
  from_profile_id?: string;
  text?: string;
  created_at?: string;
  is_auto_reply?: boolean;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();

  let body: { connection_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { connection_id } = body;
  if (!connection_id) {
    return NextResponse.json({ error: "connection_id is required" }, { status: 400 });
  }

  const { data: connection, error: fetchError } = await db
    .from("connections")
    .select(`
      id, type, from_profile_id, to_profile_id, metadata, created_at,
      from_profile:business_profiles!connections_from_profile_id_fkey(display_name, email, account_id),
      to_profile:business_profiles!connections_to_profile_id_fkey(display_name, email, account_id)
    `)
    .eq("id", connection_id)
    .maybeSingle();

  if (fetchError || !connection) {
    console.error("[send-family-nudge] Connection not found:", fetchError);
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
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
  const providerProfileId = isInquiry ? connection.to_profile_id : connection.from_profile_id;

  // Resolve family email: business_profiles.email → accounts → auth.users
  // (mirrors app/api/connections/message/route.ts).
  let familyEmail = familyProfile?.email?.trim() || null;
  if (!familyEmail && familyProfile?.account_id) {
    const { data: acct } = await db
      .from("accounts")
      .select("user_id")
      .eq("id", familyProfile.account_id)
      .maybeSingle();
    if (acct?.user_id) {
      const { data: authData } = await db.auth.admin.getUserById(acct.user_id);
      familyEmail = authData?.user?.email ?? null;
    }
  }
  if (!familyEmail) {
    return NextResponse.json({ error: "Family has no email address on file" }, { status: 400 });
  }

  // Cooldown (separate key from the provider nudge).
  const meta = (connection.metadata as Record<string, unknown>) ?? {};
  const lastNudgedAt = meta.family_nudged_at as string | undefined;
  if (lastNudgedAt) {
    const since = Date.now() - new Date(lastNudgedAt).getTime();
    if (since < NUDGE_COOLDOWN_MS) {
      const hrs = Math.ceil((NUDGE_COOLDOWN_MS - since) / (60 * 60 * 1000));
      return NextResponse.json(
        { error: `This family was already nudged recently. Please wait ${hrs} hour(s).`, family_nudged_at: lastNudgedAt },
        { status: 429 }
      );
    }
  }

  // Re-surface the provider's most recent non-auto reply as the preview.
  // Use resolved providerProfileId based on connection type.
  const thread = (meta.thread as ThreadMsg[]) || [];
  const providerReply = [...thread]
    .reverse()
    .find((m) => m.from_profile_id === providerProfileId && m.is_auto_reply !== true && m.text);
  const providerName = providerProfile?.display_name || "A provider";
  const familyName = familyProfile?.display_name || "there";
  let preview = providerReply?.text?.trim() || `${providerName} responded to your care inquiry.`;
  if (preview.length > 200) preview = preview.slice(0, 197) + "...";

  const emailType = "family_reengagement";
  const emailLogId = await reserveEmailLogId({
    to: familyEmail,
    subject: `${providerName} replied to your care inquiry`,
    emailType,
    recipientType: "family",
    metadata: { connection_id, nudged_by: user.email },
  });

  const viewUrl = appendTrackingParams(`${getSiteUrl()}/portal/inbox?id=${connection_id}`, emailLogId);

  const { success, error: sendError } = await sendEmail({
    to: familyEmail,
    subject: `${providerName} replied to your care inquiry`,
    html: newMessageEmail({
      recipientName: familyName,
      senderName: providerName,
      messagePreview: preview,
      viewUrl,
    }),
    emailType,
    recipientType: "family",
    metadata: { connection_id, nudged_by: user.email },
    emailLogId: emailLogId ?? undefined,
  });

  if (!success) {
    console.error("[send-family-nudge] Email send failed:", sendError);
    return NextResponse.json({ error: "Failed to send the follow-up email" }, { status: 500 });
  }

  const nudgedAt = new Date().toISOString();
  const { error: updateError } = await db
    .from("connections")
    .update({
      metadata: {
        ...meta,
        family_nudged_at: nudgedAt,
        family_nudged_by: user.email,
        family_nudge_count: ((meta.family_nudge_count as number) || 0) + 1,
      },
    })
    .eq("id", connection_id);
  if (updateError) {
    console.error("[send-family-nudge] metadata update failed:", updateError);
    // Email already sent — don't fail the request.
  }

  return NextResponse.json({ success: true, family_nudged_at: nudgedAt, family_email: familyEmail });
}
