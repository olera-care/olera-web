import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email";
import { applicationReceivedEmail, applicationSentEmail } from "@/lib/medjobs-email-templates";
import { sendSlackAlert, slackMedJobsApplication } from "@/lib/slack";
import { sendSMS } from "@/lib/twilio";
import { getTrackLabel } from "@/lib/medjobs-helpers";
import type { StudentMetadata } from "@/lib/types";

// Lazy initialization to avoid build-time errors when env vars are not available
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { providerProfileId, message } = body;

    if (!providerProfileId) {
      return NextResponse.json({ error: "Provider profile ID required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get student's account and profile
    const { data: account } = await supabaseAdmin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const { data: studentProfile } = await supabaseAdmin
      .from("business_profiles")
      .select("id, slug, display_name, email, metadata")
      .eq("account_id", account.id)
      .eq("type", "student")
      .single();

    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found. Please create your profile first." }, { status: 404 });
    }

    // Get provider profile
    const { data: providerProfile } = await supabaseAdmin
      .from("business_profiles")
      .select("id, display_name, email, phone, metadata")
      .eq("id", providerProfileId)
      .in("type", ["organization", "caregiver"])
      .single();

    if (!providerProfile) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Check for existing application
    const { data: existing } = await supabaseAdmin
      .from("connections")
      .select("id")
      .eq("from_profile_id", studentProfile.id)
      .eq("to_profile_id", providerProfileId)
      .eq("type", "application")
      .single();

    if (existing) {
      return NextResponse.json({ error: "You have already applied to this provider" }, { status: 409 });
    }

    // Create application connection
    const { data: connection, error } = await supabaseAdmin
      .from("connections")
      .insert({
        from_profile_id: studentProfile.id,
        to_profile_id: providerProfileId,
        type: "application",
        status: "pending",
        message: message?.trim() || null,
        metadata: {
          source: "medjobs",
          student_university: (studentProfile.metadata as Record<string, unknown>)?.university || null,
          student_program_track: (studentProfile.metadata as Record<string, unknown>)?.program_track || null,
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("[medjobs/apply-to-provider] insert error:", error);
      return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }

    const studentMeta = studentProfile.metadata as StudentMetadata;

    // Fire-and-forget: email to provider
    if (providerProfile.email) {
      try {
        await sendEmail({
          to: providerProfile.email,
          subject: `New MedJobs Application from ${studentProfile.display_name}`,
          html: applicationReceivedEmail({
            providerName: providerProfile.display_name,
            studentName: studentProfile.display_name,
            university: studentMeta.university || "Not specified",
            programTrack: getTrackLabel(studentMeta) || "Not specified",
            profileSlug: studentProfile.slug,
          }),
          emailType: "application_received",
          recipientType: "provider",
          providerId: providerProfile.id,
        });
      } catch (err) {
        console.error("[medjobs/apply-to-provider] provider email error:", err);
      }
    }

    // Fire-and-forget: email to student
    if (studentProfile.email) {
      try {
        await sendEmail({
          to: studentProfile.email,
          subject: `Application sent to ${providerProfile.display_name}`,
          html: applicationSentEmail({
            studentName: studentProfile.display_name,
            providerName: providerProfile.display_name,
          }),
          emailType: "application_sent",
          recipientType: "student",
        });
      } catch (err) {
        console.error("[medjobs/apply-to-provider] student email error:", err);
      }
    }

    // Fire-and-forget: SMS to provider
    if (providerProfile.phone) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
        await sendSMS({
          to: providerProfile.phone,
          body: `New MedJobs application from ${studentProfile.display_name} (${studentMeta.university || "student"}). View: ${siteUrl}/provider/medjobs/candidates/${studentProfile.slug}`,
        });
      } catch (err) {
        console.error("[medjobs/apply-to-provider] sms error:", err);
      }
    }

    // Fire-and-forget: Slack (structured)
    try {
      const alert = slackMedJobsApplication({
        studentName: studentProfile.display_name,
        providerName: providerProfile.display_name,
        university: studentMeta.university || "Not specified",
      });
      await sendSlackAlert(alert.text, alert.blocks);
    } catch (err) {
      console.error("[medjobs/apply-to-provider] slack error:", err);
    }

    return NextResponse.json({ connectionId: connection.id });
  } catch (err) {
    console.error("[medjobs/apply-to-provider] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
