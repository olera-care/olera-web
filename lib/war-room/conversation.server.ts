import Anthropic from "@anthropic-ai/sdk";
import { BANGKOK, inEastern, loadBlindSpots, LOOKUP_TOOLS, runLookup } from "@/lib/war-room/lookups.server";
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

// Sonnet, not Haiku. On 2026-09-23 Haiku, given a live ledger listing eight
// campaign requests, named six and invented "three were repeat requests"; and
// asked about subscriptions "besides Hoop Cares" it agreed she subscribed this
// week when her date sat outside the window. Sonnet corrected the premise and
// listed all eight. A question costs cents; a confident wrong answer to the
// founder costs the channel.
const CONVERSATION_MODEL = process.env.WAR_ROOM_CONVERSATION_MODEL || "claude-sonnet-5";
// Headroom for thinking, not a longer answer; length is set by the prompt.
// Sonnet 5 thinks adaptively by default, and at 700 the first question after
// the switch (2026-09-23, "do you know the recent work on the ads nudge")
// spent all 700 tokens thinking and returned no text at all.
const MAX_ANSWER_TOKENS = 4_000;
// A lookup answer takes several model calls. The Slack route allows 90s; the
// budget leaves room for the final answer after the last lookup returns.
const MAX_LOOKUP_ROUNDS = 4;
const LOOKUP_BUDGET_MS = 45_000;
const LOOKUP_RESULT_CHARS = 60_000;
// Adaptive thinking and effort are rejected outright by Haiku (400: "adaptive
// thinking is not supported on this model"), so an env override back to Haiku
// would have failed every answer. Sent only where the model accepts them.
const SUPPORTS_ADAPTIVE = /^claude-(sonnet-(5|4-6)|opus|fable|mythos)/.test(CONVERSATION_MODEL);

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

/**
 * Does this message actually answer the question the brief asked?
 *
 * The lexical test above only says "not obviously a question". That was the
 * whole gate for filing a top-level DM as evidence, so any statement -- an
 * idea, a note to self, a request phrased without a verb up front -- was
 * written into an investigation's record in the founder's name. A reply in
 * the brief's own thread is explicit and skips this; everything else must
 * look like an answer to that specific question. Unsure means no: a missed
 * answer can be re-sent in the thread, a misfiled one silently steers scans.
 */
export async function answersOpenAsk(db: SupabaseClient, text: string): Promise<boolean> {
  const { data } = await db.from("war_room_investigation_events")
    .select("details")
    .eq("event_type", "founder_asked")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const asked = (data?.details as { question?: string; title?: string } | null) ?? null;
  if (!asked?.question) return false;
  return judgedAnAnswer(asked.question, text);
}

/**
 * The judgement itself, separate so it can be tested against any question.
 *
 * A word list is not enough in either direction. "I want to send Logan a
 * note" is a request; "I want it closed, not worth a plan" is a verdict on the
 * recurrence question and must be recorded. A first version that treated every
 * "I want" / "let's" / "please" as a request would have silently dropped
 * exactly the verdicts the recurrence question exists to collect.
 */
export async function judgedAnAnswer(question: string, text: string): Promise<boolean> {
  if (!process.env.ANTHROPIC_API_KEY) return false;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const verdict = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 5,
      system: "You judge whether a founder's Slack message is a direct answer to a specific question his assistant asked him. Reply with exactly ANSWER or OTHER. It is ANSWER if the message responds to that question's subject, including a short decision about it such as 'close it', 'drop it', 'make a plan', or 'keep raising it', however it is phrased. It is OTHER if it asks the assistant to do something unrelated, raises a new topic or idea, or is unrelated. If unsure, OTHER.",
      messages: [{ role: "user", content: `QUESTION HE WAS ASKED:\n${question}\n\nHIS MESSAGE:\n${text.slice(0, 1_500)}` }],
    });
    const word = verdict.content.find((block): block is Anthropic.TextBlock => block.type === "text")?.text.trim().toUpperCase() ?? "";
    return word.startsWith("ANSWER");
  } catch {
    return false;
  }
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

