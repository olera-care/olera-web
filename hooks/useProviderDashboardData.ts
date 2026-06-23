"use client";

import { useEffect, useState, useRef } from "react";
import type { Profile } from "@/lib/types";
import type { ExtendedMetadata } from "@/lib/profile-completeness";

/**
 * Enriches a provider profile with data from the olera-providers table when
 * the profile was claimed from the iOS directory (source_provider_id is set).
 *
 * Optimized for instant render: returns base metadata immediately, then
 * enriches in the background if needed. Loading state only blocks render
 * when we're waiting for the initial enrichment.
 */
export function useProviderDashboardData(profile: Profile | null) {
  // Initialize with profile metadata immediately - no waiting
  const baseMeta = (profile?.metadata || {}) as ExtendedMetadata;
  const [metadata, setMetadata] = useState<ExtendedMetadata>(baseMeta);

  // Track which profile we've already enriched to avoid redundant fetches
  const hasEnrichedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profile) {
      setMetadata({});
      return;
    }

    const currentBaseMeta = (profile.metadata || {}) as ExtendedMetadata;

    // Always update base metadata immediately when profile changes
    setMetadata(currentBaseMeta);

    // If we don't need enrichment, we're done
    if (!profile.source_provider_id) {
      return;
    }

    // Skip if we've already enriched this profile
    if (hasEnrichedRef.current === profile.id) {
      return;
    }

    // Fetch enrichment in the background via the ownership-checked server bridge.
    // olera-providers is service-role-only, so a direct browser read returns
    // nothing — the dashboard gallery was empty for claimed providers. The
    // bridge reads it server-side and returns the parsed image list + rating.
    (async () => {
      try {
        const res = await fetch(
          `/api/provider/profile/directory?profileId=${encodeURIComponent(profile.id)}`,
          { credentials: "include" },
        );
        if (res.ok) {
          const data = (await res.json()) as { images?: string[]; rating?: number | null };
          const logoImages = Array.isArray(data.images) ? data.images : [];
          setMetadata({
            ...currentBaseMeta,
            images:
              currentBaseMeta.images && currentBaseMeta.images.length > 0
                ? currentBaseMeta.images
                : logoImages,
            rating: currentBaseMeta.rating ?? data.rating ?? undefined,
          });
        }
        // Mark as enriched to avoid re-fetching
        hasEnrichedRef.current = profile.id;
      } catch {
        // Enrichment failed - base metadata is already set, so just continue
      }
    })();
  }, [profile]);

  return { metadata };
}
