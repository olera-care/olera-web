/**
 * Q&A helpers shared between server (provider page) and client (QASectionV2).
 * Kept dependency-free so it's safe to import into client components — do not
 * add server-only imports (e.g. lib/supabase/server) here.
 */

/**
 * Canonicalize a question string for matching a submitted question back to a
 * suggested chip (and for tallying "how many asked this"). Lowercase, collapse
 * whitespace, normalize curly apostrophes, and drop trailing punctuation so
 * "What's the monthly cost?" and "whats the monthly cost" collapse together.
 * Must be used identically on both the page (building counts) and the
 * QASectionV2 component (reordering chips) so the keys line up.
 */
export function normalizeQuestion(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/[?.!,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
