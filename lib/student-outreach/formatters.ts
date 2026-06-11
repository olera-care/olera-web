/**
 * Formatters used across the MedJobs admin surface (cards, drawer,
 * specialty list views). Pure functions, no React.
 *
 * Extracted from app/admin/student-outreach/page.tsx as part of the
 * v9.0 MedJobs reorg (Phase 0).
 */

export function formatDueDate(iso: string): string {
  const due = new Date(iso);
  const diffMin = Math.round((due.getTime() - Date.now()) / 60_000);
  if (diffMin < -60 * 24) return `${Math.round(-diffMin / (60 * 24))}d overdue`;
  if (diffMin < 0) return "due now";
  if (diffMin < 60) return `in ${diffMin}m`;
  if (diffMin < 60 * 24) return `in ${Math.round(diffMin / 60)}h`;
  return `in ${Math.round(diffMin / (60 * 24))}d`;
}

export function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Compact form with no "ago" suffix — used inside pills. */
export function formatShortRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function humanChannel(channel: string): string {
  switch (channel) {
    case "email":
      return "email";
    case "ig_dm":
      return "IG DM";
    case "contact_form":
      return "contact form";
    default:
      return channel;
  }
}

/**
 * Clean AI artifacts out of an organization name for display. The partner
 * sourcing AI sometimes puts a description in the name field for offices with
 * no named person (e.g. "Health Professions Office (not a named person)").
 * Strip those parentheticals so cards/headers read cleanly. Does not mutate
 * stored data — display-only.
 */
export function cleanOrgName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .replace(/\s*\((?:not a named person|no named[^)]*|general contact|general)\)\s*/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
