/**
 * Resend webhook event handling.
 *
 * Receives lifecycle events (sent / delivered / opened / clicked / bounced /
 * complained / etc) from Resend and persists them to email_events. Updates
 * the denormalized snapshot columns on email_log so "what's the open rate?"
 * stays a flat scan.
 *
 * Idempotency: every webhook delivery has a unique svix-id header. Resend
 * (via Svix) re-delivers on receiver failure. We use svix-id as a UNIQUE key
 * on email_events so replays are no-ops at the DB level.
 *
 * Out-of-order safety: the email_log denormalized columns use monotonic
 * UPDATEs — "first" timestamps only set when null, "last_event" only updates
 * when the new event's occurred_at is newer than the stored last_event_at.
 */

import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";

// ── Resend webhook payload types ────────────────────────────────────────
//
// Resend sends events with this top-level shape, dispatched by `type`. Inner
// `data` shape varies per event. We only type the fields we actually consume.

export type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.opened"
  | "email.clicked"
  | "email.bounced"
  | "email.complained"
  | "email.failed";

interface ResendEventBase {
  type: ResendEventType;
  created_at: string; // ISO timestamp at Resend
  data: {
    email_id: string; // matches email_log.resend_id
    from?: string;
    to?: string[] | string;
    subject?: string;
  };
}

interface ResendClickedEvent extends ResendEventBase {
  type: "email.clicked";
  data: ResendEventBase["data"] & {
    click?: {
      link?: string;
      ipAddress?: string;
      userAgent?: string;
      timestamp?: string;
    };
  };
}

interface ResendBouncedEvent extends ResendEventBase {
  type: "email.bounced";
  data: ResendEventBase["data"] & {
    bounce?: {
      subType?: string; // "hard" | "soft" | etc.
      message?: string;
    };
  };
}

export type ResendEventPayload =
  | ResendEventBase
  | ResendClickedEvent
  | ResendBouncedEvent;

// ── Service-role DB client ───────────────────────────────────────────────

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase admin credentials not configured");
  }
  return createClient(url, serviceKey);
}

// ── Signature verification ───────────────────────────────────────────────

/**
 * Verify a Resend webhook delivery using Svix's standard verification.
 * Returns the parsed payload on success, null on any failure (bad signature,
 * malformed payload, missing secret).
 *
 * Resend webhooks are dispatched by Svix infra; the headers and message
 * format match Svix's conventions exactly.
 */
export function verifyResendSignature(
  rawBody: string,
  headers: { "svix-id": string; "svix-timestamp": string; "svix-signature": string },
): ResendEventPayload | null {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET not configured");
    return null;
  }
  try {
    const wh = new Webhook(secret);
    return wh.verify(rawBody, headers) as ResendEventPayload;
  } catch (err) {
    console.error("[resend-webhook] signature verification failed:", err);
    return null;
  }
}

// ── Event recording ──────────────────────────────────────────────────────

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

/**
 * Persist a verified webhook event to the DB.
 *
 * Two writes:
 *   1. INSERT into email_events with ON CONFLICT (svix_id) DO NOTHING
 *      — replays are no-ops, original row is canonical.
 *   2. Look up email_log by resend_id; if found, conditionally UPDATE the
 *      denormalized snapshot columns (first_* timestamps only set when null,
 *      last_event_* only when newer).
 *
 * The email_log lookup can race with the send pipeline (Resend webhook can
 * arrive before lib/email.ts has written the resend_id). When that happens
 * the event row still lands with email_log_id = null; the audit can join
 * later via resend_id.
 */
