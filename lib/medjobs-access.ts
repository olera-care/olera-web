/**
 * MedJobs Access — pilot-only model.
 *
 * G3 consolidation (2026-06-05): the credit / $49-subscription paywall was
 * removed. The pilot (free, 90 days, granted on Terms acceptance) is the only
 * access path. This module now answers two questions off a provider's
 * business_profiles.metadata:
 *
 *   1. Does this provider have MedJobs access?  → `isPaid` (active pilot)
 *   2. Can they see candidate CONTACT info?     → access AND verified
 *      (the de-platforming gate — unchanged)
 *
 * The `AccessTier` union and `AccessInfo` shape are retained for backwards
 * compatibility with existing consumers; the credit fields are deprecated
 * (always 0 / Infinity) and `"free_exhausted"` is no longer produced.
 */

export type AccessTier = "anonymous" | "free_active" | "free_exhausted" | "paid";

export interface AccessInfo {
  tier: AccessTier;
  /** @deprecated credits removed (pilot-only). Always 0. */
  creditsUsed: number;
  /** @deprecated credits removed (pilot-only). Always Infinity. */
  creditsRemaining: number;
  /** True when the provider has active MedJobs access (pilot). */
  isPaid: boolean;
  /** verification_state === "verified" || "not_required". */
  isVerified: boolean;
}

/**
 * Determine the provider's access.
 *
 * @param isAuthenticated - whether the user has an active session
 * @param providerMeta - the provider's business_profiles.metadata
 * @param verificationState - the provider's verification_state
 */
export function getAccessTier(
  isAuthenticated: boolean,
  providerMeta?: Record<string, unknown> | null,
  verificationState?: string | null,
): AccessInfo {
  const isVerified = verificationState === "verified" || verificationState === "not_required";

  if (!isAuthenticated || !providerMeta) {
    return { tier: "anonymous", creditsUsed: 0, creditsRemaining: 0, isPaid: false, isVerified: false };
  }

  // Phase A: any authenticated provider has full access. Contact is no longer
  // hidden behind pilot/verification — the de-platforming moat is the student
  // credential + platform Terms, not blurring. See PROVIDER_FUNNEL_BUILD_PLAN.md.
  return {
    tier: "paid",
    creditsUsed: 0,
    creditsRemaining: Infinity,
    isPaid: true,
    isVerified,
  };
}

/**
 * Whether the provider can request an interview.
 * Any signed-in provider may request through Olera; the pilot unlocks
 * contact/full data. No credit limit.
 */
export function canScheduleInterview(access: AccessInfo): boolean {
  return access.tier !== "anonymous";
}

/**
 * Full access to candidate details (contact, résumé, LinkedIn).
 * Requires MedJobs access AND verified status — the de-platforming gate.
 */
export function hasFullAccess(access: AccessInfo): boolean {
  // Phase A: full access for any authenticated provider (no verified gate).
  return access.isPaid;
}

/** Contact info (email, phone) visible only with full access. */
export function canSeeContactInfo(access: AccessInfo): boolean {
  return hasFullAccess(access);
}

/** LinkedIn URL visible only with full access. */
export function canSeeLinkedIn(access: AccessInfo): boolean {
  return hasFullAccess(access);
}

/** Résumé link clickable only with full access. */
export function canSeeResume(access: AccessInfo): boolean {
  return hasFullAccess(access);
}

/**
 * Format candidate display name based on access.
 * Full access sees full names; others see "First L." (anti de-platforming).
 */
export function formatCandidateName(fullName: string, access: AccessInfo): string {
  if (hasFullAccess(access)) return fullName;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

/**
 * Filter candidate data for the given access tier. Call server-side BEFORE
 * passing data to client components so restricted fields never reach the browser.
 */
export function filterCandidateForTier(
  candidate: {
    displayName: string;
    email: string | null;
    phone: string | null;
    linkedinUrl?: string | null;
    resumeUrl?: string | null;
  },
  access: AccessInfo,
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
