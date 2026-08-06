import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { normalizeUSPhone } from "@/lib/twilio";
import { smsHelpReply } from "@/lib/sms/templates";
import { interpretBenefitsSmsReply } from "@/lib/family-comms/benefits-sms-replies.server";
import { readBenefitsCascade } from "@/lib/family-comms/benefits-cascade.server";

/**
 * POST /api/sms/webhook
 *
 * Inbound SMS handler for care-seeker texting. Twilio posts here on every reply
 * to our number. We use it for TCPA opt-out/opt-in + HELP:
 *
 *   STOP / STOPALL / UNSUBSCRIBE / CANCEL / END / QUIT → opt out
 *     → set phone_validity='opted_out' on the matching family profile(s).
 *   START / UNSTOP / YES → opt back in (clear opted_out).
 *   HELP / INFO → reply with a one-line help message.
 *
 * Twilio's carrier-level Advanced Opt-Out may also auto-handle STOP/START/HELP;
 * recording it here keeps OUR send path honest regardless (sendSMS callers check
 * phone_validity before texting). Verifies X-Twilio-Signature. Always 200s with
 * TwiML so Twilio doesn't retry.
 *
 * NOTE: matching phone → profile scans family profiles and filters in JS because
 * stored phone formats vary and we have no normalized-phone column. Inbound
 * opt-out volume is low, so this is acceptable; revisit if it grows.
 */

const OPT_OUT_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const OPT_IN_KEYWORDS = new Set(["START", "UNSTOP", "YES"]);
const HELP_KEYWORDS = new Set(["HELP", "INFO"]);

const HELP_REPLY = smsHelpReply();

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function twiml(message?: string) {
  const body = message
    ? `<Response><Message>${escapeXml(message)}</Message></Response>`
    : "<Response/>";
  return new NextResponse(body, { status: 200, headers: { "Content-Type": "text/xml" } });
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string)
  );
}

function buildWebhookUrl(request: NextRequest): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (siteUrl) {
    const base = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    return `${base}/api/sms/webhook`;
  }
  return request.url;
}

