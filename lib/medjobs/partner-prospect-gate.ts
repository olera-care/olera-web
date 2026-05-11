/**
 * Partner Prospect unlock gate.
 *
 * A Partner Prospect (university research card + downstream
 * stakeholder ops) is visible for a Site iff:
 *
 *   campuses.is_active = true
 *   AND (
 *     campuses.partner_prospect_unlocked_at IS NOT NULL  -- already unlocked, sticky
 *     OR ∃ client provider in this Site's catchment      -- new unlock event
 *   )
 *
 * "Client provider" = business_profile of type org|caregiver whose
 * metadata.medjobs_subscription_active=true OR
 * metadata.interview_terms_accepted_at within the 90-day pilot window.
 * Same predicate as lib/medjobs/clients.ts:getClientStatus and as the
 * isClientMeta() helpers in queue/route.ts and catchment-audit.ts.
 *
 * Visibility is derived (re-computed every read) so a missed event
 * can't permanently hide a prospect — next read catches up. Once
 * unlocked, the timestamp persists, so sticky semantics survive
 * client-provider churn for Partner Prospects already in progress.
 *
 * Callers should invoke `resolvePartnerProspectUnlocks` to:
 *   1. Detect campuses that NOW satisfy the predicate but have null
 *      partner_prospect_unlocked_at
 *   2. UPDATE those campuses (lazy backfill)
 *   3. Return the set of slugs that are currently unlocked
 *
 * The function is the single source of truth for the gate so the
 * queue endpoint (research-card surfacing) and prospect-counts
 * (sidebar / In Basket fraction) stay aligned.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";

const PILOT_MS = 90 * 24 * 60 * 60 * 1000;

export function isClientMeta(
  m: Record<string, unknown> | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!m) return false;
  if (m.medjobs_subscription_active === true) return true;
  const accepted = m.interview_terms_accepted_at;
  if (typeof accepted !== "string") return false;
  const t = new Date(accepted).getTime();
  return !isNaN(t) && now - t < PILOT_MS;
}

export interface CampusGateInput {
  id: string;
  slug: string;
  partner_prospect_unlocked_at: string | null;
}

export interface UnlockResolution {
  /** Campus IDs currently unlocked (already-sticky OR just-unlocked). */
  unlockedCampusIds: Set<string>;
  /** Campus IDs that just transitioned to unlocked on this read. */
  newlyUnlockedCampusIds: Set<string>;
  /** Per-campus catchment-client count (informational; used by
   *  fetchResearchCampuses for the stage derivation). */
  clientCountByCampusId: Map<string, number>;
}

/**
 * Resolve the unlock state for a set of campuses. Side effect: writes
 * partner_prospect_unlocked_at = now() for any campus that newly
 * satisfies the predicate. Idempotent.
 *
 * Pass the campus rows already fetched (with their current
 * partner_prospect_unlocked_at). The caller decides which set to
 * inspect (e.g. all is_active, or just one) — this function doesn't
 * own the campus query.
 *
 * `providers` is the cached list of org/caregiver business_profiles
 * with city/state/metadata. Passing it in lets the caller dedupe the
 * fetch across other code paths (queue/route.ts already pulls it for
 * the stage derivation).
 */
export async function resolvePartnerProspectUnlocks(
  db: SupabaseClient,
  campuses: CampusGateInput[],
  providers: Array<{
    city: string | null;
    state: string | null;
    metadata: Record<string, unknown> | null;
  }>,
): Promise<UnlockResolution> {
  const providerIndex = new Map<
    string,
    Array<{ metadata: Record<string, unknown> | null }>
  >();
  for (const p of providers) {
    if (!p.city || !p.state) continue;
    const key = `${p.city.toLowerCase()}|${p.state}`;
    if (!providerIndex.has(key)) providerIndex.set(key, []);
    providerIndex.get(key)!.push({ metadata: p.metadata });
  }

  const now = Date.now();
  const unlockedCampusIds = new Set<string>();
  const newlyUnlockedCampusIds = new Set<string>();
  const clientCountByCampusId = new Map<string, number>();

  for (const c of campuses) {
    const uni = PARTNER_UNIVERSITIES.find((u) => u.slug === c.slug);
    let clientCount = 0;
    if (uni) {
      for (const cc of uni.catchment) {
        const key = `${cc.city.toLowerCase()}|${cc.state}`;
        const list = providerIndex.get(key) ?? [];
        for (const p of list) if (isClientMeta(p.metadata, now)) clientCount += 1;
      }
    }
    clientCountByCampusId.set(c.id, clientCount);

    if (c.partner_prospect_unlocked_at) {
      unlockedCampusIds.add(c.id);
      continue;
    }
    if (clientCount > 0) {
      unlockedCampusIds.add(c.id);
      newlyUnlockedCampusIds.add(c.id);
    }
  }

  // Persist newly-unlocked timestamps so the flag becomes sticky.
  // Single UPDATE — the IS NULL guard makes this race-safe against a
  // concurrent read that also tries to set it.
  if (newlyUnlockedCampusIds.size > 0) {
    const nowIso = new Date(now).toISOString();
    const { error } = await db
      .from("student_outreach_campuses")
      .update({ partner_prospect_unlocked_at: nowIso })
      .in("id", Array.from(newlyUnlockedCampusIds))
      .is("partner_prospect_unlocked_at", null);
    if (error) {
      // Don't fail the read on backfill failure — the gate already
      // returned the correct visibility for this request via
      // unlockedCampusIds. The next request will retry the persist.
      console.warn(
        "[partner-prospect-gate] failed to persist unlocked_at",
        error.message,
      );
    }
  }

  return { unlockedCampusIds, newlyUnlockedCampusIds, clientCountByCampusId };
}
