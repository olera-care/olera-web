import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * CR5 and CR6 — the actions a care recipient takes, not the pages they read.
 *
 * Each is a count of a single event type, so the database does the counting
 * and nothing comes back but the numbers.
 *
 *   CR5   questions asked     provider_question_asks
 *   CR6a  benefits CTAs       seeker_activity   benefits_completed
 *   CR6b  connection CTAs     provider_activity lead_received
 *   CR6c  profiles made live  seeker_activity   matches_activated
 *
 * CR5 reads `provider_question_asks` rather than the `question_asked` row the
 * same submission also writes to seeker_activity. That is the table
 * network-health counts, and two admin surfaces disagreeing about how many
 * questions were asked would be worse than the duplication.
 *
 * CR6c is `matches_activated`: a care recipient publishing their care post so
 * providers can see it. The daily digest already reports that event as
 * "profiles published", which is what the node means by made live.
 *
 * None of these carry visitor geo. It is recorded on page views, and these
 * are form submissions written through four different routes — so CR5 and
 * CR6 are all-cities figures and the caller has to say so when a city is
 * selected.
 */

export interface Conversions {
  questions: number;
  benefitsCtas: number;
  connectionCtas: number;
  profilesLive: number;
  /** CR6's total: the three CTA types beneath it. */
  ctasTotal: number;
}

type Range = { from: string | null; to: string | null };

async function countEvents(
  db: SupabaseClient,
  table: string,
  range: Range,
  eventType?: string,
): Promise<number> {
  let query = db.from(table).select("id", { count: "exact", head: true });
  if (eventType) query = query.eq("event_type", eventType);
  if (range.from) query = query.gte("created_at", range.from);
  if (range.to) query = query.lt("created_at", range.to);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getConversions(
  db: SupabaseClient,
  range: Range,
): Promise<Conversions> {
  const [questions, benefitsCtas, connectionCtas, profilesLive] = await Promise.all([
    countEvents(db, "provider_question_asks", range),
    countEvents(db, "seeker_activity", range, "benefits_completed"),
    countEvents(db, "provider_activity", range, "lead_received"),
    countEvents(db, "seeker_activity", range, "matches_activated"),
  ]);

  return {
    questions,
    benefitsCtas,
    connectionCtas,
    profilesLive,
    ctasTotal: benefitsCtas + connectionCtas + profilesLive,
  };
}
