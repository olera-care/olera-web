import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

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
 * No auth required (Telnyx webhook), but we verify the payload structure.
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
