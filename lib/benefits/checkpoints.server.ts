import type { SupabaseClient } from "@supabase/supabase-js";
import { familyProgress, type CheckpointEvent, type CheckpointRecord, type FamilyProgress } from "./checkpoints";

/**
 * Loads the rows the five checkpoints are counted from (lib/benefits/checkpoints.ts).
 * Shared by /api/admin/benefits/checkpoints and the daily brief's Benefits line.
 */

/** Per-step tracking began 30 Sep 2026; nothing earlier carries a session. */
export const CHECKPOINTS_FROM = "2026-09-29T00:00:00Z";

const MAX_ROWS = 60_000;

type Meta = Record<string, unknown>;

export async function loadCheckpointFamilies(db: SupabaseClient, from = CHECKPOINTS_FROM): Promise<{ families: FamilyProgress[]; truncated: boolean }> {
  const events: CheckpointEvent[] = [];
  let truncated = true;
  for (let lo = 0; lo < MAX_ROWS; lo += 1000) {
    const { data, error } = await db
      .from("provider_activity")
      .select("id, event_type, created_at, metadata")
      .eq("provider_id", "benefits-finder")
      .in("event_type", ["benefits_entry_viewed", "benefits_step_viewed", "benefits_step_completed"])
      .gte("created_at", from)
      .order("id")
      .range(lo, lo + 999);
    if (error) throw new Error(`checkpoints_events_failed:${error.message}`);
    events.push(...((data ?? []) as CheckpointEvent[]));
    if (!data || data.length < 1000) { truncated = false; break; }
  }

  // Families who told us an application went in. Few rows: the field exists
  // only for families who used an apply-along.
  const { data: profiles, error } = await db
    .from("business_profiles")
    .select("id, account_id, state, metadata")
    .eq("type", "family")
    .not("metadata->benefits_cascade->applied", "is", null)
    .limit(5000);
  if (error) throw new Error(`checkpoints_records_failed:${error.message}`);
  const rows = (profiles ?? []) as Array<{ id: string; account_id: string | null; state: string | null; metadata: Meta | null }>;

  const sessions = new Map<string, Set<string>>(rows.map((r) => [r.id, new Set<string>()]));
  const add = (profileId: string, s: unknown) => {
    if (typeof s === "string" && s) sessions.get(profileId)?.add(s);
  };
  const accountIds = rows.map((r) => r.account_id).filter((v): v is string => Boolean(v));
  for (let i = 0; i < accountIds.length; i += 100) {
    const { data } = await db.from("accounts").select("id, session_id").in("id", accountIds.slice(i, i + 100));
    const byAccount = new Map((data ?? []).map((a) => [a.id as string, a.session_id as string | null]));
    for (const r of rows) if (r.account_id && byAccount.has(r.account_id)) add(r.id, byAccount.get(r.account_id));
  }
  const ids = rows.map((r) => r.id);
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await db
      .from("seeker_activity")
      .select("profile_id, metadata")
      .eq("event_type", "benefits_completed")
      .in("profile_id", ids.slice(i, i + 100))
      .limit(2000);
    for (const a of data ?? []) add(a.profile_id as string, (a.metadata as Meta | null)?.session_id);
  }

  const records: CheckpointRecord[] = rows.map((r) => {
    const meta = r.metadata ?? {};
    const cascade = (meta.benefits_cascade as Meta | undefined) ?? {};
    const applied = cascade.applied as CheckpointRecord["applied"];
    return {
      profileId: r.id,
      sessions: [...(sessions.get(r.id) ?? [])],
      state: r.state,
      studyCohort: typeof meta.study_cohort === "string" ? meta.study_cohort : null,
      // Apply-along launched 7 Oct, after any window start, so no date filter.
      applied: applied ?? null,
    };
  });

  return { families: familyProgress(events, records), truncated };
}
