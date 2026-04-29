/**
 * Helper to publish pending Q&A answers and notify askers.
 * Used when a provider completes verification - their pending answers
 * become visible and askers receive notifications.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { sendSlackAlert, slackQuestionAnswered } from "@/lib/slack";
import { sendEmail } from "@/lib/email";
import { questionAnsweredEmail } from "@/lib/email-templates";

interface PublishResult {
  published: number;
  notified: number;
  errors: string[];
}

interface PendingAnswer {
  id: string;
  question: string | null;
  answer: string | null;
  asker_name: string | null;
  asker_email: string | null;
  provider_id: string;
}

/**
 * Publish all pending Q&A answers for a provider and send notifications.
 *
 * @param db - Supabase admin client
 * @param providerProfileId - The provider's profile ID (answered_by)
 * @param providerName - Provider's display name for notifications
 * @param providerSlug - Provider's slug for URLs
 */
export async function publishPendingQAAnswers(
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
    // Fetch all pending answers BEFORE updating them (we need the data for notifications)
    const { data: pendingAnswers, error: fetchError } = await db
      .from("provider_questions")
      .select("id, question, answer, asker_name, asker_email, provider_id")
      .eq("answered_by", providerProfileId)
      .eq("answer_status", "pending");

    if (fetchError) {
      result.errors.push(`Failed to fetch pending answers: ${fetchError.message}`);
      return result;
    }

    if (!pendingAnswers || pendingAnswers.length === 0) {
      return result;
    }

    // Update all answers to published status
    const { error: updateError } = await db
      .from("provider_questions")
      .update({
        answer_status: "published",
        is_public: true,
        updated_at: new Date().toISOString(),
      })
      .eq("answered_by", providerProfileId)
      .eq("answer_status", "pending");

    if (updateError) {
      result.errors.push(`Failed to publish answers: ${updateError.message}`);
      return result;
    }

    result.published = pendingAnswers.length;

    // Send notifications for each published answer (fire-and-forget)
    const notificationPromises = pendingAnswers.map((answer) =>
      notifyAsker(answer as PendingAnswer, providerName, providerSlug)
        .then(() => {
          result.notified++;
        })
        .catch((err) => {
          result.errors.push(`Notification failed for ${answer.id}: ${err.message}`);
        })
    );

    await Promise.allSettled(notificationPromises);

    console.log(
      `[publish-pending-qa] Published ${result.published} answers, notified ${result.notified} askers for ${providerName}`
    );

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(`Unexpected error: ${message}`);
    return result;
  }
}

/**
 * Send notifications to the person who asked the question.
 */
async function notifyAsker(
  answer: PendingAnswer,
  providerName: string,
  providerSlug?: string
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  const askerName = answer.asker_name || "Someone";
  const question = answer.question || "";
  const answerText = answer.answer || "";

  // Skip notification if we don't have meaningful content
  if (!question.trim() || !answerText.trim()) {
    console.warn(`[publish-pending-qa] Skipping notification for ${answer.id}: missing question or answer content`);
    return;
  }

  // Use provider_id as slug fallback only if it looks like a slug (not a UUID)
  // UUIDs have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars with dashes)
  const isLikelyUUID = answer.provider_id.length === 36 && answer.provider_id.split("-").length === 5;
  const effectiveSlug = providerSlug || (!isLikelyUUID ? answer.provider_id : null);

  // If we can't determine a valid slug, skip email but still send Slack
  if (!effectiveSlug) {
    console.warn(`[publish-pending-qa] No valid slug for ${answer.id}, sending Slack only`);
  }

  // Send Slack notification (fire-and-forget)
  try {
    const slack = slackQuestionAnswered({
      providerName,
      providerSlug: effectiveSlug || answer.provider_id, // Slack can handle UUID in logs
      askerName,
      question,
      answer: answerText,
    });
    await sendSlackAlert(slack.text, slack.blocks);
  } catch (slackErr) {
    console.error("[publish-pending-qa] Slack notification failed:", slackErr);
  }

  // Send email to the asker (only if we have a valid slug for the URL)
  if (answer.asker_email && effectiveSlug) {
    try {
      const providerUrl = `${siteUrl}/provider/${effectiveSlug}`;
      await sendEmail({
        to: answer.asker_email,
        subject: `${providerName} answered your question on Olera`,
        html: questionAnsweredEmail({
          askerName,
          providerName,
          question,
          answer: answerText,
          providerUrl,
        }),
        emailType: "question_answered",
        recipientType: "family",
        providerId: effectiveSlug,
      });
    } catch (emailErr) {
      console.error("[publish-pending-qa] Email notification failed:", emailErr);
    }
  } else if (answer.asker_email && !effectiveSlug) {
    console.warn(`[publish-pending-qa] Skipping email for ${answer.id}: no valid provider slug for URL`);
  }
}
