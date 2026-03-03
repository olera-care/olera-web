import { Resend } from "resend";

const FROM_ADDRESS = "Olera <noreply@olera.care>";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resendClient = new Resend(key);
  return resendClient;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
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

  const { to, subject, html, from = FROM_ADDRESS } = options;

  const { error } = await resend.emails.send({ from, to, subject, html });

  if (error) {
    console.error("[email] Send failed:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
