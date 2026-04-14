import twilio from "twilio";
import { shouldSendNotification } from "./notification-prefs";

let twilioClient: twilio.Twilio | null = null;

function getTwilio(): twilio.Twilio | null {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  twilioClient = twilio(sid, token);
  return twilioClient;
}

interface SendSMSOptions {
  to: string;
  body: string;
  /** Recipient's profile ID for checking notification preferences */
  recipientProfileId?: string;
  /** Notification type for preference checking (e.g., 'new_leads') */
  notificationType?: string;
}

/**
 * Send an SMS via Twilio. Fire-and-forget safe — logs errors
 * but never throws so callers can wrap in try/catch without
 * breaking their main flow.
 *
 * If recipientProfileId and notificationType are provided, checks
 * user preferences before sending. Defaults to sending if preferences
 * can't be checked.
 */
export async function sendSMS(
  options: SendSMSOptions
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  const { to, body, recipientProfileId, notificationType } = options;

  // Check notification preferences if profile ID and type provided
  if (recipientProfileId && notificationType) {
    const shouldSend = await shouldSendNotification(recipientProfileId, notificationType, "sms");
    if (!shouldSend) {
      console.log(`[sms] Skipped to ${to} - user preference disabled for ${notificationType}`);
      return { success: true, skipped: true };
    }
  }

  const client = getTwilio();
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!client || !from) {
    console.error("[sms] Twilio not configured");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    await client.messages.create({
      from,
      to,
      body,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sms] Send failed:", message);
    return { success: false, error: message };
  }
}

/**
 * Format a US phone number to E.164 (+1XXXXXXXXXX).
 * Returns null if the number can't be normalized.
 */
export function normalizeUSPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/**
 * Mask a phone number for display: +1213****970
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "****";
  return `+${digits.slice(0, 4)}****${digits.slice(-3)}`;
}