export async function recordEmailEvent(
  payload: ResendEventPayload,
  svixId: string,
): Promise<void> {
  const db = getAdminClient();
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

  // Extract event-type-specific fields
  let linkUrl: string | null = null;
  let bounceType: string | null = null;
  let bounceReason: string | null = null;
  if (payload.type === "email.clicked") {
    linkUrl = (payload as ResendClickedEvent).data.click?.link ?? null;
  } else if (payload.type === "email.bounced") {
    bounceType = (payload as ResendBouncedEvent).data.bounce?.subType ?? null;
    bounceReason = (payload as ResendBouncedEvent).data.bounce?.message ?? null;
  }

  // Look up the email_log row by resend_id (may miss on race; that's OK).
  // Select every "first_* / *_at" column we may need to guard against, so the
  // monotonic UPDATE logic can compare against the current state.
  const { data: logRow } = await db
    .from("email_log")
    .select(
      "id, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at, last_event_at",
    )
    .eq("resend_id", resendId)
    .maybeSingle();

  const emailLogId = logRow?.id ?? null;

  // 1. Insert event (idempotent on svix_id)
  const { error: insertErr } = await db.from("email_events").insert({
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
  // These are write-once-mostly: the first time we observe the event for this
  // email is what we record. Out-of-order replays of the same event type
  // would re-set to the same-or-near value; the IS-NULL guard prevents that.
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

  // Conditional UPDATE — guard each "first" column with IS NULL on the row.
  // Supabase's update() doesn't natively support per-column WHERE, so we
  // re-check at the row level: the row's snapshot we already read is what
  // we filter against. Two concurrent webhooks for the same email_log row
  // are extraordinarily rare; the worst case is one overwrite of an
  // identical-or-near-identical timestamp. Acceptable.
  const { error: updateErr } = await db
    .from("email_log")
    .update(update)
    .eq("id", logRow.id);
  if (updateErr) {
    console.error("[resend-webhook] email_log update failed:", updateErr);
  }

  // 3. Flag family-profile email_validity on bounce/complaint.
  //
  // Used by the SBF V3 flow to mark dead email destinations so we don't:
  //   (a) include them in the "captured & contactable" KPI in admin/analytics
  //   (b) keep trying to send to them in any future re-engagement loop
  //
  // Lookup is by email + type='family' (scoped to the partial index added
  // in migration 058). Family profiles share email column with their auth
  // user; provider profiles use their own email which is excluded here.
  //
  // Validity precedence: 'complained' > 'bounced' > 'delivered' > 'unverified'.
  // We never downgrade — `.in('email_validity', allowed)` enforces this:
  // a 'bounced' update will skip a row already 'complained', and a 'complained'
  // update will overwrite a 'bounced' row.
  if (eventType === "bounced" || eventType === "complained") {
    const rawTo = payload.data?.to;
    const recipient = Array.isArray(rawTo) ? rawTo[0] : rawTo;
    if (recipient && typeof recipient === "string") {
      const allowedCurrent =
        eventType === "bounced"
          ? ["unverified", "delivered"]
          : ["unverified", "delivered", "bounced"];
      const { error: validityErr } = await db
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

  // 4. Flag provider_questions with email_dead when a question email bounces or
  // receives a complaint (spam report).
  //
  // When a "question_received" email bounces or is marked as spam, we need to
  // flag all pending questions for that provider so they appear in the Delivery
  // Issues tab. This catches first-time bounces that weren't on the suppression
  // list at send time — especially important for claimed providers whose email
  // may become invalid after account creation.
  //
  // Complaints are treated the same as bounces: the email is unusable and we
  // must not retry sending to it.
  if ((eventType === "bounced" || eventType === "complained") && logRow) {
    await flagQuestionsOnBounce(db, logRow.id);
  }
}

/**
 * Flag pending provider_questions with email_dead when a question email bounces.
 *
 * Lookup: use the email_log row to check if it's a question_received email.
 * If so, find the provider_id and flag all their pending questions so they
 * appear in the Delivery Issues tab instead of Unanswered.
 */
async function flagQuestionsOnBounce(
  db: ReturnType<typeof getAdminClient>,
  emailLogId: string,
): Promise<void> {
  // Get the email_log details to check if it's a question email
  const { data: emailLog } = await db
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
  const { data: questions } = await db
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

    const { error } = await db
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
