/**
 * Cron: Provider Growth Meeting Reminders
 *
 * Runs hourly to send reminder emails to providers with upcoming meetings.
 * - 2 days before: First reminder
 * - 1 day before: Final reminder
 *
 * Schedule: Every hour (0 * * * *)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import {
  generateReminderEmailHtml,
  generateReminderSubject,
} from "@/lib/provider-growth/meeting-reminder-email";

const CRON_SECRET = process.env.CRON_SECRET;

// Time windows for reminders (in milliseconds)
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 1 * 24 * 60 * 60 * 1000;
const BUFFER_MS = 2 * 60 * 60 * 1000; // 2 hour buffer for cron timing

interface MeetingToRemind {
  id: string;
  business_profile_id: string;
  meeting_scheduled_at: string;
  reminder_2d_sent_at: string | null;
  reminder_1d_sent_at: string | null;
  provider_name: string | null;
  provider_email: string | null;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();
  const now = new Date();
  const results = {
    checked: 0,
    reminders_2d_sent: 0,
    reminders_1d_sent: 0,
    errors: [] as string[],
  };

  try {
    // Query meetings in meeting_scheduled or upgrade_meeting stage
    // that have a meeting_scheduled_at in the future
    const { data: meetings, error } = await db
      .from("provider_growth_tracking")
      .select(`
        id,
        business_profile_id,
        meeting_scheduled_at,
        reminder_2d_sent_at,
        reminder_1d_sent_at,
        business_profiles!inner (
          display_name,
          email
        )
      `)
      .in("pipeline_stage", ["meeting_scheduled", "upgrade_meeting"])
      .not("meeting_scheduled_at", "is", null)
      .gt("meeting_scheduled_at", now.toISOString());

    if (error) {
      console.error("[cron/provider-growth-meeting-reminders] Query error:", error);
      return NextResponse.json({ error: "Database query failed" }, { status: 500 });
    }

    results.checked = meetings?.length || 0;

    for (const meeting of meetings || []) {
      const profile = meeting.business_profiles as unknown as {
        display_name: string | null;
        email: string | null;
      };

      const meetingData: MeetingToRemind = {
        id: meeting.id,
        business_profile_id: meeting.business_profile_id,
        meeting_scheduled_at: meeting.meeting_scheduled_at,
        reminder_2d_sent_at: meeting.reminder_2d_sent_at,
        reminder_1d_sent_at: meeting.reminder_1d_sent_at,
        provider_name: profile?.display_name || null,
        provider_email: profile?.email || null,
      };

      // Skip if no email
      if (!meetingData.provider_email) {
        continue;
      }

      const meetingDate = new Date(meetingData.meeting_scheduled_at);
      const timeUntilMeeting = meetingDate.getTime() - now.getTime();

      // Check if 2-day reminder is due
      // Send if: meeting is ~2 days away AND 2d reminder not sent
      if (
        timeUntilMeeting <= TWO_DAYS_MS + BUFFER_MS &&
        timeUntilMeeting > ONE_DAY_MS + BUFFER_MS &&
        !meetingData.reminder_2d_sent_at
      ) {
        const sent = await sendReminder(db, meetingData, "2d");
        if (sent) {
          results.reminders_2d_sent++;
        } else {
          results.errors.push(`Failed 2d reminder for ${meetingData.id}`);
        }
      }

      // Check if 1-day reminder is due
      // Send if: meeting is ~1 day away AND 1d reminder not sent
      if (
        timeUntilMeeting <= ONE_DAY_MS + BUFFER_MS &&
        timeUntilMeeting > 0 &&
        !meetingData.reminder_1d_sent_at
      ) {
        const sent = await sendReminder(db, meetingData, "1d");
        if (sent) {
          results.reminders_1d_sent++;
        } else {
          results.errors.push(`Failed 1d reminder for ${meetingData.id}`);
        }
      }
    }

    console.log("[cron/provider-growth-meeting-reminders] Completed:", results);
    return NextResponse.json(results);
  } catch (e) {
    console.error("[cron/provider-growth-meeting-reminders] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function sendReminder(
  db: ReturnType<typeof getServiceClient>,
  meeting: MeetingToRemind,
  reminderType: "2d" | "1d"
): Promise<boolean> {
  try {
    const meetingDate = new Date(meeting.meeting_scheduled_at);
    const providerName = meeting.provider_name || "there";

    // Generate email content
    const subject = generateReminderSubject(
      { providerName, meetingDate },
      reminderType
    );
    const html = generateReminderEmailHtml(
      { providerName, meetingDate },
      reminderType
    );

    // Send email
    const emailResult = await sendEmail({
      to: meeting.provider_email!,
      subject,
      emailType: `provider_growth_meeting_reminder_${reminderType}`,
      html,
    });

    if (!emailResult.success) {
      console.error(`[cron/provider-growth-meeting-reminders] Email failed:`, emailResult.error);
      return false;
    }

    // Update tracking record with reminder sent timestamp
    const updateField = reminderType === "2d" ? "reminder_2d_sent_at" : "reminder_1d_sent_at";
    await db
      .from("provider_growth_tracking")
      .update({ [updateField]: new Date().toISOString() })
      .eq("id", meeting.id);

    // Create touchpoint for audit trail
    await db.from("provider_growth_touchpoints").insert({
      tracking_id: meeting.id,
      business_profile_id: meeting.business_profile_id,
      touchpoint_type: "reminder_sent",
      details: {
        reminder_type: reminderType,
        meeting_scheduled_at: meeting.meeting_scheduled_at,
        email_sent_to: meeting.provider_email,
        email_log_id: emailResult.emailLogId,
      },
    });

    console.log(`[cron/provider-growth-meeting-reminders] Sent ${reminderType} reminder for ${meeting.id}`);
    return true;
  } catch (e) {
    console.error(`[cron/provider-growth-meeting-reminders] Error sending reminder:`, e);
    return false;
  }
}
