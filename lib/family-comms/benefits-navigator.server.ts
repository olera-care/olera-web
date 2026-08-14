/**
 * Benefits Care Navigator — AI-drafted, TJ-approved first-touch letters.
 *
 * Replaces the templated B1 "first step" email with a personal note composed
 * per family from everything we actually hold: their own words (facts they
 * tapped), the eligibility-ranked first step, and what's near them. The
 * coordinator COMPOSES a draft; nothing sends until TJ approves it from the
 * /admin/benefits caseload (draft-queue-first, locked 2026-07-29). TJ signs,
 * TJ reads replies. The draft queue doubles as the concierge discovery engine:
 * every edit TJ makes is a correction the composer learns from at review time.
 *
 * Honesty rails (non-negotiable):
 *  - The model may only reference facts THE FAMILY provided; nothing inferred,
 *    nothing looked up about them.
 *  - Program specifics (name, phone, documents, savings) are injected from the
 *    verified pipeline pick and must be used as given — never invented.
 *  - No persona fabrication: the letter is from TJ, a real person who reads
 *    the replies. "Care navigator" language is fine; "social worker" is not
 *    (licensed title).
 *  - Provider mention is an OFFER of introductions only — no acceptance or
 *    eligibility claims (Phase 4 gate: zero payment-acceptance data).
 */
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  selectFirstStepProgram,
  buildCallScript,
  benefitsSituationLine,
  familyPhraseFromRelationship,
  type FirstStepPick,
} from "./benefits-cascade.server";
import { familyBenefitsFacts, hasCoResidentSpouse } from "./benefits-guidance.server";
import { countProvidersInArea } from "./provider-recs.server";

// ── Metadata shape: business_profiles.metadata.benefits_navigator ──────────

export interface BenefitsNavigatorMeta {
  /** pending = waiting for TJ; sent/dismissed are terminal for this draft. */
  status?: "pending" | "sent" | "dismissed";
  composed_at?: string;
  subject?: string;
  body?: string;
  /** TJ-voiced companion text ({link} placeholder; STOP suffix added at send). */
  sms?: string | null;
  model?: string;
  /** Snapshot of the verified first-step pick so the send path never re-runs
   *  selection (the letter references THIS program; re-picking could drift). */
  pick?: {
    programId: string;
    stateId: string | null;
    name: string;
    shortName: string;
    contactLabel: string;
    contactPhone: string;
    contactHours: string | null;
    documents: string[];
    programPath: string;
    complexity: string | null;
    savingsRange: string | null;
    source: string;
  };
  provider_count?: number;
  /** TJ's saved in-drawer edits. The AI originals above stay untouched — the
   *  edit-vs-original diff is the concierge learning signal the draft queue
   *  exists to capture. Send and the AI-review exports prefer these. Cleared
   *  by recompose (the letter they edited no longer exists). */
  edited_subject?: string;
  edited_body?: string;
  edited_sms?: string | null;
  edited_at?: string;
  edited_by?: string;
  /** Scheduled send: the letter (saved edits included) goes out automatically
   *  at/after this UTC instant via the benefits-navigator-scheduler cron.
   *  Cleared on manual send, dismiss, recompose, or a blocked fire. */
  scheduled_at?: string;
  scheduled_by?: string;
  /** A scheduled fire that was blocked (governance cap, no email, …) — the
   *  draft stays pending and the reason surfaces in the admin queue. */
  schedule_failed_at?: string;
  schedule_failed_reason?: string;
  sent_at?: string;
  /** Who fired the send: TJ's button or the scheduler cron. */
  sent_via?: "admin" | "scheduler";
  /** Final copies as actually sent (TJ may have edited the drafts). */
  sent_subject?: string;
  sent_body?: string;
  sent_sms?: string;
  dismissed_at?: string;
}

export function readBenefitsNavigator(
  profileMeta: Record<string, unknown> | null | undefined,
): BenefitsNavigatorMeta {
  const raw = (profileMeta as { benefits_navigator?: unknown } | null | undefined)
    ?.benefits_navigator;
  return raw && typeof raw === "object" ? (raw as BenefitsNavigatorMeta) : {};
}

