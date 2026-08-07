import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createTwilioClient } from "@/lib/twilio";

/**
 * Is this number capable of receiving SMS? (migration 167)
 *
 * Provider phones come from the `olera-providers` directory — scraped business
 * numbers, mostly front-desk landlines and office VoIP. Texting them produces
 * Twilio error 30006 and nothing else. That was ~68% of our provider alerts.
 *
 * Only `mobile` passes. Evidence (n=36 against real send outcomes): every
 * number that ever delivered was mobile; failures were fixedVoip, nonFixedVoip,
 * landline, and one mobile. nonFixedVoip is blocked despite Google Voice being
 * technically SMS-capable, because 5 of 5 sampled failed and none delivered.
 *
 * FAILS OPEN. Any error — Twilio down, no config, DB blip — returns true and
 * the send proceeds. Matching lib/do-not-contact.ts: a transient fault must
 * never silently mute provider notifications. The cost of a wrong "yes" is one
 * failed text; the cost of a wrong "no" is a provider never hearing about a
 * family.
 */

const SMS_CAPABLE_LINE_TYPES = new Set(["mobile"]);

/** Twilio error codes that prove a number cannot receive SMS. */
export const UNREACHABLE_ERROR_CODES = new Set(["30003", "30005", "30006"]);

function getServiceDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function last10(phone: string): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

/**
 * Record an outcome we already know, without paying for a lookup.
 *
 * `send_history` beats `lookup` because it is an observation rather than a
 * prediction, so it overwrites an existing row. A `lookup` row never downgrades
 * a `send_history` one.
 */
export async function recordLineType(params: {
  phone: string;
  smsCapable: boolean;
  lineType?: string | null;
  carrier?: string | null;
  source: "lookup" | "send_history";
}): Promise<void> {
  const key = last10(params.phone);
  const db = getServiceDb();
  if (!db || !key) return;
  try {
    if (params.source === "lookup") {
      const { data: existing } = await db
        .from("phone_line_types")
        .select("source")
        .eq("phone_last10", key)
        .limit(1)
        .maybeSingle();
      if (existing?.source === "send_history") return;
    }
    await db.from("phone_line_types").upsert(
      {
        phone_last10: key,
        line_type: params.lineType ?? null,
        carrier: params.carrier ?? null,
        sms_capable: params.smsCapable,
        source: params.source,
        checked_at: new Date().toISOString(),
      },
      { onConflict: "phone_last10" },
    );
  } catch (err) {
    console.error("[line-type] Failed to record:", err);
  }
}

/**
 * True if we should attempt an SMS to this number.
 *
 * Cache hit → answer immediately. Cache miss → one Twilio Lookup
 * (~$0.008, cached permanently), then answer.
 */
export async function isSmsCapable(phone: string): Promise<boolean> {
  const key = last10(phone);
  if (!key) return true; // Unparseable — let the existing send path fail normally.

  const db = getServiceDb();
  if (!db) return true;

  try {
    const { data: cached } = await db
      .from("phone_line_types")
      .select("sms_capable")
      .eq("phone_last10", key)
      .limit(1)
      .maybeSingle();
    if (cached) return cached.sms_capable;
  } catch (err) {
    console.error("[line-type] Cache read failed (sending anyway):", err);
    return true;
  }

  const client = createTwilioClient();
  if (!client) return true;

  try {
    const result = await client.lookups.v2
      .phoneNumbers(`+1${key}`)
      .fetch({ fields: "line_type_intelligence" });
    const intel = result.lineTypeIntelligence as
      | { type?: string; carrier_name?: string }
      | undefined;
    const lineType = intel?.type ?? null;

    // An absent/unknown type is not evidence of incapacity — send.
    if (!lineType || lineType === "unknown") {
      await recordLineType({ phone: key, smsCapable: true, lineType, source: "lookup" });
      return true;
    }

    const capable = SMS_CAPABLE_LINE_TYPES.has(lineType);
    await recordLineType({
      phone: key,
      smsCapable: capable,
      lineType,
      carrier: intel?.carrier_name ?? null,
      source: "lookup",
    });
    return capable;
  } catch (err) {
    console.error("[line-type] Lookup failed (sending anyway):", err);
    return true;
  }
}
