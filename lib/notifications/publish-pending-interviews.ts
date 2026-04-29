/**
 * Helper to publish pending verification interviews and notify students.
 * Used when a provider completes verification - their pending interviews
 * are released and students receive notifications.
 *
 * Follows the same pattern as publish-pending-qa-answers.ts
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

interface PublishResult {
  published: number;
  notified: number;
  errors: string[];
}

interface PendingInterview {
  id: string;
  student_profile_id: string;
  type: string;
  proposed_time: string;
  alternative_time: string | null;
  notes: string | null;
  student: {
    id: string;
    display_name: string;
    email: string;
    slug: string;
  };
}

/**
 * Publish all pending verification interviews for a provider and send notifications.
 *
 * @param db - Supabase admin client
 * @param providerProfileId - The provider's profile ID
 * @param providerName - Provider's display name for notifications
 * @param providerSlug - Provider's slug for URLs (optional)
 */
export async function publishPendingInterviews(
  db: SupabaseClient,
  providerProfileId: string,
  providerName: string,
  providerSlug?: string
): Promise<PublishResult> {
  const result: PublishResult = {
    published: 0,
    notified: 0,
    errors: [],
  };

  try {
    // Fetch all pending verification interviews with student details
    // Only fetch "proposed" status - don't release cancelled/confirmed interviews
    const { data: pendingInterviews, error: fetchError } = await db
      .from("interviews")
      .select(`
        id, student_profile_id, type, proposed_time, alternative_time, notes,
        student:business_profiles!interviews_student_profile_id_fkey(
          id, display_name, email, slug
        )
      `)
      .eq("provider_profile_id", providerProfileId)
      .eq("is_pending_verification", true)
      .eq("status", "proposed");

    if (fetchError) {
      result.errors.push(`Failed to fetch pending interviews: ${fetchError.message}`);
      return result;
    }

    if (!pendingInterviews || pendingInterviews.length === 0) {
      console.log(`[publish-pending-interviews] No pending interviews for ${providerName}`);
      return result;
    }

    // Update all pending proposed interviews to released state
    // Also clear the flag on any cancelled ones (no notification sent for those)
    const { error: updateError } = await db
      .from("interviews")
      .update({
        is_pending_verification: false,
        updated_at: new Date().toISOString(),
      })
      .eq("provider_profile_id", providerProfileId)
      .eq("is_pending_verification", true);

    if (updateError) {
      result.errors.push(`Failed to publish interviews: ${updateError.message}`);
      return result;
    }

    result.published = pendingInterviews.length;

    // Send notifications for each published interview (fire-and-forget)
    const notificationPromises = pendingInterviews.map((interview) =>
      notifyStudent(interview as unknown as PendingInterview, providerName)
        .then(() => {
          result.notified++;
        })
        .catch((err) => {
          result.errors.push(`Notification failed for ${interview.id}: ${err.message}`);
        })
    );

    await Promise.allSettled(notificationPromises);

    console.log(
      `[publish-pending-interviews] Published ${result.published} interviews, notified ${result.notified} students for ${providerName}`
    );

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(`Unexpected error: ${message}`);
    return result;
  }
}

/**
 * Send notification email to the student about the interview request.
 */
async function notifyStudent(
  interview: PendingInterview,
  providerName: string
): Promise<void> {
  const student = interview.student;
  if (!student?.email) {
    console.warn(`[publish-pending-interviews] No email for student ${interview.student_profile_id}`);
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  const typeLabel = interview.type === "video" ? "Video" : interview.type === "in_person" ? "In-Person" : "Phone";

  const time = new Date(interview.proposed_time).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const viewUrl = `${siteUrl}/portal/medjobs/interviews`;

  try {
    await sendEmail({
      to: student.email,
      subject: `Interview request from ${providerName}`,
      html: `
        <h2>You have an interview request!</h2>
        <p><strong>${providerName}</strong> would like to schedule a ${typeLabel.toLowerCase()} interview.</p>
        <p><strong>Proposed time:</strong> ${time}</p>
        ${interview.alternative_time ? `<p><strong>Alternative time:</strong> ${new Date(interview.alternative_time).toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        })}</p>` : ""}
        ${interview.notes ? `<p><strong>Notes:</strong> ${interview.notes}</p>` : ""}
        <p><a href="${viewUrl}">View & respond on Olera</a></p>
      `,
      emailType: "interview_proposed",
      recipientType: "student",
      recipientProfileId: student.id,
    });

    console.log(`[publish-pending-interviews] Notified ${student.display_name} about interview ${interview.id}`);
  } catch (emailErr) {
    console.error("[publish-pending-interviews] Email notification failed:", emailErr);
    throw emailErr;
  }
}
