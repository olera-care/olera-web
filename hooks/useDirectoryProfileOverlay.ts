"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";

/**
 * For a directory-linked provider, fetch the CORE display fields from the
 * directory row (the public source of truth) and overlay them onto the thin
 * business_profiles record so the dashboard editor shows the provider's real
 * listing instead of blanks. No-op for account-first providers (no
 * source_provider_id) — they render straight from business_profiles.
 *
 * Reads go through the ownership-checked server API (olera-providers is
 * service-role-only). Scoped to the provider dashboard so AuthProvider — and
 * every other surface that consumes it — is untouched.
 */
export function useDirectoryProfileOverlay(
  profile: Profile | null,
): Profile | null {
  const [overlay, setOverlay] = useState<Record<string, unknown> | null>(null);
  const profileId = profile?.id ?? null;
  const sourceProviderId = profile?.source_provider_id ?? null;

  useEffect(() => {
    if (!profileId || !sourceProviderId) {
      setOverlay(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/provider/profile/directory?profileId=${encodeURIComponent(profileId)}`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { overlay?: Record<string, unknown> };
        if (!cancelled) setOverlay(data.overlay ?? null);
      } catch {
        /* directory unreachable — fall back to the thin profile */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId, sourceProviderId]);

  if (!profile) return null;
  if (!overlay) return profile;

  // Prefer directory values where present; keep business_profiles for the rest.
  // Writes mirror both records, so they stay in sync going forward.
  const merged = { ...profile } as Record<string, unknown>;
  for (const [k, v] of Object.entries(overlay)) {
    if (v != null && v !== "") merged[k] = v;
  }
  return merged as unknown as Profile;
}
