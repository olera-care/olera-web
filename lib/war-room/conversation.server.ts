import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Talking to Cortex, rather than only answering it.
 *
 * Until now the founder's DM understood two things: the word "scan", and an
 * answer to the single question most recently asked. Everything else he typed
 * was filed as that answer, whatever it was actually about, and handed to the
 * next scan attributed to him. Cortex trusts that channel more than anything it
 * can query for itself, which is exactly what made feeding it a stray sentence
 * expensive rather than merely useless. And nothing replied, so a sentence
 * landing on the wrong condition looked identical to nothing happening.
 *
 * Three things change that. A question is recognised as a question and answered
 * instead of swallowed. Every captured answer is acknowledged, naming what it
 * was filed against, so a mistake is visible immediately. And a reply typed in
 * the thread of the brief that asked resolves to that exact condition.
 *
 * Answering is deliberately a small, cheap, tool-free call against a bounded
 * context, not a scan. A scan sweeps for what nobody has noticed; this reads
 * back what Cortex already knows. Conflating them is how a question costs two
 * dollars and takes two minutes.
 */

const CONVERSATION_MODEL = process.env.WAR_ROOM_CONVERSATION_MODEL || "claude-haiku-4-5-20251001";
const MAX_ANSWER_TOKENS = 700;

/**
 * How long an exchange stays "in progress".
 *
 * On 2026-09-22, the first real conversation with Cortex, the founder asked a
 * question, got an answer, and typed a two-word correction to his own question
 * seconds later: "Aging in America" (dictation had mangled it). Nothing in the
 * system knew a conversation was happening, so that fragment was classified as
 * a statement and filed as his answer to a question from the previous day's
 * brief about data consistency. It would have been read as evidence on the next
 * scan.
 *
 * The lexical classifier cannot catch that, and no amount of tuning it will: the
 * fragment genuinely is not a question. What distinguishes it is that Cortex had
 * just spoken. A message arriving moments after Cortex answered is the next turn
 * of that exchange, not the answer to something asked eighteen hours ago.
 */
// Fifteen minutes, not thirty. The window has to be long enough for him to read
// an answer and type a follow-up, and short enough that it does not swallow a
// deliberate reply to the brief's question typed later in the same session.
// That failure is the mirror of the one this fixes, and it is the less visible
// of the two, so the window errs short.
const CONVERSATION_WINDOW_MS = 15 * 60_000;
const CONVERSATION_STATE_KEY = "founder_conversation";

export type ConversationTurn = { question: string; answer: string; focusInvestigationId: string | null; at: string };

/** The exchange still in progress, or null if the last one has gone cold. */
export async function loadOpenExchange(db: SupabaseClient): Promise<ConversationTurn | null> {
  const { data } = await db.from("war_room_source_state")
    .select("metadata")
    .eq("source_key", CONVERSATION_STATE_KEY)
    .maybeSingle();
  const turn = (data?.metadata ?? null) as ConversationTurn | null;
  if (!turn?.at) return null;
  return Date.now() - new Date(turn.at).getTime() < CONVERSATION_WINDOW_MS ? turn : null;
}

export async function recordExchange(db: SupabaseClient, turn: Omit<ConversationTurn, "at">): Promise<void> {
  const now = new Date().toISOString();
  await db.from("war_room_source_state").upsert({
    source_key: CONVERSATION_STATE_KEY,
    last_synced_at: now,
    last_success_at: now,
    last_error: null,
    metadata: { ...turn, at: now },
    updated_at: now,
  }, { onConflict: "source_key" }).then(() => undefined, () => undefined);
}

/**
 * Ends the exchange so the next message is read as evidence again.
 *
 * Called when a brief asks a new question: Cortex has changed the subject, so
 * whatever he says next is far more likely to be about that than about a
 * conversation from earlier.
 */
export async function closeExchange(db: SupabaseClient): Promise<void> {
  await db.from("war_room_source_state")
    .update({ metadata: {}, updated_at: new Date().toISOString() })
    .eq("source_key", CONVERSATION_STATE_KEY)
    .then(() => undefined, () => undefined);
}

export type MessageKind = "question" | "answer";

const INTERROGATIVE = /^(what|why|how|when|who|where|which|can|could|should|would|is|are|was|were|do|does|did|tell me|show me|explain|give me|remind me|any|status)\b/i;

/**
 * Question or answer?
 *
 * Wrong in the safe direction on purpose. Misreading an answer as a question
 * costs one cheap model call and a reply saying nothing was recorded, and he
 * can send it again. Misreading a question as an answer writes a sentence into
 * the evidence record attributed to him and feeds it to the next scan, which is
 * the failure this whole module exists to stop.
 */
export function classifyMessage(text: string): MessageKind {
  const body = text.trim();
  if (!body) return "answer";
  if (body.endsWith("?")) return "question";
  if (INTERROGATIVE.test(body)) return "question";
  return "answer";
}

type InvestigationRow = {
  id: string;
  title: string;
  status: string | null;
  domain: string | null;
  impact: string | null;
  likely_cause: string | null;
  unknowns: unknown;
  occurrence_count: number | null;
};

