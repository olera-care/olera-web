import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { generateICS } from "@/lib/ics-generator";
import { generateMedJobsNotificationUrl } from "@/lib/claim-tokens";
import { getAccessTier, canScheduleInterview } from "@/lib/medjobs-access";
import type { InterviewStatus } from "@/lib/types";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/medjobs/interviews
 * List interviews for the authenticated user (provider or student).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();

    // Find the user's profile IDs
    const { data: account } = await admin.from("accounts").select("id").eq("user_id", user.id).single();
    if (!account) return NextResponse.json({ error: "No account" }, { status: 404 });

    const { data: profiles } = await admin.from("business_profiles").select("id, type").eq("account_id", account.id);
    const profileIds = (profiles || []).map((p) => p.id);

    if (profileIds.length === 0) return NextResponse.json({ interviews: [] });

    // Fetch interviews where user is either provider or student
    const { data: interviews } = await admin
      .from("interviews")
      .select(`
        *,
        provider:business_profiles!interviews_provider_profile_id_fkey(id, display_name, image_url, city, state, email, phone),
        student:business_profiles!interviews_student_profile_id_fkey(id, slug, display_name, image_url, email, metadata)
      `)
      .or(`provider_profile_id.in.(${profileIds.join(",")}),student_profile_id.in.(${profileIds.join(",")})`)
      .order("created_at", { ascending: false });

    return NextResponse.json({ interviews: interviews || [] });
  } catch (err) {
    console.error("[medjobs/interviews] GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/medjobs/interviews
 * Create a new interview proposal. Supports both directions:
 * - Provider proposes to student: send { studentProfileId, ... }
 * - Student proposes to provider: send { providerProfileId, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      studentProfileId,
      providerProfileId,
      type = "video",
      proposedTime,
      alternativeTime,
      location,
      notes,
    } = body;

    if (!proposedTime || (!studentProfileId && !providerProfileId)) {
      return NextResponse.json({ error: "proposedTime and either studentProfileId or providerProfileId are required" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Get the caller's account and profiles
    const { data: account } = await admin.from("accounts").select("id").eq("user_id", user.id).single();
    if (!account) return NextResponse.json({ error: "No account" }, { status: 403 });

    const { data: callerProfiles } = await admin
      .from("business_profiles")
      .select("id, type, display_name, email")
      .eq("account_id", account.id);

    if (!callerProfiles?.length) {
      return NextResponse.json({ error: "No profile found" }, { status: 403 });
    }

    let resolvedProviderId: string;
    let resolvedStudentId: string;
    let proposedById: string;
    let providerProfile: { id: string; display_name: string; email: string; slug?: string };
    let studentProfile: { id: string; display_name: string; email: string; slug?: string };

    if (studentProfileId) {
      // Provider → Student flow
      const callerProvider = callerProfiles.find((p) => p.type === "organization" || p.type === "caregiver");
      if (!callerProvider) return NextResponse.json({ error: "Provider profile required" }, { status: 403 });

      // Paywall gate: check provider's access tier before allowing outbound request
      const { data: providerFull } = await admin
        .from("business_profiles")
        .select("metadata")
        .eq("id", callerProvider.id)
        .single();
      const providerMeta = (providerFull?.metadata ?? {}) as Record<string, unknown>;
      const access = getAccessTier(true, providerMeta);
      if (!canScheduleInterview(access)) {
        return NextResponse.json({ error: "upgrade_required", tier: access.tier }, { status: 402 });
      }

      const { data: target } = await admin
        .from("business_profiles")
        .select("id, display_name, email, slug")
        .eq("id", studentProfileId)
        .eq("type", "student")
        .single();
      if (!target) return NextResponse.json({ error: "Student not found" }, { status: 404 });

      resolvedProviderId = callerProvider.id;
      resolvedStudentId = target.id;
      proposedById = callerProvider.id;
      providerProfile = callerProvider as typeof providerProfile;
      studentProfile = target;
    } else {
      // Student → Provider flow
      const callerStudent = callerProfiles.find((p) => p.type === "student");
      if (!callerStudent) return NextResponse.json({ error: "Student profile required" }, { status: 403 });

      const { data: target } = await admin
        .from("business_profiles")
        .select("id, display_name, email, slug")
        .eq("id", providerProfileId)
        .in("type", ["organization", "caregiver"])
        .single();
      if (!target) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

      resolvedProviderId = target.id;
      resolvedStudentId = callerStudent.id;
      proposedById = callerStudent.id;
      providerProfile = target;
      studentProfile = callerStudent as typeof studentProfile;
    }

    // Create the interview
    const { data: interview, error: insertError } = await admin
      .from("interviews")
      .insert({
        provider_profile_id: resolvedProviderId,
        student_profile_id: resolvedStudentId,
        status: "proposed",
        type,
        proposed_time: proposedTime,
        alternative_time: alternativeTime || null,
        location: location || null,
        notes: notes || null,
        proposed_by: proposedById,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[medjobs/interviews] insert error:", insertError);
      return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
    }

    // Send notification email to the other party
    try {
      const typeLabel = type === "video" ? "Video" : type === "in_person" ? "In-Person" : "Phone";
      const time = new Date(proposedTime).toLocaleString("en-US", {
        weekday: "long", month: "long", day: "numeric",
        hour: "numeric", minute: "2-digit", timeZoneName: "short",
      });

      // Email goes to whoever did NOT propose
      const recipientEmail = proposedById === providerProfile.id ? studentProfile.email : providerProfile.email;
      const proposerName = proposedById === providerProfile.id ? providerProfile.display_name : studentProfile.display_name;

      // When sending to provider (Student → Provider flow), use magic link with otk token
      // When sending to student (Provider → Student flow), use direct portal link
      const isProviderRecipient = proposedById !== providerProfile.id;
      let viewUrl: string;
      if (isProviderRecipient) {
        // Provider receives - use magic link if slug available, otherwise original fallback
        viewUrl = providerProfile.slug && providerProfile.email
          ? generateMedJobsNotificationUrl(providerProfile.slug, providerProfile.email, "interview", interview.id)
          : `${process.env.NEXT_PUBLIC_SITE_URL}/provider/caregivers`;
      } else {
        // Student receives - use portal link (unchanged from original)
        viewUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/portal/medjobs/interviews`;
      }

      await sendEmail({
        to: recipientEmail!,
        subject: `Interview request from ${proposerName}`,
        html: `
          <h2>You have an interview request!</h2>
          <p><strong>${proposerName}</strong> would like to schedule a ${typeLabel.toLowerCase()} interview.</p>
          <p><strong>Proposed time:</strong> ${time}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
          <p><a href="${viewUrl}">View & respond on Olera</a></p>
        `,
        emailType: "interview_proposed",
      });
    } catch (err) {
      console.error("[medjobs/interviews] email error:", err);
    }

    return NextResponse.json({ interviewId: interview.id });
  } catch (err) {
    console.error("[medjobs/interviews] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * PATCH /api/medjobs/interviews
 * Update interview status (confirm, cancel, reschedule).
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { interviewId, status, newTime } = body as {
      interviewId: string;
      status: InterviewStatus;
      newTime?: string;
    };

    if (!interviewId || !status) {
      return NextResponse.json({ error: "interviewId and status required" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Fetch the interview
    const { data: interview } = await admin
      .from("interviews")
      .select(`
        *,
        provider:business_profiles!interviews_provider_profile_id_fkey(id, display_name, email),
        student:business_profiles!interviews_student_profile_id_fkey(id, display_name, email, slug)
      `)
      .eq("id", interviewId)
      .single();

    if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

    // Verify the user is a participant
    const { data: account } = await admin.from("accounts").select("id").eq("user_id", user.id).single();
    if (!account) return NextResponse.json({ error: "No account" }, { status: 403 });

    const { data: userProfiles } = await admin.from("business_profiles").select("id, type, metadata").eq("account_id", account.id);
    const userProfileIds = (userProfiles || []).map((p: { id: string }) => p.id);
    const isParticipant = userProfileIds.includes(interview.provider_profile_id) || userProfileIds.includes(interview.student_profile_id);
    if (!isParticipant) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    // Paywall gate: if a provider is confirming an inbound interview, check their tier
    if (status === "confirmed") {
      const isProviderConfirming =
        userProfileIds.includes(interview.provider_profile_id) &&
        interview.proposed_by !== interview.provider_profile_id;

      if (isProviderConfirming) {
        const providerProfile2 = (userProfiles || []).find(
          (p: { id: string; type: string }) =>
            p.id === interview.provider_profile_id && (p.type === "organization" || p.type === "caregiver")
        );
        if (providerProfile2) {
          const providerMeta = ((providerProfile2 as { metadata?: unknown }).metadata ?? {}) as Record<string, unknown>;
          const access = getAccessTier(true, providerMeta);
          if (!canScheduleInterview(access)) {
            return NextResponse.json({ error: "upgrade_required", tier: access.tier }, { status: 402 });
          }
        }
      }
    }

    // Build update
    const update: Record<string, unknown> = { status };
    if (status === "confirmed") {
      update.confirmed_time = interview.proposed_time;
    }
    if (status === "rescheduled" && newTime) {
      update.proposed_time = newTime;
      update.status = "proposed";
    }

    await admin.from("interviews").update(update).eq("id", interviewId);

    // Increment the provider's confirmed interview count after successful confirmation
    if (status === "confirmed") {
      try {
        const { data: providerRow } = await admin
          .from("business_profiles")
          .select("metadata")
          .eq("id", interview.provider_profile_id)
          .single();
        const meta = ((providerRow?.metadata as Record<string, unknown>) ?? {});
        const currentCount = (meta.medjobs_interview_count as number) || 0;
        await admin
          .from("business_profiles")
          .update({ metadata: { ...meta, medjobs_interview_count: currentCount + 1 } })
          .eq("id", interview.provider_profile_id);
      } catch (err) {
        console.error("[medjobs/interviews] count increment error:", err);
      }
    }

    // Send emails based on status change
    const provider = interview.provider as { display_name: string; email: string };
    const student = interview.student as { display_name: string; email: string; slug: string };

    if (status === "confirmed") {
      const confirmedTime = new Date(interview.proposed_time);
      const typeLabel = interview.type === "video" ? "Video" : interview.type === "in_person" ? "In-Person" : "Phone";

      // Generate .ics
      const icsContent = generateICS({
        title: `MedJobs Interview: ${student.display_name} × ${provider.display_name}`,
        description: `${typeLabel} interview scheduled via Olera MedJobs.${interview.notes ? `\n\nNotes: ${interview.notes}` : ""}`,
        location: interview.location || (interview.type === "video" ? "Video call — link TBD" : undefined),
        startTime: confirmedTime,
        durationMinutes: interview.duration_minutes || 30,
        organizerEmail: provider.email,
        attendeeEmail: student.email,
      });

      const icsBase64 = Buffer.from(icsContent).toString("base64");
      const time = confirmedTime.toLocaleString("en-US", {
        weekday: "long", month: "long", day: "numeric",
        hour: "numeric", minute: "2-digit", timeZoneName: "short",
      });

      // Email both parties with .ics attachment
      const confirmationHtml = (name: string, otherName: string) => `
        <h2>Interview Confirmed!</h2>
        <p>Your ${typeLabel.toLowerCase()} interview with <strong>${otherName}</strong> is confirmed.</p>
        <p><strong>When:</strong> ${time}</p>
        <p><strong>Duration:</strong> ${interview.duration_minutes || 30} minutes</p>
        ${interview.location ? `<p><strong>Where:</strong> ${interview.location}</p>` : ""}
        <p>A calendar invite is attached to this email.</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/portal/medjobs/interviews">View on Olera</a></p>
      `;

      try {
        await sendEmail({
          to: student.email,
          subject: `Interview confirmed with ${provider.display_name}`,
          html: confirmationHtml(student.display_name, provider.display_name),
          emailType: "interview_confirmed",
          attachments: [{ filename: "interview.ics", content: icsBase64, encoding: "base64", type: "text/calendar" }],
        });
        await sendEmail({
          to: provider.email,
          subject: `Interview confirmed with ${student.display_name}`,
          html: confirmationHtml(provider.display_name, student.display_name),
          emailType: "interview_confirmed",
          attachments: [{ filename: "interview.ics", content: icsBase64, encoding: "base64", type: "text/calendar" }],
        });
      } catch (err) {
        console.error("[medjobs/interviews] confirmation email error:", err);
      }
    }

    if (status === "cancelled") {
      try {
        const cancelHtml = (otherName: string) => `
          <h2>Interview Cancelled</h2>
          <p>The interview with <strong>${otherName}</strong> has been cancelled.</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/portal/medjobs/interviews">View on Olera</a></p>
        `;
        await sendEmail({ to: student.email, subject: "Interview cancelled", html: cancelHtml(provider.display_name), emailType: "interview_cancelled" });
        await sendEmail({ to: provider.email, subject: "Interview cancelled", html: cancelHtml(student.display_name), emailType: "interview_cancelled" });
      } catch (err) {
        console.error("[medjobs/interviews] cancel email error:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[medjobs/interviews] PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