/**
 * When each reader last copied anything in.
 *
 * Slack, Notion and the written record are refreshed only by the daily scan.
 * On 2026-09-23 the founder asked about ads-nudge work shipped the evening
 * before; its write-up landed two hours after the last scan, and Cortex said
 * five times over "I don't see anything in the record" -- true of a copy it
 * never said was ten hours old.
 */
async function lastIngested(db: SupabaseClient): Promise<Record<string, string | null>> {
  const sources = ["slack", "notion", "archive"] as const;
  const rows = await Promise.all(sources.map((source) =>
    db.from("war_room_source_items").select("ingested_at").eq("source", source)
      .order("ingested_at", { ascending: false }).limit(1).maybeSingle()));
  return Object.fromEntries(sources.map((source, i) =>
    [source, (rows[i].data as { ingested_at?: string } | null)?.ingested_at ?? null]));
}

async function buildConversationContext(
  db: SupabaseClient,
  focusInvestigationId?: string | null,
  question?: string,
): Promise<string> {
  const [investigations, proposals, model, matches, sources, refreshed, blindSpots] = await Promise.all([
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
    lastIngested(db),
    loadBlindSpots(db).catch(() => [] as string[]),
  ]);

  const rows = (investigations.data ?? []) as InvestigationRow[];
  const focus = focusInvestigationId ? rows.find((row) => row.id === focusInvestigationId) : undefined;

  // Plain-English keys throughout. Told not to name "managedAds" or "shipped",
  // the model still wrote "managedAds gives me subscription status only" to
  // the founder. A key it repeats should read as English when it does.
  return JSON.stringify(inEastern({
    "Current time": {
      eastern: new Date().toISOString(),
      founderLocalBangkok: BANGKOK.format(new Date()),
    },
    // Copies, not live reads. Anything written after these times is invisible
    // until the next scan, and an answer of "nothing in the record" must say so.
    "When the daily copies were last refreshed": {
      slackChannelMessages: refreshed.slack,
      notionPages: refreshed.notion,
      oleraWrittenRecord: refreshed.archive,
      note: "Refreshed only when the daily scan runs. Work written up or shipped after these times is not in the record yet.",
    },
    // Where the copy is known to be behind the source. When a search comes up
    // empty, this is what separates "it was not said" from "I cannot see it".
    "Where my copy is behind": blindSpots,
    // Stated explicitly so Cortex can distinguish "this did not happen" from
    // "I cannot see where that would be recorded". Those are different answers
    // and only one of them is honest when a reader is not ingested.
    "What Cortex can and cannot see": {
      slackChannelMessages: sources.slack > 0
        ? `${sources.slack} stored`
        : "NONE stored -- no Slack channel message has been ingested yet",
      notionPages: sources.notion > 0
        ? `${sources.notion} stored`
        : "NONE stored -- no Notion source is being read",
      oleraWrittenRecord: `${sources.archive} stored`,
      directMessages: "NEVER ingested, and never can be. A Slack bot cannot read direct messages between two people; no permission grants it. This includes the founder's own DMs.",
      email: "NEVER ingested.",
      liveLookups: "Everything else is read live through your lookups: who pays and campaigns, shipped work, ads engagement, and the scan's probes. Use them.",
    },
    "Matching passages from the written record and Slack": matches.map((row) => ({
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
  }));
}

const CONVERSATION_SYSTEM = `You are Cortex, the operating system for Olera, answering its founder in a Slack DM.

Two kinds of question reach you, and they have different rules.

About Olera -- its providers, families, revenue, campaigns, team, product, or anything in its record -- answer from the supplied record and your lookups only. Never invent a number, an owner, a date, or a status about Olera.

About the world -- other companies, markets, technology, people in the news, how something works, whether a claim is true -- think freely, the way a sharp chief of staff would. Answer from what you know, and use web search for anything current, numeric, or checkable, since what you know can be out of date. Name your sources briefly and say how confident you are. Never refuse a question because it is not about Olera. Mention Olera only when there is a real, specific connection; never force one.

You have lookups: named, read-only readers over Olera's systems of record. Call the ones the question needs before answering; they are live and outrank the written record. Call several at once when the question spans them. Never say you cannot see something until you have checked whether a lookup covers it; if none does and the question is about Olera, call nothing_fits with what would have answered it, then tell the founder plainly what you could not see and that it has been noted.

When the record does not contain the answer, distinguish two very different cases and never blur them:

If the relevant source IS ingested and simply holds nothing, say the record shows nothing and that you would expect it to.

If the relevant source IS ingested but the question is about something recent, check when the daily copies were last refreshed. When the event could postdate the last refresh, say when the record was last refreshed rather than implying it did not happen.

When a search of the written record or Slack comes up empty, check where your copy is behind before saying something does not exist, and say which channel or source is stale. Names in the record are full names; the founder may use a short, misspelled or voice-dictated form, so match loosely on part of a name and on a channel's topic rather than its exact name.

If the relevant source is NOT ingested, say you cannot see it. Read what Cortex can and cannot see before answering anything about a person, a conversation, a message, an email or a meeting. Cortex cannot read direct messages or email at all. Saying "the record contains no mention" when you were never able to look is misleading, and it is the failure this instruction exists to prevent. Name the specific thing you cannot see.

Write for a phone screen. No markdown headers, no bullet lists, no tables. Two or three short paragraphs at most, and one is often right. Slack bold is single asterisks.

Lead with the answer. Do not restate the question. You are talking to the founder: call him "you" and his rules "your", never "the founder". Call people by the names in the record and never derive a name from a username. Never quote the record's section names or field names; say what they mean. Do not offer to help further.

Never end your reply with a question. Your replies are delivered into the same channel you read from, and a trailing question mark makes a reply look like a new question.

Questions about who pays, who subscribed, who requested a campaign, or what ended are answered with the managed_ads_subscriptions lookup. It is read live from the database and outranks any message or document; a subscription is never something to look for in Slack. A campaign row is not a provider request: the counts separate campaigns the provider asked for from ones Olera created without a request, such as a pilot, and the team's note says why. Never call an Olera-created campaign a provider request. Say a campaign is live only when its state says live; "created" is not "live", and a draft is not running. Use their counts for any count or "this week" question rather than counting rows yourself, and give the dates. If they are unavailable, say you could not read them.

Questions about what was built, shipped, merged or deployed are answered with the shipped_work lookup first. It is live, so it outranks the written record. Name the pull request number. Whether it has reached production, and which promotion carried it, are already worked out on each pull (inProduction, reachedProductionIn); never recompute them from timestamps. To say what a promotion shipped, use that promotion's carried list and carriedCount exactly. Work per person is mergedByAuthor, each with its count; use that count and list every pull under it, never a subset. If it is unavailable, say you could not read it.

Questions about whether providers have seen, used, tapped or dismissed something, or whether a change "is working", are answered with the ads_engagement lookup. Counts and names are already worked out; never count or compare yourself. To judge a change, first find the release whose carried list contains it; never assume the latest release. Then compare what happened since it went live with the same hours one week earlier, and say how many hours it has been live. Test profiles are already excluded. For week-on-week, use the direction already given; never judge up or down yourself. A request that was later deleted is not a request; say it was withdrawn or deleted. Engagement is not revenue: a tap is not a request and a request is not a subscription, so say which one you are reporting.

Questions about which providers to follow up with, nurture toward subscribing, or who received the most leads are answered with the providers lookup; for anything about selling Managed Ads, set ads_fit_only. Its order is his own ranking, so to him it is "your order": engagement first (replied to Olera, then replied to families, then active in the product), then leads delivered. Keep that order, say briefly why each name ranks where it does, and leave out providers who already pay when he asks who is next to nurture. A reply sent to the founder's own inbox is not recorded unless it was logged, so "has not replied to Olera" means none on record.

All times in the record are already in US Eastern (ET), which is how the business runs. The founder lives in Bangkok; his local time is given under the current time. Never convert time zones yourself, and never quote a raw timestamp.

Refer to a provider by its name, or as "they". Never give a business or its owner a gender you were not told. Do not comment on which calendar day something falls on in one time zone or another.

Correct the founder only when something he states is wrong in a way that would change a decision. Never correct wording, rounding, or which day something counts as.`;

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
    const messages: Anthropic.MessageParam[] = [{
      role: "user",
      content: priorTurn
        // The previous turn is supplied verbatim so a correction reads as a
        // correction. "Aging in America" after a question about "Asian in
        // America" is a fix to the question, not a new topic.
        ? `RECORD:\n${context}\n\nEARLIER IN THIS CONVERSATION\nHe asked: ${priorTurn.question}\nYou answered: ${priorTurn.answer}\n\nHE NOW SAYS:\n${question}\n\nIf this corrects or narrows what he just asked, treat it as the corrected question and answer that. Do not ask him to repeat himself.`
        : `RECORD:\n${context}\n\nFOUNDER ASKS:\n${question}`,
    }];

    // The model picks lookups; the server runs them and hands back results.
    // Bounded twice: rounds, and a wall-clock budget inside the Slack route's
    // limit, after which it must answer with what it has.
    const deadline = Date.now() + LOOKUP_BUDGET_MS;
    // Web search is a server tool: Anthropic runs it and returns results in the
    // same response. On 2026-09-23 the founder asked whether Telegram really
    // has about thirty employees and a billion users, and Cortex answered that
    // Telegram "isn't a subject the Olera record would ever cover". The
    // record-only rule exists to stop invented Olera numbers; it was never
    // meant to make Cortex unable to think about the world.
    const tools = [
      ...LOOKUP_TOOLS,
      SUPPORTS_ADAPTIVE
        ? { type: "web_search_20260209" as const, name: "web_search" as const, max_uses: 3 }
        : { type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 3 },
    ];
    let message: Anthropic.Message | null = null;
    for (let round = 0; round <= MAX_LOOKUP_ROUNDS; round += 1) {
      const outOfBudget = round === MAX_LOOKUP_ROUNDS || Date.now() > deadline;
      message = await anthropic.messages.create({
        model: CONVERSATION_MODEL,
        max_tokens: MAX_ANSWER_TOKENS,
        // Adaptive thinking stays on: it is what made Sonnet correct a wrong
        // premise instead of agreeing with it. Medium, not low: at low it said "five PRs" and listed seven.
        ...(SUPPORTS_ADAPTIVE ? { thinking: { type: "adaptive" as const }, output_config: { effort: "medium" as const } } : {}),
        system: CONVERSATION_SYSTEM,
        tools,
        // Out of rounds or time: no more lookups, answer from what is in hand.
        tool_choice: outOfBudget ? { type: "none" } : { type: "auto" },
        messages,
      });
      // A long server-side search can pause the turn; hand it back to continue.
      if (message.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: message.content });
        continue;
      }
      if (message.stop_reason !== "tool_use") break;
      const calls = message.content.filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
      // Thinking and tool calls go back unchanged, as the API requires.
      messages.push({ role: "assistant", content: message.content });
      const results = await Promise.all(calls.map(async (call) => ({
        type: "tool_result" as const,
        tool_use_id: call.id,
        content: JSON.stringify(await runLookup(db, call.name, (call.input ?? {}) as Record<string, unknown>)).slice(0, LOOKUP_RESULT_CHARS),
      })));
      messages.push({ role: "user", content: results });
    }
    // Web search answers arrive as several text blocks split at each citation.
    // Joined with newlines, sentences broke mid-line in Slack; they are one
    // flow of prose, so they join with nothing.
    const textBlocks = (message?.content ?? [])
      .filter((block): block is Anthropic.TextBlock => block.type === "text");
    let reply = textBlocks.map((block) => block.text).join("").replace(/\n{3,}/g, "\n\n").trim();
    // Sources as Slack links, deduplicated, so a claim about the world can be
    // checked from the phone.
    const sources = new Map<string, string>();
    for (const block of textBlocks) {
      for (const citation of block.citations ?? []) {
        if (citation.type === "web_search_result_location" && citation.url && !sources.has(citation.url)) {
          sources.set(citation.url, (citation.title ?? citation.url).replace(/[|<>]/g, " ").slice(0, 60));
        }
      }
    }
    if (reply && sources.size) {
      reply += `\n\n_Sources: ${[...sources].slice(0, 4).map(([url, title]) => `<${url}|${title}>`).join(" · ")}_`;
    }
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