type SourceItemRow = {
  source: string;
  title: string | null;
  content: string | null;
  source_url: string | null;
  occurred_at: string | null;
};

/**
 * Words worth searching the record for.
 *
 * Crude on purpose. The alternative is a model call to extract search terms,
 * which doubles the cost and latency of every question to save a few wasted
 * ILIKEs against a table of a few hundred rows.
 */
const STOP_WORDS = new Set([
  "the","a","an","and","or","but","is","are","was","were","be","been","being","to","of","in","on","at",
  "for","with","about","from","by","as","it","its","this","that","these","those","has","have","had",
  "do","does","did","will","would","should","could","can","may","me","my","i","we","our","us","you",
  "your","he","she","they","them","his","her","their","what","why","how","when","who","where","which",
  "any","all","get","got","gotten","back","thing","stuff","whole","yet","still","now","just","really","kind",
  // Sentence-initial words are capitalised by grammar, not by being names.
  "has","had","was","were","does","did","can","should","would","could","is","are","the","what","why",
]);

export function searchTermsFrom(question: string): string[] {
  // Proper nouns first, and this is not a nicety. Ranking by length alone
  // dropped "Tim" from "has Tim gotten back to me about the Aging in America
  // cloud solution" -- the single most distinctive word in the sentence lost
  // to "gotten" because it is three letters long. A name is the thing you
  // search a record for.
  const proper = new Set(
    (question.match(/\b[A-Z][a-zA-Z]{1,}\b/g) ?? [])
      .map((w) => w.toLowerCase())
      .filter((w) => !STOP_WORDS.has(w)),
  );
  const words = question.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
  const terms = [...new Set(words.filter((w) => w.length > 2 && !STOP_WORDS.has(w)))];
  return terms
    .sort((a, b) => {
      const byProper = Number(proper.has(b)) - Number(proper.has(a));
      return byProper !== 0 ? byProper : b.length - a.length;
    })
    .slice(0, 6);
}

type ProposalRow = {
  title: string;
  status: string | null;
  assigned_owner: string | null;
  why_now: string | null;
  finding: string | null;
  success_measure: string | null;
};

/**
 * What Cortex knows, small enough to be cheap and bounded enough to be honest.
 *
 * Deliberately not the operating pack the scan uses. That carries every metric
 * and costs dollars to send; this answers questions about conditions and
 * proposals, so it carries conditions and proposals.
 */
/**
 * Anything in the ingested record that mentions what he is asking about.
 *
 * Added after the first question Cortex could not answer: "has Tim gotten back
 * to me about the Aging in America cloud solution?" It replied that the record
 * contained no mention of it, which was true of the record it had been given --
 * investigations, proposals and the company model -- and badly misleading about
 * the record as he would understand it. It had not looked anywhere a
 * conversation with a person could possibly live.
 */
async function searchRecord(db: SupabaseClient, question: string): Promise<SourceItemRow[]> {
  const terms = searchTermsFrom(question);
  if (!terms.length) return [];
  const filter = terms.flatMap((t) => [`title.ilike.*${t}*`, `content.ilike.*${t}*`]).join(",");
  const { data, error } = await db.from("war_room_source_items")
    .select("source, title, content, source_url, occurred_at")
    .or(filter)
    .order("occurred_at", { ascending: false, nullsFirst: false })
    .limit(12);
  if (error) return [];
  return (data ?? []) as SourceItemRow[];
}

/**
 * How much of each reader is actually stored, so Cortex can say what it cannot see.
 *
 * Three head-only counts rather than pulling a thousand rows to derive a set of
 * three strings. The original did the latter, which was merely wasteful when the
 * table held eighty archive rows and becomes a thousand-row transfer on every
 * question now that twelve Slack channels feed it.
 *
 * Counts rather than presence, because "ingested" is not binary. A reader that
 * has imported four messages is switched on and nearly empty, and answering as
 * though it were fully stocked is the same overstatement this whole module
 * exists to stop.
 */
async function ingestedCounts(db: SupabaseClient): Promise<Record<string, number>> {
  const sources = ["slack", "notion", "archive"] as const;
  const counts = await Promise.all(sources.map((source) =>
    db.from("war_room_source_items").select("id", { count: "exact", head: true }).eq("source", source)));
  return Object.fromEntries(sources.map((source, i) => [source, counts[i].count ?? 0]));
}

