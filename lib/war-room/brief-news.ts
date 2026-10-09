/**
 * The news-only brief.
 *
 * TJ, 2026-10-09, on the daily brief and the directory digest: "Those long
 * lists are just overwhelming for me." Seven mornings in a row repeated the
 * same "1 of 12", the same inbox count, the same case counts and the same
 * blind spot; the question "seen 55 times" was asked again. The rule now:
 *
 * 1. A fact appears only the first time it is true (its key is new since the
 *    last brief). Facts that are true every day (the CRP count, the inbox
 *    count, cases, blind spots, what shipped) wait for the Monday summary.
 * 2. At most two facts a morning, the most important first.
 * 3. The model writes them as plain sentences, and may only use numbers that
 *    are in the facts; any other number sends the plain template instead
 *    (renderPlainBrief). On 2026-10-09 a draft of this very message invented
 *    "the oldest from Monday".
 *
 * Pure. The delivery side is brief-delivery.server.ts; the checks are
 * scripts/check-brief-news.ts.
 */

export type BriefFact = {
  /** Identity of the fact. A changed value is a new key, so it is news again. */
  key: string;
  /** One sentence, plain words, Slack markup allowed. */
  text: string;
  /** Higher leads. */
  weight: number;
  /** A reply draft that goes with it, quoted under the message. */
  draft?: string | null;
};

export const MAX_NEWS = 2;

/** The facts that are new since the last brief, most important first, at most MAX_NEWS. */
export function selectNews(facts: BriefFact[], previousKeys: Iterable<string>): BriefFact[] {
  const seen = new Set(previousKeys);
  const unique = new Map<string, BriefFact>();
  for (const fact of facts) if (!seen.has(fact.key) && !unique.has(fact.key)) unique.set(fact.key, fact);
  return [...unique.values()].sort((a, b) => b.weight - a.weight).slice(0, MAX_NEWS);
}

/** Keys to remember: what was said before plus what was said today, newest kept. */
export function rememberKeys(previousKeys: string[], shown: BriefFact[], cap = 300): string[] {
  const merged = [...previousKeys.filter((key) => !shown.some((fact) => fact.key === key)), ...shown.map((fact) => fact.key)];
  return merged.slice(-cap);
}

/** Renewal news: once when it is a week out, again the day before. */
export function renewalFact(renewal: { name: string; renewsOn: string | null; daysUntilRenewal: number | null; amount?: number | string | null; flightEndsOn?: string | null } | null | undefined, shortDate: (iso: string) => string): BriefFact | null {
  if (!renewal?.renewsOn || renewal.daysUntilRenewal === null || renewal.daysUntilRenewal > 7 || renewal.daysUntilRenewal < 0) return null;
  const when = renewal.daysUntilRenewal <= 1 ? "tomorrow" : `in ${renewal.daysUntilRenewal} days`;
  const amount = renewal.amount ? ` for $${renewal.amount}` : "";
  const flight = renewal.flightEndsOn && renewal.flightEndsOn !== renewal.renewsOn ? `, and her ad flight ends ${shortDate(renewal.flightEndsOn)}` : "";
  return {
    key: `renewal:${renewal.renewsOn}:${renewal.daysUntilRenewal <= 1 ? "eve" : "week"}`,
    text: `${renewal.name} renews ${when}, ${shortDate(renewal.renewsOn)}${amount}${flight}.`,
    weight: 80,
  };
}

/** Every number-like token in a text: 77, 1,562, $75, 4.33, 15. Commas dropped. */
export function numbersIn(text: string): string[] {
  return (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((token) => token.replace(/,/g, "").replace(/\.$/, ""));
}

/**
 * True when every number in the draft appears in the facts. Small counting
 * words the model may add ("two things") are words, not digits, so they pass;
 * a digit it made up does not.
 */
export function numbersCheck(draft: string, facts: string[]): { ok: boolean; invented: string[] } {
  const allowed = new Set(facts.flatMap(numbersIn));
  const invented = [...new Set(numbersIn(draft).filter((n) => !allowed.has(n)))];
  return { ok: invented.length === 0, invented };
}

/** The template: the facts as sentences, in order. Used when the model is off or fails the check. */
export function renderPlainBrief(news: BriefFact[], weekly: string[], nextDate: string | null): string {
  const parts: string[] = [];
  if (weekly.length) parts.push(weekly.join(" "));
  if (news.length) parts.push(news.map((fact) => fact.text).join(" "));
  else if (!weekly.length) parts.push(`Nothing new today.${nextDate ? ` ${nextDate}` : ""}`);
  return parts.join("\n\n");
}

/** Drafts go under the message as quotes, whoever wrote the prose. */
export function withDrafts(prose: string, news: BriefFact[]): string {
  const drafts = news.filter((fact) => fact.draft).map((fact) => `_Draft:_\n${fact.draft!.split("\n").map((line) => `> ${line}`).join("\n")}`);
  return [prose, ...drafts].join("\n\n");
}

/** What the model is asked to write. */
export function briefPrompt(news: BriefFact[], weekly: string[], nextDate: string | null): string {
  return [
    "Write TJ's morning message from these facts and nothing else.",
    weekly.length ? `WEEKLY SUMMARY FACTS (it is the start of the week; say these in two or three sentences first):\n${weekly.map((line) => `- ${line}`).join("\n")}` : "",
    news.length ? `NEW SINCE YESTERDAY (most important first):\n${news.map((fact) => `- ${fact.text}`).join("\n")}` : "NEW SINCE YESTERDAY: nothing.",
    // Only on a quiet day: on a busy one it was repeated under every message.
    nextDate && !news.length && !weekly.length ? `NEXT DATE: ${nextDate}` : "",
    "Rules: plain sentences like a cofounder texting, one or two short paragraphs, no headers, no bullets, no bold labels, no em dashes, no greeting and no sign-off. Lead with what needs him. Say each fact once. Use only the facts above: no numbers, names, dates, advice or interpretation they do not contain. If nothing is new, say so in one sentence and give the next date. Do not mention drafts; they are attached separately.",
  ].filter(Boolean).join("\n\n");
}
