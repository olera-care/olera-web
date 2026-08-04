import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import * as crypto from "crypto";

/**
 * POST /api/admin/provider-outreach/fax-webhook
 *
 * Receives Telnyx fax delivery status webhooks.
 * Updates provider_outreach_tracking with the delivery result.
 *
 * Telnyx sends events like:
 *   fax.queued, fax.media.processed, fax.sending.started,
 *   fax.delivered, fax.failed
 *
 * Webhook URL to configure in Telnyx Mission Control:
 *   https://yourdomain.com/api/admin/provider-outreach/fax-webhook
 *
 * Security: Verifies webhook signature using TELNYX_WEBHOOK_SECRET if set.
 * Configure the secret in Telnyx Mission Control > Webhooks.
 */
export const runtime = "nodejs";

// Map Telnyx event types to our simplified status
const STATUS_MAP: Record<string, string> = {
  "fax.queued": "queued",
  "fax.media.processed": "processing",
  "fax.sending.started": "sending",
  "fax.delivered": "delivered",
  "fax.failed": "failed",
};

/**
 * Verify Telnyx webhook signature.
 * Telnyx signs webhooks with a timestamp and signature.
 * See: https://developers.telnyx.com/docs/v2/development/api-guide/webhooks
 */
function verifyTelnyxSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null,
  secret: string
): boolean {
  if (!signature || !timestamp) {
    return false;
  }

  // Telnyx signature format: t=<timestamp>,v1=<signature>
  // The signature is HMAC-SHA256 of timestamp + payload
  const signedPayload = `${timestamp}|${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // Telnyx may send signature in format "v1=<hex>" or just "<hex>"
  const providedSig = signature.replace(/^v1=/, "");

  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(providedSig, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.TELNYX_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("telnyx-signature-ed25519")
        || request.headers.get("x-telnyx-signature");
      const timestamp = request.headers.get("telnyx-timestamp");

      if (!verifyTelnyxSignature(rawBody, signature, timestamp, webhookSecret)) {
        console.warn("[fax-webhook] Invalid signature - rejecting webhook");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("[fax-webhook] TELNYX_WEBHOOK_SECRET not set - skipping signature verification");
    }

    // Telnyx wraps events in { data: { event_type, payload } }
    const eventType = body?.data?.event_type;
    const payload = body?.data?.payload;

    if (!eventType || !payload) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const status = STATUS_MAP[eventType];
    if (!status) {
      // Event type we don't track — acknowledge and ignore
      return NextResponse.json({ received: true });
    }

    const faxId = payload.fax_id || payload.id;
    if (!faxId) {
      return NextResponse.json({ error: "No fax_id in payload" }, { status: 400 });
    }

    const db = getServiceClient();

    // Find the provider row by telnyx fax ID
    const { data: tracking, error: findError } = await db
      .from("provider_outreach_tracking")
      .select("provider_id")
      .eq("fax_telnyx_id", faxId)
      .maybeSingle();

    if (findError) {
      console.error("[fax-webhook] Lookup error:", findError);
      return NextResponse.json({ error: "DB lookup failed" }, { status: 500 });
    }

    if (!tracking) {
      console.warn(`[fax-webhook] No tracking row for fax_id=${faxId}`);
      return NextResponse.json({ received: true, matched: false });
    }

    // Build update
    const update: Record<string, unknown> = {
      fax_status: status,
    };

    if (status === "delivered") {
      update.fax_delivered_at = new Date().toISOString();
    }

    if (status === "failed") {
      update.fax_failure_reason =
        payload.failure_reason || payload.errors?.[0]?.detail || "Unknown error";
    }

    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update(update)
      .eq("provider_id", tracking.provider_id);

    if (updateError) {
      console.error("[fax-webhook] Update error:", updateError);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log(
      `[fax-webhook] ${eventType} → ${status} for provider ${tracking.provider_id}`,
    );

    return NextResponse.json({ received: true, status });
  } catch (e) {
    console.error("[fax-webhook] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Webhook processing failed" },
      { status: 500 },
    );
  }
}
