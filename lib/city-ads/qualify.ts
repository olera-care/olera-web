import type { CityRecipient } from "./config";

/**
 * The one question the confirmation text asks a family, and nothing else.
 *
 * ONE question, because a text that asks three gets none answered. WHICH one
 * depends on what the form already told us, and that is the whole point: the
 * Meta instant form collects a name, a phone and a ZIP, so the open question
 * there is who the care is even for. The /care/{city} form already asked that,
 * so asking it again by text reads as though nobody read the form — the exact
 * failure that nearly went out to Gwen Makone on 18 Sep, where a call script
 * ignored a reply she had already sent.
 *
 * So a website lead is asked the next thing instead: what is actually going on.
 * It is the question a concierge caller opens with anyway, it returns a
 * sentence rather than a word, and it is the one piece a provider needs that
 * four radio buttons cannot carry.
 *
 * Asked at confirmation time, which is BEFORE the optional note on the
 * thank-you screen exists — the note is written after the text has gone. Two
 * chances at the same thing on purpose: nobody has typed that note yet.
 */
export function cityQualifyingQuestion(careRecipient: CityRecipient | string | null): string {
  if (!careRecipient) return "who are you looking for care for?";
  if (careRecipient === "self") return "what kind of help do you need?";
  return "what is going on for them right now?";
}
