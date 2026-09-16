import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { interviewReminderEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { generateMedJobsStudentInterviewUrl, generateMedJobsNotificationUrl } from "@/lib/claim-tokens";

/**
 * GET /api/cron/medjobs-interview-reminders
 *
 * Runs every hour. Sends reminder emails 24 hours before confirmed interviews.
 * Both student and provider receive a reminder with interview details.
 *
 * Logic:
 * - Find interviews with status="confirmed" and confirmed_time within 23-25 hours
 * - Check metadata.reminder_sent_at to avoid duplicate sends
 * - Send reminder to both parties
 * - Mark reminder as sent in metadata
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const dryRun = searchParams.get("dry_run") === "true";
  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === process.env.CRON_SECRET;

  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("medjobs-interview-reminders", async () => {
    try {
      const db = getServiceClient();
      const now = Date.now();

      // Window: 23-25 hours from now (to catch interviews within the hour the cron runs)
      const windowStart = new Date(now + 23 * 60 * 60 * 1000).toISOString();
      const windowEnd = new Date(now + 25 * 60 * 60 * 1000).toISOString();

      // Find confirmed interviews in the reminder window
      const { data: interviews, error } = await db
        .from("interviews")
        .select(`
          id,
          type,
          confirmed_time,
          duration_minutes,
          location,
          notes,
          metadata,
          provider:business_profiles!interviews_provider_profile_id_fkey(id, display_name, email, slug),
          student:business_profiles!interviews_student_profile_id_fkey(id, display_name, email, slug)
        `)
        .eq("status", "confirmed")
        .gte("confirmed_time", windowStart)
        .lte("confirmed_time", windowEnd)
        .limit(50);

      if (error) {
        console.error("[cron/medjobs-interview-reminders] query error:", error);
        return NextResponse.json({ error: "Query failed" }, { status: 500 });
      }

      let remindersSent = 0;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

      for (const interview of interviews || []) {
        const meta = (interview.metadata || {}) as Record<string, unknown>;

        // Skip if reminder already sent
        if (meta.reminder_sent_at) {
          continue;
        }

        // Supabase returns relations as arrays, extract first element
        const providerRaw = interview.provider;
        const studentRaw = interview.student;
        const provider = (Array.isArray(providerRaw) ? providerRaw[0] : providerRaw) as { id: string; display_name: string; email: string; slug: string } | null;
        const student = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as { id: string; display_name: string; email: string; slug?: string } | null;

        if (!provider?.email || !student?.email) {
          console.warn(`[cron/medjobs-interview-reminders] Missing email for interview ${interview.id}`);
          continue;
        }

        const confirmedTime = new Date(interview.confirmed_time);
        const typeLabel = interview.type === "video" ? "Video" : interview.type === "in_person" ? "In-Person" : "Phone";
        const timeStr = confirmedTime.toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
          timeZone: "America/Chicago",
        });

        // Generate view URLs
        const studentViewUrl = generateMedJobsStudentInterviewUrl(student.email, interview.id);
        const providerViewUrl = provider.slug
          ? generateMedJobsNotificationUrl(provider.slug, provider.email, "interview", interview.id)
          : `${siteUrl}/provider/caregivers`;

        if (dryRun) {
          console.log(
            `[cron/medjobs-interview-reminders] [DRY RUN] Would send reminders for interview ${interview.id} (${student.display_name} <-> ${provider.display_name}) at ${timeStr}`
          );
          remindersSent++;
          continue;
        }

        // Send reminder to student
        try {
          await sendEmail({
            to: student.email,
            subject: `Reminder: Interview with ${provider.display_name} tomorrow`,
            html: interviewReminderEmail({
              recipientName: student.display_name,
              otherName: provider.display_name,
              interviewType: typeLabel,
              confirmedTime: timeStr,
              durationMinutes: interview.duration_minutes || 30,
              location: interview.location || null,
              viewUrl: studentViewUrl,
            }),
            emailType: "interview_reminder",
            recipientType: "student",
          });
        } catch (err) {
          console.error(`[cron/medjobs-interview-reminders] Failed to send student reminder for ${interview.id}:`, err);
        }

        // Send reminder to provider
        try {
          await sendEmail({
            to: provider.email,
            subject: `Reminder: Interview with ${student.display_name} tomorrow`,
            html: interviewReminderEmail({
              recipientName: provider.display_name,
              otherName: student.display_name,
              interviewType: typeLabel,
              confirmedTime: timeStr,
              durationMinutes: interview.duration_minutes || 30,
              location: interview.location || null,
              viewUrl: providerViewUrl,
            }),
            emailType: "interview_reminder",
            recipientType: "provider",
            providerId: provider.slug || provider.id,
          });
        } catch (err) {
          console.error(`[cron/medjobs-interview-reminders] Failed to send provider reminder for ${interview.id}:`, err);
        }

        // Mark reminder as sent
        await db
          .from("interviews")
          .update({
            metadata: {
              ...meta,
              reminder_sent_at: new Date().toISOString(),
            },
          })
          .eq("id", interview.id);

        remindersSent++;
      }

      return NextResponse.json({
        status: "ok",
        remindersSent,
        dry_run: dryRun,
        window: { start: windowStart, end: windowEnd },
      });
    } catch (err) {
      console.error("[cron/medjobs-interview-reminders] error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
