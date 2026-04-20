/**
 * Byline rules for editorial articles with author + medical-reviewer metadata.
 *
 * Collapses "Verified by" when the author is the same person as the reviewer
 * (single signature instead of a double), and surfaces the original publish
 * date only when it meaningfully precedes the last verified date — keeps the
 * byline short on fresh articles, tells the "refreshed long after first
 * publish" story on older ones.
 */

export interface BylineRules {
  /** Author and reviewer are the same person — skip the "Verified by" phrase. */
  isSamePerson: boolean;
  /** Published date is >= thresholdDays older than the verified date. */
  showPublishedDate: boolean;
  /** The freshness date shown on every article. ISO string; falls back to publishedAt. */
  verifiedDate: string;
  /** The original publish date. ISO string. */
  publishedDate: string;
}

const DEFAULT_THRESHOLD_DAYS = 30;

export function getBylineRules(args: {
  authorName: string | null | undefined;
  reviewerName: string | null | undefined;
  publishedAt: string | null | undefined;
  updatedAt: string | null | undefined;
  thresholdDays?: number;
}): BylineRules {
  const author = (args.authorName ?? "").trim();
  const reviewer = (args.reviewerName ?? "").trim();
  const isSamePerson = author.length > 0 && reviewer.length > 0 && author === reviewer;

  const verifiedDate = args.updatedAt || args.publishedAt || "";
  const publishedDate = args.publishedAt || "";

  const thresholdMs = (args.thresholdDays ?? DEFAULT_THRESHOLD_DAYS) * 24 * 60 * 60 * 1000;
  let showPublishedDate = false;
  if (args.publishedAt && args.updatedAt) {
    const diff = new Date(args.updatedAt).getTime() - new Date(args.publishedAt).getTime();
    showPublishedDate = diff >= thresholdMs;
  }

  return { isSamePerson, showPublishedDate, verifiedDate, publishedDate };
}
