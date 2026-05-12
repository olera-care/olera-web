import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { providerNudgeEmail } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";

/**
 * POST /api/admin/send-nudge
 *
 * Sends a reminder email to a provider about an unanswered lead.
 * Admin-only endpoint with 24h cooldown per connection.
 *
 * Body: { connection_id: string }
 */

const NUDGE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
  // Admin auth check
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("business_profiles")
    .select("type")
    .eq("account_id", user.id)
    .maybeSingle();

  const isAdmin =
    profile?.type === "admin" ||
    user.email?.endsWith("@olera.care") ||
    user.email?.endsWith("@anthropic.com");

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getServiceDb();
  if (!db) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

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

  // Fetch connection with provider profile
  const { data: connection, error: fetchError } = await db
    .from("connections")
    .select(
      `
      id,
      from_profile_id,
      to_profile_id,
      message,
      metadata,
      created_at,
      from_profile:business_profiles!connections_from_profile_id_fkey(display_name),
      to_profile:business_profiles!connections_to_profile_id_fkey(display_name, slug, source_provider_id, email)
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

  // Normalize joined relations
  const fromProfile = Array.isArray(connection.from_profile)
    ? connection.from_profile[0]
    : connection.from_profile;
  const toProfile = Array.isArray(connection.to_profile)
    ? connection.to_profile[0]
    : connection.to_profile;

  if (!toProfile?.email?.trim()) {
    return NextResponse.json(
      { error: "Provider has no email address" },
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

  // Extract message preview
  let messagePreview: string | null = null;
  if (connection.message) {
    messagePreview = String(connection.message);
    if (messagePreview.length > 100) {
      messagePreview = messagePreview.substring(0, 97) + "...";
    }
  } else {
    const thread = (meta.thread as Array<{ text?: string }>) || [];
    if (thread.length > 0 && thread[0].text) {
      messagePreview = thread[0].text;
      if (messagePreview.length > 100) {
        messagePreview = messagePreview.substring(0, 97) + "...";
      }
    }
  }

  const siteUrl = getSiteUrl();
  const providerSlug = toProfile.slug || toProfile.source_provider_id || "";
  const providerName = toProfile.display_name || "Your Organization";
  const familyName = fromProfile?.display_name || "A family";

  // Reserve email log ID for tracking
  const emailLogId = await reserveEmailLogId({
    to: toProfile.email,
    subject: `${familyName} is waiting for a response`,
    emailType: "provider_nudge",
    recipientType: "provider",
    providerId: providerSlug,
    metadata: {
      connection_id,
      nudged_by: user.email,
      days_since_inquiry: daysSinceInquiry,
    },
  });

  // Build view URL with tracking
  const viewUrl = appendTrackingParams(
    `${siteUrl}/provider/connections`,
    emailLogId
  );

  // Build and send email
  const html = providerNudgeEmail({
    providerName,
    familyName,
    messagePreview,
    daysSinceInquiry,
    viewUrl,
    providerSlug,
  });

  const { success, error: sendError } = await sendEmail({
    to: toProfile.email,
    subject: `${familyName} is waiting for a response`,
    html,
    emailType: "provider_nudge",
    recipientType: "provider",
    providerId: providerSlug,
    metadata: {
      connection_id,
      nudged_by: user.email,
      days_since_inquiry: daysSinceInquiry,
    },
    emailLogId: emailLogId ?? undefined,
  });

  if (!success) {
    console.error("[send-nudge] Email send failed:", sendError);
    return NextResponse.json(
      { error: "Failed to send nudge email" },
      { status: 500 }
    );
  }

  // Update connection metadata with nudge info
  const nudgedAt = new Date().toISOString();
  const updatedMeta = {
    ...meta,
    nudged_at: nudgedAt,
    nudged_by: user.email,
    nudge_count: ((meta.nudge_count as number) || 0) + 1,
  };

  const { error: updateError } = await db
    .from("connections")
    .update({ metadata: updatedMeta })
    .eq("id", connection_id);

  if (updateError) {
    console.error("[send-nudge] Failed to update connection metadata:", updateError);
    // Don't fail the request - email was sent successfully
  }

  return NextResponse.json({
    success: true,
    nudged_at: nudgedAt,
    provider_email: toProfile.email,
  });
}
