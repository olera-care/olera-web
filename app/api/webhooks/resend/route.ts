/**
 * POST /api/webhooks/resend
 *
 * Webhook handler for Resend email events.
 * Used to track email engagement and handle bounces for staffing outreach.
 *
 * Events handled:
 *   email.sent      - Log when email was delivered
 *   email.opened    - Track engagement (provider opened email)
 *   email.clicked   - Track engagement (provider clicked a link)
 *   email.bounced   - Mark provider as bounced, stop sequence
 *
 * Resend sends webhooks to this endpoint when email events occur.
 * Configure webhook URL in Resend Dashboard: https://resend.com/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for webhook processing (no user context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Resend webhook event types
interface ResendWebhookEvent {
  type: "email.sent" | "email.delivered" | "email.opened" | "email.clicked" | "email.bounced" | "email.complained";
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    // For clicked events
    click?: {
      link: string;
      timestamp: string;
    };
    // For bounced events
    bounce?: {
      message: string;
    };
  };
}

/**
 * Verify the webhook signature from Resend.
 * For now, we'll use a simple shared secret approach.
 * In production, Resend provides SVIX signatures for verification.
 */
function verifyWebhookSignature(req: NextRequest): boolean {
  // TODO: Implement proper SVIX signature verification
  // For now, check for a simple webhook secret
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // If no secret configured, allow in development
    console.warn("[resend-webhook] No RESEND_WEBHOOK_SECRET configured");
    return true;
  }

  const signature = req.headers.get("svix-signature");
  // Basic check - in production, use proper SVIX verification
  return !!signature;
}

export async function POST(req: NextRequest) {
  // Verify webhook authenticity
  if (!verifyWebhookSignature(req)) {
    console.error("[resend-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`[resend-webhook] Received event: ${event.type}`, {
    email_id: event.data.email_id,
    to: event.data.to,
    subject: event.data.subject,
  });

  const db = getServiceClient();
  const recipientEmail = event.data.to[0]; // Primary recipient

  // Find the outreach record by sequence_email
  const { data: outreach, error: findError } = await db
    .from("staffing_outreach")
    .select("id, status, email1_sent_at, email2_sent_at")
    .eq("sequence_email", recipientEmail)
    .eq("status", "sequencing")
    .single();

  if (findError || !outreach) {
    // Not found - might be a non-staffing email, ignore
    console.log(`[resend-webhook] No active sequence found for ${recipientEmail}`);
    return NextResponse.json({ ok: true, ignored: true });
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

    case "email.clicked":
      await handleEmailClicked(db, outreach.id, event.data.click?.link, now);
      break;

    case "email.bounced":
      await handleEmailBounced(db, outreach.id, event.data.bounce?.message, now);
      break;

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
