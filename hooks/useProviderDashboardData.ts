"use client";

import { useEffect, useState, useRef } from "react";
import type { Profile } from "@/lib/types";
import type { ExtendedMetadata } from "@/lib/profile-completeness";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

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
    if (!profile.source_provider_id || !isSupabaseConfigured()) {
      return;
    }

    // Skip if we've already enriched this profile
    if (hasEnrichedRef.current === profile.id) {
      return;
    }

    // Fetch enrichment in background (don't block render)
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("olera-providers")
          .select(
            "provider_images, provider_logo, community_Score, value_score, information_availability_score, google_rating"
          )
          .eq("provider_id", profile.source_provider_id!)
          .single();

        if (data) {
          const iosImages = (data.provider_images as string | null)
            ? (data.provider_images as string)
                .split(" | ")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
          const logoImages = (data.provider_logo as string | null)
            ? [data.provider_logo as string, ...iosImages]
            : iosImages;

          setMetadata({
            ...currentBaseMeta,
            images:
              currentBaseMeta.images && currentBaseMeta.images.length > 0
                ? currentBaseMeta.images
                : logoImages,
            community_score:
              currentBaseMeta.community_score ??
              (data.community_Score as number | null) ??
              undefined,
            value_score:
              currentBaseMeta.value_score ??
              (data.value_score as number | null) ??
              undefined,
            info_score:
              currentBaseMeta.info_score ??
              (data.information_availability_score as number | null) ??
              undefined,
            rating:
              currentBaseMeta.rating ??
              (data.google_rating as number | null) ??
              undefined,
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
