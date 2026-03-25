import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const FROM_ADDRESS = "Olera <noreply@olera.care>";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resendClient = new Resend(key);
  return resendClient;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  /** Email type for audit log (e.g. 'connection_request', 'welcome') */
  emailType?: string;
  /** Recipient type: 'provider', 'family', 'student', 'admin' */
  recipientType?: string;
  /** Associated provider ID if applicable */
  providerId?: string;
  /** Extra context for audit log (connection_id, question_id, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * Log an email send to the email_log table. Fire-and-forget —
 * never blocks or throws. Uses service role client.
 */
async function logEmailSend(params: {
  resendId?: string;
  recipient: string;
  sender: string;
  subject: string;
  emailType: string;
  recipientType?: string;
  providerId?: string;
  status: "sent" | "failed";
  errorMessage?: string;
  htmlBody?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return;

    const db = createClient(url, serviceKey);
    await db.from("email_log").insert({
      resend_id: params.resendId ?? null,
      recipient: params.recipient,
      sender: params.sender,
      subject: params.subject,
      email_type: params.emailType,
      recipient_type: params.recipientType ?? null,
      provider_id: params.providerId ?? null,
      status: params.status,
      error_message: params.errorMessage ?? null,
      html_body: params.htmlBody ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.error("[email] Failed to log email send:", err);
  }
}

/**
 * Send an email via Resend. Fire-and-forget safe — logs errors
 * but never throws so callers can wrap in try/catch without
 * breaking their main flow.
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.error("[email] RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  const {
    to,
    subject,
    html,
    from = FROM_ADDRESS,
    emailType = "unknown",
    recipientType,
    providerId,
    metadata,
  } = options;

  const { data, error } = await resend.emails.send({ from, to, subject, html });

  const recipient = Array.isArray(to) ? to.join(", ") : to;

  // Fire-and-forget audit log — don't await in the critical path
  logEmailSend({
    resendId: data?.id,
    recipient,
    sender: from,
    subject,
    emailType,
    recipientType,
    providerId,
    status: error ? "failed" : "sent",
    errorMessage: error?.message,
    htmlBody: html,
    metadata,
  });

  if (error) {
    console.error("[email] Send failed:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
