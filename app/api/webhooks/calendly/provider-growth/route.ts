/**
 * POST /api/webhooks/calendly/provider-growth
 *
 * Calendly webhook endpoint for Provider Growth meeting events.
 * Handles invitee.created and invitee.canceled events.
 *
 * When a provider books a meeting via our Calendly link:
 * 1. Calendly sends invitee.created event here
 * 2. We extract tracking_id from utm_content
 * 3. Update provider_growth_tracking to meeting_scheduled stage
 * 4. Create a touchpoint record
 *
 * Security: Verifies Calendly webhook signature using CALENDLY_WEBHOOK_SECRET.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServiceClient } from "@/lib/admin";
import {
  type CalendlyWebhookPayload,
  parseWebhookEvent,
} from "@/lib/provider-growth/calendly";

const CALENDLY_WEBHOOK_SECRET = process.env.CALENDLY_WEBHOOK_SECRET;

/**
 * Verify Calendly webhook signature.
 * Calendly signs webhooks with HMAC-SHA256.
 */
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  // Calendly signature format: t=timestamp,v1=signature
  const parts = signature.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = timestampPart.slice(2);
  const providedSignature = signaturePart.slice(3);

  // Create the signed payload (timestamp.payload)
  const signedPayload = `${timestamp}.${payload}`;

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(providedSignature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify signature if secret is configured
    if (CALENDLY_WEBHOOK_SECRET) {
      const signature = request.headers.get("calendly-webhook-signature");
      if (!verifySignature(rawBody, signature, CALENDLY_WEBHOOK_SECRET)) {
        console.error("[calendly-webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("[calendly-webhook] CALENDLY_WEBHOOK_SECRET not set, skipping signature verification");
    }

    // Parse the webhook payload
    const payload: CalendlyWebhookPayload = JSON.parse(rawBody);
    const eventInfo = parseWebhookEvent(payload);

    console.log("[calendly-webhook] Received event:", {
      event: payload.event,
      trackingId: eventInfo.trackingId,
      inviteeName: eventInfo.inviteeName,
      scheduledAt: eventInfo.scheduledAt,
      status: eventInfo.status,
    });

    // Extract tracking ID
    const trackingId = eventInfo.trackingId;
    if (!trackingId) {
      console.warn("[calendly-webhook] No tracking ID in webhook, ignoring");
      return NextResponse.json({ ok: true, message: "No tracking ID, ignored" });
    }

    const db = getServiceClient();

    // Get the tracking record
    const { data: tracking, error: trackingError } = await db
      .from("provider_growth_tracking")
      .select("id, business_profile_id, pipeline_stage")
      .eq("id", trackingId)
      .single();

    if (trackingError || !tracking) {
      console.error("[calendly-webhook] Tracking record not found:", trackingId);
      return NextResponse.json({ error: "Tracking record not found" }, { status: 404 });
    }

    // Handle based on event type
    if (payload.event === "invitee.created" && eventInfo.status === "active") {
      // Meeting booked - update to meeting_scheduled
      const now = new Date().toISOString();

      const { error: updateError } = await db
        .from("provider_growth_tracking")
        .update({
          pipeline_stage: "meeting_scheduled",
          pipeline_stage_changed_at: now,
          meeting_scheduled_at: eventInfo.scheduledAt,
          calendly_event_id: eventInfo.eventId,
          last_activity_at: now,
          updated_at: now,
        })
        .eq("id", trackingId);

      if (updateError) {
        console.error("[calendly-webhook] Failed to update tracking:", updateError);
        return NextResponse.json({ error: "Failed to update tracking" }, { status: 500 });
      }

      // Create touchpoint
      await db.from("provider_growth_touchpoints").insert({
        tracking_id: trackingId,
        business_profile_id: tracking.business_profile_id,
        touchpoint_type: "meeting_scheduled",
        details: {
          calendly_event_id: eventInfo.eventId,
          invitee_name: eventInfo.inviteeName,
          invitee_email: eventInfo.inviteeEmail,
          scheduled_at: eventInfo.scheduledAt,
          method: "calendly_webhook",
        },
      });

      console.log("[calendly-webhook] Meeting scheduled for tracking:", trackingId);
      return NextResponse.json({ ok: true, action: "meeting_scheduled" });
    }

    if (payload.event === "invitee.canceled" || eventInfo.status === "canceled") {
      // Meeting canceled - create touchpoint but don't change stage
      // (Admin should decide what to do with canceled meetings)
      await db.from("provider_growth_touchpoints").insert({
        tracking_id: trackingId,
        business_profile_id: tracking.business_profile_id,
        touchpoint_type: "meeting_cancelled",
        details: {
          calendly_event_id: eventInfo.eventId,
          invitee_name: eventInfo.inviteeName,
          scheduled_at: eventInfo.scheduledAt,
          canceled_at: new Date().toISOString(),
        },
      });

      // Clear the meeting fields but keep in meeting_scheduled stage
      // Admin can manually move back to new_claim if needed
      await db
        .from("provider_growth_tracking")
        .update({
          meeting_scheduled_at: null,
          calendly_event_id: null,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", trackingId);

      console.log("[calendly-webhook] Meeting cancelled for tracking:", trackingId);
      return NextResponse.json({ ok: true, action: "meeting_cancelled" });
    }

    // Unknown event type
    console.log("[calendly-webhook] Unhandled event type:", payload.event);
    return NextResponse.json({ ok: true, message: "Event type not handled" });
  } catch (e) {
    console.error("[calendly-webhook] Error processing webhook:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Calendly may send GET requests to verify the endpoint exists
export async function GET() {
  return NextResponse.json({ ok: true, message: "Provider Growth Calendly webhook endpoint" });
}
