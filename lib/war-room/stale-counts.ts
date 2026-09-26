/**
 * Remove renewal day counts that were written on an earlier day.
 *
 * `dateFacts` says the count; a stale one beside it is what the model copies.
 * Also applied wherever a stored title is shown to the founder: on 2026-09-26
 * a DM acknowledgement quoted a condition titled "...renews in 27 days..."
 * two weeks after the count was written.
 * On 2026-09-25, with the correct count stated as a fact, one Sonnet run still
 * titled a condition "27-day renewal risk", lifted verbatim from a memory title
 * written two days before. Only counts tied to a renewal or flight end are
 * touched; a "30-day window" is a definition, not a countdown.
 */
export function scrubStaleRenewalCounts(text: string, instead = "on the date in dateFacts"): string {
  return text
    .replace(/\b\d{1,3}[- ]day (renewal|flight)/gi, "$1")
    .replace(/\b(renew\w*|ends?|lands?|closes?)\s+in\s+~?\d{1,3}\s+days?\b/gi, `$1 ${instead}`)
    .replace(/\b\d{1,3}\s+days?\s+(until|before|to)\s+(her |the |its )?(soonest paid )?(renewal|flight)/gi, "before $2$3$4")
    .replace(/(renew\w*[^()]{0,40})\s*\(\s*~?\d{1,3}\s+days?\s*\)/gi, "$1");
}

/** For text shown to the founder: a stored count becomes "soon", never a stale number. */
export function withoutStaleRenewalCounts(text: string): string {
  return scrubStaleRenewalCounts(text, "soon");
}
