import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Canonical "who owns this directory listing?" lookup, keyed on the
 * olera-providers id (= student_outreach.research_data.olera_provider_id).
 *
 * The MedJobs content lock keys off `owned` (an account is attached), NOT the
 * `claimState` label — once a real account owns the listing, MedJobs research
 * must never overwrite the provider's display content. `claimState` and
 * `verificationState` are surfaced for operator context (e.g. the pre-flight
 * "Claimed · verified/unverified" tag).
 *
 * One source of truth for the pre-flight lock (Chunk 3) and any other path that
 * needs to ask "is this provider owned / claimed / verified?".
 */

export interface ProviderOwnership {
  /** An account is attached → CRM must never overwrite display content. */
  owned: boolean;
  accountId: string | null;
  claimState: string | null;
  verificationState: string | null;
  businessProfileId: string | null;
}

const EMPTY: ProviderOwnership = {
  owned: false,
  accountId: null,
  claimState: null,
  verificationState: null,
  businessProfileId: null,
};

export async function getProviderOwnership(
  db: SupabaseClient,
  sourceProviderId: string | null | undefined,
): Promise<ProviderOwnership> {
  if (!sourceProviderId) return EMPTY;

  // Fetch-then-filter (rather than `.neq("claim_state","rejected")`) so a
  // legacy NULL claim_state row is still found — the same invariant the claim
  // primitive enforces (at most one non-rejected row per source_provider_id).
  const { data } = await db
    .from("business_profiles")
    .select("id, account_id, claim_state, verification_state")
    .eq("source_provider_id", sourceProviderId)
    .order("created_at", { ascending: true });

  const row =
    ((data ?? []) as Array<{
      id: string;
      account_id: string | null;
      claim_state: string | null;
      verification_state: string | null;
    }>).find((r) => r.claim_state !== "rejected") ?? null;

  if (!row) return EMPTY;
  return {
    owned: !!row.account_id,
    accountId: row.account_id,
    claimState: row.claim_state,
    verificationState: row.verification_state,
    businessProfileId: row.id,
  };
}
