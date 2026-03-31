import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const FROM_ADDRESS = "Olera <noreply@olera.care>";

/**
 * Append email tracking query params to a URL path or full URL.
 * Used to tag links embedded in provider emails so clicks can be tracked.
 *
 * Example: appendTrackingParams("/provider/connections", "abc-123")
 *   → "/provider/connections?ref=email&eid=abc-123"
 */
export function appendTrackingParams(
  url: string,
  emailLogId: string | null | undefined
): string {
  if (!emailLogId) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}ref=email&eid=${emailLogId}`;
}

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
  /** Pre-reserved email_log ID (from reserveEmailLogId). If set, updates that row instead of creating a new one. */
  emailLogId?: string;
  /** File attachments (e.g. .ics calendar invites) */
  attachments?: Array<{ filename: string; content: string; encoding?: string; type?: string }>;
}

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * Pre-create an email_log row before sending. Returns the row ID
 * so callers can embed it in tracking links (e.g. ?eid={id}).
 * Returns null if logging fails — callers should still send the email.
 */
async function preLogEmail(params: {
  recipient: string;
  sender: string;
  subject: string;
  emailType: string;
  recipientType?: string;
  providerId?: string;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const db = getServiceDb();
    if (!db) return null;

    const { data } = await db
      .from("email_log")
      .insert({
        recipient: params.recipient,
        sender: params.sender,
        subject: params.subject,
        email_type: params.emailType,
        recipient_type: params.recipientType ?? null,
        provider_id: params.providerId ?? null,
        status: "pending",
        metadata: params.metadata ?? {},
      })
      .select("id")
      .single();

    return data?.id ?? null;
  } catch (err) {
    console.error("[email] Failed to pre-log email:", err);
    return null;
  }
}

/**
 * Update an existing email_log row after send attempt.
 * Fire-and-forget — never blocks or throws.
 */
async function updateEmailLog(
  logId: string,
  params: {
    resendId?: string;
    status: "sent" | "failed";
    errorMessage?: string;
    htmlBody?: string;
  }
) {
  try {
    const db = getServiceDb();
    if (!db) return;

    await db
      .from("email_log")
      .update({
        resend_id: params.resendId ?? null,
        status: params.status,
        error_message: params.errorMessage ?? null,
        html_body: params.htmlBody ?? null,
      })
      .eq("id", logId);
  } catch (err) {
    console.error("[email] Failed to update email log:", err);
  }
}

/**
 * Reserve an email_log ID before generating the email HTML.
 * Use this when you need the log ID for tracking links embedded
 * in the email body itself.
 *
 * Call flow: reserveEmailLogId() → build HTML with eid → sendEmail({ emailLogId })
 */
export async function reserveEmailLogId(options: {
  to: string | string[];
  subject: string;
  emailType?: string;
  recipientType?: string;
  providerId?: string;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  const recipient = Array.isArray(options.to)
    ? options.to.join(", ")
    : options.to;

  return preLogEmail({
    recipient,
    sender: FROM_ADDRESS,
    subject: options.subject,
    emailType: options.emailType ?? "unknown",
    recipientType: options.recipientType,
    providerId: options.providerId,
    metadata: options.metadata,
  });
}

/**
 * Send an email via Resend. Fire-and-forget safe — logs errors
 * but never throws so callers can wrap in try/catch without
 * breaking their main flow.
 *
 * If `emailLogId` is provided (from reserveEmailLogId), updates
 * that row instead of creating a new one.
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; error?: string; emailLogId?: string }> {
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
    emailLogId: existingLogId,
  } = options;

  const recipient = Array.isArray(to) ? to.join(", ") : to;

  // If no pre-reserved log ID, create one now
  const logId =
    existingLogId ??
    (await preLogEmail({
      recipient,
      sender: from,
      subject,
      emailType,
      recipientType,
      providerId,
      metadata,
    }));

  const sendPayload: Record<string, unknown> = { from, to, subject, html };
  if (options.attachments?.length) {
    sendPayload.attachments = options.attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content, (a.encoding as BufferEncoding) || "utf-8"),
      contentType: a.type,
    }));
  }
  const { data, error } = await resend.emails.send(sendPayload as Parameters<typeof resend.emails.send>[0]);

  // Update the log row with send result
  if (logId) {
    updateEmailLog(logId, {
      resendId: data?.id,
      status: error ? "failed" : "sent",
      errorMessage: error?.message,
      htmlBody: html,
    });
  }

  if (error) {
    console.error("[email] Send failed:", error);
    return { success: false, error: error.message, emailLogId: logId ?? undefined };
  }

  return { success: true, emailLogId: logId ?? undefined };
}