// ── Voice spec ─────────────────────────────────────────────────────────────
// This is the product. The audience is confused and overwhelmed, often a
// low-income senior or their adult child, and heavily scam-targeted. The
// letter must read as one competent human who looked at their situation and
// is not going to waste their time.

const NAVIGATOR_VOICE = `You draft short personal notes from TJ, a real person at Olera. Olera helps families of older adults find care and the benefit programs that help pay for it. TJ personally reads and answers every reply to these notes.

WHO YOU ARE WRITING TO
A family member or senior who used Olera's free benefits finder a couple of days ago. They are often overwhelmed, short on money, and wary of scams. Many came looking for help with bills first, care second. Write at a 6th-grade reading level.

VOICE
- Plain words. Short sentences. Calm and competent, like a good caseworker.
- Warm but never gushing. No hype, no marketing language, no exclamation points, no emojis.
- Never use these words: journey, navigate, unlock, empower, explore, amazing, exciting.
- No em dashes. Use periods and commas.
- Do not open with "I hope this finds you well" or any filler greeting.
- Anchor trust in what THEY did: name the concrete thing (they used the benefits finder, what they were looking into). Never reveal knowledge they did not give us.

SIMPLICITY (the most important rule)
- Write like you would text a neighbor you respect. Not like an essay.
- Keep most sentences under 12 words. One idea per sentence.
- 90 to 130 words total. If a sentence does not help them make the call, cut it.
- No stacked clauses. No semicolons. At most one short parenthetical (a program nickname).
- If the program covers several sub-programs, name ONLY the part that fits this family's facts, and list ONLY that part's documents. Drop the rest entirely. Two or three documents at most.
- Phrase the call naturally. If the contact label and the phone number say the same thing, say it once ("Call 2-1-1"), never "Call Texas 2-1-1 at 2-1-1".
- If a savings figure is given, one short sentence at most ("Families that qualify often save $X a year.").

HONESTY RULES (never break these)
- Only mention facts listed in the FAMILY section. If something is not listed, do not reference it or guess at it.
- Never state or imply how fast this will go unless the FIRST STEP section gives a timeline. Do not say quick, easy, simple, fast, or "just one call". A family who expects an answer this week and waits three months feels lied to, and stops answering us.
- Never assume the care recipient's gender. "My spouse" is not "your husband". If the FAMILY section does not name them or say wife/husband/mother/father, write "your spouse" or "your loved one".
- Recommend, do not instruct. "I would start with" and "it is worth asking about" are right. "Call this number" and "do not call back" are not. We can be wrong, and a family should never feel ordered around by us.
- Hold a dollar figure until the family qualifies for it. If eligibility turns on something we do not know, ask that question first and leave the amount out. Leading with money a reader cannot get reads as bait.
- Hedge the facts, not the recommendation. Rules and figures get "as I understand it" or "the figure I am seeing". What you would do stays direct.
- Program details (name, phone number, documents, savings) come from the FIRST STEP section. Use them exactly as given. Never invent numbers, dollar amounts, deadlines, or eligibility claims.
- Never promise approval, never say they qualify. "Worth a call" is the ceiling.
- Never tell a family their own numbers are "in range", "within the limits", "in the range they look at", or any equivalent. That reads as a yes and it is the same promise as saying they qualify, made sideways. State what a limit IS if it is given to you. Never measure the family against it.
- The income figure in FAMILY is the care recipient's own income. Means-tested programs count the whole household, including a spouse. So never present that figure as though it were what the program will weigh, and if the family includes a spouse, do not mention the family's income next to a program limit at all.
- Telling a family they do NOT qualify is subject to the same rules in reverse, and the stakes are worse: a wrong yes costs someone an afternoon, a wrong no costs them a benefit they were owed and would have received. If the facts look unpromising, you may say the limits look tight, but you must in the same breath say that only the agency decides, and that applying is free and worth doing anyway. Never write a sentence whose effect is to talk a family out of applying.
- The provider offer, when included, is only an offer to introduce them if they reply. No claims about what providers accept or cost.

STRUCTURE (90-130 words total)
1. One or two sentences: who you are, and the concrete thing they did. Acknowledge, in plain terms, what they came looking for. If FAMILY says the first name is unknown, open with no name at all ("Hi, it's TJ with Olera.") — never guess a name and never use a placeholder.
2. The one first step, laid out so it feels doable: the program, who to call and the number, what to have nearby before dialing. Mention the short phone script is written down on their plan page. If the program is a Medicaid waiver or needs a Medicaid application first, say plainly that the process runs weeks to months. Never imply the call itself resolves it.
3. ONE of the following, never both, chosen from the data:
   - If MISSING FACTS lists anything: one gentle ask for a single fact, tied to a concrete payoff ("If you tell me X, I can check Y for you").
   - Else if the PROVIDER OFFER section allows it: one sentence offering to personally introduce them to a few care providers near them if they reply.
   If the FAMILY facts contain a reason they would rule themselves out (no Medicaid, income they think is too high), answer that BEFORE asking them to act. A reader who thinks they do not qualify stops reading at the instruction.
4. Close in one sentence: they can reply to this email and TJ's team reads every reply (phrase it naturally, e.g. "You can reply to this email. My team and I read every reply." — never promise that TJ alone reads it). Sign off exactly as "TJ" on its own line, with "Olera" on the line after.

COMPANION TEXT MESSAGE
Also draft one short text message. It goes only to families who asked for texts, alongside the email, from the same number that texted their results. Texts get seen when email does not, so this is often the first thing they read.
- Two or three short sentences, under 240 characters total. It must sound like a person texting, not a notification. Same voice rules as the letter.
- Say who you are (TJ from Olera) and point at the step you prepared in one clause. End exactly with "Reply CALLED, NO ANSWER, or STUCK." This gives the family a clear way to move their plan forward without opening a link. Same no-name rule: if the first name is unknown, open "Hi, it's TJ from Olera" with no name.
- Include the literal placeholder {link} exactly once where the plan link belongs. Write no other links, no phone numbers, and no opt-out language (both are added automatically).

FORMAT
Return exactly this format, nothing else:
SUBJECT: <a plain, specific subject line. No clickbait, no colons-and-hype. Something a person would write, like "Your first step for LIHEAP">
TEXT: <the companion text message on a single line>

<the letter body as plain text paragraphs separated by blank lines. No markdown, no links, no bullet points.>`;

