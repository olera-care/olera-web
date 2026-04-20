/**
 * Per-program and per-state reviewer overrides for the Benefits Hub.
 *
 * The default reviewer is Dr. Logan DuBose (Olera co-founder & MD) — shown on
 * every program and state page when no explicit override exists here. Add a
 * key below to surface a different reviewer (TJ, Cecille, etc.) on specific
 * pages. Slugs must match entries in `lib/authors.ts`.
 */

import { getAuthorBySlug, type Author } from "@/lib/authors";

const DEFAULT_VERIFIER_SLUG = "logan-dubose";

/** Per-program overrides, keyed by `"${stateAbbrev.toLowerCase()}:${programId}"`. */
export const PROGRAM_VERIFIERS: Record<string, string> = {
  // "fl:weatherization-assistance-program": "tj-falohun",
};

/** Per-state overrides for the state hub page, keyed by lowercase abbrev. */
export const STATE_VERIFIERS: Record<string, string> = {
  // "fl": "tj-falohun",
};

function resolveAuthor(slug: string | undefined): Author {
  const author = slug ? getAuthorBySlug(slug) : undefined;
  if (author) return author;
  // Fallback — DEFAULT_VERIFIER_SLUG must always exist in lib/authors.ts.
  return getAuthorBySlug(DEFAULT_VERIFIER_SLUG)!;
}

export function getProgramVerifier(stateAbbrev: string, programId: string): Author {
  const key = `${stateAbbrev.toLowerCase()}:${programId}`;
  return resolveAuthor(PROGRAM_VERIFIERS[key]);
}

export function getStateVerifier(stateAbbrev: string): Author {
  return resolveAuthor(STATE_VERIFIERS[stateAbbrev.toLowerCase()]);
}
