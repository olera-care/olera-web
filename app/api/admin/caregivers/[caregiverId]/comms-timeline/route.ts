import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/caregivers/[caregiverId]/comms-timeline
 *
 * Student counterpart to the provider comms timeline. Shows all emails
 * sent to this student with bounce/open/click indicators.
 *
 * Since students don't have a dedicated activity table like providers or
 * care seekers, this timeline focuses on email history only.
 *
 * Query params:
 *   - limit (optional, default 50, max 200) — total events returned
 */

/**
 * Escape a string for use in a PostgREST filter value.
 * Handles special characters that would otherwise break the query.
 */
function postgrestQuote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Student-relevant email types. Must match the actual emailType values used
 * when sending emails with recipientType: "student".
 *
 * IMPORTANT: Keep in sync with app/api/admin/students/email-health/route.ts
 */
const STUDENT_EMAIL_TYPES = [
  // Account/Auth
  "student_signup_welcome",
  "student_account_created",
  "student_welcome",
  "student_returning",
  "student_magic_link",
  // Profile lifecycle
  "profile_incomplete_nudge", // cron sends this (not "student_profile_incomplete_nudge")
  "medjobs_review_nudge",
  "medjobs_profile_approved",
  "medjobs_profile_rejected",
  "medjobs_profile_revoked",
  // Interviews
  "interview_proposed",
  "interview_confirmed",
  "interview_scheduled_confirmation",
  "interview_request_sent",
  "interview_cancelled",
  "interview_reminder",
  "interview_reschedule_sent",
  "interview_cancelled_admin",
  // Applications & Invitations
  "invitation_received", // provider invites student (not "student_invitation_received")
  "application_sent", // confirmation when student applies
  "application_response", // provider responds to application
  // Placements
  "placement_offered",
  "placement_accepted_confirmation",
  "placement_cancelled",
  // Job ready
  "medjobs_job_ready", // student accepts terms (not "student_job_ready")
] as const;

type EmailRow = {
  id: string;
  email_type: string;
  subject: string;
  channel: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
  first_opened_at: string | null;
  first_clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  error_message: string | null;
};

type TimelineEvent = {
  id: string;
  at: string;
  kind: "email";
  email: {
    log_id: string;
    email_type: string;
    subject: string;
    channel: string | null;
    status: string;
    delivered_at: string | null;
    first_opened_at: string | null;
    first_clicked_at: string | null;
    bounced_at: string | null;
    complained_at: string | null;
    error_message: string | null;
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caregiverId: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { caregiverId: studentId } = await params;
    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, Math.floor(rawLimit))) : 50;
    const perSourceCap = Math.min(200, limit * 4);
    const db = getServiceClient();

    // Get the student's email address for matching
    const { data: student, error: studentError } = await db
      .from("business_profiles")
      .select("id, email")
      .eq("id", studentId)
      .eq("type", "student")
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!student.email) {
      // No email means no email history to show
      return NextResponse.json({
        events: [],
        totalEmails: 0,
        totalActivity: 0,
        fetchedEmails: 0,
        fetchedActivity: 0,
      });
    }

    // Query emails sent to this student
    // Match on recipient (exact match with proper quoting) or metadata.student_profile_id
    // Using .eq with postgrestQuote handles special characters in emails (e.g., john+test@example.com)
    const quotedEmail = postgrestQuote(student.email);

    const [emailRes, emailCountRes] = await Promise.all([
      db
        .from("email_log")
        .select(
          "id, email_type, subject, channel, status, created_at, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at, error_message",
        )
        .eq("recipient_type", "student")
        .or(`recipient.eq.${quotedEmail},metadata->>student_profile_id.eq.${studentId}`)
        .in("email_type", STUDENT_EMAIL_TYPES as unknown as string[])
        .order("created_at", { ascending: false })
        .limit(perSourceCap),
      db
        .from("email_log")
        .select("id", { count: "exact", head: true })
        .eq("recipient_type", "student")
        .or(`recipient.eq.${quotedEmail},metadata->>student_profile_id.eq.${studentId}`)
        .in("email_type", STUDENT_EMAIL_TYPES as unknown as string[]),
    ]);

    if (emailRes.error) {
      console.error("[student-comms-timeline] email_log query failed:", emailRes.error);
      return NextResponse.json({ error: "Failed to load emails" }, { status: 500 });
    }

    const emailRows = (emailRes.data ?? []) as EmailRow[];

    const events: TimelineEvent[] = emailRows.map((row) => ({
      id: `email:${row.id}`,
      at: row.created_at,
      kind: "email",
      email: {
        log_id: row.id,
        email_type: row.email_type,
        subject: row.subject,
        channel: row.channel,
        status: row.status,
        delivered_at: row.delivered_at,
        first_opened_at: row.first_opened_at,
        first_clicked_at: row.first_clicked_at,
        bounced_at: row.bounced_at,
        complained_at: row.complained_at,
        error_message: row.error_message,
      },
    }));

    // Slice to the requested limit
    const sliced = events.slice(0, limit);

    return NextResponse.json({
      events: sliced,
      totalEmails: emailCountRes.count ?? events.length,
      totalActivity: 0, // Students don't have an activity table
      fetchedEmails: events.length,
      fetchedActivity: 0,
    });
  } catch (error) {
    console.error("[student-comms-timeline] fatal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