// ── Compose ────────────────────────────────────────────────────────────────

export interface NavigatorComposeInput {
  profileId: string;
  accountId: string;
  displayName: string | null;
  state: string | null;
  city: string | null;
  careTypes: string[];
  /** ISO timestamp of benefits intake completion. */
  intakeAt: string;
  profileMeta: Record<string, unknown>;
  /** Profile row fields familyBenefitsFacts reads (pass the loaded row). */
  factsRow: Parameters<typeof familyBenefitsFacts>[0];
  /** Program ids the selector must skip. Used when a fact-check rules a pick
   *  out but the family still has it saved, so the normal ladder would keep
   *  choosing it (2026-08-07: a WV family's saved VISIONS outranked the Aged
   *  and Disabled Waiver they saved first, because the ladder sorts by
   *  ascending complexity before saved order). */
  exclude?: string[];
}

export interface NavigatorDraft {
  subject: string;
  body: string;
  /** TJ-voiced companion text (one {link} placeholder; STOP suffix added at
   *  send). Null when the model omitted it — send falls back to the template. */
  sms: string | null;
  pick: FirstStepPick;
  providerCount: number;
}

/** Care types that make a provider introduction sensible (a LIHEAP-only
 *  bills-relief family should not get a care-provider pitch in touch one). */
function providerOfferAllowed(careTypes: string[], providerCount: number): boolean {
  return providerCount >= 3 && careTypes.length > 0;
}

/**
 * Compose a navigator draft for one family. Returns null when there is no
 * qualifying first-step program (same fewer-honest-beats-hollow rule as the
 * old B1) or when the model output is unusable. Throws only on transport
 * errors — callers decide whether to retry next run.
 */
