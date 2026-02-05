import type { Membership, Profile } from "@/lib/types";

/**
 * Minimum profile completeness check.
 * A profile must have at least a name, a location (city or state),
 * and at least one care type before it can be shared.
 */
export function isProfileShareable(profile: Profile | null): boolean {
  if (!profile) return false;
  if (!profile.display_name?.trim()) return false;
  if (!profile.city && !profile.state) return false;
  if (profile.care_types.length === 0) return false;
  // Providers must have a description
  if (profile.type !== "family" && !profile.description?.trim()) return false;
  // Providers must have at least one contact method
  if (profile.type !== "family" && !profile.phone && !profile.email && !profile.website) return false;
  return true;
}

/**
 * Returns an array of missing fields for profile completeness.
 */
export function getProfileCompletionGaps(profile: Profile | null): string[] {
  if (!profile) return ["profile"];
  const gaps: string[] = [];
  if (!profile.display_name?.trim()) gaps.push("display name");
  if (!profile.city && !profile.state) gaps.push("location (city or state)");
  if (profile.care_types.length === 0) gaps.push("care types");
  if (profile.type !== "family" && !profile.description?.trim()) gaps.push("description");
  if (profile.type !== "family" && !profile.phone && !profile.email && !profile.website) gaps.push("contact method (phone, email, or website)");
  return gaps;
}

/**
 * Engagement access rules.
 *
 * - Families always have full access (they never pay).
 * - Saves and viewing inquiry existence are always free.
 * - For providers, engagement actions (viewing details, responding,
 *   initiating contact) require either:
 *   1. An active Pro membership, OR
 *   2. Remaining free connections (3 total before paywall)
 */

export const FREE_CONNECTION_LIMIT = 3;

export type EngageAction =
  | "save"
  | "receive_inquiry"
  | "view_inquiry_metadata"
  | "view_inquiry_details"
  | "respond_to_inquiry"
  | "initiate_contact";

export function canEngage(
  profileType: Profile["type"] | undefined,
  membership: Membership | null,
  action: EngageAction
): boolean {
  // Families always can
  if (profileType === "family") return true;

  // Saves are always free
  if (action === "save") return true;

  // Receiving/viewing inquiry existence is always free
  if (action === "receive_inquiry" || action === "view_inquiry_metadata")
    return true;

  // Everything else requires paid membership OR remaining free connections
  if (!membership) return false;

  // Active paid membership
  if (membership.status === "active") return true;

  // Past due — grace period
  if (membership.status === "past_due") return true;

  // Free tier — check connection limit
  if (membership.status === "free" || membership.status === "trialing") {
    return (membership.free_responses_used ?? 0) < FREE_CONNECTION_LIMIT;
  }

  return false;
}

/**
 * Returns how many free connections remain, or null if on a paid plan.
 */
export function getFreeConnectionsRemaining(
  membership: Membership | null
): number | null {
  if (!membership) return FREE_CONNECTION_LIMIT;

  if (membership.status === "active" || membership.status === "past_due") {
    return null; // unlimited on paid plan
  }

  const used = membership.free_responses_used ?? 0;
  return Math.max(0, FREE_CONNECTION_LIMIT - used);
}
