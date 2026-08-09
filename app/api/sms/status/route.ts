import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/sms/status
 *
 * Twilio delivery receipts for outbound SMS. Twilio posts here once per status
 * transition (queued → sending → sent → delivered, or → undelivered/failed)
 * for any message sent with a statusCallback, which lib/twilio.ts sendSMS now
 * sets on every send.
 *
 * Why this exists: email_log rows for SMS were written `sent` and never touched
 * again, because "sent" only means Twilio ACCEPTED the API call. It says nothing
 * about the carrier. Before the 10DLC campaign cleared (2026-07-15) roughly 80%
 * of our texts were silently dropped (error 30034, unregistered A2P) while every
 * row in our own database read `sent`. As of 2026-08-09 all 67 SMS rows still
 * read `sent` with no delivered_at, so the per-message-type table on
 * /admin/automations could only show dashes for text.
 *
 * The alternative was to keep reading Twilio's Messages resource live (which is
 * what /api/admin/family-comms-analytics/sms does). That works for a health
 * panel but cannot join per email_type, and it re-queries an external API for
 * data that never changes once terminal. Receipts land here once and persist.
 *
 * Matching: on the Twilio SID, stored in email_log.resend_id at send time.
 * A callback for a SID we never logged (sends that pass no emailType never
 * reach email_log) is a no-op, not an error.
 *
 * Always returns 200. A non-2xx makes Twilio retry with backoff, and there is
 * nothing a retry can fix here — the row either exists or it does not.
 */

/** Twilio's terminal failure states. Everything else is progress. */
const FAILED = new Set(["undelivered", "failed"]);

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Must reproduce the URL Twilio signed, which is the callback we handed it in
 * sendSMS — not request.url, which can differ behind Vercel's proxy.
 */
function buildCallbackUrl(request: NextRequest): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (siteUrl) {
    const base = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    return `${base}/api/sms/status`;
  }
  return request.url;
}

export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("[sms-status] TWILIO_AUTH_TOKEN not configured");
    return NextResponse.json({ ok: true });
  }

  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const signature = request.headers.get("x-twilio-signature") || "";
  if (!twilio.validateRequest(authToken, signature, buildCallbackUrl(request), params)) {
    console.error("[sms-status] Invalid Twilio signature");
    return new NextResponse("Forbidden", { status: 403 });
  }

  const sid = (params.MessageSid || params.SmsSid || "").trim();
  const status = (params.MessageStatus || params.SmsStatus || "").trim().toLowerCase();
  const errorCode = (params.ErrorCode || "").trim();
  if (!sid || !status) return NextResponse.json({ ok: true });

  const db = getServiceDb();
  if (!db) return NextResponse.json({ ok: true });

  try {
    const { data: row } = await db
      .from("email_log")
      .select("id, delivered_at, bounced_at")
      .eq("resend_id", sid)
      .maybeSingle();
    // Sends that pass no emailType never reach email_log, so an unmatched SID
    // is expected rather than a fault.
    if (!row) return NextResponse.json({ ok: true });

    // Deliberately mirrors the email convention rather than inventing an SMS
    // one. On the email side `status` only ever holds sent | failed | pending,
    // and delivery is expressed by setting delivered_at while status stays
    // `sent`. The Automations rollup counts delivered as `if (e.delivered_at)`
    // (app/api/admin/automations/[id]/recipients/route.ts), so writing a
    // status of "delivered" would add a fourth value nothing reads AND leave
    // the column it feeds empty.
    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      last_event_type: status,
      last_event_at: now,
    };

    // A terminal receipt already landed. Twilio can resend a callback and can
    // deliver them out of order, so record the event but never walk the row
    // back from delivered or failed.
    const terminal = Boolean(row.delivered_at || row.bounced_at);

    if (FAILED.has(status) && !terminal) {
      update.status = "failed";
      // bounced_at is what the Bounced column counts, and a carrier rejection
      // is the SMS equivalent of a bounce.
      update.bounced_at = now;
      // The numeric code is the actionable part (30034 = unregistered A2P,
      // 30003 = unreachable handset, 21610 = recipient replied STOP).
      update.error_message = errorCode
        ? `Twilio ${status} (error ${errorCode})`
        : `Twilio ${status}`;
    } else if (status === "delivered" && !row.delivered_at) {
      update.delivered_at = now;
    }

    const { error } = await db.from("email_log").update(update).eq("id", row.id);
    if (error) console.error("[sms-status] update failed:", error.message);
  } catch (err) {
    console.error("[sms-status] Unexpected error:", err);
  }

  return NextResponse.json({ ok: true });
}
