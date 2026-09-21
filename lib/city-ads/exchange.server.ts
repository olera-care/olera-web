import type { SupabaseClient } from "@supabase/supabase-js";
import { cityQualifyingQuestion } from "./qualify";

/**
 * The text exchange with a family, rendered for the provider deciding on an offer.
 *
 * Why this exists: until now a provider deciding whether to take a request saw
 * one generated line — "a family in Dallas is looking for care, type not
 * decided yet". The family's own words were stored and shown to nobody. The
 * offer page rendered `note` only AFTER acceptance, and never rendered
 * `qualification_reply` at all, so the single most informative thing we hold
 * was invisible at the only moment it mattered.
 *
 * Two live cases from 20 September:
 *   - Bessie Brooks texted three times in ninety seconds. Only the first was
 *     stored on the lead; her second ("Richardson Texas") named her area. Three
 *     providers passed on an offer carrying none of it.
 *   - Marla Branham wrote "I'm in Frisco. Need a little help keeping my room
 *     clean and maybe driver to doctor in Plano." That sentence IS the lead.
 *
 * So the exchange is read from `sms_inbound` rather than from the lead's single
 * `qualification_reply` column, because a family does not answer in exactly one
 * message and the column only ever keeps the first.
 *
 * CONTACT DETAILS STAY HIDDEN UNTIL A PROVIDER SAYS YES. That rule is the whole
 * premise of the relay, so this deliberately carries no name, and redacts any
 * phone or email the family typed into the message body. Without the redaction
 * the rule would leak through the transcript the moment someone wrote their own
 * number, which families do.
 */

/** Messages shown. Enough for a real back-and-forth, short of a wall of text. */
const MAX_TURNS = 8;
/**
 * Rows fetched before filtering. Higher than MAX_TURNS on purpose: bare
 * acknowledgements are dropped AFTER the read, so fetching exactly MAX_TURNS
 * means a family who sent eight "ok"s and then the real answer would have the
 * answer cut off by the limit and fall through to the all-acknowledgements
 * branch. The headroom is what makes that branch mean what it says.
 */
const FETCH_LIMIT = 40;
/** Per-message cap. Long enough for a paragraph, short of a pasted essay. */
const MAX_CHARS = 400;

export interface ExchangeTurn {
  who: "olera" | "family";
  text: string;
  at: string | null;
}

export interface ExchangeLead {
  id: string;
  phone: string | null;
  created_at: string;
  care_recipient: string | null;
  note?: string | null;
  qualification_reply?: string | null;
}

function last10(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : null;
}

/**
 * Strip contact details a family typed into their own message.
 *
 * Order matters: emails first, because an email's local part can contain digit
 * runs that the phone pattern would otherwise chew through and leave a mangled
 * half-address behind.
 */
export function redactContactDetails(text: string): string {
  return text
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[contact hidden]")
    .replace(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g, "[contact hidden]");
}

/**
 * A bare acknowledgement of our thank-you text, not an answer.
 *
 * Every family in the pilot so far has sent one: Rudy "Okay", Drema "Okay",
 * Bessie "Okay 👌🏾". Carrying them makes a two-line exchange look like a
 * conversation and pushes the real sentence further from the provider's eye,
 * so they are dropped — unless they are ALL we have, in which case the fact
 * that she replied at all is the only signal there is and it stays.
 */
const ACKNOWLEDGEMENTS = new Set([
  "ok", "okay", "okey", "k", "kk", "yes", "yep", "yeah", "yup", "sure",
  "thanks", "thank you", "thankyou", "ty", "got it", "gotit", "alright",
  "alrighty", "sounds good", "great", "perfect", "noted", "understood",
]);

function isAcknowledgement(text: string): boolean {
  const bare = text
    .toLowerCase()
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/gu, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return bare.length === 0 || ACKNOWLEDGEMENTS.has(bare);
}

function clean(raw: string): string {
  const t = redactContactDetails(raw.trim()).replace(/\s+/g, " ");
  return t.length > MAX_CHARS ? `${t.slice(0, MAX_CHARS).trimEnd()}…` : t;
}

/**
 * Build the exchange for a lead. Best effort: a failed read returns the
 * question and whatever the lead row itself carries, never throws, because an
 * offer must still go out when the message store is unavailable.
 */
export async function getLeadExchange(db: SupabaseClient, lead: ExchangeLead): Promise<ExchangeTurn[]> {
  const question: ExchangeTurn = {
    who: "olera",
    text: cap(cityQualifyingQuestion(lead.care_recipient)),
    at: lead.created_at,
  };
  try {
    return await buildExchange(db, lead, question);
  } catch (e) {
    // This runs AFTER the offer row is inserted and the lead is stamped
    // "offered", and the caller has no try/catch of its own. A throw here
    // would leave a provider recorded as asked and never actually told, and
    // would take the rest of the five-minute sweep down with it. The words are
    // a bonus on the offer; the offer is not a bonus on the words.
    console.error("[city-ads] exchange build failed", e);
    return [question];
  }
}

async function buildExchange(
  db: SupabaseClient,
  lead: ExchangeLead,
  question: ExchangeTurn,
): Promise<ExchangeTurn[]> {
  const turns: ExchangeTurn[] = [question];

  const digits = last10(lead.phone);
  let inbound: { body: string | null; created_at: string }[] = [];
  if (digits) {
    const { data, error } = await db
      .from("sms_inbound")
      .select("body, created_at")
      .eq("phone_last10", digits)
      .gte("created_at", lead.created_at)
      .order("created_at", { ascending: true })
      .limit(FETCH_LIMIT);
    if (error) console.error("[city-ads] exchange read failed", error);
    else inbound = data ?? [];
  }

  const fromText = inbound
    .map((row) => ({ text: clean((row.body ?? "").trim()), at: row.created_at }))
    .filter((t) => t.text.length > 0);
  const substantive = fromText.filter((t) => !isAcknowledgement(t.text));
  // All acknowledgements means she engaged but told us nothing. Keep the first
  // so the provider can see there was contact, rather than an empty block.
  for (const t of (substantive.length > 0 ? substantive : fromText.slice(0, 1))) {
    turns.push({ who: "family", text: t.text, at: t.at });
  }

  // A family who answered on the thank-you screen instead of by text has no
  // inbound row at all, and one who did both has the note on top of them.
  // Either way the note is something she wrote, so it belongs here — but only
  // when it is not already in the thread verbatim.
  const note = (lead.note ?? "").trim();
  if (note && !turns.some((t) => t.who === "family" && t.text === clean(note))) {
    turns.push({ who: "family", text: clean(note), at: null });
  }

  // Last resort: the stored reply. Reached when sms_inbound is unavailable or
  // the row predates it, so the provider still sees the words rather than a
  // bare question with nothing under it.
  if (!turns.some((t) => t.who === "family")) {
    const reply = (lead.qualification_reply ?? "").trim();
    if (reply) turns.push({ who: "family", text: clean(reply), at: null });
  }

  return turns.slice(0, MAX_TURNS + 1);
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Plain-text rendering, for an SMS-adjacent context or a Slack line. */
export function exchangeToText(turns: ExchangeTurn[]): string {
  return turns
    .map((t) => (t.who === "olera" ? `We asked: ${t.text}` : `They replied: "${t.text}"`))
    .join("\n");
}
