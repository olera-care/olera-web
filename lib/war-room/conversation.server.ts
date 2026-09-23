import Anthropic from "@anthropic-ai/sdk";
import { PROVIDER_EVENT_LABELS } from "@/lib/activity/provider-categories";
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

/**
 * The Managed Ads ledger, read live.
 *
 * On 2026-09-23 the founder asked "have any providers subscribed to managed ads
 * in the past week besides Hoop Cares?" Cortex answered from Slack: it said a
 * subscription notification would land in a DM it cannot read, then reported
 * that none of 93 channel messages mentioned one. The answer happened to be
 * right, and the reasoning was wrong: a subscription is a row in
 * `ad_campaign_requests`, not a message. This context carried no product data
 * at all, so the one number the north star counts could only be guessed at from
 * chatter.
 *
 * Small on purpose: every paying provider, and every request, subscription or
 * ending in the last thirty days. Enough to answer "who pays" and "what changed
 * this week" without sending the scan's operating pack.
 */
const LEDGER_WINDOW_DAYS = 30;

async function loadManagedAdsLedger(db: SupabaseClient) {
  const since = new Date(Date.now() - LEDGER_WINDOW_DAYS * 86_400_000).toISOString();
  const { data, error } = await db.from("ad_campaign_requests")
    .select("display_name, provider_slug, status, plan_status, channel, admin_note, created_at, subscribed_at, ended_at, updated_at")
    .is("deleted_at", null)
    .or(`plan_status.in.(active,past_due),created_at.gte.${since},subscribed_at.gte.${since},ended_at.gte.${since},and(plan_status.eq.canceled,updated_at.gte.${since})`)
    .order("created_at", { ascending: false })
    .limit(40);
  // A failed read must say so. Returning an empty ledger would read as "nobody
  // pays", which is the confident wrong answer this block exists to replace.
  if (error) return { unavailable: `Could not read the Managed Ads ledger: ${error.message}` };
  type LedgerRow = { display_name: string | null; provider_slug: string | null; status: string; plan_status: string | null; channel: string | null; admin_note: string | null; created_at: string; subscribed_at: string | null; ended_at: string | null; updated_at: string | null };
  // Paying means what the admin revenue chip means: active or past_due. A
  // failed card is still a subscriber until Stripe cancels, and counting only
  // "active" would have Cortex report zero paying providers the day Hoop Cares'
  // card bounced while the admin page still showed one.
  const isPaying = (row: LedgerRow) => row.plan_status === "active" || row.plan_status === "past_due";
  const rows = (data ?? []) as LedgerRow[];
  const day = (iso: string | null) => (iso ? iso.slice(0, 10) : null);
  // Did the provider ask, or did Olera create the row? A campaign row is not
  // proof of a provider request. On 2026-09-16 three rows were created in the
  // same second at 4 AM Eastern -- TJ's Nextdoor question pilot, drafts Olera
  // set up -- and Cortex reported all day that "three providers requested".
  // A provider request fires `managed_ads_requested` from the form; a row with
  // no such event within a day of its creation was not asked for by them.
  const slugs = rows.map((row) => row.provider_slug).filter((slug): slug is string => Boolean(slug));
  const { data: requestEvents } = slugs.length
    ? await db.from("provider_activity")
      .select("provider_id, created_at")
      .eq("event_type", "managed_ads_requested")
      .in("provider_id", slugs)
      .gte("created_at", new Date(Date.now() - (LEDGER_WINDOW_DAYS + 1) * 86_400_000).toISOString())
    : { data: [] };
  const providerAsked = (row: LedgerRow) => ((requestEvents ?? []) as Array<{ provider_id: string; created_at: string }>)
    .some((event) => event.provider_id === row.provider_slug
      && Math.abs(new Date(event.created_at).getTime() - new Date(row.created_at).getTime()) < 86_400_000);
  // Counted here, not by the model. Given only the rows it said "three
  // providers requested" and then listed four, and called a subscription eight
  // days old "in the past week".
  const within = (iso: string | null, days: number) =>
    Boolean(iso && Date.now() - new Date(iso).getTime() <= days * 86_400_000);
  // Names, not only numbers. With bare counts it still wrote that Hoop Cares
  // subscribed "in the past week" beside a seven-day count of zero; an empty
  // list is harder to talk past than a 0.
  const names = (keep: (row: LedgerRow) => boolean) => rows.filter(keep).map((row) => row.display_name ?? "unnamed");
  const counts = (days: number) => ({
    requestedByTheProvider: names((row) => within(row.created_at, days) && providerAsked(row)),
    createdByOleraWithoutAProviderRequest: names((row) => within(row.created_at, days) && !providerAsked(row)),
    subscribed: names((row) => within(row.subscribed_at, days)),
    ended: names((row) => within(row.ended_at, days)),
    canceled: names((row) => row.plan_status === "canceled" && within(row.updated_at, days)),
  });
  return {
    asOf: new Date().toISOString(),
    windowDays: LEDGER_WINDOW_DAYS,
    counts: { last7Days: counts(7), last30Days: counts(LEDGER_WINDOW_DAYS) },
    payingProviders: rows.filter(isPaying)
      .map((row) => ({ name: row.display_name, subscribedOn: day(row.subscribed_at), planStatus: row.plan_status })),
    recentActivity: rows.map((row) => ({
      name: row.display_name,
      status: row.status,
      paying: isPaying(row),
      planStatus: row.plan_status,
      providerAsked: providerAsked(row),
      channel: row.channel,
      teamNote: row.admin_note ? row.admin_note.slice(0, 200) : null,
      // The webhook stamps no cancellation date; updated_at is the closest.
      canceledAround: row.plan_status === "canceled" ? day(row.updated_at) : null,
      requestedOn: day(row.created_at),
      subscribedOn: day(row.subscribed_at),
      endedOn: day(row.ended_at),
    })),
  };
}

