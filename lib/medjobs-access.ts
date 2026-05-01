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
  /** Whether the provider is verified (verification_state === "verified" or "not_required") */
  isVerified: boolean;
}

const FREE_CREDIT_LIMIT = 3;

/**
 * Determine the provider's access tier.
 *
 * @param isAuthenticated - Whether the user has an active session
 * @param providerMeta - The provider's business_profiles.metadata (if they have a provider profile)
 * @param verificationState - The provider's verification_state (optional, defaults to unverified)
 */
export function getAccessTier(
  isAuthenticated: boolean,
  providerMeta?: Record<string, unknown> | null,
  verificationState?: string | null,
): AccessInfo {
  // Verified means explicitly verified OR verification not required for this provider
  const isVerified = verificationState === "verified" || verificationState === "not_required";

  if (!isAuthenticated || !providerMeta) {
    return { tier: "anonymous", creditsUsed: 0, creditsRemaining: 0, isPaid: false, isVerified: false };
  }

  const isPaid = !!(providerMeta.medjobs_subscription_active as boolean);
  const creditsUsed = (providerMeta.medjobs_credits_used as number) || 0;

  if (isPaid) {
    return { tier: "paid", creditsUsed, creditsRemaining: Infinity, isPaid: true, isVerified };
  }

  if (creditsUsed >= FREE_CREDIT_LIMIT) {
    return { tier: "free_exhausted", creditsUsed, creditsRemaining: 0, isPaid: false, isVerified };
  }

  return {
    tier: "free_active",
    creditsUsed,
    creditsRemaining: FREE_CREDIT_LIMIT - creditsUsed,
    isPaid: false,
    isVerified,
  };
}

/**
 * Check if a provider can schedule a new interview.
 */
export function canScheduleInterview(access: AccessInfo): boolean {
  return access.tier === "paid" || access.tier === "free_active";
}

/**
 * Check if a provider has full access to candidate details.
 * Requires BOTH paid subscription AND verified status.
 * This prevents bad actors who are flagged for re-verification from
 * accessing candidate contact info even if they have an active subscription.
 */
export function hasFullAccess(access: AccessInfo): boolean {
  return access.isPaid && access.isVerified;
}

/**
 * Check if contact info (email, phone) should be visible.
 * Requires both paid AND verified to prevent de-platforming.
 */
export function canSeeContactInfo(access: AccessInfo): boolean {
  return hasFullAccess(access);
}

/**
 * Check if LinkedIn URL should be visible.
 * Requires both paid AND verified to prevent de-platforming.
 */
export function canSeeLinkedIn(access: AccessInfo): boolean {
  return hasFullAccess(access);
}

/**
 * Check if resume link should be clickable.
 * Requires both paid AND verified to prevent de-platforming.
 */
export function canSeeResume(access: AccessInfo): boolean {
  return hasFullAccess(access);
}

/**
 * Format candidate display name based on access tier.
 * Only providers with full access (paid + verified) see full names.
 * Others see "First L." to prevent de-platforming via name lookup.
 */
export function formatCandidateName(fullName: string, access: AccessInfo): string {
  if (hasFullAccess(access)) return fullName;
  // All non-full-access providers: First + last initial
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

/**
 * Filter candidate data for a given access tier.
 * Call this server-side BEFORE passing data to client components
 * so restricted fields never reach the browser.
 * Requires BOTH paid AND verified for full access.
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
  if (hasFullAccess(access)) {
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
