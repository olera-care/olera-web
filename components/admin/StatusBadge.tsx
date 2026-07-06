export type StatusTone = "emerald" | "amber" | "blue" | "rose" | "gray";

const TONE_CLASSES: Record<StatusTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  rose: "bg-rose-50 text-rose-700",
  gray: "bg-gray-100 text-gray-600",
};

/**
 * Canonical status → tone map for admin surfaces. Exported so pages can
 * extend it locally, but prefer adding shared vocabulary here so status
 * colors stay consistent across the dashboard.
 */
export const STATUS_TONES: Record<string, StatusTone> = {
  // Positive / completed
  success: "emerald",
  live: "emerald",
  published: "emerald",
  verified: "emerald",
  approved: "emerald",
  answered: "emerald",
  delivered: "emerald",
  // Waiting on someone
  pending: "amber",
  queued: "amber",
  in_review: "amber",
  "in-review": "amber",
  awaiting: "amber",
  // Informational / upcoming
  scheduled: "blue",
  info: "blue",
  // Negative / terminal failures
  failed: "rose",
  rejected: "rose",
  bounced: "rose",
  denied: "rose",
  // Neutral / inactive
  neutral: "gray",
  archived: "gray",
  unclaimed: "gray",
  draft: "gray",
  deleted: "gray",
  hidden: "gray",
};

function sentenceCase(status: string): string {
  const words = status.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

interface StatusBadgeProps {
  status: string;
  /** Override the displayed text (defaults to sentence-cased status). */
  label?: string;
  /** Override the tone when the canonical map doesn't fit. */
  tone?: StatusTone;
  className?: string;
}

/**
 * Compact tinted status pill (text-xs, sentence case). Unknown statuses
 * fall back to the gray tone — never throws.
 */
export default function StatusBadge({ status, label, tone, className = "" }: StatusBadgeProps) {
  const resolvedTone = tone ?? STATUS_TONES[status.toLowerCase()] ?? "gray";
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[resolvedTone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label ?? sentenceCase(status)}
    </span>
  );
}
