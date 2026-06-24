/**
 * POST /api/medjobs/invite — Provider invites a student to a job posting.
 *
 * Creates a `connections` row with type "invitation" (provider→student),
 * seeds the first thread message with the canned intro, and fires
 * notification emails to both parties.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email";
import { invitationReceivedEmail, invitationSentEmail } from "@/lib/medjobs-email-templates";
import { sendSlackAlert } from "@/lib/slack";
import { HOURS_LABELS } from "@/lib/medjobs/job-postings";

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
    const { studentProfileId, posting, message: customMessage } = body as {
      studentProfileId?: string;
      message?: string;
      posting?: {
        id: string;
        title: string;
        hoursPerWeek: string;
        payMin: string;
        payMax: string;
      };
    };

    if (!studentProfileId || !posting?.id || !posting?.title) {
      return NextResponse.json({ error: "studentProfileId and posting are required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Get provider's account and profile
    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const { data: providerProfile } = await admin
      .from("business_profiles")
      .select("id, display_name, email, slug")
      .eq("account_id", account.id)
      .in("type", ["organization", "caregiver"])
      .limit(1)
      .single();

    if (!providerProfile) {
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    // Get student profile
    const { data: studentProfile } = await admin
      .from("business_profiles")
      .select("id, display_name, email, slug, metadata")
      .eq("id", studentProfileId)
      .eq("type", "student")
      .single();

    if (!studentProfile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Dedup: prevent duplicate invitation for same provider + student + posting
    const { data: existing } = await admin
      .from("connections")
      .select("id")
      .eq("from_profile_id", providerProfile.id)
      .eq("to_profile_id", studentProfileId)
      .eq("type", "invitation")
      .filter("metadata->>posting_id", "eq", posting.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Already invited to this posting" }, { status: 409 });
    }

    // Build the intro message (use custom message if provided, else canned default)
    const studentFirstName = studentProfile.display_name?.split(" ")[0] || "there";
    const introText = customMessage?.trim()
      || `Hey ${studentFirstName}, we thought you'd be great for this role. Check it out and apply if you think it's a fit!`;

    const now = new Date().toISOString();

    // Create the invitation connection
    const { data: connection, error } = await admin
      .from("connections")
      .insert({
        from_profile_id: providerProfile.id,
        to_profile_id: studentProfileId,
        type: "invitation",
        status: "pending",
        message: introText,
        metadata: {
          source: "medjobs",
          posting_id: posting.id,
          job_posting: {
            title: posting.title,
            hoursPerWeek: posting.hoursPerWeek,
            payMin: posting.payMin,
            payMax: posting.payMax,
          },
          thread: [
            {
              from_profile_id: providerProfile.id,
              text: introText,
              created_at: now,
            },
          ],
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("[medjobs/invite] insert error:", error);
      return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
    }

    const hoursLabel = HOURS_LABELS[posting.hoursPerWeek] || posting.hoursPerWeek;

    // Fire-and-forget: email to student
    if (studentProfile.email) {
      try {
        await sendEmail({
          to: studentProfile.email,
          subject: `${providerProfile.display_name} invited you to apply`,
          html: invitationReceivedEmail({
            studentName: studentProfile.display_name,
            providerName: providerProfile.display_name,
            jobTitle: posting.title,
            hoursLabel,
            payRange: `$${posting.payMin}–$${posting.payMax}/hr`,
          }),
          emailType: "invitation_received",
          recipientType: "student",
        });
      } catch (err) {
        console.error("[medjobs/invite] student email error:", err);
      }
    }

    // Fire-and-forget: confirmation email to provider
    if (providerProfile.email) {
      try {
        await sendEmail({
          to: providerProfile.email,
          subject: `Invite sent to ${studentProfile.display_name}`,
          html: invitationSentEmail({
            providerName: providerProfile.display_name,
            studentName: studentProfile.display_name,
            jobTitle: posting.title,
          }),
          emailType: "invitation_sent",
          recipientType: "provider",
          providerId: providerProfile.id,
        });
      } catch (err) {
        console.error("[medjobs/invite] provider email error:", err);
      }
    }

    // Fire-and-forget: Slack
    try {
      await sendSlackAlert(
        `MedJobs Invite: ${providerProfile.display_name} invited ${studentProfile.display_name} to "${posting.title}"`
      );
    } catch (err) {
      console.error("[medjobs/invite] slack error:", err);
    }

    return NextResponse.json({ connectionId: connection.id });
  } catch (err) {
    console.error("[medjobs/invite] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
