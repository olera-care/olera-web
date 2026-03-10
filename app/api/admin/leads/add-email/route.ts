import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { connectionRequestEmail } from "@/lib/email-templates";

/**
 * POST /api/admin/leads/add-email
 *
 * Add email to a provider (business_profiles + olera-providers) and
 * send deferred lead notification emails for flagged connections.
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

    const { profileId, email } = await request.json();

    if (!profileId || !email) {
      return NextResponse.json({ error: "Missing profileId or email" }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const db = getServiceClient();

    // Get the business profile
    const { data: profile, error: profileErr } = await db
      .from("business_profiles")
      .select("id, display_name, email, source_provider_id")
      .eq("id", profileId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (profile.email) {
      return NextResponse.json({ error: "Provider already has an email" }, { status: 400 });
    }

    // Update email on business_profiles
    await db
      .from("business_profiles")
      .update({ email })
      .eq("id", profileId);

    // Also sync to olera-providers if linked
    if (profile.source_provider_id) {
      await db
        .from("olera-providers")
        .update({ email })
        .eq("provider_id", profile.source_provider_id);
    }

    // Find and process flagged connections
    const { data: flaggedConnections } = await db
      .from("connections")
      .select("id, message, from_profile:business_profiles!connections_from_profile_id_fkey(display_name)")
      .eq("to_profile_id", profileId)
      .eq("status", "pending")
      .contains("metadata", { needs_provider_email: true });

    let emailsSent = 0;

    if (flaggedConnections && flaggedConnections.length > 0) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
      const careTypeMap: Record<string, string> = {
        home_care: "Home Care",
        home_health: "Home Health Care",
        assisted_living: "Assisted Living",
        memory_care: "Memory Care",
      };

      for (const conn of flaggedConnections) {
        try {
          let careType: string | null = null;
          let additionalNotes: string | null = null;
          let familyName = "A family";
          try {
            const msg = JSON.parse(conn.message || "{}");
            careType = msg.care_type ? (careTypeMap[msg.care_type] || msg.care_type) : null;
            additionalNotes = msg.additional_notes || null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fromProfile = (conn as any).from_profile as { display_name: string } | null;
            familyName = fromProfile?.display_name || `${msg.seeker_first_name || ""} ${msg.seeker_last_name || ""}`.trim() || "A family";
          } catch { /* use defaults */ }

          await sendEmail({
            to: email,
            subject: `New care inquiry from ${familyName} on Olera`,
            html: connectionRequestEmail({
              providerName: profile.display_name || "Provider",
              familyName,
              careType,
              message: additionalNotes,
              viewUrl: `${siteUrl}/provider/connections`,
            }),
          });

          // Clear the flag
          const { data: connData } = await db
            .from("connections")
            .select("metadata")
            .eq("id", conn.id)
            .single();

          if (connData?.metadata) {
            const meta = connData.metadata as Record<string, unknown>;
            delete meta.needs_provider_email;
            meta.email_sent_at = new Date().toISOString();
            await db
              .from("connections")
              .update({ metadata: meta })
              .eq("id", conn.id);
          }

          emailsSent++;
        } catch (emailErr) {
          console.error(`Failed to send deferred email for connection ${conn.id}:`, emailErr);
        }
      }
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "add_provider_email",
      targetType: "business_profile",
      targetId: profileId,
      details: {
        provider_name: profile.display_name,
        email,
        emails_sent: emailsSent,
      },
    });

    return NextResponse.json({
      success: true,
      emailsSent,
    });
  } catch (err) {
    console.error("Add email error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
