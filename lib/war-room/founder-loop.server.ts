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
    .select("id, title, domain, impact, strategic_fit, status, unknowns, readiness_reason")
    .eq("status", "investigating")
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error || !data?.length) return null;

  const rows = data as InvestigationRow[];
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
    event_type: "founder_asked",
    summary: question.question.slice(0, 500),
    details: { run_id: runId, question: question.question, title: question.title },
  });
  return !error;
}

/**
 * Attach an inbound Slack reply to the question it answers.
 *
 * "The most recent ask that has no answer after it." The brief asks at most one
 * question per scan, so this is unambiguous without threading Slack message ids
 * through the database — and it still works when he replies a day late.
 */
export async function captureFounderAnswer(
  db: SupabaseClient,
  text: string,
): Promise<{ captured: boolean; investigationId?: string; reason?: string }> {
  const body = text.trim();
  if (body.length < 2) return { captured: false, reason: "empty reply" };

  const { data, error } = await db.from("war_room_investigation_events")
    .select("id, investigation_id, event_type, summary, created_at")
    .in("event_type", ["founder_asked", "founder_answered"])
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) return { captured: false, reason: error.message };

  const rows = (data ?? []) as Array<{ investigation_id: string; event_type: string; summary: string | null }>;
  // Newest first, so the first ask we meet before meeting an answer is the open one.
  const newest = rows[0];
  if (!newest || newest.event_type !== "founder_asked") {
    return { captured: false, reason: "no open question" };
  }

  const { error: insertError } = await db.from("war_room_investigation_events").insert({
    investigation_id: newest.investigation_id,
    event_type: "founder_answered",
    summary: body.slice(0, 500),
    details: { answer: body.slice(0, 2_000), question: newest.summary ?? null, answered_at: new Date().toISOString() },
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
    .select("investigation_id, summary, details, created_at")
    .eq("event_type", "founder_answered")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return [];

  const seen = new Set<string>();
  const evidence: WarRoomProposalEvidence[] = [];
  for (const row of (data ?? []) as Array<{ investigation_id: string; summary: string | null; details: Record<string, unknown> | null; created_at: string }>) {
    if (seen.has(row.investigation_id)) continue;
    seen.add(row.investigation_id);
    const answer = typeof row.details?.answer === "string" ? row.details.answer : (row.summary ?? "");
    const question = typeof row.details?.question === "string" ? row.details.question : null;
    if (!answer) continue;
    evidence.push({
      id: `founder:${row.investigation_id}`,
      label: "Founder answer",
      detail: question ? `Asked: ${question}\nAnswered: ${answer}` : answer,
      source: `Olera founder, answered ${row.created_at.slice(0, 10)}`,
    });
  }
  return evidence;
}