async function buildConversationContext(
  db: SupabaseClient,
  focusInvestigationId?: string | null,
  question?: string,
): Promise<string> {
  const [investigations, proposals, model, matches, sources] = await Promise.all([
    db.from("war_room_investigations")
      .select("id, title, status, domain, impact, likely_cause, unknowns, occurrence_count")
      .in("status", ["investigating", "watchlist", "decision_ready"])
      .order("updated_at", { ascending: false })
      .limit(20),
    db.from("war_room_proposals")
      .select("title, status, assigned_owner, why_now, finding, success_measure")
      .order("created_at", { ascending: false })
      .limit(10),
    db.from("war_room_company_models").select("north_star, targets, constraints").eq("key", "olera").maybeSingle(),
    question ? searchRecord(db, question) : Promise.resolve([] as SourceItemRow[]),
    ingestedCounts(db),
  ]);

  const rows = (investigations.data ?? []) as InvestigationRow[];
  const focus = focusInvestigationId ? rows.find((row) => row.id === focusInvestigationId) : undefined;

  return JSON.stringify({
    // Stated explicitly so Cortex can distinguish "this did not happen" from
    // "I cannot see where that would be recorded". Those are different answers
    // and only one of them is honest when a reader is not ingested.
    whatIsIngested: {
      slackChannelMessages: sources.slack > 0
        ? `${sources.slack} stored`
        : "NONE stored -- no Slack channel message has been ingested yet",
      notionPages: sources.notion > 0
        ? `${sources.notion} stored`
        : "NONE stored -- no Notion source is being read",
      oleraWrittenRecord: `${sources.archive} stored`,
      directMessages: "NEVER ingested, and never can be. A Slack bot cannot read direct messages between two people; no permission grants it. This includes the founder's own DMs.",
      email: "NEVER ingested.",
    },
    recordMatches: matches.map((row) => ({
      source: row.source,
      title: row.title,
      occurredAt: row.occurred_at,
      excerpt: typeof row.content === "string" ? row.content.slice(0, 600) : null,
      url: row.source_url,
    })),
    northStar: model.data?.north_star ?? null,
    targets: model.data?.targets ?? null,
    constraints: model.data?.constraints ?? null,
    // The thread he replied in, given in full and named as the subject, so a
    // follow-up like "why does that matter" has something to be about.
    focus: focus
      ? { ...focus, note: "This is the condition the founder is replying about." }
      : null,
    openConditions: rows.map((row) => ({
      title: row.title,
      status: row.status,
      domain: row.domain,
      impact: row.impact,
      likelyCause: row.likely_cause,
      timesObserved: row.occurrence_count,
    })),
    proposals: (proposals.data ?? []) as ProposalRow[],
  });
}

const CONVERSATION_SYSTEM = `You are Cortex, the operating system for Olera, answering its founder in a Slack DM.

Answer from the supplied record only. Never invent a number, an owner, a date, or a status.

When the record does not contain the answer, distinguish two very different cases and never blur them:

If the relevant source IS ingested and simply holds nothing, say the record shows nothing and that you would expect it to.

If the relevant source is NOT ingested, say you cannot see it. Read the whatIsIngested block before answering anything about a person, a conversation, a message, an email or a meeting. Cortex cannot read direct messages or email at all. Saying "the record contains no mention" when you were never able to look is misleading, and it is the failure this instruction exists to prevent. Name the specific thing you cannot see.

Write for a phone screen. No markdown headers, no bullet lists, no tables. Two or three short paragraphs at most, and one is often right. Slack bold is single asterisks.

Lead with the answer. Do not restate the question. Do not offer to help further.

Never end your reply with a question. Your replies are delivered into the same channel you read from, and a trailing question mark makes a reply look like a new question.

If the record shows something the founder appears to have wrong, say so directly in one sentence.`;

export async function answerFounderQuestion(
  db: SupabaseClient,
  question: string,
  focusInvestigationId?: string | null,
  priorTurn?: ConversationTurn | null,
): Promise<{ answered: boolean; reply: string; costUsd?: number }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { answered: false, reply: "I cannot answer questions right now: no model key is configured." };
  }
  try {
    const context = await buildConversationContext(db, focusInvestigationId, question);
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: CONVERSATION_MODEL,
      max_tokens: MAX_ANSWER_TOKENS,
      system: CONVERSATION_SYSTEM,
      messages: [{
        role: "user",
        content: priorTurn
          // The previous turn is supplied verbatim so a correction reads as a
          // correction. "Aging in America" after a question about "Asian in
          // America" is a fix to the question, not a new topic.
          ? `RECORD:\n${context}\n\nEARLIER IN THIS CONVERSATION\nHe asked: ${priorTurn.question}\nYou answered: ${priorTurn.answer}\n\nHE NOW SAYS:\n${question}\n\nIf this corrects or narrows what he just asked, treat it as the corrected question and answer that. Do not ask him to repeat himself.`
          : `RECORD:\n${context}\n\nFOUNDER ASKS:\n${question}`,
      }],
    });
    const reply = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    // Deliberately not phrased as a question. Cortex's own replies land in this
    // same DM, and a reply ending in a question mark classifies as a question,
    // so this string -- the FAILURE path, the one most likely to recur -- would
    // have been self-sustaining loop fuel if the app-message filter ever missed.
    if (!reply) return { answered: false, reply: "I could not put an answer together. Send it again and I will retry." };
    return { answered: true, reply };
  } catch (error) {
    // Never silent. A question that vanishes is the defect this replaces.
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[cortex] conversation answer failed:", detail);
    return { answered: false, reply: "I could not reach the model to answer that. Nothing was recorded." };
  }
}
