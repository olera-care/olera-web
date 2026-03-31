/**
 * MedJobs Access Tier System
 *
 * Four tiers control what providers see and can do:
 *
 * 1. anonymous    — not logged in, limited preview
 * 2. free_active  — logged in, < 3 confirmed interviews
 * 3. free_exhausted — logged in, >= 3 confirmed interviews, not paid
 * 4. paid         — active $50/mo subscription
 */

export type AccessTier = "anonymous" | "free_active" | "free_exhausted" | "paid";

export interface AccessInfo {
  tier: AccessTier;
  interviewsUsed: number;
  interviewsRemaining: number;
  isPaid: boolean;
}

const FREE_INTERVIEW_LIMIT = 3;

/**
 * Determine the provider's access tier.
 *
 * @param isAuthenticated - Whether the user has an active session
 * @param providerMeta - The provider's business_profiles.metadata (if they have a provider profile)
 * @param interviewCount - Count of confirmed/completed/no_show interviews (optional override; if not provided, reads from metadata cache)
 */
export function getAccessTier(
  isAuthenticated: boolean,
  providerMeta?: Record<string, unknown> | null,
  interviewCount?: number
): AccessInfo {
  if (!isAuthenticated || !providerMeta) {
    return { tier: "anonymous", interviewsUsed: 0, interviewsRemaining: 0, isPaid: false };
  }

  const isPaid = !!(providerMeta.medjobs_subscription_active as boolean);
  const count = interviewCount ?? ((providerMeta.medjobs_interview_count as number) || 0);

  if (isPaid) {
    return { tier: "paid", interviewsUsed: count, interviewsRemaining: Infinity, isPaid: true };
  }

  if (count < FREE_INTERVIEW_LIMIT) {
    return {
      tier: "free_active",
      interviewsUsed: count,
      interviewsRemaining: FREE_INTERVIEW_LIMIT - count,
      isPaid: false,
    };
  }

  return { tier: "free_exhausted", interviewsUsed: count, interviewsRemaining: 0, isPaid: false };
}

/**
 * Check if a provider can schedule a new interview.
 */
export function canScheduleInterview(access: AccessInfo): boolean {
  return access.tier === "paid" || access.tier === "free_active";
}

/**
 * Check if contact info (email, phone) should be visible.
 */
export function canSeeContactInfo(access: AccessInfo): boolean {
  return access.tier === "paid" || access.tier === "free_active";
}

/**
 * Check if LinkedIn URL should be visible.
 */
export function canSeeLinkedIn(access: AccessInfo): boolean {
  return access.tier === "paid" || access.tier === "free_active";
}

/**
 * Check if resume link should be clickable (vs just "on file" badge).
 */
export function canSeeResume(access: AccessInfo): boolean {
  return access.tier === "paid";
}

/**
 * Format candidate display name based on access tier.
 * Free providers see "First L." — paid see full name.
 */
export function formatCandidateName(fullName: string, access: AccessInfo): string {
  if (access.tier === "paid") return fullName;
  if (access.tier === "anonymous") {
    // Anonymous: first name only
    return fullName.split(" ")[0];
  }
  // Free (active or exhausted): First + last initial
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}
