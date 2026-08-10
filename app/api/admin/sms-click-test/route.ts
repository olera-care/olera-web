import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { generateBenefitsToken } from "@/lib/benefits-token";
import { sendSMS, normalizeUSPhone } from "@/lib/twilio";
import { withSmsSource, SMS_CLICK_TEST_TYPE } from "@/lib/sms/click-source";

/**
 * GET /api/admin/sms-click-test — end-to-end self-check for text click tracking.
 *
 * The pipeline has two halves that had never met: a text goes out carrying a
 * tagged link, and an arrival on /m/{token} stamps first_clicked_at on the send
 * it came from. Each was verified alone; nothing had exercised both on a real
 * request. Verifying by hand meant editing a URL and reading a database column,
 * which is not a test anyone will repeat.
 *
 * modes:
 *   open   (default) — log a test send, then redirect the browser straight at
 *                      the tagged link. One click, no phone needed.
 *   sms    — same, but actually text the link, so Twilio and the handset are in
 *            the loop too. Costs one message.
 *   status — JSON: did the most recent test send get clicked, and how fast.
 *
 * GET throughout, and every mode reachable by typing a URL, because the admin
 * surfaces here are driven from a browser rather than curl (the WAF blocks
 * curl, and TJ is not going to run a shell to check a checkbox).
 *
 * Everything is logged under its own email_type, which belongs to no cron job,
 * so a self-check can never move a real automation's numbers.
 */

export const dynamic = "force-dynamic";

/** The profile a test send is attributed to. Any real family would have their
 *  own stats polluted by our click, so the check needs a profile of its own. */
async function resolveTestProfile(db: ReturnType<typeof getServiceClient>) {
  // Prefer an explicitly-named test profile; fall back to any profile owned by
  // an olera address. Never picks an arbitrary real family.
  const { data } = await db
    .from("business_profiles")
    .select("*")
    .ilike("display_name", "%test%")
    .limit(1);
  if (data?.[0]) return data[0] as { id: string; display_name: string | null };
  const { data: mine } = await db
    .from("business_profiles")
    .select("*")
    .ilike("email", "%tfalohun%")
    .limit(1);
  return (mine?.[0] as { id: string; display_name: string | null }) ?? null;
}

/** Find or create a plan token for the test profile, so the link resolves to a
 *  real page rather than a 404 (the click is only recorded once /m/ renders). */
async function resolveTestToken(
  db: ReturnType<typeof getServiceClient>,
  profileId: string,
): Promise<string | null> {
  const { data: existing } = await db
    .from("benefits_results_tokens")
    .select("token")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.token) return existing.token;

  const token = generateBenefitsToken();
  const { error } = await db.from("benefits_results_tokens").insert({
    token,
    profile_id: profileId,
    care_need: "payingForCare",
    state_code: "TX",
    match_count: 0,
  });
  if (error) {
    console.error("[sms-click-test] token create failed:", error.message);
    return null;
  }
  return token;
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://olera.care")
  );
}

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "open";
  const db = getServiceClient();

  const profile = await resolveTestProfile(db);
  if (!profile) {
    return NextResponse.json(
      { error: "No test profile available. Create a profile with 'test' in the name first." },
      { status: 400 },
    );
  }

  // ── status: report on the newest test send ──
  if (mode === "status") {
    const { data: row } = await db
      .from("email_log")
      .select("id, created_at, first_clicked_at, recipient, resend_id, delivered_at")
      .eq("channel", "sms")
      .eq("email_type", SMS_CLICK_TEST_TYPE)
      .eq("provider_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!row) return NextResponse.json({ state: "none" });
    const secondsToClick = row.first_clicked_at
      ? Math.round((Date.parse(row.first_clicked_at) - Date.parse(row.created_at)) / 1000)
      : null;
    return NextResponse.json({
      state: row.first_clicked_at ? "clicked" : "waiting",
      sentAt: row.created_at,
      clickedAt: row.first_clicked_at,
      secondsToClick,
      sentTo: row.recipient,
      // Only present for mode=sms — a redirect test never touches Twilio.
      hasSid: !!row.resend_id,
      deliveredAt: row.delivered_at,
    });
  }

  const token = await resolveTestToken(db, profile.id);
  if (!token) {
    return NextResponse.json({ error: "Could not create a test plan token" }, { status: 500 });
  }
  const tagged = withSmsSource(`${siteUrl()}/m/${token}`, SMS_CLICK_TEST_TYPE);

  // ── sms: the full chain, Twilio and handset included ──
  if (mode === "sms") {
    const raw = url.searchParams.get("to");
    const to = raw ? normalizeUSPhone(raw) : null;
    if (!to) {
      return NextResponse.json(
        { error: "Pass ?to=<your mobile number> to send the test text." },
        { status: 400 },
      );
    }
    // sendSMS logs the row itself, with the Twilio SID, so delivery is tracked
    // on this check exactly as it is on a real send.
    const result = await sendSMS({
      to,
      body: `Olera click-tracking self-check. Tap to confirm it registers: ${tagged}`,
      emailType: SMS_CLICK_TEST_TYPE,
      recipientType: "admin",
      recipientLogProfileId: profile.id,
      metadata: { sms_click_test: true },
    });
    if (!result.success || result.skipped) {
      return NextResponse.json(
        { error: `Test text not sent: ${result.error || "suppressed"}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ success: true, sentTo: to, url: tagged });
  }

  // ── open (default): log the send, then hand the browser the tagged link ──
  // The row must exist BEFORE the redirect: recordSmsClick stamps the newest
  // send of this type, so arriving with nothing logged would find no row and
  // silently record nothing — the check would fail for the wrong reason.
  const { error: logErr } = await db.from("email_log").insert({
    channel: "sms",
    recipient: "self-check (no message sent)",
    sender: "admin-self-check",
    subject: `SMS: ${SMS_CLICK_TEST_TYPE}`,
    email_type: SMS_CLICK_TEST_TYPE,
    recipient_type: "admin",
    provider_id: profile.id,
    status: "sent",
    html_body: `Self-check link: ${tagged}`,
    metadata: { sms_click_test: true, mode: "open" },
  });
  if (logErr) {
    return NextResponse.json({ error: `Could not log test send: ${logErr.message}` }, { status: 500 });
  }
  return NextResponse.redirect(tagged, 302);
}
