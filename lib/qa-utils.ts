/**
 * Q&A helpers shared between server (provider page) and client (QASectionV2).
 * Kept dependency-free so it's safe to import into client components — do not
 * add server-only imports (e.g. lib/supabase/server) here.
 */

/**
 * Canonicalize a question string for matching a submitted question back to a
 * suggested chip (and for tallying "how many asked this"). Lowercase, collapse
 * whitespace, normalize curly apostrophes, and drop trailing punctuation so
 * "What's the monthly cost?" and "whats the monthly cost" collapse together.
 * Must be used identically on both the page (building counts) and the
 * QASectionV2 component (reordering chips) so the keys line up.
 */
export function normalizeQuestion(s: string): string {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/[?.!,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface DisplayQuestion {
  id?: string;
  question: string;
  answer?: string | null;
  created_at?: string | null;
  answered_at?: string | null;
}

/**
 * A thread only counts as answered when there is response copy we can show.
 * Database status alone is not enough: an answer may still be awaiting
 * publication, and legacy rows can carry an answered status with no text.
 */
export function hasProviderAnswer(question: DisplayQuestion): boolean {
  return typeof question.answer === "string" && question.answer.trim().length > 0;
}

/**
 * Provider responses are the durable social proof on a public profile. Keep
 * every answered thread ahead of unanswered activity, then use the relevant
 * timestamp within each group. Returning a copy makes this safe for React
 * state and readonly server results.
 */
export function sortQuestionsForDisplay<T extends DisplayQuestion>(
  questions: readonly T[],
): T[] {
  return [...questions].sort((a, b) => {
    const aAnswered = hasProviderAnswer(a);
    const bAnswered = hasProviderAnswer(b);
    if (aAnswered !== bAnswered) return aAnswered ? -1 : 1;

    const aTimestamp = Date.parse(
      (aAnswered ? a.answered_at : a.created_at) || a.created_at || "",
    );
    const bTimestamp = Date.parse(
      (bAnswered ? b.answered_at : b.created_at) || b.created_at || "",
    );
    const safeATimestamp = Number.isNaN(aTimestamp) ? 0 : aTimestamp;
    const safeBTimestamp = Number.isNaN(bTimestamp) ? 0 : bTimestamp;
    const timestampDifference = safeBTimestamp - safeATimestamp;
    if (timestampDifference !== 0) return timestampDifference;

    // Make hydration deterministic even when two rows share a timestamp.
    return (a.id || a.question).localeCompare(b.id || b.question);
  });
}

/**
 * Suggested prompts are acquisition shortcuts, not a rotating reminder list.
 * Once a topic has been asked on this provider, remove it whether the thread
 * is pending or answered. `askedCounts` carries server-rendered history while
 * `questions` carries the live client fetch, covering stale cached pages.
 */
export function getUnaskedQuestionSuggestions(
  suggestions: Array<{ key: string; text: string }>,
  questions: Array<{ question: string; suggestion_key?: string | null }>,
  askedCounts: Record<string, number>,
): Array<{ key: string; text: string }> {
  const asked = new Set(
    questions.map((entry) => normalizeQuestion(entry.question)).filter(Boolean),
  );
  for (const entry of questions) {
    if (entry.suggestion_key) asked.add(entry.suggestion_key);
  }
  for (const [normalized, count] of Object.entries(askedCounts)) {
    if (count > 0) asked.add(normalized);
  }
  return suggestions.filter(
    (suggestion) =>
      !asked.has(suggestion.key) && !asked.has(normalizeQuestion(suggestion.text)),
  );
}

export interface QuestionTopicSummary {
  received: number;
  unanswered: number;
  uniqueReceived: number;
  uniqueUnanswered: number;
}

/** Roll raw activity topics into tap and unique-topic counts. */
export function summarizeQuestionTopics(
  topics: string[],
  answeredByTopic: ReadonlyMap<string, boolean>,
): QuestionTopicSummary {
  const counted = topics.filter((topic) => topic && answeredByTopic.has(topic));
  const unique = new Set(counted);
  return {
    received: counted.length,
    unanswered: counted.filter((topic) => !answeredByTopic.get(topic)).length,
    uniqueReceived: unique.size,
    uniqueUnanswered: [...unique].filter((topic) => !answeredByTopic.get(topic)).length,
  };
}
