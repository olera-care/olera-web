import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { questionReceivedEmail } from "@/lib/email-templates";

/**
 * POST /api/admin/questions/add-email
 *
 * Add email to a provider and send deferred question notifications.
 * Also clears needs_provider_email flags on any pending leads for the same provider.
 *
 * Body: { providerSlug, email }
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

    const { providerSlug, email } = await request.json();

    if (!providerSlug || !email) {
      return NextResponse.json({ error: "Missing providerSlug or email" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const db = getServiceClient();

    // Look up provider by slug
    const { data: provider, error: providerErr } = await db
      .from("business_profiles")
      .select("id, display_name, email, source_provider_id, slug")
      .eq("slug", providerSlug)
      .single();

    if (providerErr || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (provider.email) {
      return NextResponse.json({ error: "Provider already has an email" }, { status: 400 });
    }

    // Update email on business_profiles
    await db
      .from("business_profiles")
      .update({ email })
      .eq("id", provider.id);

    // Sync to olera-providers if linked
    if (provider.source_provider_id) {
      await db
        .from("olera-providers")
        .update({ email })
        .eq("provider_id", provider.source_provider_id);
    }

    // Find flagged questions for this provider
    const { data: flaggedQuestions } = await db
      .from("provider_questions")
      .select("id, question, asker_name, asker_email, metadata")
      .eq("provider_id", providerSlug)
      .contains("metadata", { needs_provider_email: true });

    let emailsSent = 0;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

    if (flaggedQuestions && flaggedQuestions.length > 0) {
      for (const q of flaggedQuestions) {
        try {
          const emailSubject = `A family has a question about ${provider.display_name || "your organization"}`;
          const emailLogId = await reserveEmailLogId({
            to: email,
            subject: emailSubject,
            emailType: "question_received",
            recipientType: "provider",
            providerId: provider.id,
          });

          await sendEmail({
            to: email,
            subject: emailSubject,
            html: questionReceivedEmail({
              providerName: provider.display_name || "Provider",
              askerName: q.asker_name || "A family",
              question: q.question,
              providerUrl: appendTrackingParams(`${siteUrl}/provider/${providerSlug}/onboard`, emailLogId),
              providerSlug,
            }),
            emailType: "question_received",
            recipientType: "provider",
            providerId: provider.id,
            emailLogId: emailLogId ?? undefined,
          });

          // Clear the flag
          const meta = (q.metadata as Record<string, unknown>) || {};
          delete meta.needs_provider_email;
          meta.email_sent_at = new Date().toISOString();
          await db
            .from("provider_questions")
            .update({ metadata: meta })
            .eq("id", q.id);

          emailsSent++;
        } catch (emailErr) {
          console.error(`Failed to send deferred question email for ${q.id}:`, emailErr);
        }
      }
    }

    // Also clear needs_provider_email flags on any pending leads for this provider
    const { data: flaggedLeads } = await db
      .from("connections")
      .select("id, metadata")
      .eq("to_profile_id", provider.id)
      .contains("metadata", { needs_provider_email: true });

    if (flaggedLeads && flaggedLeads.length > 0) {
      for (const lead of flaggedLeads) {
        try {
          const meta = (lead.metadata as Record<string, unknown>) || {};
          delete meta.needs_provider_email;
          meta.email_sent_at = new Date().toISOString();
          await db
            .from("connections")
            .update({ metadata: meta })
            .eq("id", lead.id);
        } catch (err) {
          console.error(`Failed to clear lead flag for ${lead.id}:`, err);
        }
      }
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "add_provider_email_via_questions",
      targetType: "business_profile",
      targetId: provider.id,
      details: {
        provider_name: provider.display_name,
        provider_slug: providerSlug,
        email,
        question_emails_sent: emailsSent,
        lead_flags_cleared: flaggedLeads?.length ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      emailsSent,
    });
  } catch (err) {
    console.error("Add email (questions) error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
