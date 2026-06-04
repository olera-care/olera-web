/**
 * Pilot tier predicate — single source of truth for "does this
 * business_profile have full MedJobs access?". Phase 2+3 Bullet 2
 * (2026-06-04).
 *
 * Two paths to full access:
 *   1. Paid Stripe subscription: metadata.medjobs_subscription_active === true.
 *      Written by the Stripe webhook on checkout / billing events.
 *   2. Active pilot membership: metadata.pilot_active_through > now().
 *      Written by the Phase 4+5 self-serve activation API + by Phase 1's
 *      handleMakeClient (admin-driven path; Q1 lock).
 *
 * Option A architecture (master plan § 4.14): ONE predicate, ONE source of
 * truth. Adding a new tier in the future means extending THIS function — all
 * read sites stay clean.
 *
 * Replaces scattered `metadata.medjobs_subscription_active === true` checks
 * across the codebase. Phase 2+3 replaces the candidate board readers + the
 * queue endpoint reader; other call sites (account settings, admin tooling,
 * review-requests, Stripe writers) stay as-is for now since they care
 * specifically about subscription billing, not access.
 */

export function medjobsAccessActive(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  if (!metadata) return false;
  if (metadata.medjobs_subscription_active === true) return true;
  const pilotThrough = metadata.pilot_active_through;
  if (typeof pilotThrough === "string") {
    const t = new Date(pilotThrough).getTime();
    if (Number.isFinite(t) && t > Date.now()) return true;
  }
  return false;
}

/** Returns the access source, for surfaces that want to render different
 *  CTAs ("Manage subscription" vs "Pilot expires in N days"). */
export type AccessTier = "none" | "pilot" | "subscription";

export function medjobsAccessTier(
  metadata: Record<string, unknown> | null | undefined,
): AccessTier {
  if (!metadata) return "none";
  if (metadata.medjobs_subscription_active === true) return "subscription";
  const pilotThrough = metadata.pilot_active_through;
  if (typeof pilotThrough === "string") {
    const t = new Date(pilotThrough).getTime();
    if (Number.isFinite(t) && t > Date.now()) return "pilot";
  }
  return "none";
}

/** Days remaining in the pilot. Returns null when not pilot-active. */
export function pilotDaysRemaining(
  metadata: Record<string, unknown> | null | undefined,
): number | null {
  if (medjobsAccessTier(metadata) !== "pilot") return null;
  const pilotThrough = (metadata as Record<string, unknown>).pilot_active_through;
  if (typeof pilotThrough !== "string") return null;
  const t = new Date(pilotThrough).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24)));
}
