"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import type { Profile } from "@/lib/types";

/**
 * Returns the first provider profile (organization or caregiver) for the
 * current account, or null if none exists.
 *
 * Provider portal pages use this instead of `activeProfile` so they are
 * never dependent on which profile the user last explicitly activated.
 */
export function useProviderProfile(): Profile | null {
  const { profiles } = useAuth();
  return (
    profiles.find(
      (p) => p.type === "organization" || p.type === "caregiver"
    ) ?? null
  );
}
