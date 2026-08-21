import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { createTwilioClient, sendSMS } from "@/lib/twilio";
import { isPhoneDoNotContact } from "@/lib/do-not-contact";

/**
 * One SMS conversation, and the ability to answer it.
 *
 * GET  /api/admin/sms-inbox/[phone]  — full thread, both directions, plus any saved draft
 * POST /api/admin/sms-inbox/[phone]  — { action: "reply", body } | { action: "mark_handled" }
 *                                    | { action: "save_draft", body } | { action: "discard_draft" }
 *
 * Twilio remains the complete history when available. Durable sms_inbound and
 * email_log rows form the fallback so an outage cannot hide logged outbound
 * messages or make an outbound-only conversation open to a blank pane.
 *
 * `phone` in the path is the last 10 digits (the thread key used everywhere:
 * sms_inbound.phone_last10 and do_not_contact.phone).
 */

const MAX_THREAD = 200;

/** Matches the reply box and the sms_drafts CHECK — one limit, three places. */
const MAX_BODY = 480;

/** Twilio addresses US numbers in E.164; our thread key is the last 10 digits. */
function toE164(last10: string): string {
  return `+1${last10}`;
}

/**
 * Close out the researched answer a reply came from, recording what was
 * actually sent next to what the engine proposed.
 *
 * Deliberately scoped to the NEWEST ready job rather than every ready row for
 * the number. More than one can exist: the webhook only suppresses a duplicate
 * job while an earlier one is `pending` or `running`, so a family who texts
 * again while a draft is awaiting review gets a second job, and the cron will
 * happily draft that one too. A blanket update would then stamp one reply's
 * text onto both, marking a question answered that was never answered and
 * corrupting the draft-vs-sent comparison for the older one.
 */
