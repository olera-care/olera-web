/**
 * POST /api/webhooks/resend
 *
 * Webhook handler for Resend email events - STAFFING OUTREACH specific.
 * Used to track email engagement and handle bounces for staffing outreach sequences.
 *
 * Events handled:
 *   email.sent      - Track when email was delivered (Email 1 or Email 2)
 *   email.opened    - Track engagement (provider opened email)
 *   email.clicked   - Track engagement (provider clicked a link)
 *   email.bounced   - Mark provider as bounced, stop sequence
 *
 * Note: This is separate from the main Resend webhook at /api/resend/webhook
 * which handles general email logging. This handler is specifically for
 * staffing outreach automation tracking.
 *
 * Resend sends webhooks to this endpoint when email events occur.
 * Configure webhook URL in Resend Dashboard: https://resend.com/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stopEmailSequence } from "@/lib/staffing-outreach/resend-automation";
import { verifyResendSignature, type ResendEventPayload } from "@/lib/resend-events";

// Use service role for webhook processing (no user context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: NextRequest) {
  // Get raw body for signature verification
  const rawBody = await req.text();

  // Get SVIX headers for signature verification
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[staffing-webhook] Missing svix headers");
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  // Verify signature using the shared verification function
  const event = verifyResendSignature(rawBody, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  });

  if (!event) {
    console.error("[staffing-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  console.log(`[staffing-webhook] Received event: ${event.type}`, {
    email_id: event.data.email_id,
    to: event.data.to,
    subject: event.data.subject,
    svix_id: svixId,
  });

  const db = getServiceClient();

  // Handle to field which can be string[] or string
  const toField = event.data.to;
  const recipientEmail = Array.isArray(toField) ? toField[0] : toField;

  if (!recipientEmail) {
    console.log("[staffing-webhook] No recipient email in event");
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Find the outreach record by sequence_email
  // Don't filter by status - webhooks can arrive after status changes
  const { data: outreach, error: findError } = await db
    .from("staffing_outreach")
    .select("id, status, email1_sent_at, email2_sent_at, sequence_email")
    .eq("sequence_email", recipientEmail)
    .order("sequence_started_at", { ascending: false })
    .limit(1)
    .single();

  if (findError || !outreach) {
    // Not found - might be a non-staffing email, ignore
    console.log(`[resend-webhook] No outreach found for ${recipientEmail}`);
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Skip processing for terminal statuses (bounced, closed, enrolled)
  const terminalStatuses = ["bounced", "closed", "enrolled", "activated"];
  if (terminalStatuses.includes(outreach.status) && event.type !== "email.bounced") {
    console.log(`[resend-webhook] Skipping event for terminal status ${outreach.status}`);
    return NextResponse.json({ ok: true, skipped: true });
  }

  const now = new Date().toISOString();

  switch (event.type) {
    case "email.sent":
    case "email.delivered":
      await handleEmailSent(db, outreach, now);
      break;

    case "email.opened":
      await handleEmailOpened(db, outreach.id, now);
      break;

    case "email.clicked": {
      // Cast to access click-specific data
      const clickData = (event as { data: { click?: { link?: string } } }).data.click;
      await handleEmailClicked(db, outreach.id, clickData?.link, now);
      break;
    }

    case "email.bounced": {
      // Cast to access bounce-specific data
      const bounceData = (event as { data: { bounce?: { message?: string } } }).data.bounce;
      await handleEmailBounced(db, outreach.id, outreach.sequence_email, bounceData?.message, now);
      break;
    }

    default:
      console.log(`[resend-webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ ok: true });
}

/**
 * Handle email.sent/delivered - track which email in the sequence was sent
 */
async function handleEmailSent(
  db: ReturnType<typeof getServiceClient>,
  outreach: { id: string; email1_sent_at: string | null; email2_sent_at: string | null },
  now: string
) {
  // Determine if this is Email 1 or Email 2
  if (!outreach.email1_sent_at) {
    // First email in sequence
    await db
      .from("staffing_outreach")
      .update({ email1_sent_at: now, updated_at: now })
      .eq("id", outreach.id);

    await insertTouchpoint(db, outreach.id, "sequence_email1_sent", now);
    console.log(`[resend-webhook] Email 1 sent for outreach ${outreach.id}`);
  } else if (!outreach.email2_sent_at) {
    // Second email in sequence
    await db
      .from("staffing_outreach")
      .update({ email2_sent_at: now, updated_at: now })
      .eq("id", outreach.id);

    await insertTouchpoint(db, outreach.id, "sequence_email2_sent", now);
    console.log(`[resend-webhook] Email 2 sent for outreach ${outreach.id}`);
  }
}

/**
 * Handle email.opened - log engagement
 */
async function handleEmailOpened(
  db: ReturnType<typeof getServiceClient>,
  outreachId: string,
  now: string
) {
  await insertTouchpoint(db, outreachId, "email_opened", now);

  // Update last engagement timestamp
  await db
    .from("staffing_outreach")
    .update({ last_engagement_at: now, updated_at: now })
    .eq("id", outreachId);

  console.log(`[resend-webhook] Email opened for outreach ${outreachId}`);
}

/**
 * Handle email.clicked - log engagement with link details
 */
async function handleEmailClicked(
  db: ReturnType<typeof getServiceClient>,
  outreachId: string,
  link: string | undefined,
  now: string
) {
  await insertTouchpoint(db, outreachId, "email_clicked", now, { link });

  // Update last engagement timestamp
  await db
    .from("staffing_outreach")
    .update({ last_engagement_at: now, updated_at: now })
    .eq("id", outreachId);

  console.log(`[resend-webhook] Email clicked for outreach ${outreachId}`, { link });
}

/**
 * Handle email.bounced - mark as bounced, stop sequence
 */
async function handleEmailBounced(
  db: ReturnType<typeof getServiceClient>,
  outreachId: string,
  sequenceEmail: string | null,
  bounceMessage: string | undefined,
  now: string
) {
  // Update status to bounced
  await db
    .from("staffing_outreach")
    .update({
      status: "bounced",
      updated_at: now,
    })
    .eq("id", outreachId);

  // Remove from Resend audience to stop further emails
  if (sequenceEmail) {
    await stopEmailSequence(sequenceEmail);
  }

  await insertTouchpoint(db, outreachId, "email_bounced", now, {
    bounce_message: bounceMessage,
  });

  console.log(`[resend-webhook] Email bounced for outreach ${outreachId}`, { bounceMessage });
}

/**
 * Insert a touchpoint record
 */
async function insertTouchpoint(
  db: ReturnType<typeof getServiceClient>,
  outreachId: string,
  type: string,
  createdAt: string,
  payload: Record<string, unknown> = {}
) {
  await db.from("staffing_touchpoints").insert({
    outreach_id: outreachId,
    type,
    payload,
    created_at: createdAt,
    // No created_by since this is from webhook (system)
  });
}