export async function composeNavigatorDraft(
  db: SupabaseClient,
  input: NavigatorComposeInput,
): Promise<NavigatorDraft | null> {
  const facts = familyBenefitsFacts(input.factsRow);
  const pick = await selectFirstStepProgram(db, {
    accountId: input.accountId,
    stateAbbrev: input.state,
    facts,
    exclude: input.exclude,
  });
  if (!pick) return null;

  const relationship =
    (input.profileMeta.relationship_to_recipient as string) || null;
  const familyPhrase = familyPhraseFromRelationship(relationship);
  const situation = benefitsSituationLine(input.profileMeta);
  // The benefits intake collects NO name — save-results defaults display_name
  // to "Care Seeker", so a naive split greeted every family "Care," (TJ QA
  // 2026-07-29). Treat placeholder names as no-name; the letter opens
  // nameless unless a real name exists (e.g. set later via enrichment).
  const rawFirst = input.displayName?.split(/\s+/)[0] || null;
  const PLACEHOLDER_FIRST_NAMES = new Set(["care", "seeker", "family", "guest", "friend", "user", "there"]);
  const firstName =
    rawFirst && !PLACEHOLDER_FIRST_NAMES.has(rawFirst.toLowerCase()) ? rawFirst : null;

  const missing: string[] = [];
  const pMeta = input.profileMeta as {
    age?: unknown;
    medicaid_status?: unknown;
    income_range?: unknown;
  };
  if (!pMeta.age) missing.push("the age of the person needing care");
  if (!pMeta.medicaid_status) missing.push("whether they are on Medicaid");
  if (!pMeta.income_range) missing.push("a rough monthly income range");
  // The intake asks for the recipient's income, but every means test counts
  // the household. With a spouse in the picture the stored band is a
  // fragment, so ask for the combined figure before anything weighs it.
  // Skipped for preferNotToSay: they declined to give a figure, and asking
  // about the scope of a number they withheld reads as not having listened.
  else if (pMeta.income_range !== "preferNotToSay" && hasCoResidentSpouse(input.profileMeta)) {
    missing.push("whether that income figure is just theirs or covers both spouses");
  }

  let providerCount = 0;
  if (input.city && input.state && input.careTypes.length > 0) {
    try {
      providerCount = await countProvidersInArea(
        db,
        input.city,
        input.state,
        input.careTypes,
      );
    } catch {
      providerCount = 0;
    }
  }
  const offerProviders = providerOfferAllowed(input.careTypes, providerCount);

  const intakeDay = new Date(input.intakeAt).toLocaleDateString("en-US", {
    weekday: "long",
  });
  const callScript = buildCallScript(pick.shortName, relationship);

  const dataBlock = [
    "FAMILY (only what they told us — reference nothing else):",
    `- First name: ${firstName ?? "unknown (open without a name)"}`,
    `- Who needs care: ${familyPhrase}`,
    `- State: ${input.state ?? "unknown"}${input.city ? `, city: ${input.city}` : ""}`,
    `- Used the benefits finder on ${intakeDay}, entering through the ${pick.source === "entry" ? `${pick.shortName} page (that program is what brought them in)` : "site"}`,
    `- What they told us about their situation: ${situation || "nothing beyond the above"}`,
    `- MISSING FACTS: ${missing.length > 0 ? missing.join("; ") : "none"}`,
    "",
    "FIRST STEP (verified — use exactly as given):",
    `- Program: ${pick.name} (short name: ${pick.shortName})`,
    `- Call: ${pick.contact.label} at ${pick.contact.phone}${pick.contact.hours ? ` (${pick.contact.hours})` : ""}`,
    `- Have nearby before calling: ${pick.documents.join("; ")}`,
    `- Phone script written on their plan page: "${callScript}"`,
    pick.savingsRange ? `- Typical savings: ${pick.savingsRange}` : null,
    "",
    "PROVIDER OFFER:",
    offerProviders
      ? `- Allowed. There are ${providerCount} ${input.careTypes[0].toLowerCase()} providers near ${input.city}. Offer a personal introduction if they reply. No other claims.`
      : "- Not allowed for this family. Do not mention providers.",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // max_tokens covers thinking + text on this model — a tight cap truncates
  // the letter mid-sentence, so leave generous headroom (letters are ~200 words).
  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 8000,
    system: NAVIGATOR_VOICE,
    messages: [{ role: "user", content: dataBlock }],
  });

  // Safety classifiers can decline (stop_reason "refusal") — treat like an
  // unusable draft, not an error; the next run retries.
  if (response.stop_reason === "refusal") return null;
  const text = response.content.find((b) => b.type === "text");
  const raw = text && text.type === "text" ? text.text.trim() : "";
  const match = raw.match(/^SUBJECT:\s*(.+?)\s*\n+(?:TEXT:\s*(.+?)\s*\n+)?([\s\S]+)$/);
  if (!match) return null;
  const subject = match[1].trim();
  const smsRaw = (match[2] || "").trim();
  const body = match[3].trim().replace(/—/g, ", ").replace(/[ \t]+\n/g, "\n");
  if (!subject || body.length < 80) return null;
  // The companion text is optional (send falls back to the template without
  // it) but never oversized or off-format: cap length, strip stray links.
  const sms =
    smsRaw && smsRaw.length >= 40 && smsRaw.includes("{link}") && !/https?:\/\//.test(smsRaw)
      ? smsRaw.replace(/—/g, ", ").slice(0, 320)
      : null;

  return { subject, body, sms, pick, providerCount };
}

