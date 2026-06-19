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
/**
 * Publisher = the person who produced/QA'd the content (Cecille Chavez, Benefits
 * QA Lead). Shown as "Published by …" alongside the MD "Verified by …" credit so
 * each page carries both a content owner and a medical-authority signal. The
 * verifier (default Dr. Logan DuBose, MD) is what preserves the page's clinical
 * E-E-A-T — do not displace it.
 */
const DEFAULT_PUBLISHER_SLUG = "cecille-chavez";

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

/**
 * Publisher overrides — same keying as the verifier maps. Default is Cecille
 * (DEFAULT_PUBLISHER_SLUG); add an entry to credit a different content owner on
 * a specific program/state.
 */
export const PROGRAM_PUBLISHERS: Record<string, VerifierOverride> = {};
export const STATE_PUBLISHERS: Record<string, VerifierOverride> = {};

/**
 * When each state's benefits content was last QA'd / published — surfaced as the
 * "Last verified <date>" freshness signal and used to gate the named
 * "Published by … · Verified by …" byline. A state appears here ONLY once a human
 * has reviewed it; absence means the page is still an unreviewed pipeline draft
 * and shows the dated ContentStatusBadge instead of named credits. Update the
 * date whenever a state is re-QA'd so the freshness signal stays accurate.
 */
export const STATE_REVIEWED_AT: Record<string, string> = {
  ny: "2026-06-06",
  fl: "2026-06-06",
  ca: "2026-05-20",
  tx: "2026-05-21",
  pa: "2026-06-17",
};

export function getStateReviewedAt(stateAbbrev: string): string | undefined {
  return STATE_REVIEWED_AT[stateAbbrev.toLowerCase()];
}

export interface ResolvedVerifier {
  author: Author;
  /** Only set when the override explicitly carries a reviewed-at date. */
  reviewedAt?: string;
  /** True when an override entry exists — signals human signoff, regardless of date. */
  hasExplicitReview: boolean;
}

function resolve(override: VerifierOverride | undefined, defaultSlug: string): ResolvedVerifier {
  const author =
    (override?.slug ? getAuthorBySlug(override.slug) : undefined) ??
    getAuthorBySlug(defaultSlug)!;
  return { author, reviewedAt: override?.reviewedAt, hasExplicitReview: !!override };
}

export function getProgramVerifier(stateAbbrev: string, programId: string): ResolvedVerifier {
  const key = `${stateAbbrev.toLowerCase()}:${programId}`;
  return resolve(PROGRAM_VERIFIERS[key], DEFAULT_VERIFIER_SLUG);
}

export function getStateVerifier(stateAbbrev: string): ResolvedVerifier {
  return resolve(STATE_VERIFIERS[stateAbbrev.toLowerCase()], DEFAULT_VERIFIER_SLUG);
}

export function getProgramPublisher(stateAbbrev: string, programId: string): ResolvedVerifier {
  const key = `${stateAbbrev.toLowerCase()}:${programId}`;
  return resolve(PROGRAM_PUBLISHERS[key], DEFAULT_PUBLISHER_SLUG);
}

export function getStatePublisher(stateAbbrev: string): ResolvedVerifier {
  return resolve(STATE_PUBLISHERS[stateAbbrev.toLowerCase()], DEFAULT_PUBLISHER_SLUG);
}
