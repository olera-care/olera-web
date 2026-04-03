import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { normalizeUSPhone } from "./twilio";

let twilioClient: twilio.Twilio | null = null;

function getTwilio(): twilio.Twilio | null {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  twilioClient = twilio(sid, token);
  return twilioClient;
}

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

interface SendWhatsAppOptions {
  to: string;
  contentSid: string;
  contentVariables: Record<string, string>;
  /** Fallback plain-text body for sandbox mode (no template approval needed) */
  fallbackBody?: string;
  messageType?: string;
  recipientType?: string;
  profileId?: string;
}

/**
 * Send a WhatsApp message via Twilio Content API. Fire-and-forget safe —
 * logs errors but never throws so callers can wrap in try/catch without
 * breaking their main flow.
 */
export async function sendWhatsApp(
  options: SendWhatsAppOptions
): Promise<{ success: boolean; error?: string; logId?: string }> {
  const client = getTwilio();
  const from = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!client || !from) {
    console.error("[whatsapp] Twilio not configured or TWILIO_WHATSAPP_NUMBER missing");
    return { success: false, error: "WhatsApp service not configured" };
  }

  const normalized = normalizeUSPhone(options.to);
  if (!normalized) {
    console.error("[whatsapp] Could not normalize phone:", options.to);
    return { success: false, error: "Invalid phone number" };
  }

  const logId = await logWhatsApp({
    recipient: normalized,
    messageType: options.messageType ?? "unknown",
    contentSid: options.contentSid,
    recipientType: options.recipientType,
    profileId: options.profileId,
    status: "pending",
  });

  try {
    // Use Content API templates in production, fall back to plain body for sandbox
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      from: `whatsapp:${from}`,
      to: `whatsapp:${normalized}`,
    };

    if (options.contentSid.startsWith("HX")) {
      // Production: approved Content API template
      payload.contentSid = options.contentSid;
      payload.contentVariables = JSON.stringify(options.contentVariables);
    } else if (options.fallbackBody) {
      // Sandbox: free-form body text
      payload.body = options.fallbackBody;
    } else {
      // No template and no fallback — skip
      console.warn("[whatsapp] No valid contentSid or fallbackBody, skipping");
      return { success: false, error: "No template or fallback body" };
    }

    const message = await client.messages.create(payload);

    if (logId) {
      updateWhatsAppLog(logId, { twilioSid: message.sid, status: "sent" });
    }

    return { success: true, logId: logId ?? undefined };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[whatsapp] Send failed:", errorMessage);

    if (logId) {
      updateWhatsAppLog(logId, { status: "failed", errorMessage });
    }

    return { success: false, error: errorMessage, logId: logId ?? undefined };
  }
}

async function logWhatsApp(params: {
  recipient: string;
  messageType: string;
  contentSid: string;
  recipientType?: string;
  profileId?: string;
  status: string;
}): Promise<string | null> {
  try {
    const db = getServiceDb();
    if (!db) return null;

    const { data } = await db
      .from("whatsapp_log")
      .insert({
        recipient: params.recipient,
        message_type: params.messageType,
        content_sid: params.contentSid,
        recipient_type: params.recipientType ?? null,
        profile_id: params.profileId ?? null,
        status: params.status,
      })
      .select("id")
      .single();

    return data?.id ?? null;
  } catch (err) {
    console.error("[whatsapp] Failed to log message:", err);
    return null;
  }
}

async function updateWhatsAppLog(
  logId: string,
  params: {
    twilioSid?: string;
    status: "sent" | "failed";
    errorMessage?: string;
  }
) {
  try {
    const db = getServiceDb();
    if (!db) return;

    await db
      .from("whatsapp_log")
      .update({
        twilio_sid: params.twilioSid ?? null,
        status: params.status,
        error_message: params.errorMessage ?? null,
      })
      .eq("id", logId);
  } catch (err) {
    console.error("[whatsapp] Failed to update log:", err);
  }
}
