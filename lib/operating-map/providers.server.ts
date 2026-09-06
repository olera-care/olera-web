import type { SupabaseClient } from "@supabase/supabase-js";
import { countListedProviders, listedProviderIdsInCity, PROVIDER_ID_CHUNK } from "@/lib/providers";

/**
 * CP1 and CP2 — the care provider lane.
 *
 * A note on what "city" means here, because it is NOT what it means further
 * left on the map. CR2 and CR4 scope by the *visitor's* city. CP1 and CP2
 * scope by the *provider's* city, which is the only reading that makes sense
 * for them: filtering to Houston should show Houston's providers, not the
 * providers Houston residents happened to look at. Both tooltips say which
 * they mean.
 *
 * Both are also standing counts, not flows. They describe the directory as
 * it is right now, so the date range does not move them — the tooltips say
 * that too, because the range control sits right above them.
 */

/**
 * CP2's definition of "in outreach": contact has begun and has not
 * concluded. Everything except `not_contacted`, which has not started, and
 * the three terminal stages (claimed, not_interested, archived), which are
 * finished.
 *
 * Kept as one exported constant so the rule lives in a single place and the
 * inspector can describe it without restating it.
 */
export const ACTIVE_OUTREACH_STAGES = [
  "in_sequence",
  "needs_call",
  "broadcast_ready",
  "re_engage",
  "call_exhausted",
] as const;

/** CP1 — providers listed. */
export async function getProvidersListed(
  db: SupabaseClient,
  citySlug: string | null = null,
): Promise<number> {
  return countListedProviders(db, citySlug);
}

/**
 * CP2 — providers in outreach.
 *
 * `provider_outreach_tracking` carries a state but no city, so scoping to one
 * city means asking the directory which providers are there and counting the
 * tracking rows against them in batches.
 */
export async function getProvidersInOutreach(
  db: SupabaseClient,
  citySlug: string | null = null,
): Promise<number> {
  const stages = ACTIVE_OUTREACH_STAGES as unknown as string[];

  if (!citySlug) {
    const { count, error } = await db
      .from("provider_outreach_tracking")
      .select("provider_id", { count: "exact", head: true })
      .in("stage", stages);
    if (error) throw error;
    return count ?? 0;
  }

  const ids = await listedProviderIdsInCity(db, citySlug);
  if (ids.length === 0) return 0;

  let total = 0;
  for (let i = 0; i < ids.length; i += PROVIDER_ID_CHUNK) {
    const { count, error } = await db
      .from("provider_outreach_tracking")
      .select("provider_id", { count: "exact", head: true })
      .in("stage", stages)
      .in("provider_id", ids.slice(i, i + PROVIDER_ID_CHUNK));
    if (error) throw error;
    total += count ?? 0;
  }
  return total;
}
