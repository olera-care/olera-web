"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import type { ExtendedMetadata } from "@/lib/profile-completeness";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Enriches a provider profile with data from the olera-providers table when
 * the profile was claimed from the iOS directory (source_provider_id is set).
 */
export function useProviderDashboardData(profile: Profile | null) {
  const [metadata, setMetadata] = useState<ExtendedMetadata>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setMetadata({});
      setLoading(false);
      return;
    }

    const baseMeta = (profile.metadata || {}) as ExtendedMetadata;

    if (profile.source_provider_id && isSupabaseConfigured()) {
      setLoading(true);

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
              ...baseMeta,
              images:
                baseMeta.images && baseMeta.images.length > 0
                  ? baseMeta.images
                  : logoImages,
              community_score:
                baseMeta.community_score ??
                (data.community_Score as number | null) ??
                undefined,
              value_score:
                baseMeta.value_score ??
                (data.value_score as number | null) ??
                undefined,
              info_score:
                baseMeta.info_score ??
                (data.information_availability_score as number | null) ??
                undefined,
              rating:
                baseMeta.rating ??
                (data.google_rating as number | null) ??
                undefined,
            });
          } else {
            setMetadata(baseMeta);
          }
        } catch {
          setMetadata(baseMeta);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setMetadata(baseMeta);
      setLoading(false);
    }
  }, [profile]);

  return { metadata, loading };
}
