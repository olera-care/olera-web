import type { SupabaseClient } from "@supabase/supabase-js";
import type { WarRoomProposalEvidence } from "@/lib/war-room/types";

/**
 * The founder loop.
 *
 * War Room stalls on questions that are not database queries. Every
 * investigation carries `unknowns` and a `readiness_reason` that reads as a
 * question, `cause_confidence` cannot rise until those resolve, and probes only
 * resolve the ones that happen to be SQL. Everything else needs someone who
 * already knows the answer.
 *
 * Before this there was no path for that knowledge to enter the system. On
 * 2026-09-20 the GA4 bot-traffic caveat — the answer to a condition that had
 * recurred 34 times — got in because a human hand-wrote it into a config row.
 * That is a courier, not a mechanism.
 *
 * This is the mechanism: the daily brief asks one question, the reply is
 * captured from Slack, and it becomes evidence on the next scan exactly as
 * `probe_completed` already does.
 */

type InvestigationRow = {
  id: string;
  title: string;
  domain: string | null;
  impact: string | null;
  strategic_fit: string | null;
  status: string | null;
  unknowns: unknown;
  readiness_reason: string | null;
};

export type FounderQuestion = {
  investigationId: string;
  title: string;
  question: string;
};

function firstUnknown(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === "string" && entry.trim().length > 12);
    return typeof first === "string" ? first.trim() : null;
  }
  return null;
}

/**
 * How many re-observations without progress before a condition stops being a
 * finding and becomes a question about whether we are going to do anything.
 * Twenty is roughly three weeks of daily scans -- long enough that it is not
 * noise, short enough that it does not reach forty-two.
 */
const RECURRENCE_ESCALATION_THRESHOLD = 20;

type StalledRow = InvestigationRow & {
  occurrence_count: number | null;
  first_seen_at: string | null;
  resolution_evidence: unknown[] | null;
};

/**
 * Investigations already put to the founder recently.
 *
 * Without this the picker re-asks the same thing every morning. The ranking is
 * deterministic — on 2026-09-21 all seven investigating rows scored identically
 * on impact and strategic fit, so the tiebreak fell to `updated_at` and the same
 * unknown would have come up day after day whether or not he had answered it.
 * `brief-delivery.server.ts` already guards against delivering one brief twice
 * for the same reason; an ask repeated daily is the same defect one layer up,
 * and it is the thing that teaches someone to stop reading a channel.
 *
 * Silence is the correct output when every open investigation has been asked
 * about. The brief simply ends without a question, which it already handles.
 */
const FOUNDER_ASK_COOLDOWN_DAYS = 14;

async function loadRecentlyAskedInvestigations(db: SupabaseClient): Promise<Set<string>> {
  const since = new Date(Date.now() - FOUNDER_ASK_COOLDOWN_DAYS * 86_400_000).toISOString();
  const { data, error } = await db.from("war_room_investigation_events")
    .select("investigation_id")
    .eq("event_type", "founder_asked")
    .gte("created_at", since)
    .limit(200);
  // A read failure must not silence the brief. Asking a question he has already
  // seen is a smaller harm than asking nothing at all.
  if (error) return new Set<string>();
  return new Set((data ?? []).map((row) => (row as { investigation_id: string }).investigation_id));
}

/**
 * The single question most worth a founder's attention right now.
 *
 * Deliberately one, not a list. The whole design of this system is that it
 * spends its compute eliminating work before the founder sees it, and a brief
 * that ends in six questions is a brief that gets none of them answered.
 *
 * Ranked by the same properties the agenda gate cares about — high impact and
 * central strategic fit first — so the question asked is the one whose answer
 * would unblock the most.
 */
export async function pickQuestionForFounder(db: SupabaseClient): Promise<FounderQuestion | null> {
  const { data, error } = await db.from("war_room_investigations")
    .select("id, title, domain, impact, strategic_fit, status, unknowns, readiness_reason, occurrence_count, first_seen_at, resolution_evidence")
    .eq("status", "investigating")
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error || !data?.length) return null;

  const recentlyAsked = await loadRecentlyAskedInvestigations(db);

  // A condition that keeps coming back and never moves outranks every other
  // question, because it is the one the system has been failing at longest.
  //
  // On 2026-09-21 nine conditions had been re-observed between 25 and 42 times
  // since 2026-08-16, every one with empty `resolution_evidence` and no
  // proposal ever raised. Cortex re-confirmed the same nine facts every morning
  // for 36 days and nothing escalated, nothing closed. TJ: "it ran 42 times and
  // nothing happened."
  //
  // Recurrence without progress is not new information, so asking about the
  // condition itself wastes the one question. The useful question is about the
  // system's relationship to it: does this deserve a plan, or should it stop
  // being rediscovered? That is a decision only the founder can make, and it is
  // the one that unsticks the queue.
  //
  // Deliberately keyed on `occurrence_count` and empty `resolution_evidence`
  // rather than `last_progress_at`. That field was set on evidence-hash drift
  // until today, so every row currently claims progress as of this morning; it
  // will only become trustworthy after a fortnight of honest writes.
  const stalled = (data as StalledRow[])
    .filter((row) => !recentlyAsked.has(row.id))
    .filter((row) => (row.occurrence_count ?? 0) >= RECURRENCE_ESCALATION_THRESHOLD)
    .filter((row) => !(row.resolution_evidence?.length))
    .sort((a, b) => (b.occurrence_count ?? 0) - (a.occurrence_count ?? 0))[0];
  if (stalled) {
    const since = typeof stalled.first_seen_at === "string" ? stalled.first_seen_at.slice(0, 10) : "it was first seen";
    return {
      investigationId: stalled.id,
      title: stalled.title,
      question: `This has been observed ${stalled.occurrence_count} times since ${since} and has never moved: no resolved unknown, no proposal, no closure. Is it worth a real plan, or should it stop being raised? Either answer is useful. "Close it" is a decision, not a failure.`,
    };
  }
  const rows = (data as InvestigationRow[]).filter((row) => !recentlyAsked.has(row.id));
  if (!rows.length) return null;
  const ranked = [...rows].sort((a, b) => {
    const score = (r: InvestigationRow) =>
      (r.impact === "high" ? 2 : r.impact === "medium" ? 1 : 0)
      + (r.strategic_fit === "central" ? 2 : r.strategic_fit === "adjacent" ? 1 : 0);
    return score(b) - score(a);
  });

  for (const row of ranked) {
    const question = firstUnknown(row.unknowns) ?? row.readiness_reason;
    if (question && question.trim().length > 12) {
      return { investigationId: row.id, title: row.title, question: question.trim() };
    }
  }
  return null;
}

