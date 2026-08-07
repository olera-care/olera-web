import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { createTwilioClient, sendSMS } from "@/lib/twilio";
import { isPhoneDoNotContact } from "@/lib/do-not-contact";

/**
 * One SMS conversation, and the ability to answer it.
 *
 * GET  /api/admin/sms-inbox/[phone]  — full thread, both directions
 * POST /api/admin/sms-inbox/[phone]  — { action: "reply", body } | { action: "mark_handled" }
 *
 * The thread is read from TWILIO, not our database, because Twilio holds the
 * complete permanent history of both directions and our own outbound logging is
 * partial (logSms only fires when a caller passes emailType — roughly 94% of
 * sends never reach email_log). Reading Twilio avoids a backfill and a
 * dual-write, and it can't silently show half a conversation.
 *
 * `phone` in the path is the last 10 digits (the thread key used everywhere:
 * sms_inbound.phone_last10 and do_not_contact.phone).
 */

const MAX_THREAD = 200;

/** Twilio addresses US numbers in E.164; our thread key is the last 10 digits. */
function toE164(last10: string): string {
  return `+1${last10}`;
}

function normalizeLast10(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ phone: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { phone } = await params;
    const last10 = normalizeLast10(phone);
    if (!last10) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });

    const db = getServiceClient();
    const e164 = toE164(last10);

    const [inboundRes, dncRes] = await Promise.all([
      db
        .from("sms_inbound")
        .select("id, from_phone, body, keyword, profile_id, profile_type, display_name, handled_at, created_at")
        .eq("phone_last10", last10)
        .order("created_at", { ascending: true }),
      db.from("do_not_contact").select("id, reason, note").eq("phone", last10).limit(1).maybeSingle(),
    ]);
    if (inboundRes.error) {
      console.error("[admin/sms-inbox/phone] inbound load failed:", inboundRes.error);
      return NextResponse.json({ error: inboundRes.error.message }, { status: 500 });
    }
    const inboundRows = inboundRes.data ?? [];

    // Identity: take the most recent non-null resolution we have on file.
    const identified = [...inboundRows].reverse().find((r) => r.display_name || r.profile_type);

    const client = createTwilioClient();
    let messages: {
      sid: string;
      direction: "in" | "out";
      body: string;
      at: string | null;
      status: string;
      errorCode: number | null;
    }[] = [];
    let twilioError: string | null = null;

    if (client) {
      try {
        // Twilio has no OR filter, so each direction is its own query.
        const [outbound, inbound] = await Promise.all([
          client.messages.list({ to: e164, limit: MAX_THREAD }),
          client.messages.list({ from: e164, limit: MAX_THREAD }),
        ]);
        messages = [
          ...outbound.map((m) => ({
            sid: m.sid,
            direction: "out" as const,
            body: m.body || "",
            at: m.dateSent ? new Date(m.dateSent).toISOString() : null,
            status: m.status,
            errorCode: m.errorCode ?? null,
          })),
          ...inbound.map((m) => ({
            sid: m.sid,
            direction: "in" as const,
            body: m.body || "",
            at: m.dateSent ? new Date(m.dateSent).toISOString() : null,
            status: m.status,
            errorCode: m.errorCode ?? null,
          })),
        ].sort((a, b) => (a.at ?? "").localeCompare(b.at ?? ""));
      } catch (err) {
        // A Twilio outage must not blank the page — we still have our own
        // inbound rows to show.
        console.error("[admin/sms-inbox/phone] Twilio history failed:", err);
        twilioError = "Twilio history is unavailable right now.";
      }
    } else {
      twilioError = "Twilio is not configured.";
    }

    return NextResponse.json({
      phone_last10: last10,
      e164,
      display_name: identified?.display_name ?? null,
      profile_type: identified?.profile_type ?? null,
      profile_id: identified?.profile_id ?? null,
      suppressed: Boolean(dncRes.data),
      suppression: dncRes.data ? { reason: dncRes.data.reason, note: dncRes.data.note } : null,
      unhandled: inboundRows.filter((r) => !r.handled_at).length,
      // Our stored copy — the durable record, and the only source if Twilio errors.
      inbound: inboundRows,
      messages,
      twilioError,
    });
  } catch (err) {
    console.error("[admin/sms-inbox/phone] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to load thread" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { phone } = await params;
    const last10 = normalizeLast10(phone);
    if (!last10) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const db = getServiceClient();

    if (action === "mark_handled") {
      const { error } = await db
        .from("sms_inbound")
        .update({ handled_at: new Date().toISOString(), handled_by: user.email ?? admin.id })
        .eq("phone_last10", last10)
        .is("handled_at", null);
      if (error) {
        console.error("[admin/sms-inbox/phone] mark_handled failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "reply") {
      const text = typeof body?.body === "string" ? body.body.trim() : "";
      if (!text) return NextResponse.json({ error: "Message body is required" }, { status: 400 });
      if (text.length > 480) {
        return NextResponse.json(
          { error: "Message is too long (480 characters max)" },
          { status: 400 },
        );
      }

      // Refuse before sending rather than relying on sendSMS's silent skip: a
      // human staring at a reply box needs to be told WHY nothing was sent.
      // This is the one place where a person could trivially text someone who
      // asked us to stop.
      if (await isPhoneDoNotContact(last10)) {
        return NextResponse.json(
          {
            error:
              "This number is on the do-not-contact list (they texted STOP). Replying would violate their opt-out.",
          },
          { status: 409 },
        );
      }

      const result = await sendSMS({
        to: toE164(last10),
        body: text,
        // Logged to email_log so a human reply appears alongside automated
        // sends in /admin/family-comms and counts toward the frequency cap.
        emailType: "admin_reply",
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Twilio rejected the message" },
          { status: 502 },
        );
      }
      if (result.skipped) {
        return NextResponse.json(
          { error: "Message was suppressed before sending (do-not-contact or preferences)." },
          { status: 409 },
        );
      }

      // Answering the thread IS handling it.
      await db
        .from("sms_inbound")
        .update({ handled_at: new Date().toISOString(), handled_by: user.email ?? admin.id })
        .eq("phone_last10", last10)
        .is("handled_at", null);

      await logAuditAction({
        adminUserId: admin.id,
        action: "sms_reply_sent",
        targetType: "phone",
        targetId: last10,
        details: { length: text.length },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[admin/sms-inbox/phone] Unexpected error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
