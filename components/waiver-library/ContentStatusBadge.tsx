import { Info } from "@phosphor-icons/react";
import type { ContentStatus } from "@/data/waiver-library";

interface ContentStatusBadgeProps {
  contentStatus?: ContentStatus | string | null;
  draftedAt?: string | null;
  reviewedAt?: string | null;
  variant?: "program" | "state";
  className?: string;
}

function formatDate(raw?: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Trust signal for pipeline-drafted content awaiting human review.
 * Shown only when content is auto-generated and not yet approved. For
 * hand-curated content (no contentStatus) or approved/published content,
 * renders nothing — the content is trusted by default.
 *
 * Design intent: Wikipedia's "last edited" bar, not a warning banner.
 * Quiet gray text, neutral icon, not a call to action. The goal is
 * transparency without eroding confidence.
 */
export function ContentStatusBadge({
  contentStatus,
  draftedAt,
  reviewedAt,
  variant = "program",
  className = "",
}: ContentStatusBadgeProps) {
  // Only show for unreviewed auto-generated content
  if (!contentStatus) return null;
  if (contentStatus === "approved" || contentStatus === "published") return null;

  const displayDate = formatDate(reviewedAt) || formatDate(draftedAt);
  const label = contentStatus === "under-review" ? "Under review" : "Auto-researched";

  const copy = variant === "state"
    ? `${label} — ${displayDate ? `content compiled ${displayDate}` : "content pending review"}`
    : `${label} — ${displayDate ? `facts last verified ${displayDate}` : "pending human review"}`;

  return (
    <div className={`flex items-start gap-1.5 text-xs text-gray-400 ${className}`}>
      <Info size={13} weight="regular" className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{copy}</span>
    </div>
  );
}
