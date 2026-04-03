import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { handleInboundMessage } from "@/lib/whatsapp-conversation";

/**
 * POST /api/whatsapp/webhook
 *
 * Receives inbound WhatsApp messages from Twilio.
 * Verifies the X-Twilio-Signature header, then routes the message
 * to the conversation state machine for seeker enrichment.
 *
 * Must return 200 with empty TwiML to acknowledge receipt —
 * we send replies via the API, not via TwiML response.
 */
export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("[wa-webhook] TWILIO_AUTH_TOKEN not configured");
    return new NextResponse("<Response/>", {
      status: 500,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Parse the form-encoded body that Twilio sends
  const body = await request.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  // Verify Twilio signature
  const signature = request.headers.get("x-twilio-signature") || "";
  const url = buildWebhookUrl(request);

  const isValid = twilio.validateRequest(authToken, signature, url, params);
  if (!isValid) {
    console.error("[wa-webhook] Invalid Twilio signature");
    return new NextResponse("<Response/>", {
      status: 403,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Extract message details
  const from = params.From || "";       // e.g. "whatsapp:+12125551234"
  const messageBody = params.Body || "";
  const buttonText = params.ButtonText || undefined;

  // Strip "whatsapp:" prefix to get the phone number
  const phone = from.replace("whatsapp:", "").trim();
  if (!phone) {
    console.warn("[wa-webhook] No phone number in From field:", from);
    return twimlOk();
  }

  console.log(
    `[wa-webhook] Inbound from ${phone}: "${buttonText || messageBody}"`
  );

  try {
    const result = await handleInboundMessage(phone, messageBody, buttonText);

    if (!result.handled) {
      console.log(
        `[wa-webhook] Message not handled: ${result.error || "unknown"}`
      );
    }
  } catch (err) {
    console.error("[wa-webhook] Error handling inbound message:", err);
  }

  // Always return 200 with empty TwiML — Twilio retries on non-2xx
  return twimlOk();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function twimlOk() {
  return new NextResponse("<Response/>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

/**
 * Build the full webhook URL for signature validation.
 * Twilio validates against the URL it was configured to call.
 * In production this is https://olera.care/api/whatsapp/webhook.
 * In development, it might be a ngrok tunnel.
 */
function buildWebhookUrl(request: NextRequest): string {
  // Use the configured site URL if available (avoids Vercel preview URL mismatches)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (siteUrl) {
    const base = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    return `${base}/api/whatsapp/webhook`;
  }
  // Fallback to the request URL
  return request.url;
}
