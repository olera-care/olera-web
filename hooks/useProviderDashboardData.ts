"use client";

import type { Profile } from "@/lib/types";
import type { ExtendedMetadata } from "@/lib/profile-completeness";

/**
 * Returns the provider's dashboard metadata. The business_profile is the
 * canonical, fully-hydrated provider record (the directory listing is copied in
 * at claim time), so its metadata already carries photos and the rest — no
 * directory enrichment fetch needed.
 */
export function useProviderDashboardData(profile: Profile | null) {
  const metadata = (profile?.metadata || {}) as ExtendedMetadata;
  return { metadata };
}
