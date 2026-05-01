/**
 * Benefits results token — short, unguessable URL identifier for the
 * post-submit results panel addressable at /m/{token}.
 *
 * Design:
 *   - 12 random bytes → 16-char base64url encoded → ~72 bits of entropy.
 *     Unguessable in practice; collision probability negligible at our
 *     volume (millions of tokens before birthday-collision risk).
 *   - The token IS the auth. Anyone with the URL sees the matches —
 *     no login wall on /m/{token}. This matches the "honest backup, not
 *     promised hero" model: ~95% of users won't engage with email, so
 *     the token's job is to give the 5% who return frictionless access,
 *     not to be a credential they manage.
 *   - Tokens are NOT short-lived. They live as long as the family profile.
 *     If we need to rotate later (compromised database dump, etc.), we
 *     issue new tokens and let old ones 404 — column is nullable elsewhere.
 *
 * Storage: benefits_results_tokens table (migration 057). One row per
 * SBF intake completion, FK to business_profiles.
 */

import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnrichedProgram, getAllProgramIds, getStateSlug } from "./program-data";
import type { WaiverProgram } from "@/data/waiver-library";
import { matchesCareNeed, type CareNeed } from "./benefits/match-care-need";

/**
 * Generate a 16-character base64url token. Uses crypto.randomBytes for
 * cryptographic randomness (NOT Math.random).
 *
 * 12 bytes → 16 chars after base64url with no padding. Charset:
 * [A-Za-z0-9_-]. URL-safe with no escaping needed.
 */
export function generateBenefitsToken(): string {
  return crypto.randomBytes(12).toString("base64url");
}

export interface BenefitsTokenRow {
  token: string;
  profile_id: string;
  care_need: CareNeed;
  state_code: string;
  provider_slug: string | null;
  match_count: number;
  created_at: string;
  last_viewed_at: string | null;
}

export interface ResultBundle {
  token: BenefitsTokenRow;
  profile: {
    id: string;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    state: string | null;
    metadata: Record<string, unknown>;
  };
  matchedPrograms: WaiverProgram[];
  stateName: string;
}

/**
 * Resolve a token URL to its full results bundle.
 *
 * Used by /m/[token]/page.tsx. The matched programs are recomputed from
 * current pipeline data each time — we don't snapshot the matches at
 * issuance, so the user sees fresh program info if data has updated since.
 *
 * Returns null if the token doesn't exist (caller renders 404).
 */
export async function lookupResultByToken(
  client: SupabaseClient,
  token: string,
): Promise<ResultBundle | null> {
  const { data: tokenRow } = await client
    .from("benefits_results_tokens")
    .select("token, profile_id, care_need, state_code, provider_slug, match_count, created_at, last_viewed_at")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow) return null;

  const { data: profile } = await client
    .from("business_profiles")
    .select("id, display_name, email, phone, state, metadata")
    .eq("id", tokenRow.profile_id)
    .maybeSingle();

  if (!profile) return null;

  const stateId = getStateSlug(tokenRow.state_code);
  if (!stateId) return null;

  // Recompute matched programs from current pipeline data
  const allIds = getAllProgramIds(stateId);
  const allPrograms = allIds
    .map((id) => getEnrichedProgram(stateId, id))
    .filter((p): p is WaiverProgram => !!p)
    .filter((p) => p.programType === "benefit");

  const matched = allPrograms.filter((p) =>
    matchesCareNeed(p, tokenRow.care_need as CareNeed),
  );

  // Bump last_viewed_at — fire-and-forget, don't block render
  client
    .from("benefits_results_tokens")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("token", token)
    .then(() => {})
    .then(undefined, (err: unknown) => {
      console.error("[benefits-token] last_viewed_at update failed:", err);
    });

  // State name from waiver-library or fallback
  const stateName =
    stateId.charAt(0).toUpperCase() + stateId.slice(1).replace(/-/g, " ");

  return {
    token: tokenRow as BenefitsTokenRow,
    profile: profile as ResultBundle["profile"],
    matchedPrograms: matched,
    stateName,
  };
}
