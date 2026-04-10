/**
 * MedJobs Access Tier System
 *
 * Four tiers control what providers see and can do:
 *
 * 1. anonymous       — not logged in, limited preview
 * 2. free_active     — logged in, under credit limit
 * 3. free_exhausted  — logged in, credits exhausted, not paid
 * 4. paid            — active $49/mo subscription
 *
 * Providers get 3 free credits. Each credit is consumed by:
 * - Sending an outbound interview request (provider → candidate)
 * - Confirming an inbound interview request (candidate → provider)
 *
 * When a candidate confirms a provider's outbound request, no credit
 * is consumed (the credit was already spent at request time).
 *
 * Contact info, LinkedIn, resume, and full names are paid-only to prevent
 * de-platforming (providers bypassing Olera by contacting candidates directly).
 */

export type AccessTier = "anonymous" | "free_active" | "free_exhausted" | "paid";

export interface AccessInfo {
  tier: AccessTier;
  creditsUsed: number;
  creditsRemaining: number;
  isPaid: boolean;
}

const FREE_CREDIT_LIMIT = 3;

/**
 * Determine the provider's access tier.
 *
 * @param isAuthenticated - Whether the user has an active session
 * @param providerMeta - The provider's business_profiles.metadata (if they have a provider profile)
 */
export function getAccessTier(
  isAuthenticated: boolean,
  providerMeta?: Record<string, unknown> | null,
): AccessInfo {
  if (!isAuthenticated || !providerMeta) {
    return { tier: "anonymous", creditsUsed: 0, creditsRemaining: 0, isPaid: false };
  }

  const isPaid = !!(providerMeta.medjobs_subscription_active as boolean);
  const creditsUsed = (providerMeta.medjobs_credits_used as number) || 0;

  if (isPaid) {
    return { tier: "paid", creditsUsed, creditsRemaining: Infinity, isPaid: true };
  }

  if (creditsUsed >= FREE_CREDIT_LIMIT) {
    return { tier: "free_exhausted", creditsUsed, creditsRemaining: 0, isPaid: false };
  }

  return {
    tier: "free_active",
    creditsUsed,
    creditsRemaining: FREE_CREDIT_LIMIT - creditsUsed,
    isPaid: false,
  };
}

/**
 * Check if a provider can schedule a new interview.
 */
export function canScheduleInterview(access: AccessInfo): boolean {
  return access.tier === "paid" || access.tier === "free_active";
}

/**
 * Check if contact info (email, phone) should be visible.
 * Paid-only to prevent de-platforming.
 */
export function canSeeContactInfo(access: AccessInfo): boolean {
  return access.tier === "paid";
}

/**
 * Check if LinkedIn URL should be visible.
 * Paid-only to prevent de-platforming.
 */
export function canSeeLinkedIn(access: AccessInfo): boolean {
  return access.tier === "paid";
}

/**
 * Check if resume link should be clickable.
 * Paid-only to prevent de-platforming.
 */
export function canSeeResume(access: AccessInfo): boolean {
  return access.tier === "paid";
}

/**
 * Format candidate display name based on access tier.
 * Only paid providers see full names. Free tiers see "First L."
 * to prevent de-platforming via name lookup.
 */
export function formatCandidateName(fullName: string, access: AccessInfo): string {
  if (access.tier === "paid") return fullName;
  // All non-paid tiers (anonymous, free_active, free_exhausted): First + last initial
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

/**
 * Filter candidate data for a given access tier.
 * Call this server-side BEFORE passing data to client components
 * so restricted fields never reach the browser.
 */
export function filterCandidateForTier(
  candidate: {
    displayName: string;
    email: string | null;
    phone: string | null;
    linkedinUrl?: string | null;
    resumeUrl?: string | null;
  },
  access: AccessInfo
): {
  displayName: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  resumeUrl: string | null;
} {
  if (access.isPaid) {
    return {
      displayName: candidate.displayName,
      email: candidate.email,
      phone: candidate.phone,
      linkedinUrl: candidate.linkedinUrl ?? null,
      resumeUrl: candidate.resumeUrl ?? null,
    };
  }

  return {
    displayName: formatCandidateName(candidate.displayName, access),
    email: null,
    phone: null,
    linkedinUrl: null,
    resumeUrl: null,
  };
}