/** Serialize the pick for the metadata snapshot (send path re-reads it). */
export function pickSnapshot(pick: FirstStepPick): NonNullable<BenefitsNavigatorMeta["pick"]> {
  return {
    programId: pick.programId,
    stateId: pick.stateId ?? null,
    name: pick.name,
    shortName: pick.shortName,
    contactLabel: pick.contact.label,
    contactPhone: pick.contact.phone,
    contactHours: pick.contact.hours ?? null,
    documents: pick.documents,
    programPath: pick.programPath,
    complexity: pick.complexity ?? null,
    savingsRange: pick.savingsRange ?? null,
    source: pick.source,
  };
}

// ── Email rendering ────────────────────────────────────────────────────────
// Deliberately un-designed: a personal note, not a campaign. 16px body for
// the senior audience, paragraphs as written, one plan link appended
// deterministically (the model never writes links), unsubscribe footer.

/** tel: href from a human-formatted phone ("2-1-1", "1-877-541-7905"). */
function telHref(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:${digits}`;
}

export function renderNavigatorEmail(opts: {
  body: string;
  planUrl: string;
  unsubscribeUrl: string;
  /** The letter's one action, made tappable (TJ design 2026-07-29): a
   *  70-year-old reading on her phone should never have to memorize a number
   *  and dial it herself. Colors mirror the /m hero for continuity. */
  call?: { phone: string } | null;
}): string {
  const paragraphs = opts.body
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.65; color: #1f2937;">${p
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br/>")}</p>`,
    )
    .join("\n");
  const callButton = opts.call
    ? `
  <a href="${telHref(opts.call.phone)}" style="display: block; margin: 24px 0 0; padding: 15px 20px; background: #33261e; color: #f7f3ee; text-align: center; border-radius: 12px; font-size: 17px; font-weight: bold; text-decoration: none; font-family: Arial, sans-serif;">Call ${opts.call.phone}</a>`
    : "";
  return `
<div style="max-width: 560px; margin: 0 auto; padding: 32px 24px; font-family: Georgia, 'Times New Roman', serif;">
  ${paragraphs}${callButton}
  <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
    Everything above is also written down for you here:
    <a href="${opts.planUrl}" style="color: #0f766e;">your plan page</a>.
  </p>
  <p style="margin: 28px 0 0; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; line-height: 1.6; color: #9ca3af; font-family: Arial, sans-serif;">
    You're getting this because you used Olera's benefits finder.
    <a href="${opts.unsubscribeUrl}" style="color: #9ca3af;">Stop these emails</a>.
  </p>
</div>`;
}