/**
 * What shipped, read live from GitHub.
 *
 * "Do you know the recent work we did on the ads nudge? I think we shipped
 * that yesterday." The written record is a copy refreshed once a day, and that
 * work was written up after the copy. But whether something shipped is not a
 * matter of anyone writing it down: it is a merged pull request. Same lesson as
 * the Managed Ads ledger, a fact with a system of record is read from it.
 *
 * Seven days of merges into staging, and the promotions to main that carried
 * them to production. Titles only; a PR body is not needed to say what shipped.
 */
const SHIPPED_WINDOW_DAYS = 7;

// GitHub logins to the names people use, from docs/MERGE_PERMISSIONS.md. Given
// only "tfalohun" the model called the founder "Tobi". An unmapped login is
// passed through as-is rather than guessed at.
const GITHUB_NAMES: Record<string, string> = {
  tfalohun: "TJ",
  logan447: "Logan",
  Efuanyamekye: "Efua",
  "chantel-stack": "Chantel",
  jakub300: "Jakub",
};

async function loadRecentlyShipped() {
  const token = process.env.WAR_ROOM_GITHUB_TOKEN;
  const repository = process.env.WAR_ROOM_GITHUB_REPOSITORY;
  if (!token || !repository) return { unavailable: "GitHub is not configured for Cortex, so what shipped cannot be read." };
  const since = Date.now() - SHIPPED_WINDOW_DAYS * 86_400_000;
  // One budget for the whole read. The Slack route has thirty seconds for
  // everything, and up to ten sequential GitHub calls at eight seconds each
  // could outlast it and leave the founder with no reply at all.
  const deadline = Date.now() + 8_000;
  let partial = false;
  type PullRow = { number: number; title: string; merged_at: string | null; updated_at: string; user: { login: string } | null; head: { ref: string } | null };
  // Paged until the pulls are older than the window. One page of fifty was the
  // first version, and staging takes more than fifty merges a week: it counted
  // Efua's week as nine when GitHub has fourteen.
  const read = async (base: string) => {
    const pulls: PullRow[] = [];
    for (let page = 1; page <= 5; page += 1) {
      const remaining = deadline - Date.now();
      if (remaining < 500) {
        partial = true;
        break;
      }
      const response = await fetch(
        `https://api.github.com/repos/${repository}/pulls?state=closed&base=${base}&sort=updated&direction=desc&per_page=100&page=${page}`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
          signal: AbortSignal.timeout(remaining),
        },
      );
      if (!response.ok) throw new Error(`GitHub ${response.status}`);
      const batch = (await response.json()) as PullRow[];
      pulls.push(...batch);
      // Sorted by last update, and a merge is an update, so once a page ends
      // before the window nothing later can have merged inside it.
      if (batch.length < 100 || new Date(batch[batch.length - 1].updated_at).getTime() < since) break;
    }
    return pulls
      .filter((pull) => pull.merged_at && new Date(pull.merged_at).getTime() >= since)
      .map((pull) => ({ number: pull.number, title: pull.title, mergedAt: pull.merged_at, author: pull.user?.login ? (GITHUB_NAMES[pull.user.login] ?? pull.user.login) : null, fromBranch: pull.head?.ref ?? null }));
  };
  try {
    const [toStaging, toProduction] = await Promise.all([read("staging"), read("main")]);
    // Worked out here, not by the model. Left to compare timestamps it said
    // #2085 had not reached production when it merged 34 minutes before the
    // promotion that carried it, and counted Efua's week as five, then seven.
    // Promotions are merged from staging, so any staging merge earlier than
    // the newest promotion is live. That holds while main is only ever
    // reached through staging; a hotfix straight to main does not break it.
    const latestPromotion = toProduction
      .filter((pull) => pull.fromBranch === "staging")
      .map((pull) => pull.mergedAt as string)
      .sort()
      .at(-1) ?? null;
    // Which promotion carried each merge: the first one to land after it.
    // Without this, "what went to production today?" named four of the five
    // pulls a promotion carried and credited all of them to one author.
    // Only staging -> main merges carry staging work; a hotfix to main does not.
    const promotions = toProduction.filter((pull) => pull.fromBranch === "staging").sort((a, b) => (a.mergedAt as string).localeCompare(b.mergedAt as string));
    const merged = toStaging.map((pull) => {
      const carrier = promotions.find((promotion) => (promotion.mergedAt as string) > (pull.mergedAt as string));
      return {
        ...pull,
        inProduction: Boolean(carrier),
        reachedProductionIn: carrier ? { promotion: carrier.number, at: carrier.mergedAt } : null,
      };
    });
    // Grouped by person with the count beside the list, so the two cannot
    // disagree. A separate tally and a flat list produced "6" beside nine.
    const byAuthor: Record<string, { count: number; pulls: typeof merged }> = {};
    for (const pull of merged) {
      const key = pull.author ?? "unknown";
      byAuthor[key] ??= { count: 0, pulls: [] };
      byAuthor[key].count += 1;
      byAuthor[key].pulls.push(pull);
    }
    return {
      windowDays: SHIPPED_WINDOW_DAYS,
      ...(partial ? { incomplete: "GitHub was slow and only part of the week was read. Say the list may be missing older merges; do not present counts as complete." } : {}),
      totalMergedToStaging: merged.length,
      latestPromotionToProduction: latestPromotion,
      mergedByAuthor: byAuthor,
      // Each promotion with everything it carried and the count, so "what went
      // live today" is read off one list. Gathering it from per-pull fields,
      // the model said five on two runs and four on the third.
      promotedToProduction: toProduction.map(({ number, title, mergedAt, fromBranch }) => {
        const carried = merged
          .filter((pull) => pull.reachedProductionIn?.promotion === number)
          .map((pull) => ({ number: pull.number, title: pull.title, author: pull.author }));
        return { number, title, mergedAt, isHotfix: fromBranch !== "staging", carriedCount: carried.length, carried };
      }),
    };
  } catch (error) {
    // Said, not swallowed: an empty list would read as "nothing shipped".
    return { unavailable: `Could not read GitHub: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * How providers are engaging with the Managed Ads surfaces, read live.
 *
 * On 2026-09-23, two hours after a new ads nudge went live, the founder asked
 * "any signs of it working? Have providers seen the newer version and engaged
 * with it?" Cortex answered that it had no visibility, which was false: every
 * showing, tap and dismissal of the nudge is a row in `provider_activity`. It
 * simply did not read that table. Third time in a day the same lesson: a fact
 * with a system of record is read from it.
 *
 * Counted in code, per event, as distinct providers with their names. And
 * per release: engagement since each recent promotion went live against the
 * same span one week earlier, so "is it working" compares like with like --
 * same weekday, same hours -- instead of this afternoon against a whole week.
 */
const ADS_EVENTS = [
  "ads_touchpoint_viewed",
  "ads_touchpoint_clicked",
  "ads_touchpoint_dismissed",
  "managed_ads_pitch_viewed",
  "managed_ads_cta_clicked",
  "managed_ads_boost_viewed",
  "managed_ads_requested",
  "managed_ads_not_now",
] as const;
const ENGAGEMENT_ROW_CAP = 10_000;

type PromotionTime = { number: number; title: string; mergedAt: string | null };

async function loadAdsEngagement(db: SupabaseClient, promotions: PromotionTime[]) {
  const now = Date.now();
  const since = new Date(now - 21 * 86_400_000).toISOString();
  const [{ data, error }, deletedResult] = await Promise.all([
    db.from("provider_activity")
      .select("provider_id, event_type, created_at, metadata")
      .in("event_type", ADS_EVENTS as unknown as string[])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(ENGAGEMENT_ROW_CAP),
    // A request event is written when the form submits; the campaign row can
    // be deleted minutes later. On 2026-09-23 Aggie Home Care's request was
    // deleted four minutes after it was made, and Cortex offered it as the one
    // sign the new nudge was working.
    db.from("ad_campaign_requests")
      .select("provider_slug, created_at")
      .not("deleted_at", "is", null)
      .gte("created_at", since),
  ]);
  if (error) return { unavailable: `Could not read provider engagement: ${error.message}` };
  const deletedRequests = (deletedResult.data ?? []) as Array<{ provider_slug: string | null; created_at: string }>;
  const requestWasDeleted = (row: { provider_id: string | null; created_at: string }) =>
    deletedRequests.some((request) =>
      request.provider_slug === row.provider_id
      && Math.abs(new Date(request.created_at).getTime() - new Date(row.created_at).getTime()) < 10 * 60_000);
  type Row = { provider_id: string | null; event_type: string; created_at: string; metadata: Record<string, unknown> | null };
  const nameOf = (row: Row) => String(row.metadata?.provider_name ?? row.provider_id ?? "unknown");
  // Test profiles are the team clicking through its own work. On 2026-09-22
  // the only showing of the nudge after 21:00 UTC was "(Test) Effy's Homecare".
  const rows = ((data ?? []) as Row[]).filter((row) =>
    !(row.provider_id ?? "").startsWith("test-") && !nameOf(row).startsWith("(Test)"));

  const summarize = (from: number, to: number) => {
    const inWindow = rows.filter((row) => {
      const at = new Date(row.created_at).getTime();
      return at >= from && at < to;
    });
    const byEvent: Record<string, { providers: number; names: string[]; events: number }> = {};
    const withdrawn = [...new Set(inWindow
      .filter((row) => row.event_type === "managed_ads_requested" && requestWasDeleted(row))
      .map(nameOf))];
    for (const eventType of ADS_EVENTS) {
      const hits = inWindow.filter((row) => row.event_type === eventType
        && !(eventType === "managed_ads_requested" && requestWasDeleted(row)));
      const names = [...new Set(hits.map(nameOf))];
      if (hits.length) byEvent[PROVIDER_EVENT_LABELS[eventType] ?? eventType] = { providers: names.length, names: names.slice(0, 15), events: hits.length };
    }
    // Which placement showed the nudge: a new placement and an old one read
    // very differently.
    const shownBy: Record<string, number> = {};
    for (const row of inWindow.filter((r) => r.event_type === "ads_touchpoint_viewed")) {
      const placement = String(row.metadata?.touchpoint ?? "unknown");
      shownBy[placement] = (shownBy[placement] ?? 0) + 1;
    }
    return {
      byEvent,
      ...(withdrawn.length ? { requestsLaterDeleted: withdrawn } : {}),
      nudgeShowingsByPlacement: shownBy,
      anyActivity: inWindow.length > 0,
    };
  };

  const recent = promotions
    .filter((promotion) => promotion.mergedAt)
    .sort((a, b) => (b.mergedAt as string).localeCompare(a.mergedAt as string))
    .slice(0, 3)
    .map((promotion) => {
      const at = new Date(promotion.mergedAt as string).getTime();
      return {
        promotion: promotion.number,
        title: promotion.title,
        liveSince: promotion.mergedAt,
        hoursLive: Math.round((now - at) / 3_600_000),
        sinceItWentLive: summarize(at, now),
        sameHoursOneWeekEarlier: summarize(at - 7 * 86_400_000, now - 7 * 86_400_000),
      };
    });

  // Direction worked out here. Given both weeks side by side, the model wrote
  // that page views "rose from 12 providers to 9".
  const thisWeek = summarize(now - 7 * 86_400_000, now);
  const lastWeek = summarize(now - 14 * 86_400_000, now - 7 * 86_400_000);
  const weekOverWeek = Object.fromEntries(
    [...new Set([...Object.keys(thisWeek.byEvent), ...Object.keys(lastWeek.byEvent)])].map((label) => {
      const current = thisWeek.byEvent[label]?.providers ?? 0;
      const prior = lastWeek.byEvent[label]?.providers ?? 0;
      return [label, {
        providersThisWeek: current,
        providersLastWeek: prior,
        direction: current > prior ? "up" : current < prior ? "down" : "flat",
      }];
    }),
  );
  return {
    ...(rows.length >= ENGAGEMENT_ROW_CAP ? { incomplete: "Hit the row cap; older activity may be missing." } : {}),
    testProfilesExcluded: true,
    latestActivity: rows[0]?.created_at ?? null,
    weekOverWeek,
    last7Days: thisWeek,
    previous7Days: lastWeek,
    sinceEachRecentRelease: recent,
    note: "Providers mostly use the product in US business hours. A release that has only been live overnight Eastern has had almost no chance to be seen; say so rather than reading silence as failure.",
  };
}

/**
 * Every timestamp in the record, rendered in US Eastern before the model sees
 * it. The business runs on Eastern and the admin pages already do; the model
 * was left to convert UTC itself and told the founder "yesterday is not quite
 * right" about a merge that was yesterday evening in the US and this morning
 * in Bangkok. It never does time-zone arithmetic now.
 */
const EASTERN = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
});
const BANGKOK = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Bangkok", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
});
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function inEastern(value: unknown): unknown {
  if (typeof value === "string" && ISO_DATETIME.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : `${EASTERN.format(date)} ET`;
  }
  if (Array.isArray(value)) return value.map(inEastern);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, inEastern(inner)]));
  }
  return value;
}

async function buildConversationContext(
  db: SupabaseClient,
  focusInvestigationId?: string | null,
  question?: string,
): Promise<string> {
  const [investigations, proposals, model, matches, sources, managedAds, refreshed, shipped] = await Promise.all([
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
    loadManagedAdsLedger(db),
    lastIngested(db),
    loadRecentlyShipped(),
  ]);

  const rows = (investigations.data ?? []) as InvestigationRow[];
  const focus = focusInvestigationId ? rows.find((row) => row.id === focusInvestigationId) : undefined;
  // After the GitHub read, because "since it went live" needs the promotion times.
  const engagement = await loadAdsEngagement(
    db,
    "promotedToProduction" in shipped ? (shipped.promotedToProduction as PromotionTime[]) : [],
  );

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
      managedAdsSubscriptions: "LIVE, read from the database at the moment of this question.",
      shippedWork: "LIVE, pull requests merged in the last 7 days, read from GitHub at the moment of this question.",
      providerEngagementWithAds: "LIVE, every showing, tap and dismissal of the ads nudge and pitch, read from product analytics at the moment of this question.",
    },
    "Managed Ads subscriptions (live)": managedAds,
    "Shipped work from GitHub (live)": shipped,
    "Provider engagement with Managed Ads (live)": engagement,
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

Answer from the supplied record only. Never invent a number, an owner, a date, or a status.

When the record does not contain the answer, distinguish two very different cases and never blur them:

If the relevant source IS ingested and simply holds nothing, say the record shows nothing and that you would expect it to.

If the relevant source IS ingested but the question is about something recent, check when the daily copies were last refreshed. When the event could postdate the last refresh, say when the record was last refreshed rather than implying it did not happen.

If the relevant source is NOT ingested, say you cannot see it. Read what Cortex can and cannot see before answering anything about a person, a conversation, a message, an email or a meeting. Cortex cannot read direct messages or email at all. Saying "the record contains no mention" when you were never able to look is misleading, and it is the failure this instruction exists to prevent. Name the specific thing you cannot see.

Write for a phone screen. No markdown headers, no bullet lists, no tables. Two or three short paragraphs at most, and one is often right. Slack bold is single asterisks.

Lead with the answer. Do not restate the question. Call people by the names in the record and never derive a name from a username. Never quote the record's section names or field names; say what they mean. Do not offer to help further.

Never end your reply with a question. Your replies are delivered into the same channel you read from, and a trailing question mark makes a reply look like a new question.

Questions about who pays, who subscribed, who requested a campaign, or what ended are answered from the Managed Ads subscriptions. They are read live from the database, so it outranks any message or document, and a subscription is never something to look for in Slack. A campaign row is not a provider request: the counts separate campaigns the provider asked for from ones Olera created without a request, such as a pilot, and the team's note says why. Never call an Olera-created campaign a provider request. Use their counts for any count or "this week" question rather than counting rows yourself, and give the dates. If they are unavailable, say you could not read them.

Questions about what was built, shipped, merged or deployed are answered from the shipped work first. It is live, so it outranks the written record. Name the pull request number. Whether it has reached production, and which promotion carried it, are already worked out on each pull (inProduction, reachedProductionIn); never recompute them from timestamps. To say what a promotion shipped, use that promotion's carried list and carriedCount exactly. Work per person is mergedByAuthor, each with its count; use that count and list every pull under it, never a subset. If it is unavailable, say you could not read it.

Questions about whether providers have seen, used, tapped or dismissed something, or whether a change "is working", are answered from the provider engagement. Counts and names are already worked out; never count or compare yourself. To judge a release, compare what happened since it went live with the same hours one week earlier, and say how many hours it has been live. Test profiles are already excluded. For week-on-week, use the direction already given; never judge up or down yourself. A request that was later deleted is not a request; say it was withdrawn or deleted. Engagement is not revenue: a tap is not a request and a request is not a subscription, so say which one you are reporting.

All times in the record are already in US Eastern (ET), which is how the business runs. The founder lives in Bangkok; his local time is given under the current time. Never convert time zones yourself, and never quote a raw timestamp.

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
    const message = await anthropic.messages.create({
      model: CONVERSATION_MODEL,
      max_tokens: MAX_ANSWER_TOKENS,
      // Adaptive thinking stays on: it is what made Sonnet correct a wrong
      // premise instead of agreeing with it. Medium, not low: at low it said "five PRs" and listed seven.
      ...(SUPPORTS_ADAPTIVE ? { thinking: { type: "adaptive" as const }, output_config: { effort: "medium" as const } } : {}),
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
