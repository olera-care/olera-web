import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/webhook
 *
 * SmartLead webhook receiver for provider outreach campaigns.
 * Updates engagement counters and lead scores in provider_outreach.
 *
 * SmartLead event types we handle:
 *   - EMAIL_OPEN
 *   - EMAIL_CLICK
 *   - EMAIL_REPLY
 *   - EMAIL_BOUNCE
 *   - UNSUBSCRIBE
 *
 * When a provider claims their page (via the claim link), the onboard
 * flow calls the separate /api/admin/provider-outreach/claimed endpoint
 * which pauses them in SmartLead and updates sequence_status to 'claimed'.
 */

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const eventType: string = body.event_type || body.event || "";
  const email: string = body.to_email || body.email || body.lead?.email || "";

  if (!email) {
    return NextResponse.json({ ok: true, skipped: "no email" });
  }

  const db = getServiceClient();

  // Look up the provider by email
  const { data: rawRow, error: lookupErr } = await db
    .from("provider_outreach")
    .select("id, provider_id, email_opens, email_clicks, email_replies, sequence_status")
    .eq("email", email)
    .in("sequence_status", ["active", "paused"])
    .limit(1)
    .single();

  const row = rawRow as { id: string; provider_id: string; email_opens: number; email_clicks: number; email_replies: number; sequence_status: string } | null;

  if (lookupErr || !row) {
    return NextResponse.json({ ok: true, skipped: "provider not found" });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };
  let touchpointType: string | null = null;

  switch (eventType.toUpperCase()) {
    case "EMAIL_OPEN":
    case "OPEN":
      updates.email_opens = (row.email_opens || 0) + 1;
      updates.last_open_at = now;
      updates.last_engagement_at = now;
      touchpointType = "email_opened";
      break;

    case "EMAIL_CLICK":
    case "CLICK":
      updates.email_clicks = (row.email_clicks || 0) + 1;
      updates.last_click_at = now;
      updates.last_engagement_at = now;
      // Clicks upgrade to warm
      updates.lead_score = "warm";
      touchpointType = "email_clicked";
      break;

    case "EMAIL_REPLY":
    case "REPLY":
      updates.email_replies = (row.email_replies || 0) + 1;
      updates.last_reply_at = now;
      updates.last_engagement_at = now;
      // Replies are hot, pause the sequence
      updates.lead_score = "hot";
      updates.sequence_status = "paused";
      updates.status = "paused";
      touchpointType = "reply_received";
      break;

    case "EMAIL_BOUNCE":
    case "BOUNCE":
      updates.email_bounced = true;
      updates.lead_score = "dead";
      touchpointType = "email_bounced";
      break;

    case "UNSUBSCRIBE":
      updates.sequence_status = "opted_out";
      updates.status = "do_not_contact";
      touchpointType = "opted_out";
      break;

    default:
      return NextResponse.json({ ok: true, skipped: `unknown event: ${eventType}` });
  }

  // Update the provider_outreach row
  await db.from("provider_outreach").update(updates).eq("id", row.id);

  // Log the touchpoint
  if (touchpointType) {
    await db.from("provider_outreach_touchpoints").insert({
      outreach_id: row.id,
      type: touchpointType,
      payload: { event_type: eventType, raw: body },
    });
  }

  return NextResponse.json({ ok: true, provider_id: row.provider_id, event: eventType });
}
