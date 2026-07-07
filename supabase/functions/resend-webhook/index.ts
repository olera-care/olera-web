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
    to?: string[] | string;
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

  // 3. Flag family-profile email_validity on bounce/complaint.
  // Mirrors the logic in lib/resend-events.ts — see that file for full reasoning.
  // Validity precedence: 'complained' > 'bounced' > 'delivered' > 'unverified'.
  // Never downgrade — `.in('email_validity', allowed)` enforces this.
  if (eventType === "bounced" || eventType === "complained") {
    const rawTo = payload.data?.to;
    const recipient = Array.isArray(rawTo) ? rawTo[0] : rawTo;
    if (recipient && typeof recipient === "string") {
      const allowedCurrent =
        eventType === "bounced"
          ? ["unverified", "delivered"]
          : ["unverified", "delivered", "bounced"];
      const { error: validityErr } = await supabase
        .from("business_profiles")
        .update({ email_validity: eventType })
        .eq("email", recipient.trim().toLowerCase())
        .eq("type", "family")
        .in("email_validity", allowedCurrent);
      if (validityErr) {
        console.error("[resend-webhook] email_validity update failed:", validityErr);
      }
    }
  }

  // 3b. Flag provider_questions with email_dead when a question email bounces
  // or receives a complaint (spam report).
  // This ensures bounced/complained question emails show up in the Delivery
  // Issues tab, not hidden in Unanswered. Critical for claimed providers whose
  // email may become invalid after account creation. Complaints are treated
  // the same as bounces - the email is unusable and we must not retry.
  if ((eventType === "bounced" || eventType === "complained") && emailLogId) {
    await flagQuestionsOnBounce(emailLogId);
  }

  // 4. v9 Phase 8 — student_outreach touchpoint emission + downstream
  // operational side effects.
  //
  // Strategy: every Resend event with an email_log row is potentially
  // tied to an outreach row. We locate the outreach via the
  // 'email_sent' touchpoint whose payload.email_log_id matches our
  // log (every send writes one). For bounce / complained / failed we
  // emit a corresponding touchpoint so deriveStage() picks it up and
  // the drawer Timeline narrates it. Bounce additionally cancels
  // pending email tasks (no point continuing to bad addresses) and
  // complained auto-DNCs the row (compliance — must not retry).
  if (
    emailLogId &&
    (eventType === "bounced" ||
      eventType === "complained" ||
      eventType === "failed")
  ) {
    await emitOutreachTouchpoint(emailLogId, eventType, payload, occurredAt);
  }
}

/**
 * Find the outreach row tied to this email_log and emit a downstream
 * touchpoint + apply operational side effects per event type.
 *
 * Lookup: find the email_sent touchpoint with payload.email_log_id =
 * <emailLogId>. Cheap — touchpoints are scoped by outreach_id and
 * email_log_id is a stable foreign-key reference set at send time.
 * Multi-recipient sends create one email_log per recipient, so the
 * touchpoint join is 1:1.
 *
 * Side effects:
 *   bounced     → emit email_bounced touchpoint
 *                  + cancel pending outreach_email_send tasks
 *                    (broken contact, future sends would also bounce)
 *   complained  → emit email_complained touchpoint
 *                  + transition outreach.status → do_not_contact
 *                    (compliance: cannot continue cadence)
 *   failed      → emit email_failed touchpoint
 *                  (no auto-transition; admin retries from the drawer)
 *
 * Idempotent: if a touchpoint already exists for this email_log_id +
 * event_type, we don't duplicate. Resend may redeliver events; the
 * dedupe guard keeps the timeline clean.
 */
