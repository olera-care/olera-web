"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import type { Profile } from "@/lib/types";

/**
 * Returns the first provider profile (organization or caregiver) for the
 * current user, or null if none exists.
 */
export function useProviderProfile(): Profile | null {
  const { profiles } = useAuth();

  return (
    (profiles || []).find(
      (p) => p.type === "organization" || p.type === "caregiver"
    ) ?? null
  );
}
