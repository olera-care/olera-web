/**
 * The families a provider's campaign produced, each with a status — server only.
 *
 * This is the list on a provider's campaign page and the single count of
 * "families" every provider-facing surface should show. Two doors feed it:
 *
 *   - Form leads: city leads from an ad that belongs to her campaign, once
 *     handed to her (city_leads.handed_request_id, see
 *     lib/city-ads/primary.server.ts).
 *   - Page inquiries: families who asked through her Olera page after arriving
 *     from one of her ads (a tagged lead_received with a connection).
 *
 * Every status is set by something the system knows, never by our opinion:
 *   replied        answered our text and the classifier reads a family seeking
 *                  care, or wrote to her through her page
 *   warming        our text reached them and they have not answered yet
 *   hard_to_reach  Twilio could not deliver our text (landline, phone off)
 * Screened-out leads (job seekers, spam) are never listed. They are counted, so
 * she can see we filtered them.
 *
 * No dollar figure is read or returned here, by design.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { BLOCKING_CATEGORIES } from "@/lib/city-ads/classify.server";

export type FamilyStatus = "replied" | "warming" | "hard_to_reach";
export type FamilyOutcome = "talking" | "client" | "no";

export interface CampaignFamily {
  /** city_leads.id for a form lead, connections.id for a page inquiry. */
  id: string;
  kind: "form" | "page";
  firstName: string;
  phone: string | null;
  email: string | null;
  arrivedAt: string;
  status: FamilyStatus;
  /** One plain sentence: what we know and what to do. */
  note: string;
  /** Where they came from, as she would say it. */
  source: string;
  outcome: FamilyOutcome | null;
  /** The family's own latest words to us or to her, when they have written any. */
  words: string | null;
  /** How far she has got with them: nothing yet, a message sent, or an outcome recorded. */
  contact: "none" | "messaged" | "talked";
  /**
   * How a message from her reaches them. "text": our texts get through.
   * "email": texts fail but we have an email. "call": neither, so calling is
   * the only way in. "inbox": a page inquiry, answered in Messages.
   */
  reach: "text" | "email" | "call" | "inbox";
}

export interface CampaignFamilies {
  families: CampaignFamily[];
  counts: Record<FamilyStatus, number>;
  screenedOut: number;
}

interface RequestForFamilies {
  id: string;
  campaign_tag: string | null;
  flight_start_date: string | null;
  requested_setup_week: string | null;
  created_at: string;
}

/** After this long without an answer, "warming" reads as "no reply yet". */
const QUIET_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

