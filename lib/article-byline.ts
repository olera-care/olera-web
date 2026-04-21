/**
 * Byline rules for editorial articles with author + medical-reviewer metadata.
 *
 * Collapses "Verified by" when the author is the same person as the reviewer
 * (single signature instead of a double).
 */

export interface BylineRules {
  /** Author and reviewer are the same person — skip the "Verified by" phrase. */
  isSamePerson: boolean;
}

export function getBylineRules(args: {
  authorName: string | null | undefined;
  reviewerName: string | null | undefined;
}): BylineRules {
  const author = (args.authorName ?? "").trim();
  const reviewer = (args.reviewerName ?? "").trim();
  const isSamePerson = author.length > 0 && reviewer.length > 0 && author === reviewer;
  return { isSamePerson };
}
