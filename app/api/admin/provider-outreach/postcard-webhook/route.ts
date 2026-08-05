import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import * as crypto from "crypto";

/**
 * POST /api/admin/provider-outreach/postcard-webhook
 *
 * Receives PostGrid postcard delivery status webhooks.
 * Updates provider_outreach_tracking with the delivery result.
 *
 * PostGrid sends events like:
 *   postcard.created, postcard.ready, postcard.printed,
 *   postcard.in_transit, postcard.delivered, postcard.returned,
 *   postcard.cancelled
 *
 * Webhook URL to configure in PostGrid dashboard:
 *   https://yourdomain.com/api/admin/provider-outreach/postcard-webhook
 *
 * Security: Verifies webhook signature using POSTGRID_WEBHOOK_SECRET if set.
 * Configure the secret in PostGrid dashboard > Webhooks.
 */
export const runtime = "nodejs";

// Map PostGrid event types to our simplified status
const STATUS_MAP: Record<string, string> = {
  "postcard.created": "draft",
  "postcard.ready": "ready",
  "postcard.printed": "printed",
  "postcard.in_transit": "in_transit",
  "postcard.delivered": "delivered",
  "postcard.returned": "returned",
  "postcard.cancelled": "cancelled",
};

/**
 * Verify PostGrid webhook signature.
 * PostGrid signs webhooks using HMAC-SHA256.
 * See: https://docs.postgrid.com/reference/webhooks
 */
function verifyPostGridSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
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
    const webhookSecret = process.env.POSTGRID_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-postgrid-signature")
        || request.headers.get("postgrid-signature");

      if (!verifyPostGridSignature(rawBody, signature, webhookSecret)) {
        console.warn("[postcard-webhook] Invalid signature - rejecting webhook");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("[postcard-webhook] POSTGRID_WEBHOOK_SECRET not set - skipping signature verification");
    }

    // PostGrid webhook payload: { type: "postcard.delivered", data: { id: "postcard_...", ... } }
    const eventType = body?.type;
    const data = body?.data;

    if (!eventType || !data) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const status = STATUS_MAP[eventType];
    if (!status) {
      // Event type we don't track — acknowledge and ignore
      return NextResponse.json({ received: true });
    }

    const postcardId = data.id;
    if (!postcardId) {
      return NextResponse.json({ error: "No postcard id in payload" }, { status: 400 });
    }

    const db = getServiceClient();

    // Find the provider row by PostGrid postcard ID
    const { data: tracking, error: findError } = await db
      .from("provider_outreach_tracking")
      .select("provider_id")
      .eq("mail_postgrid_id", postcardId)
      .maybeSingle();

    if (findError) {
      console.error("[postcard-webhook] Lookup error:", findError);
      return NextResponse.json({ error: "DB lookup failed" }, { status: 500 });
    }

    if (!tracking) {
      console.warn(`[postcard-webhook] No tracking row for postcard_id=${postcardId}`);
      return NextResponse.json({ received: true, matched: false });
    }

    // Build update
    const update: Record<string, unknown> = {
      mail_status: status,
    };

    if (status === "delivered") {
      update.mail_delivered_at = new Date().toISOString();
    }

    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update(update)
      .eq("provider_id", tracking.provider_id);

    if (updateError) {
      console.error("[postcard-webhook] Update error:", updateError);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log(
      `[postcard-webhook] ${eventType} → ${status} for provider ${tracking.provider_id}`,
    );

    return NextResponse.json({ received: true, status });
  } catch (e) {
    console.error("[postcard-webhook] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Webhook processing failed" },
      { status: 500 },
    );
  }
}
