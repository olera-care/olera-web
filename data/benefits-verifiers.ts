/**
 * Per-program and per-state reviewer overrides for the Benefits Hub.
 *
 * The default reviewer is Dr. Logan DuBose (Olera co-founder & MD) — shown on
 * every program and state page when no explicit override exists here. Add a
 * key below to surface a different reviewer (TJ, Cecille, etc.) on specific
 * pages. Slugs must match entries in `lib/authors.ts`.
 *
 * `reviewedAt` on an override wins over `program.reviewedAt` / `program.lastVerifiedDate`
 * so a human signoff date supersedes whatever the pipeline last wrote.
 */

import { getAuthorBySlug, type Author } from "@/lib/authors";

const DEFAULT_VERIFIER_SLUG = "logan-dubose";

interface VerifierOverride {
  slug: string;
  /** ISO date (YYYY-MM-DD) — when this person signed off on the content. */
  reviewedAt?: string;
}

/** Per-program overrides, keyed by `"${stateAbbrev.toLowerCase()}:${programId}"`. */
export const PROGRAM_VERIFIERS: Record<string, VerifierOverride> = {
  "fl:weatherization-assistance-program": { slug: "tj-falohun", reviewedAt: "2026-04-20" },
  "fl:snap-food-benefits": { slug: "tj-falohun", reviewedAt: "2026-04-20" },
  "fl:smmc-ltc-hcbs-waivers": { slug: "tj-falohun", reviewedAt: "2026-04-20" },
};

/** Per-state overrides for the state hub page, keyed by lowercase abbrev. */
export const STATE_VERIFIERS: Record<string, VerifierOverride> = {
  // "fl": { slug: "tj-falohun", reviewedAt: "2026-04-20" },
};

export interface ResolvedVerifier {
  author: Author;
  /** Only set when the override explicitly carries a reviewed-at date. */
  reviewedAt?: string;
  /** True when an override entry exists — signals human signoff, regardless of date. */
  hasExplicitReview: boolean;
}

function resolve(override: VerifierOverride | undefined): ResolvedVerifier {
  const author =
    (override?.slug ? getAuthorBySlug(override.slug) : undefined) ??
    getAuthorBySlug(DEFAULT_VERIFIER_SLUG)!;
  return { author, reviewedAt: override?.reviewedAt, hasExplicitReview: !!override };
}

export function getProgramVerifier(stateAbbrev: string, programId: string): ResolvedVerifier {
  const key = `${stateAbbrev.toLowerCase()}:${programId}`;
  return resolve(PROGRAM_VERIFIERS[key]);
}

export function getStateVerifier(stateAbbrev: string): ResolvedVerifier {
  return resolve(STATE_VERIFIERS[stateAbbrev.toLowerCase()]);
}