function firstNameOf(raw: string | null | undefined): string {
  const first = String(raw ?? "").trim().split(/\s+/)[0] ?? "";
  if (!first) return "A family";
  // Forms arrive as "KATHERINE" or "katherine" as often as "Katherine".
  const word = first === first.toUpperCase() || first === first.toLowerCase() ? first.toLowerCase() : first;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function excerpt(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function parseJson(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function asOutcome(v: unknown): FamilyOutcome | null {
  return v === "talking" || v === "client" || v === "no" ? v : null;
}

export async function getCampaignFamilies(
  db: SupabaseClient,
  request: RequestForFamilies,
  providerIdVariants: string[],
): Promise<CampaignFamilies> {
  const families: CampaignFamily[] = [];

  // ── Form leads handed to this campaign ──────────────────────────────────
  const { data: handed } = await db
    .from("city_leads")
    .select(
      "id, first_name, phone, email, created_at, handed_at, archived_at, qualification_verdict, qualification_reply, outcome, is_test",
    )
    .eq("handed_request_id", request.id)
    .eq("is_test", false)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  const leads = (handed ?? []) as Array<{
    id: string;
    first_name: string | null;
    phone: string | null;
    email: string | null;
    created_at: string;
    handed_at: string | null;
    qualification_verdict: string | null;
    qualification_reply: string | null;
    outcome: string | null;
  }>;

  // What happened to the texts we sent each of them. Twilio's delivery
  // receipts land in email_log (app/api/sms/status), keyed by lead_id.
  const delivery = new Map<string, { delivered: number; failed: number; code: string | null }>();
  if (leads.length) {
    const { data: logs } = await db
      .from("email_log")
      .select("metadata, status, delivered_at, error_message, email_type")
      .like("email_type", "city_lead%")
      .like("recipient", "+%")
      .in(
        "metadata->>lead_id",
        leads.map((l) => l.id),
      );
    for (const row of (logs ?? []) as Array<{
      metadata: Record<string, unknown> | null;
      status: string | null;
      delivered_at: string | null;
      error_message: string | null;
    }>) {
      const leadId = str(row.metadata?.lead_id);
      if (!leadId) continue;
      const d = delivery.get(leadId) ?? { delivered: 0, failed: 0, code: null };
      if (row.delivered_at) d.delivered++;
      if (row.status === "failed") {
        d.failed++;
        const m = /error (\d{5})/.exec(row.error_message ?? "");
        if (m) d.code = m[1];
      }
      delivery.set(leadId, d);
    }
  }

  // Anyone who has written to her since the hand-over, on the page or by
  // text. Without this a family mid-conversation still read "no reply yet".
  const wroteBack = new Set<string>();
  // Their latest words, and whether she has written to them yet.
  const latestWords = new Map<string, { text: string; at: string }>();
  const messaged = new Set<string>();
  const noteWords = (id: string, text: string | null | undefined, at: string) => {
    const t = (text ?? "").trim();
    if (!t) return;
    const prev = latestWords.get(id);
    if (!prev || at > prev.at) latestWords.set(id, { text: t, at });
  };
  if (leads.length) {
    const { data: typed } = await db
      .from("city_lead_thread")
      .select("lead_id, author, body, created_at")
      .in(
        "lead_id",
        leads.map((l) => l.id),
      );
    for (const t of (typed ?? []) as Array<{ lead_id: string; author: string; body: string; created_at: string }>) {
      if (t.author === "family") {
        wroteBack.add(t.lead_id);
        noteWords(t.lead_id, t.body, t.created_at);
      } else if (t.author === "provider") {
        messaged.add(t.lead_id);
      }
    }
    const byPhone = new Map<string, { id: string; since: string; created: string }>();
    for (const l of leads) {
      const key = (l.phone ?? "").replace(/\D/g, "").slice(-10);
      if (key.length === 10 && l.handed_at) byPhone.set(key, { id: l.id, since: l.handed_at, created: l.created_at });
    }
    if (byPhone.size) {
      const { data: texts } = await db
        .from("sms_inbound")
        .select("phone_last10, created_at, keyword, body")
        .in("phone_last10", Array.from(byPhone.keys()));
      // Answers to our own "reply 1 or 2" check are not the family writing to
      // her, so they do not count.
      const CHECK_ANSWER = /^\s*(1|2|3|y|n|yes|no|yep|nope|not yet)\s*[.!]?\s*$/i;
      for (const t of (texts ?? []) as Array<{ phone_last10: string; created_at: string; keyword: string | null; body: string | null }>) {
        const hit = byPhone.get(t.phone_last10);
        if (!hit || t.keyword || CHECK_ANSWER.test(t.body ?? "")) continue;
        if (t.created_at > hit.created) noteWords(hit.id, t.body, t.created_at);
        if (t.created_at > hit.since) wroteBack.add(hit.id);
      }
    }
  }

  const now = Date.now();
  for (const l of leads) {
    const d = delivery.get(l.id);
    let status: FamilyStatus;
    let note: string;
    if (wroteBack.has(l.id)) {
      status = "replied";
      note = "Wrote back. Their message is under Conversation.";
    } else if (l.qualification_verdict === "care_seeker") {
      status = "replied";
      note = l.qualification_reply
        ? `Answered our text: “${excerpt(l.qualification_reply)}”`
        : "Answered our text as a family looking for care.";
    } else if (d && d.failed > 0 && d.delivered === 0) {
      status = "hard_to_reach";
      note =
        d.code === "30006"
          ? "Landline. Texts don't reach it, so call."
          : l.email
            ? "Our texts didn't reach this phone. Try a call, or email."
            : "Our texts didn't reach this phone. Try a call.";
    } else {
      status = "warming";
      const quiet = now - new Date(l.created_at).getTime() > QUIET_AFTER_MS;
      note = quiet
        ? "No reply to our texts yet. Worth a call."
        : d && d.delivered > 0
          ? "We texted to confirm what they need. No reply yet. Their number works."
          : "We texted to confirm what they need. No reply yet.";
    }
    const outcome = asOutcome(l.outcome);
    const textsFail = !!d && d.failed > 0 && d.delivered === 0;
    families.push({
      id: l.id,
      kind: "form",
      firstName: firstNameOf(l.first_name),
      phone: l.phone,
      email: l.email,
      arrivedAt: l.created_at,
      status,
      note,
      source: "Filled in your Facebook form",
      outcome,
      words: latestWords.get(l.id)?.text ?? (l.qualification_reply?.trim() || null),
      contact: outcome ? "talked" : messaged.has(l.id) ? "messaged" : "none",
      reach: !textsFail ? "text" : l.email ? "email" : "call",
    });
  }

  // ── Page inquiries from her ads ─────────────────────────────────────────
  const tag = request.campaign_tag || request.id;
  const since = new Date(
    request.flight_start_date || request.requested_setup_week || request.created_at,
  ).toISOString();
  const { data: events } = await db
    .from("provider_activity")
    .select("metadata, created_at")
    .in("provider_id", providerIdVariants)
    .eq("event_type", "lead_received")
    .eq("metadata->>utm_campaign", tag)
    .gte("created_at", since);
  const connectionIds = Array.from(
    new Set(
      ((events ?? []) as Array<{ metadata: Record<string, unknown> | null }>)
        .map((e) => str(e.metadata?.connection_id))
        .filter((id): id is string => !!id),
    ),
  );
  if (connectionIds.length) {
    const { data: conns } = await db
      .from("connections")
      .select("id, from_profile_id, message, metadata, created_at")
      .in("id", connectionIds);
    for (const c of (conns ?? []) as Array<{
      id: string;
      from_profile_id: string | null;
      message: unknown;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>) {
      const msg = parseJson(c.message);
      const thread = Array.isArray(c.metadata?.thread) ? (c.metadata!.thread as Array<Record<string, unknown>>) : [];
      const familyWrote =
        !!str(msg.message) ||
        thread.some((t) => t.from_profile_id === c.from_profile_id && !t.type && !!str(t.text));
      const phone = str(msg.seeker_phone);
      const email = str(msg.seeker_email);
      const providerOutcome = parseJson(c.metadata?.provider_outcome);
      const familyLines = thread.filter((t) => t.from_profile_id === c.from_profile_id && !t.type && !!str(t.text));
      const providerWrote = thread.some((t) => t.from_profile_id && t.from_profile_id !== c.from_profile_id && !t.type);
      const pageOutcome = asOutcome(providerOutcome.value);
      families.push({
        id: c.id,
        kind: "page",
        firstName: firstNameOf(str(msg.seeker_first_name) ?? null),
        phone,
        email,
        arrivedAt: c.created_at,
        status: familyWrote ? "replied" : "warming",
        note: familyWrote
          ? "Wrote to you through your Olera page. Their message is in Messages."
          : phone
            ? "Asked through your Olera page. No message yet."
            : "Asked through your Olera page. Left an email, no phone.",
        source: "Asked on your Olera page",
        outcome: pageOutcome,
        words: str(familyLines[familyLines.length - 1]?.text) ?? str(msg.message),
        contact: pageOutcome ? "talked" : providerWrote ? "messaged" : "none",
        reach: "inbox",
      });
    }
  }

  // ── Screened out: from her ads, filed as not a family ───────────────────
  let screenedOut = 0;
  const { data: ads } = await db
    .from("city_campaigns")
    .select("platform_campaign_id")
    .eq("request_id", request.id)
    .not("platform_campaign_id", "is", null);
  const adIds = (ads ?? []).map((a) => a.platform_campaign_id as string);
  if (adIds.length) {
    const { count } = await db
      .from("city_leads")
      .select("id", { count: "exact", head: true })
      .eq("is_test", false)
      .in("meta_campaign_id", adIds)
      .in("archive_reason", BLOCKING_CATEGORIES as unknown as string[]);
    screenedOut = count ?? 0;
  }

  const order: Record<FamilyStatus, number> = { replied: 0, warming: 1, hard_to_reach: 2 };
  families.sort(
    (a, b) => order[a.status] - order[b.status] || +new Date(b.arrivedAt) - +new Date(a.arrivedAt),
  );
  const counts: Record<FamilyStatus, number> = { replied: 0, warming: 0, hard_to_reach: 0 };
  for (const f of families) counts[f.status]++;
  return { families, counts, screenedOut };
}
