import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * TA, TB and TC — the three tracks, where a match turns into something real.
 *
 * Only five of the twelve nodes have a source. The rest are dashed on purpose
 * and the gaps are worth naming, because they are the same gap: we record
 * that we introduced two people and stop recording once they take it
 * offline.
 *
 *   TA1–TA4  aid establishment    nothing. A benefits screener produces
 *                                 matches, but applying for aid happens on a
 *                                 government site and nobody tells us how it
 *                                 went.
 *   TB1      inquiry created      connections
 *   TB2      provider responded   connections that reached "responded"
 *   TB3–TB4  care established     nothing. Care starts in a conversation we
 *                                 are not part of.
 *   TC1      interview proposed   interviews
 *   TC2      interview confirmed  interviews that reached "confirmed"
 *   TC3      hire confirmed       medjobs_placements accepted or confirmed
 *   TC4      hours worked         nothing.
 *
 * TB2, TC2 and TC3 carry a timing caveat. Only the creation of a row is
 * timestamped, not the status change, so they count rows CREATED in the
 * window that have since reached that state. An inquiry raised last month
 * and answered today lands in last month.
 */

type Range = { from: string | null; to: string | null };

export interface Tracks {
  /** TB1 — inquiries raised between a care recipient and a provider. */
  inquiries: number;
  /** TB2 — of those, the ones a provider answered. */
  inquiriesResponded: number;
  /** TC1 — interviews proposed between a care worker and a provider. */
  interviews: number;
  /** TC2 — of those, the ones that reached confirmed. */
  interviewsConfirmed: number;
  /** TC3 — placements the care worker accepted. */
  hires: number;
}

/** Apply the map's window to any table that timestamps its rows. */
function inRange<T extends { gte: (c: string, v: string) => T; lt: (c: string, v: string) => T }>(
  query: T,
  range: Range,
): T {
  let q = query;
  if (range.from) q = q.gte("created_at", range.from);
  if (range.to) q = q.lt("created_at", range.to);
  return q;
}

const HEAD = { count: "exact", head: true } as const;

export async function getTracks(
  db: SupabaseClient,
  range: Range,
): Promise<Tracks> {
  const [inquiries, inquiriesResponded, interviews, interviewsConfirmed, hires] =
    await Promise.all([
      inRange(
        db.from("connections").select("id", HEAD).eq("type", "inquiry"),
        range,
      ),
      inRange(
        db
          .from("connections")
          .select("id", HEAD)
          .eq("type", "inquiry")
          .eq("status", "responded"),
        range,
      ),
      inRange(db.from("interviews").select("id", HEAD), range),
      inRange(
        db.from("interviews").select("id", HEAD).eq("status", "confirmed"),
        range,
      ),
      inRange(
        db
          .from("medjobs_placements")
          .select("id", HEAD)
          .in("status", ["accepted", "confirmed"]),
        range,
      ),
    ]);

  for (const result of [
    inquiries,
    inquiriesResponded,
    interviews,
    interviewsConfirmed,
    hires,
  ]) {
    if (result.error) throw result.error;
  }

  return {
    inquiries: inquiries.count ?? 0,
    inquiriesResponded: inquiriesResponded.count ?? 0,
    interviews: interviews.count ?? 0,
    interviewsConfirmed: interviewsConfirmed.count ?? 0,
    hires: hires.count ?? 0,
  };
}
