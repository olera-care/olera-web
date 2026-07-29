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
import { familyBenefitsFacts } from "./benefits-guidance.server";
import { countProvidersInArea } from "./provider-recs.server";

// ── Metadata shape: business_profiles.metadata.benefits_navigator ──────────

export interface BenefitsNavigatorMeta {
  /** pending = waiting for TJ; sent/dismissed are terminal for this draft. */
  status?: "pending" | "sent" | "dismissed";
  composed_at?: string;
  subject?: string;
  body?: string;
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
  sent_at?: string;
  /** Final body as actually sent (TJ may have edited the draft). */
  sent_subject?: string;
  sent_body?: string;
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

HONESTY RULES (never break these)
- Only mention facts listed in the FAMILY section. If something is not listed, do not reference it or guess at it.
- Program details (name, phone number, documents, savings) come from the FIRST STEP section. Use them exactly as given. Never invent numbers, dollar amounts, deadlines, or eligibility claims.
- Never promise approval, never say they qualify. "Worth a call" is the ceiling.
- The provider offer, when included, is only an offer to introduce them if they reply. No claims about what providers accept or cost.

STRUCTURE (120-180 words total)
1. One or two sentences: who you are, and the concrete thing they did. Acknowledge, in plain terms, what they came looking for.
2. The one first step, laid out so a call feels doable in ten minutes: the program, who to call and the number, what to have nearby before dialing. Mention the short phone script is written down on their plan page.
3. ONE of the following, never both, chosen from the data:
   - If MISSING FACTS lists anything: one gentle ask for a single fact, tied to a concrete payoff ("If you tell me X, I can check Y for you").
   - Else if the PROVIDER OFFER section allows it: one sentence offering to personally introduce them to a few care providers near them if they reply.
4. Close in one sentence: they can reply to this email and TJ will read it. Sign off exactly as "TJ" on its own line, with "Olera" on the line after.

FORMAT
Return exactly this format, nothing else:
SUBJECT: <a plain, specific subject line. No clickbait, no colons-and-hype. Something a person would write, like "Your first step for LIHEAP">

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
}

export interface NavigatorDraft {
  subject: string;
  body: string;
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
  });
  if (!pick) return null;

  const relationship =
    (input.profileMeta.relationship_to_recipient as string) || null;
  const familyPhrase = familyPhraseFromRelationship(relationship);
  const situation = benefitsSituationLine(input.profileMeta);
  const firstName = input.displayName?.split(/\s+/)[0] || null;

  const missing: string[] = [];
  const pMeta = input.profileMeta as {
    age?: unknown;
    medicaid_status?: unknown;
    income_range?: unknown;
  };
  if (!pMeta.age) missing.push("the age of the person needing care");
  if (!pMeta.medicaid_status) missing.push("whether they are on Medicaid");
  if (!pMeta.income_range) missing.push("a rough monthly income range");

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
  const match = raw.match(/^SUBJECT:\s*(.+)\n+([\s\S]+)$/);
  if (!match) return null;
  const subject = match[1].trim();
  const body = match[2].trim().replace(/—/g, ", ").replace(/[ \t]+\n/g, "\n");
  if (!subject || body.length < 80) return null;

  return { subject, body, pick, providerCount };
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

export function renderNavigatorEmail(opts: {
  body: string;
  planUrl: string;
  unsubscribeUrl: string;
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
  return `
<div style="max-width: 560px; margin: 0 auto; padding: 32px 24px; font-family: Georgia, 'Times New Roman', serif;">
  ${paragraphs}
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
