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
 * Engagement access — PAYWALL DISABLED
 *
 * All users have full access. No restrictions.
 * When ready to add paywall, implement logic here.
 */

// Kept for backwards compatibility with existing code
export const FREE_CONNECTION_LIMIT = 3;

export type EngageAction =
  | "save"
  | "receive_inquiry"
  | "view_inquiry_metadata"
  | "view_inquiry_details"
  | "respond_to_inquiry"
  | "initiate_contact";

/**
 * Check if user can perform an engagement action.
 * Currently always returns true — paywall disabled.
 */
export function canEngage(
  _profileType?: Profile["type"] | undefined,
  _membership?: Membership | null,
  _action?: EngageAction
): boolean {
  return true;
}

/**
 * Returns how many free connections remain, or null if unlimited.
 * Currently always returns null — paywall disabled.
 */
export function getFreeConnectionsRemaining(
  _membership?: Membership | null
): number | null {
  return null;
}
