import twilio from "twilio";

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
}

/**
 * Send an SMS via Twilio. Fire-and-forget safe — logs errors
 * but never throws so callers can wrap in try/catch without
 * breaking their main flow.
 */
export async function sendSMS(
  options: SendSMSOptions
): Promise<{ success: boolean; error?: string }> {
  const client = getTwilio();
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!client || !from) {
    console.error("[sms] Twilio not configured");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    await client.messages.create({
      from,
      to: options.to,
      body: options.body,
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