/** Record that the brief asked this question, so a later reply has something to attach to. */
export async function recordFounderAsk(
  db: SupabaseClient,
  question: FounderQuestion,
  runId: string,
): Promise<boolean> {
  const { error } = await db.from("war_room_investigation_events").insert({
    investigation_id: question.investigationId,
    discovery_run_id: runId,
    event_type: "founder_asked",
    actor: "war-room",
    details: { question: question.question, title: question.title },
  });
  return !error;
}

/**
 * Attach an inbound Slack reply to the most recent question asked.
 *
 * Two things this deliberately does NOT do, both learned on 2026-09-21.
 *
 * It does not require the newest event to be an unanswered ask. That version
 * dropped every reply after the first one — silently, because the Slack route
 * still answers 200 and Slack has nowhere to show a capture failure. A founder
 * who answers, rethinks, and sends a correction lost the correction. A later
 * reply now supersedes: `loadFounderEvidence` dedupes by investigation keeping
 * the newest, so the last thing he said is what the next scan reasons with.
 *
 * It does not pretend to know which brief he is replying to. Slack DMs are not
 * threaded, so a reply typed today after today's scan has already asked about a
 * different investigation attaches to today's question, not yesterday's. The
 * previous comment here claimed replying "a day late" still worked; with a daily
 * cron that is false, and it filed answers against conditions he never read.
 * Latest-ask is the honest rule, and the brief tells him to just reply.
 */
export async function captureFounderAnswer(
  db: SupabaseClient,
  text: string,
): Promise<{ captured: boolean; investigationId?: string; reason?: string }> {
  const body = text.trim();
  if (body.length < 2) return { captured: false, reason: "empty reply" };

  const { data, error } = await db.from("war_room_investigation_events")
    .select("id, investigation_id, event_type, details, created_at")
    .eq("event_type", "founder_asked")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) return { captured: false, reason: error.message };

  const rows = (data ?? []) as Array<{ investigation_id: string; event_type: string; details: Record<string, unknown> | null }>;
  const newest = rows[0];
  if (!newest) {
    return { captured: false, reason: "nothing has been asked yet" };
  }

  const askedQuestion = typeof newest.details?.question === "string" ? newest.details.question : null;
  const { error: insertError } = await db.from("war_room_investigation_events").insert({
    investigation_id: newest.investigation_id,
    event_type: "founder_answered",
    actor: "founder",
    details: { answer: body.slice(0, 2_000), question: askedQuestion, answered_at: new Date().toISOString() },
  });
  if (insertError) return { captured: false, reason: insertError.message };
  return { captured: true, investigationId: newest.investigation_id };
}

/**
 * Founder answers as evidence, mirroring loadProbeEvidence.
 *
 * Trust is implicit and total here: this is the founder answering a question
 * about his own company, which is strictly better evidence than a probe. It is
 * dated so a six-month-old answer does not read as current.
 */
export async function loadFounderEvidence(db: SupabaseClient): Promise<WarRoomProposalEvidence[]> {
  const { data, error } = await db.from("war_room_investigation_events")
    .select("investigation_id, details, created_at")
    .eq("event_type", "founder_answered")
    .order("created_at", { ascending: false })
    // Fetch wide, keep few. Replies supersede rather than being dropped, so one
    // investigation answered repeatedly can own many rows; a tight fetch limit
    // would let it evict every other investigation's answer from the evidence
    // set. The distinct cap below is what actually bounds the prompt.
    .limit(200);
  if (error) return [];

  const MAX_DISTINCT_ANSWERS = 20;
  const seen = new Set<string>();
  const evidence: WarRoomProposalEvidence[] = [];
  for (const row of (data ?? []) as Array<{ investigation_id: string; details: Record<string, unknown> | null; created_at: string }>) {
    if (seen.has(row.investigation_id)) continue;
    seen.add(row.investigation_id);
    const answer = typeof row.details?.answer === "string" ? row.details.answer : "";
    const question = typeof row.details?.question === "string" ? row.details.question : null;
    if (!answer) continue;
    if (evidence.length >= MAX_DISTINCT_ANSWERS) break;
    evidence.push({
      id: `founder:${row.investigation_id}`,
      label: "Founder answer",
      detail: question ? `Asked: ${question}\nAnswered: ${answer}` : answer,
      source: `Olera founder, answered ${row.created_at.slice(0, 10)}`,
    });
  }
  return evidence;
}
