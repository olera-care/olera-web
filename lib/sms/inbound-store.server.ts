import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Durable capture for inbound SMS (migration 166).
 *
 * The webhook's original storage path matched `type='family'` profiles only, so
 * a text from a provider or an unrecognized number was dropped on the floor.
 * Everything here is deliberately audience-agnostic: we store first and resolve
 * identity second, because an unidentified message is still a message.
 */

export type SenderType = "family" | "provider";

export interface ResolvedSender {
  profileId: string | null;
  profileType: SenderType | null;
  displayName: string | null;
}

function getServiceDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/** Last 10 digits — the thread key, and do_not_contact.phone's convention. */
export function phoneLast10(phone: string): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

/**
 * `olera-providers.phone` is stored uniformly as "(NNN) NNN-NNNN" across all
 * 107k rows, so we can rebuild that exact string and do an equality lookup
 * instead of scanning the directory to compare digits in JS.
 */
function toDirectoryFormat(last10: string): string {
  return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
}

/**
 * Who texted us? Families first — they are the audience with real accounts and
 * an active cascade, so a family match is the more meaningful one. Falls back to
 * the provider directory, then gives up: an unresolved sender is normal, not an
 * error, and must never block storage.
 */
export async function resolveSender(last10: string): Promise<ResolvedSender> {
  const empty: ResolvedSender = { profileId: null, profileType: null, displayName: null };
  const db = getServiceDb();
  if (!db) return empty;

  try {
    // Family profiles store phones in assorted formats with no normalized
    // column, so this filters in JS. Inbound volume is low enough that the
    // scan is acceptable (same tradeoff the webhook already documented).
    const { data: families } = await db
      .from("business_profiles")
      .select("id, phone, display_name, email")
      .eq("type", "family")
      .not("phone", "is", null);
    const family = (families ?? []).find(
      (r) => phoneLast10(String(r.phone ?? "")) === last10,
    );
    if (family) {
      return {
        profileId: family.id as string,
        profileType: "family",
        displayName: (family.display_name as string) || (family.email as string) || null,
      };
    }

    const { data: provider } = await db
      .from("olera-providers")
      .select("provider_id, provider_name")
      .eq("phone", toDirectoryFormat(last10))
      .limit(1)
      .maybeSingle();
    if (provider) {
      return {
        // provider_id is a slug, not a uuid — profile_id is uuid-typed, so the
        // directory match carries its name only. The phone remains the thread key.
        profileId: null,
        profileType: "provider",
        displayName: (provider.provider_name as string) || null,
      };
    }
  } catch (err) {
    console.error("[sms-inbound] Sender resolution failed:", err);
  }

  return empty;
}

/**
 * Persist one inbound message. Idempotent on twilio_sid so a Twilio webhook
 * retry doesn't duplicate the row.
 *
 * Returns the resolved sender so callers can reuse it (e.g. for a Slack ping)
 * without resolving twice.
 */
export async function storeInboundMessage(params: {
  twilioSid: string | null;
  fromPhone: string;
  body: string;
  keyword: string | null;
}): Promise<{ stored: boolean; sender: ResolvedSender }> {
  const last10 = phoneLast10(params.fromPhone);
  const sender = last10 ? await resolveSender(last10) : { profileId: null, profileType: null, displayName: null };
  const db = getServiceDb();
  if (!db || !last10) return { stored: false, sender };

  try {
    const { error } = await db.from("sms_inbound").insert({
      twilio_sid: params.twilioSid,
      from_phone: params.fromPhone,
      phone_last10: last10,
      body: params.body,
      keyword: params.keyword,
      profile_id: sender.profileId,
      profile_type: sender.profileType,
      display_name: sender.displayName,
    });
    if (error) {
      // 23505 = unique violation on twilio_sid, i.e. a Twilio retry. Expected.
      if (error.code === "23505") return { stored: false, sender };
      console.error("[sms-inbound] Insert failed:", error);
      return { stored: false, sender };
    }
    return { stored: true, sender };
  } catch (err) {
    console.error("[sms-inbound] Insert threw:", err);
    return { stored: false, sender };
  }
}

/**
 * Record an opt-out in do_not_contact, the cross-channel kill switch sendSMS
 * already consults (lib/twilio.ts). The webhook previously only set
 * phone_validity on matching FAMILY profiles, so a provider texting STOP was a
 * no-op — we re-texted one 11 days after they asked us to stop. Writing here
 * makes the opt-out audience-agnostic and enforced at the send path.
 */
export async function suppressPhone(
  phone: string,
  note: string,
): Promise<boolean> {
  const last10 = phoneLast10(phone);
  const db = getServiceDb();
  if (!db || !last10) return false;
  try {
    const { data: existing } = await db
      .from("do_not_contact")
      .select("id")
      .eq("phone", last10)
      .limit(1)
      .maybeSingle();
    if (existing) return true;

    const { error } = await db.from("do_not_contact").insert({
      // Stored as the last 10 digits — the format isPhoneDoNotContact() looks
      // up and the admin API writes. (The 128 migration comment claims E.164;
      // that comment is stale, the code is consistent on last-10.)
      phone: last10,
      reason: "sms_stop",
      note,
      created_by: "sms-webhook",
    });
    if (error) {
      // 23505 = another request suppressed this number between our check and
      // insert. The desired end state already holds.
      if (error.code === "23505") return true;
      console.error("[sms-inbound] do_not_contact insert failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[sms-inbound] do_not_contact insert threw:", err);
    return false;
  }
}

/** Remove a phone suppression when someone texts START/UNSTOP. */
export async function unsuppressPhone(phone: string): Promise<void> {
  const last10 = phoneLast10(phone);
  const db = getServiceDb();
  if (!db || !last10) return;
  try {
    // Only clear suppressions WE added from a STOP text. An admin-added
    // do-not-contact row (an angry provider, a legal request) must survive a
    // later "START" — that person asked a human to be left alone.
    await db.from("do_not_contact").delete().eq("phone", last10).eq("reason", "sms_stop");
  } catch (err) {
    console.error("[sms-inbound] do_not_contact delete threw:", err);
  }
}
