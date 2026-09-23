import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Has anything material happened since the last scan reasoned?
 *
 * This exists so the founder can ask for a scan at any moment and get an
 * instant, free answer on the ordinary day when nothing has moved, instead of
 * waiting two minutes and spending two dollars to be told no decision is ready.
 * A trigger without this check would be slow and empty most times it is used,
 * which is how a feature teaches someone to stop using it.
 *
 * **It deliberately does not diff the fact pack, and must never be changed to.**
 * The fact pack carries counts that drift every single day -- a question total
 * ticking 1,658 to 1,662 -- and the system already made exactly that mistake
 * once: `last_progress_at` was set whenever the evidence hash moved, so every
 * stalled condition reported progress every morning while resolving nothing,
 * for thirty-six days. A hash of drifting numbers answers "did any digit
 * change", which is always yes, and never answers the question asked here.
 *
 * It also cannot count the scan's own events. On 2026-09-21, 212 of 214
 * investigation events were written by the scan pipeline itself -- evidence
 * refreshed, probes planned, conditions re-observed. Treating those as change
 * would make every check say "changed" immediately after every scan, which is
 * the same defect wearing different clothes.
 *
 * So every signal below is an event with a timestamp, caused by someone or
 * something outside the scan: the founder answered, a proposal was decided, a
 * provider subscribed or churned. Those are things that happened. A number
 * being four larger is not a thing that happened.
 */
export type MaterialChange = {
  changed: boolean;
  reasons: string[];
  lastScanAt: string | null;
};

/** A scan reads its evidence at the start, so anything after that is unseen by it. */
async function lastScanStartedAt(db: SupabaseClient): Promise<string | null> {
  const { data } = await db.from("war_room_discovery_runs")
    .select("created_at")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const raw = (data as { created_at?: string } | null)?.created_at;
  // Normalised to a trailing Z. supabase-js does encode the `+00:00` form
  // correctly, verified against the live database, but the same string in a
  // hand-built URL becomes a space and Postgres rejects it (22007). There is no
  // reason to depend on the client's encoding for this.
  return raw ? new Date(raw).toISOString() : null;
}

export async function detectMaterialChange(db: SupabaseClient): Promise<MaterialChange> {
  const since = await lastScanStartedAt(db);
  // Nothing has ever completed, so there is no baseline to be unchanged from.
  if (!since) return { changed: true, reasons: ["no scan has ever completed"], lastScanAt: null };

  const reasons: string[] = [];

  const [answers, decisions, campaigns] = await Promise.all([
    // The founder told it something it did not know. Strictly better evidence
    // than anything it can query, and the whole point of the reply loop.
    db.from("war_room_investigation_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "founder_answered")
      .gte("created_at", since),
    // A verdict landed on a proposal. What is on the agenda has changed.
    //
    // System actors are excluded for the same reason the scan's own events are:
    // approving one proposal writes TWO `approved` rows, the founder's decision
    // and Cortex's own record of having delivered the assigned work. Counting
    // both reported "2 proposal decisions" for a single click, and a delivery
    // receipt is not a decision.
    db.from("war_room_proposal_events")
      .select("id", { count: "exact", head: true })
      .in("event_type", ["approved", "rejected", "completed", "parked"])
      .not("actor", "in", "(cortex,war-room)")
      .gte("created_at", since),
    // Revenue moved: somebody subscribed, churned, or a new campaign opened.
    // `or` rather than three round trips; any one of them is material.
    db.from("ad_campaign_requests")
      .select("id", { count: "exact", head: true })
      .or(`created_at.gte.${since},subscribed_at.gte.${since},ended_at.gte.${since}`),
  ]);

  // Fail open, always. A broken check must never be the reason a scan does not
  // run -- the cost of an unnecessary scan is two dollars, and the cost of a
  // suppressed one is a day of blindness.
  for (const [label, result] of [
    ["change check could not read answers", answers],
    ["change check could not read proposal decisions", decisions],
    ["change check could not read campaigns", campaigns],
  ] as const) {
    if (result.error) return { changed: true, reasons: [label], lastScanAt: since };
  }

  if ((answers.count ?? 0) > 0) reasons.push(`${answers.count} founder answer${answers.count === 1 ? "" : "s"} landed`);
  if ((decisions.count ?? 0) > 0) reasons.push(`${decisions.count} proposal decision${decisions.count === 1 ? "" : "s"}`);
  if ((campaigns.count ?? 0) > 0) reasons.push(`${campaigns.count} campaign change${campaigns.count === 1 ? "" : "s"}`);

  return { changed: reasons.length > 0, reasons, lastScanAt: since };
}
