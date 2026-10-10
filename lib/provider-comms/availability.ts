/**
 * "Accepting new clients", from building email 2 or the dashboard toggle.
 *
 * Only a yes is ever shown to families, with the date it was given. A no
 * shows nothing: advertising "not accepting" would cost a provider families
 * who would wait. A yes older than 90 days stops showing on its own, so a
 * stale answer never misleads a family (TJ, 10 Oct 2026).
 */
export const AVAILABILITY_FRESH_DAYS = 90;

export type AvailabilityMeta = {
  accepting_new_clients?: unknown;
  accepting_new_clients_at?: unknown;
};

/** The date to show beside "Accepting new clients", or null when nothing should show. */
export function acceptingSince(meta: AvailabilityMeta | null | undefined, now: number = Date.now()): Date | null {
  if (!meta || meta.accepting_new_clients !== true || typeof meta.accepting_new_clients_at !== "string") return null;
  const at = Date.parse(meta.accepting_new_clients_at);
  if (!Number.isFinite(at) || at > now + 60_000) return null;
  return now - at <= AVAILABILITY_FRESH_DAYS * 24 * 3600_000 ? new Date(at) : null;
}

/** "Oct 2026": month and year, the precision a family needs. */
export function availabilityLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "America/New_York" });
}