async function emitOutreachTouchpoint(
  emailLogId: string,
  eventType: "bounced" | "complained" | "failed",
  payload: ResendEventPayload,
  occurredAt: string,
): Promise<void> {
  // Find the originating email_sent touchpoint so we can read the
  // outreach_id off its row. v9 Phase 9: also read recipient_contact_id
  // and contact_id from the touchpoint — these scope the bounce
  // cancellation to a single recipient when per-recipient cadence
  // mode is in use. Legacy (single-recipient task) sends have these
  // null; cancel scope falls back to outreach-wide.
  //
  // v9 final: recipient_kind='general' on the touchpoint payload
  // marks a synthetic General Contact send (no underlying contact
  // row). For those, scope cancellation by recipient_kind='general'
  // instead of recipient_contact_id — there is no contact_id to
  // match on, but the synthetic thread is its own cancellation
  // bucket and named contacts must NOT get caught up in the bounce.
  const { data: sentRows } = await supabase
    .from("student_outreach_touchpoints")
    .select("outreach_id, contact_id, payload")
    .eq("touchpoint_type", "email_sent")
    .filter("payload->>email_log_id", "eq", emailLogId)
    .limit(1);
  const sent = sentRows?.[0] as
    | { outreach_id: string; contact_id: string | null; payload: Record<string, unknown> | null }
    | undefined;
  const outreachId = sent?.outreach_id;
  if (!outreachId) {
    // No outreach row associated — likely a system / candidate /
    // other transactional email. Nothing to do operationally.
    return;
  }
  const recipientKind =
    typeof sent?.payload?.recipient_kind === "string"
      ? (sent.payload.recipient_kind as string)
      : null;
  const recipientContactId =
    (typeof sent?.payload?.recipient_contact_id === "string"
      ? sent.payload.recipient_contact_id
      : null) ?? sent?.contact_id ?? null;

  const touchpointType: "email_bounced" | "email_complained" | "email_failed" =
    eventType === "bounced"
      ? "email_bounced"
      : eventType === "complained"
        ? "email_complained"
        : "email_failed";

  // Idempotency guard: don't duplicate touchpoints if Resend redelivers.
  const { data: existing } = await supabase
    .from("student_outreach_touchpoints")
    .select("id")
    .eq("outreach_id", outreachId)
    .eq("touchpoint_type", touchpointType)
    .filter("payload->>email_log_id", "eq", emailLogId)
    .limit(1);
  if (existing && existing.length > 0) return;

  await supabase.from("student_outreach_touchpoints").insert({
    outreach_id: outreachId,
    // Synthetic General Contact sends have no contact row, so contact_id
    // stays null. For specific recipients we mirror the original send's
    // contact_id so the drawer Timeline correlates the bounce with the
    // right recipient.
    contact_id: recipientKind === "general" ? null : recipientContactId,
    touchpoint_type: touchpointType,
    channel: "email",
    outcome: eventType,
    payload: {
      email_log_id: emailLogId,
      // v9 Phase 9: carry through the recipient_contact_id so the
      // drawer Timeline can correlate the bounce row with the
      // specific recipient's email_sent above it.
      recipient_contact_id: recipientContactId,
      // v9 final: stamp the kind so timeline + cancellation logic
      // can branch without re-querying the original send.
      recipient_kind: recipientKind ?? "specific",
      bounce_type: payload.data?.bounce?.subType ?? null,
      bounce_reason: payload.data?.bounce?.message ?? null,
      occurred_at: occurredAt,
    },
    created_at: occurredAt,
  });

  // Side effects per event type.
  if (eventType === "bounced") {
    // v9 Phase 9: per-recipient cancellation. Three sub-cases:
    //   1. recipient_kind='general' (synthetic) → cancel only
    //      pending tasks tagged recipient_kind='general'. Named
    //      contacts on this row keep their cadence.
    //   2. recipient_contact_id set (specific recipient) → cancel
    //      only THAT contact's pending email tasks.
    //   3. Neither (legacy / single-recipient send) → cancel all
    //      pending email tasks on the outreach row.
    let cancelQuery = supabase
      .from("student_outreach_tasks")
      .update({ status: "cancelled" })
      .eq("outreach_id", outreachId)
      .eq("status", "pending")
      .eq("task_type", "outreach_email_send");
    if (recipientKind === "general") {
      cancelQuery = cancelQuery.filter(
        "payload->>recipient_kind",
        "eq",
        "general",
      );
    } else if (recipientContactId) {
      cancelQuery = cancelQuery.filter(
        "payload->>recipient_contact_id",
        "eq",
        recipientContactId,
      );
    }
    const { error: cancelErr } = await cancelQuery;
    if (cancelErr) {
      console.error(
        "[resend-webhook] failed to cancel pending email tasks:",
        cancelErr,
      );
    }
  } else if (eventType === "complained") {
    // Compliance hard wall — provider marked our email as spam.
    // Auto-transition to do_not_contact; row leaves active queues
    // and lives in Archive. Reopen is suppressed by NextStepCard for
    // DNC rows.
    const { error: dncErr } = await supabase
      .from("student_outreach")
      .update({
        status: "do_not_contact",
        last_edited_at: occurredAt,
      })
      .eq("id", outreachId);
    if (dncErr) {
      console.error("[resend-webhook] failed to auto-DNC:", dncErr);
    }
    // Cancel pending tasks too — no further work scheduled on a DNC row.
    await supabase
      .from("student_outreach_tasks")
      .update({ status: "cancelled" })
      .eq("outreach_id", outreachId)
      .eq("status", "pending");
  }
  // 'failed' is informational — admin sees the touchpoint and decides
  // whether to retry. No automatic state mutation.
}

/**
 * Flag pending provider_questions with email_dead when a question email bounces.
 *
 * Lookup: use the email_log row to check if it's a question_received email.
 * If so, find the provider_id and flag all their pending questions so they
 * appear in the Delivery Issues tab instead of Unanswered.
 */
async function flagQuestionsOnBounce(emailLogId: string): Promise<void> {
  // Get the email_log details to check if it's a question email
  const { data: emailLog } = await supabase
    .from("email_log")
    .select("email_type, recipient_type, provider_id")
    .eq("id", emailLogId)
    .single();

  if (!emailLog) return;

  // Only process question_received emails to providers
  if (emailLog.email_type !== "question_received" || emailLog.recipient_type !== "provider") {
    return;
  }

  const providerId = emailLog.provider_id;
  if (!providerId) return;

  // Fetch pending questions for this provider to preserve their existing metadata
  const { data: questions } = await supabase
    .from("provider_questions")
    .select("id, metadata")
    .eq("provider_id", providerId)
    .eq("status", "pending");

  if (!questions || questions.length === 0) return;

  // Update each question to add email_dead flag while preserving existing metadata
  let flaggedCount = 0;
  for (const q of questions) {
    const currentMeta = (q.metadata as Record<string, unknown>) || {};
    // Skip if already flagged
    if (currentMeta.email_dead === true) continue;

    const { error } = await supabase
      .from("provider_questions")
      .update({
        metadata: { ...currentMeta, email_dead: true },
      })
      .eq("id", q.id);

    if (!error) flaggedCount++;
  }

  if (flaggedCount > 0) {
    console.log(`[resend-webhook] Flagged ${flaggedCount} questions for provider ${providerId} with email_dead`);
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
