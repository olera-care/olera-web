import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getAuthUser, getAdminUser } from "@/lib/admin";

/**
 * SMS delivery health — the deliverability truth behind the "Text message
 * delivery" section on /admin/family-comms.
 *
 * Why a separate route (and not email_log): SMS sends log to email_log with
 * channel='sms' and status='sent', but "sent" only means Twilio ACCEPTED the
 * API call — it says nothing about whether the carrier delivered it. Before the
 * 10DLC campaign approved (2026-07-15), those rows read "sent" while the carrier
 * silently dropped ~80% (error 30034, unregistered A2P). So the only honest
 * source for delivered-vs-dropped is Twilio's Messages resource, which carries
 * the real carrier status + error code. This route reads it directly.
 *
 * Scope: every outbound SMS from our A2P sender number — both family reply-alerts
 * (provider_reach_out / connection_response) and provider new-inquiry alerts.
 * They share one number + one 10DLC campaign, so delivery health is one story.
 *
 * GET-only, admin-guarded, browser-triggerable (the WAF blocks curl).
 * Query: ?date_from=ISO&date_to=ISO  (default: last 30 days).
 */

export const maxDuration = 30;

const DAY = 24 * 60 * 60 * 1000;

// Human labels for the Twilio SMS error codes we actually see, plus the ones
// worth naming if they show up. https://www.twilio.com/docs/api/errors
const ERROR_LABELS: Record<number, string> = {
  30003: "Unreachable handset",
  30004: "Message blocked",
  30005: "Unknown / disconnected number",
  30006: "Landline or unreachable carrier",
  30007: "Carrier filtered (spam)",
  30008: "Unknown carrier error",
  30034: "Unregistered A2P (pre-10DLC)",
  30410: "Carrier delivery timeout",
  21610: "Recipient opted out (STOP)",
};

// Failure buckets — the operator question isn't "which code" but "whose fault":
//   registration → OUR problem (should be ~0 now that 10DLC is approved)
//   badNumber    → DATA problem (directory-scraped landlines / dead numbers)
//   optOut       → expected + healthy (a STOP we must honor)
//   filtered     → content/reputation problem worth watching
//   other        → everything else
const BUCKET_OF: Record<number, "registration" | "badNumber" | "optOut" | "filtered" | "other"> = {
  30034: "registration",
  30003: "badNumber",
  30005: "badNumber",
  30006: "badNumber",
  21610: "optOut",
  30007: "filtered",
};

function last4(phone: string | null | undefined): string {
  const d = (phone || "").replace(/\D/g, "");
  return d.length >= 4 ? d.slice(-4) : "????";
}

function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    // Not an error — the panel renders a "not configured" empty state.
    return NextResponse.json({ configured: false });
  }

  const now = Date.now();
  const dateFrom = request.nextUrl.searchParams.get("date_from");
  const dateTo = request.nextUrl.searchParams.get("date_to");
  const fromMs = dateFrom ? Date.parse(dateFrom) : now - 30 * DAY;
  const toMs = dateTo ? Date.parse(dateTo) : now;

  const client = twilio(sid, token);
  const LIMIT = 2000;
  let messages;
  try {
    messages = await client.messages.list({
      from,
      dateSentAfter: new Date(fromMs),
      dateSentBefore: new Date(toMs),
      limit: LIMIT,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio query failed";
    console.error("[sms-delivery] Twilio list failed:", message);
    return NextResponse.json({ configured: true, error: message }, { status: 502 });
  }

  // ── Aggregate ─────────────────────────────────────────────────────────────
  let delivered = 0, undelivered = 0, failed = 0, sentUnconfirmed = 0, inFlight = 0;
  const buckets = { registration: 0, badNumber: 0, optOut: 0, filtered: 0, other: 0 };
  const byErrorMap = new Map<number, number>();
  const daily = new Map<string, { sent: number; delivered: number; undelivered: number; failed: number }>();

  // Seed every day in the window so the trend has no gaps (a missing day is 0,
  // not absent — the sparkline reads honestly at low volume).
  for (let t = fromMs; t <= toMs; t += DAY) daily.set(dayKey(new Date(t)), { sent: 0, delivered: 0, undelivered: 0, failed: 0 });

  const recent = messages
    .slice()
    .sort((a, b) => {
      const ta = (a.dateSent || a.dateCreated)?.getTime() || 0;
      const tb = (b.dateSent || b.dateCreated)?.getTime() || 0;
      return tb - ta;
    })
    .slice(0, 20)
    .map((m) => {
      const code = m.errorCode ?? null;
      return {
        ts: (m.dateSent || m.dateCreated)?.toISOString() || null,
        toLast4: last4(m.to),
        status: m.status,
        errorCode: code,
        errorLabel: code != null ? ERROR_LABELS[code] || `Error ${code}` : null,
      };
    });

  for (const m of messages) {
    const status = m.status;
    const code = m.errorCode ?? null;
    const when = m.dateSent || m.dateCreated;
    const bucketDay = when ? daily.get(dayKey(when)) : undefined;

    if (status === "delivered") {
      delivered++;
      if (bucketDay) bucketDay.delivered++;
    } else if (status === "undelivered") {
      undelivered++;
      if (bucketDay) bucketDay.undelivered++;
    } else if (status === "failed") {
      failed++;
      if (bucketDay) bucketDay.failed++;
    } else if (status === "sent") {
      // Carrier accepted, no delivery receipt returned — final-ish but unconfirmed.
      sentUnconfirmed++;
    } else {
      // queued / sending / accepted / scheduled — still moving.
      inFlight++;
    }
    if (bucketDay) bucketDay.sent++;

    if ((status === "undelivered" || status === "failed") && code != null) {
      byErrorMap.set(code, (byErrorMap.get(code) || 0) + 1);
      buckets[BUCKET_OF[code] || "other"]++;
    } else if (status === "undelivered" || status === "failed") {
      buckets.other++;
    }
  }

  const terminal = delivered + undelivered + failed;
  const deliveredRate = terminal > 0 ? delivered / terminal : 0;

  const byError = Array.from(byErrorMap.entries())
    .map(([code, count]) => ({ code, label: ERROR_LABELS[code] || `Error ${code}`, count }))
    .sort((a, b) => b.count - a.count);

  const dailyArr = Array.from(daily.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, ...v }));

  return NextResponse.json({
    configured: true,
    range: { from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString() },
    generatedAt: new Date(now).toISOString(),
    senderLast4: last4(from),
    totals: {
      total: messages.length,
      delivered,
      undelivered,
      failed,
      sentUnconfirmed,
      inFlight,
    },
    deliveredRate,
    buckets,
    byError,
    recent,
    daily: dailyArr,
    truncated: messages.length >= LIMIT,
  });
}
