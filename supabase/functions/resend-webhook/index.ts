// Resend webhook receiver — Supabase Edge Function (Deno).
//
// Replaces app/api/resend/webhook/route.ts for production use. Vercel's
// Bot Protection edge layer blocks Resend's GCP-origin webhook POSTs with
// 403 Forbidden (Resend dispatches via Svix, also on GCP) — same wall the
// Stripe webhook hit. Supabase Edge Functions are not behind that layer.
//
// The Vercel route is retained as documented backup at
// app/api/resend/webhook/route.ts but is no longer registered in Resend.
//
// Logic mirrors lib/resend-events.ts exactly:
//   1. Verify svix signature (returns 400 on failure)
//   2. INSERT email_events with ON CONFLICT (svix_id) DO NOTHING (idempotent)
//   3. Look up email_log by resend_id; if found, conditionally UPDATE the
//      denormalized snapshot columns (first_* timestamps only set when null,
//      last_event_* only advances when occurred_at is newer)
//   4. Always return 200 on internal failures so Resend doesn't retry forever
//
// Environment variables (auto-injected by Supabase):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Environment variables (set manually via `supabase secrets set`):
//   RESEND_WEBHOOK_SECRET — whsec_... from Resend Dashboard → Webhooks
//
// Deploy: see ./README.md

import { Webhook } from "npm:svix@1.92.2";
import { createClient } from "jsr:@supabase/supabase-js@2";

const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!webhookSecret) {
  console.error("[resend-webhook] RESEND_WEBHOOK_SECRET not configured");
}
if (!supabaseUrl || !serviceRoleKey) {
  console.error("[resend-webhook] Supabase service role credentials not configured");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.opened"
  | "email.clicked"
  | "email.bounced"
  | "email.complained"
  | "email.failed";

interface ResendEventPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    click?: { link?: string };
    bounce?: { subType?: string; message?: string };
  };
}

const EVENT_TYPE_FROM_PAYLOAD: Record<ResendEventType, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delivery_delayed",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
};

async function recordEmailEvent(payload: ResendEventPayload, svixId: string): Promise<void> {
  const eventType = EVENT_TYPE_FROM_PAYLOAD[payload.type];
  if (!eventType) {
    console.warn("[resend-webhook] unknown event type:", payload.type);
    return;
  }

  const resendId = payload.data?.email_id;
  if (!resendId) {
    console.warn("[resend-webhook] missing email_id in payload:", payload.type);
    return;
  }

  const occurredAt = payload.created_at;

  let linkUrl: string | null = null;
  let bounceType: string | null = null;
  let bounceReason: string | null = null;
  if (payload.type === "email.clicked") {
    linkUrl = payload.data.click?.link ?? null;
  } else if (payload.type === "email.bounced") {
    bounceType = payload.data.bounce?.subType ?? null;
    bounceReason = payload.data.bounce?.message ?? null;
  }

  // Look up the email_log row by resend_id (may miss on race; that's OK).
  // We also pull the columns we need to guard against in the monotonic UPDATE.
  const { data: logRow } = await supabase
    .from("email_log")
    .select(
      "id, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at, last_event_at",
    )
    .eq("resend_id", resendId)
    .maybeSingle();

  const emailLogId = logRow?.id ?? null;

  // 1. Insert event (idempotent on svix_id via UNIQUE constraint)
  const { error: insertErr } = await supabase.from("email_events").insert({
    svix_id: svixId,
    email_log_id: emailLogId,
    resend_id: resendId,
    event_type: eventType,
    occurred_at: occurredAt,
    payload: payload as unknown as Record<string, unknown>,
    link_url: linkUrl,
    bounce_type: bounceType,
    bounce_reason: bounceReason,
  });
  if (insertErr) {
    // Unique violation on svix_id = replay, expected — silently no-op
    if (insertErr.code === "23505") return;
    console.error("[resend-webhook] email_events insert failed:", insertErr);
    return;
  }

  // 2. Update denormalized snapshot on email_log (skip if log row missing)
  if (!logRow) return;

  const update: Record<string, string> = {};

  // "First" timestamps — only set when the corresponding column is still null.
  if (eventType === "delivered" && !logRow.delivered_at) {
    update.delivered_at = occurredAt;
  }
  if (eventType === "opened" && !logRow.first_opened_at) {
    update.first_opened_at = occurredAt;
  }
  if (eventType === "clicked" && !logRow.first_clicked_at) {
    update.first_clicked_at = occurredAt;
  }
  if (eventType === "bounced" && !logRow.bounced_at) {
    update.bounced_at = occurredAt;
  }
  if (eventType === "complained" && !logRow.complained_at) {
    update.complained_at = occurredAt;
  }

  // "Last" event — only advance when newer than what's stored
  const isNewer =
    !logRow.last_event_at || new Date(occurredAt) > new Date(logRow.last_event_at);
  if (isNewer) {
    update.last_event_type = eventType;
    update.last_event_at = occurredAt;
  }

  if (Object.keys(update).length === 0) return;

  const { error: updateErr } = await supabase
    .from("email_log")
    .update(update)
    .eq("id", logRow.id);
  if (updateErr) {
    console.error("[resend-webhook] email_log update failed:", updateErr);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response(JSON.stringify({ error: "Missing svix headers" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const rawBody = await req.text();

  let payload: ResendEventPayload;
  try {
    const wh = new Webhook(webhookSecret);
    payload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ResendEventPayload;
  } catch (err) {
    console.error("[resend-webhook] signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    await recordEmailEvent(payload, svixId);
  } catch (err) {
    // Already logged inside recordEmailEvent for known errors; this catch is
    // for unexpected throws. Return 200 anyway so Resend doesn't retry forever.
    console.error("[resend-webhook] record failed:", err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
