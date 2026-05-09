/**
 * Normalize a provider name for blocklist + dedup matching.
 *
 * Collapses cosmetic variation (article prefix, punctuation, ampersand,
 * business suffixes) so "The Mariemont Care Center" and "Mariemont Care
 * Center, LLC" hash to the same key.
 *
 * Used at:
 *   • Seed time — provider_removal_blocklist.normalized_name (stored)
 *   • Check time — pipeline candidates + admin search box
 *
 * Both sides MUST use this function so the lookup is symmetric.
 */
export function normalizeProviderName(name: string): string {
  let s = name.toLowerCase().trim();
  // Strip leading article — "The Mariemont" → "mariemont"
  s = s.replace(/^(the|a|an)\s+/, "");
  // & → and (must run before punctuation strip so it's preserved)
  s = s.replace(/&/g, "and");
  // Strip apostrophes WITHOUT inserting a space — "Kendra's" → "kendras",
  // not "kendra s". Must precede the general punctuation→space rule below.
  s = s.replace(/['‘’ʼ]/g, "");
  // Replace any other non-alphanumeric run with a single space
  s = s.replace(/[^a-z0-9]+/g, " ").trim();
  // Strip common trailing business suffixes once they're standalone words
  s = s.replace(/\s+(llc|inc|corp|co|company|incorporated|llp|ltd)$/, "");
  // Final whitespace collapse
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