async function stampAnswerJobSent(
  db: ReturnType<typeof getServiceClient>,
  last10: string,
  sentBody: string,
  actor: string,
): Promise<void> {
  const { data: job } = await db
    .from("family_answer_jobs")
    .select("id")
    .eq("phone_last10", last10)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!job) return;

  const { error } = await db
    .from("family_answer_jobs")
    .update({
      status: "sent",
      sent_body: sentBody,
      sent_at: new Date().toISOString(),
      sent_by: actor,
    })
    .eq("id", job.id);
  if (error) console.error("[admin/sms-inbox/phone] answer job stamp failed:", error);
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

    const [inboundRes, dncRes, draftRes, packetRes, outboundLogRes] = await Promise.all([
      db
        .from("sms_inbound")
        .select("id, from_phone, body, keyword, profile_id, profile_type, display_name, handled_at, created_at")
        .eq("phone_last10", last10)
        .order("created_at", { ascending: true }),
      db.from("do_not_contact").select("id, reason, note").eq("phone", last10).limit(1).maybeSingle(),
      db.from("sms_drafts").select("body, updated_by, updated_at").eq("phone_last10", last10).maybeSingle(),
      // The most recent researched answer waiting on a human. Only `ready`
      // rows are surfaced: `pending`/`running` have nothing to show yet, and
      // `sent` is already answered.
      db
        .from("family_answer_jobs")
        .select("id, packet, created_at")
        .eq("phone_last10", last10)
        .eq("status", "ready")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Durable fallback for outbound-only conversations and for the moments
      // when Twilio history is unavailable. Benefits, navigator, acknowledgments,
      // and human admin replies all pass an emailType and therefore land here.
      db
        .from("email_log")
        .select(
          "id, resend_id, html_body, status, error_message, created_at, delivered_at, bounced_at, provider_id, recipient_type",
        )
        .eq("channel", "sms")
        .eq("recipient", e164)
        .order("created_at", { ascending: true })
        .limit(MAX_THREAD),
    ]);
    if (inboundRes.error) {
      console.error("[admin/sms-inbox/phone] inbound load failed:", inboundRes.error);
      return NextResponse.json({ error: inboundRes.error.message }, { status: 500 });
    }
    const inboundRows = inboundRes.data ?? [];
    const outboundLogRows = outboundLogRes.error ? [] : (outboundLogRes.data ?? []);
    if (outboundLogRes.error) {
      console.error("[admin/sms-inbox/phone] outbound log load failed:", outboundLogRes.error);
    }

    // Identity: take the most recent non-null resolution we have on file.
    const identified = [...inboundRows].reverse().find((r) => r.display_name || r.profile_type);
    const latestOutbound = outboundLogRows.at(-1);
    const resolvedProfileId = identified?.profile_id ?? latestOutbound?.provider_id ?? null;
    let resolvedDisplayName = identified?.display_name ?? null;
    let resolvedProfileType = identified?.profile_type ?? latestOutbound?.recipient_type ?? null;
    if (!resolvedDisplayName && resolvedProfileId) {
      const { data: profile, error: profileError } = await db
        .from("business_profiles")
        .select("display_name, type")
        .eq("id", resolvedProfileId)
        .maybeSingle();
      if (profileError) {
        console.error("[admin/sms-inbox/phone] profile identity load failed:", profileError);
      } else if (profile) {
        resolvedDisplayName = profile.display_name ?? null;
        resolvedProfileType ||= profile.type ?? null;
      }
    }

    const storedMessages = [
      ...inboundRows.map((row) => ({
        sid: `inbound:${row.id}`,
        direction: "in" as const,
        body: row.body,
        at: row.created_at,
        status: "received",
        errorCode: null,
      })),
      ...outboundLogRows.map((row) => ({
        sid: row.resend_id || `outbound:${row.id}`,
        direction: "out" as const,
        body: row.html_body || "SMS sent",
        at: row.created_at,
        status: row.delivered_at
          ? "delivered"
          : row.bounced_at || row.status === "failed"
            ? "failed"
            : row.status,
        errorCode: null,
      })),
    ].sort((a, b) => (a.at ?? "").localeCompare(b.at ?? ""));

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
        // A logged send can briefly precede Twilio's history visibility. Never
        // turn that propagation delay into an empty outbound-only thread.
        if (messages.length === 0 && storedMessages.length > 0) messages = storedMessages;
      } catch (err) {
        // A Twilio outage must not blank the page — we still have our own
        // inbound rows to show.
        console.error("[admin/sms-inbox/phone] Twilio history failed:", err);
        twilioError = "Twilio history is unavailable right now.";
        messages = storedMessages;
      }
    } else {
      twilioError = "Twilio is not configured.";
      messages = storedMessages;
    }

    return NextResponse.json({
      phone_last10: last10,
      e164,
      display_name: resolvedDisplayName,
      profile_type: resolvedProfileType,
      profile_id: resolvedProfileId,
      suppressed: Boolean(dncRes.data),
      suppression: dncRes.data ? { reason: dncRes.data.reason, note: dncRes.data.note } : null,
      unhandled: inboundRows.filter((r) => !r.handled_at).length,
      // Our stored copy — the durable record, and the only source if Twilio errors.
      inbound: inboundRows,
      messages,
      twilioError,
      // A draft read failure must never blank the conversation — the thread is
      // the point of the page, the unsent reply is an extra.
      draft: draftRes.error
        ? null
        : draftRes.data
          ? {
              body: draftRes.data.body,
              updated_by: draftRes.data.updated_by,
              updated_at: draftRes.data.updated_at,
            }
          : null,
      // Same rule as the draft: a packet read failure must not blank the
      // conversation. The researched answer is an aid, not the page.
      answerPacket:
        packetRes.error || !packetRes.data?.packet
          ? null
          : { jobId: packetRes.data.id, packet: packetRes.data.packet },
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
      const now = new Date().toISOString();
      const [inboundResult, jobsResult] = await Promise.all([
        db
          .from("sms_inbound")
          .update({ handled_at: now, handled_by: user.email ?? admin.id })
          .eq("phone_last10", last10)
          .is("handled_at", null),
        // Mark handled means the thread needs no drafted answer. Close pending,
        // running, and ready work together so the review card cannot survive
        // the message it was created for.
        db
          .from("family_answer_jobs")
          .update({ status: "skipped", completed_at: now })
          .eq("phone_last10", last10)
          .in("status", ["pending", "running", "ready"]),
      ]);
      const error = inboundResult.error ?? jobsResult.error;
      if (error) {
        console.error("[admin/sms-inbox/phone] mark_handled failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Park an unsent reply against the thread. Autosaved from the inbox as you
    // type, so this is deliberately cheap: upsert, no audit row (a keystroke
    // trail would bury real admin actions), and no effect on handled state —
    // writing a draft is not answering anyone.
    if (action === "save_draft") {
      const text = typeof body?.body === "string" ? body.body : "";
      // An empty draft is the absence of a draft, not a row holding "".
      if (!text.trim()) {
        const { error } = await db.from("sms_drafts").delete().eq("phone_last10", last10);
        if (error) {
          console.error("[admin/sms-inbox/phone] draft clear failed:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, draft: null });
      }
      if (text.length > MAX_BODY) {
        return NextResponse.json(
          { error: `Draft is too long (${MAX_BODY} characters max)` },
          { status: 400 },
        );
      }

      const updatedAt = new Date().toISOString();
      const { error } = await db.from("sms_drafts").upsert(
        {
          phone_last10: last10,
          body: text,
          updated_by: user.email ?? admin.id,
          updated_at: updatedAt,
        },
        { onConflict: "phone_last10" },
      );
      if (error) {
        console.error("[admin/sms-inbox/phone] draft save failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        draft: { body: text, updated_by: user.email ?? admin.id, updated_at: updatedAt },
      });
    }

    if (action === "discard_draft") {
      const { error } = await db.from("sms_drafts").delete().eq("phone_last10", last10);
      if (error) {
        console.error("[admin/sms-inbox/phone] draft discard failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, draft: null });
    }

    if (action === "reply") {
      const text = typeof body?.body === "string" ? body.body.trim() : "";
      if (!text) return NextResponse.json({ error: "Message body is required" }, { status: 400 });
      if (text.length > MAX_BODY) {
        return NextResponse.json(
          { error: `Message is too long (${MAX_BODY} characters max)` },
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

      // Carry the thread identity into email_log. Older admin replies omitted
      // both fields, which made the outbound ledger unable to say that Olera,
      // not the family, spoke last.
      const { data: recipientIdentity } = await db
        .from("sms_inbound")
        .select("profile_id, profile_type")
        .eq("phone_last10", last10)
        .not("profile_type", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const loggedRecipientType =
        recipientIdentity?.profile_type === "family" ||
        recipientIdentity?.profile_type === "provider" ||
        recipientIdentity?.profile_type === "caregiver"
          ? recipientIdentity.profile_type
          : undefined;

      const result = await sendSMS({
        to: toE164(last10),
        body: text,
        // Logged to email_log so a human reply appears alongside automated
        // sends in /admin/family-comms and counts toward the frequency cap.
        emailType: "admin_reply",
        recipientType: loggedRecipientType,
        recipientLogProfileId: recipientIdentity?.profile_id ?? undefined,
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

      // Answering the thread IS handling it. The draft has served its purpose
      // and must go with it, or the box refills with the message just sent the
      // next time the thread is opened. Awaited, not fire-and-forget: Vercel
      // kills pending promises once the response is returned.
      await Promise.all([
        db
          .from("sms_inbound")
          .update({ handled_at: new Date().toISOString(), handled_by: user.email ?? admin.id })
          .eq("phone_last10", last10)
          .is("handled_at", null),
        db.from("sms_drafts").delete().eq("phone_last10", last10),
        // Close out the researched answer this reply came from, and record what
        // was ACTUALLY sent alongside what the engine proposed. The difference
        // between packet.draft and sent_body is the cheapest honest signal of
        // whether the engine is any good, and it needs no extra instrumentation.
        stampAnswerJobSent(db, last10, text, user.email ?? admin.id),
      ]);

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
