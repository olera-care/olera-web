import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { questionAnsweredEmail } from "@/lib/email-templates";

interface ReservedAsk {
  id: string;
  asker_name: string | null;
  asker_email: string | null;
}

interface NotifyQuestionAskersInput {
  questionId: string;
  providerName: string;
  providerSlug: string;
  question: string;
  answer: string;
}

export interface NotifyQuestionAskersResult {
  notified: number;
  receiptsMarked: number;
  errors: string[];
}

/**
 * Fan a published answer out to every ask receipt attached to its canonical
 * topic. The reservation RPC makes this safe when provider, admin, and
 * verification publication paths race. Multiple receipts for the same email
 * intentionally produce one message, then all of that email's receipts are
 * marked delivered.
 */
export async function notifyQuestionAskers(
  db: SupabaseClient,
  input: NotifyQuestionAskersInput,
): Promise<NotifyQuestionAskersResult> {
  const result: NotifyQuestionAskersResult = { notified: 0, receiptsMarked: 0, errors: [] };
  const { data, error } = await db.rpc(
    "reserve_provider_question_answer_notifications",
    { p_question_id: input.questionId },
  );

  if (error) {
    result.errors.push(`Failed to reserve answer notifications: ${error.message}`);
    return result;
  }

  const reserved = (data || []) as ReservedAsk[];
  const byEmail = new Map<string, ReservedAsk[]>();
  for (const ask of reserved) {
    const email = ask.asker_email?.trim().toLowerCase();
    if (!email) continue;
    const group = byEmail.get(email) || [];
    group.push(ask);
    byEmail.set(email, group);
  }

  const providerUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"}/provider/${input.providerSlug}`;
  for (const [email, asks] of byEmail) {
    const askIds = asks.map((ask) => ask.id);
    try {
      const sendResult = await sendEmail({
        to: email,
        subject: `${input.providerName} answered your question on Olera`,
        html: questionAnsweredEmail({
          askerName: asks[0]?.asker_name || "there",
          providerName: input.providerName,
          question: input.question,
          answer: input.answer,
          providerUrl,
        }),
        emailType: "question_answered",
        recipientType: "family",
        providerId: input.providerSlug,
      });
      if (!sendResult.success) {
        throw new Error(sendResult.error || sendResult.skipReason || "Email was not sent");
      }

      const { error: markError } = await db
        .from("provider_question_asks")
        .update({
          answer_notified_at: new Date().toISOString(),
          answer_notification_reserved_at: null,
        })
        .in("id", askIds);
      if (markError) throw markError;
      result.notified += 1;
      result.receiptsMarked += askIds.length;
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : String(sendError);
      result.errors.push(`Answer notification failed for ${email}: ${message}`);
      const { error: releaseError } = await db
        .from("provider_question_asks")
        .update({ answer_notification_reserved_at: null })
        .in("id", askIds);
      if (releaseError) {
        result.errors.push(`Failed to release notification reservation for ${email}: ${releaseError.message}`);
      }
    }
  }

  return result;
}