/** Last 10 digits of a phone, for format-agnostic matching. */
function last10(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

/** Family profiles whose phone matches, format-agnostic. */
async function matchFamilyProfiles(
  phone: string,
): Promise<{ id: string; display_name: string | null; email: string | null; metadata: Record<string, unknown> }[]> {
  const db = getServiceDb();
  if (!db) return [];
  const target = last10(phone);
  if (!target) return [];
  const { data: rows } = await db
    .from("business_profiles")
    .select("id, phone, display_name, email, metadata")
    .eq("type", "family")
    .not("phone", "is", null);
  return (rows ?? []).filter((r) => last10(String(r.phone ?? "")) === target) as never;
}

/**
 * Persist an inbound text on the matched profile(s) so the case timeline can
 * tell the story (metadata.sms_inbound, capped at 20). A family texting back
 * is the highest-intent signal we get — it must never evaporate.
 */
async function recordInbound(
  phone: string,
  body: string,
  keyword: string | null,
  alertUnstructured = false,
): Promise<{ response?: string; structured: boolean }> {
  const db = getServiceDb();
  if (!db) return { structured: false };
  const profiles = await matchFamilyProfiles(phone);
  const at = new Date().toISOString();
  let response: string | undefined;
  let structured = false;
  let humanAlert: string | null = null;
  for (const p of profiles) {
    const meta = p.metadata || {};
    const inbound = Array.isArray(meta.sms_inbound) ? (meta.sms_inbound as unknown[]) : [];
    const isBenefitsFamily = Boolean(
      meta.benefits_results || meta.benefits_cascade || meta.benefits_navigator,
    );
    const benefitsReply = keyword && isBenefitsFamily
      ? interpretBenefitsSmsReply(keyword, readBenefitsCascade(meta), at)
      : null;
    if (benefitsReply) {
      structured = true;
      response ||= benefitsReply.response;
      if (benefitsReply.needsHuman) humanAlert = benefitsReply.label;
    }
    // Store a keyword only when it has semantic meaning. The normalized
    // parser token for an ordinary sentence ("I can't find the form" →
    // ICANTFINDTHEFORM) must not hide the real body from the admin's free-form
    // reply chip and timeline.
    const storedKeyword = benefitsReply ? keyword : alertUnstructured ? null : keyword;
    await db
      .from("business_profiles")
      .update({
        metadata: {
          ...meta,
          sms_inbound: [...inbound, { at, body: body.slice(0, 500), keyword: storedKeyword }].slice(-20),
          ...(benefitsReply ? { benefits_cascade: benefitsReply.cascade } : {}),
        },
      })
      .eq("id", p.id);
  }
  // A free-form reply or an explicit STUCK reply deserves a human. Other
  // structured updates move the plan forward without creating queue noise.
  if (((alertUnstructured && !structured) || humanAlert) && profiles.length > 0) {
    try {
      const { sendSlackAlert } = await import("@/lib/slack");
      const who = profiles[0].display_name || profiles[0].email || phone;
      await sendSlackAlert(
        humanAlert
          ? `Benefits family needs help: ${who} ${humanAlert}. Reply from the Benefits queue (/admin/benefits)`
          : `Family texted back: ${who}: "${body.slice(0, 300)}" - reply from the Benefits queue (/admin/benefits)`,
      );
    } catch (err) {
      console.error("[sms-webhook] Slack ping failed:", err);
    }
  }
  return { response, structured };
}

/** Set phone_validity for every family profile whose phone matches `phone`. */
async function setFamilyPhoneValidity(
  phone: string,
  validity: "opted_out" | "unverified"
): Promise<number> {
  const db = getServiceDb();
  if (!db) return 0;
  const target = last10(phone);
  if (!target) return 0;

  const { data: rows, error } = await db
    .from("business_profiles")
    .select("id, phone")
    .eq("type", "family")
    .not("phone", "is", null);
  if (error || !rows) return 0;

  const ids = rows.filter((r) => last10(String(r.phone ?? "")) === target).map((r) => r.id);
  if (ids.length === 0) return 0;

  await db.from("business_profiles").update({ phone_validity: validity }).in("id", ids);
  return ids.length;
}

export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("[sms-webhook] TWILIO_AUTH_TOKEN not configured");
    return twiml();
  }

  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const signature = request.headers.get("x-twilio-signature") || "";
  const url = buildWebhookUrl(request);
  if (!twilio.validateRequest(authToken, signature, url, params)) {
    console.error("[sms-webhook] Invalid Twilio signature");
    return new NextResponse("<Response/>", { status: 403, headers: { "Content-Type": "text/xml" } });
  }

  const from = (params.From || "").trim();
  const normalizedFrom = normalizeUSPhone(from) ?? from;
  const keyword = (params.Body || "").trim().toUpperCase().replace(/[^A-Z]/g, "");

  try {
    if (OPT_OUT_KEYWORDS.has(keyword)) {
      const n = await setFamilyPhoneValidity(normalizedFrom, "opted_out");
      await recordInbound(normalizedFrom, params.Body || keyword, keyword);
      console.log(`[sms-webhook] STOP from ${normalizedFrom} → opted_out ${n} profile(s)`);
      return twiml(); // Twilio sends the carrier opt-out confirmation.
    }
    if (OPT_IN_KEYWORDS.has(keyword)) {
      const n = await setFamilyPhoneValidity(normalizedFrom, "unverified");
      await recordInbound(normalizedFrom, params.Body || keyword, keyword);
      console.log(`[sms-webhook] START from ${normalizedFrom} → cleared ${n} profile(s)`);
      return twiml();
    }
    if (HELP_KEYWORDS.has(keyword)) {
      await recordInbound(normalizedFrom, params.Body || keyword, keyword);
      return twiml(HELP_REPLY);
    }
    // Benefits progress replies update the living plan and receive an
    // immediate receipt. Unrecognized replies remain human-routed below.
    if ((params.Body || "").trim()) {
      const recorded = await recordInbound(normalizedFrom, params.Body.trim(), keyword, true);
      if (recorded.structured) return twiml(recorded.response);
    }
  } catch (err) {
    console.error("[sms-webhook] Error handling inbound:", err);
  }

  return twiml();
}
