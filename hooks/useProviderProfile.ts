"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import type { Profile } from "@/lib/types";

/**
 * Returns the current provider profile (organization or caregiver) for the
 * current account, or null if none exists.
 *
 * If the activeProfile is a provider type, returns that.
 * Otherwise, returns the first provider profile found.
 * This ensures users land on newly created/claimed profiles.
 */
export function useProviderProfile(): Profile | null {
  const { profiles, activeProfile } = useAuth();

  // Prefer activeProfile if it's a provider type
  if (
    activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver")
  ) {
    return activeProfile;
  }

  // Fall back to first provider profile
  return (
    profiles.find(
      (p) => p.type === "organization" || p.type === "caregiver"
    ) ?? null
  );
}
