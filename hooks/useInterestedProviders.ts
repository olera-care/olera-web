"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Connection, Profile } from "@/lib/types";

export interface InterestedProvider extends Connection {
  providerProfile: Profile | null;
}

interface UseInterestedProvidersResult {
  pending: InterestedProvider[];
  declined: InterestedProvider[];
  pendingCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Optimistic local update — move, remove, or mark viewed */
  updateLocal: (connectionId: string, update: Partial<InterestedProvider> | "remove") => void;
}

export function useInterestedProviders(
  profileId: string | undefined
): UseInterestedProvidersResult {
  const [all, setAll] = useState<InterestedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!profileId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Fetch provider-initiated request connections directed at this care seeker
      const { data: connections, error: connError } = await supabase
        .from("connections")
        .select(
          "id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at"
        )
        .eq("to_profile_id", profileId)
        .eq("type", "request")
        .in("status", ["pending", "declined"])
        .order("created_at", { ascending: false });

      if (connError) throw new Error(connError.message);

      // Filter to only provider-initiated requests (metadata.provider_initiated = true)
      const connData = ((connections || []) as Connection[]).filter(
        (c) => (c.metadata as Record<string, unknown>)?.provider_initiated === true
      );

      // Fetch provider profiles
      const providerIds = connData.map((c) => c.from_profile_id);
      let profileMap = new Map<string, Profile>();

      if (providerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("business_profiles")
          .select(
            "id, display_name, description, image_url, city, state, type, email, phone, website, slug, care_types, category, source_provider_id, metadata"
          )
          .in("id", providerIds);

        profileMap = new Map(
          ((profiles as Profile[]) || []).map((p) => [p.id, p])
        );

        // Resolve iOS images for providers missing image_url
        const missingImageIds = ((profiles as Profile[]) || [])
          .filter((p) => !p.image_url && p.source_provider_id)
          .map((p) => p.source_provider_id as string);

        if (missingImageIds.length > 0) {
          const { data: iosProviders } = await supabase
            .from("olera-providers")
            .select("provider_id, provider_logo, provider_images")
            .in("provider_id", missingImageIds);

          if (iosProviders?.length) {
            const iosMap = new Map(
              iosProviders.map(
                (p: {
                  provider_id: string;
                  provider_logo: string | null;
                  provider_images: string | null;
                }) => [
                  p.provider_id,
                  p.provider_logo ||
                    p.provider_images?.split(" | ")[0] ||
                    null,
                ]
              )
            );
            for (const [id, profile] of profileMap) {
              if (
                !profile.image_url &&
                profile.source_provider_id &&
                iosMap.has(profile.source_provider_id)
              ) {
                profileMap.set(id, {
                  ...profile,
                  image_url: iosMap.get(profile.source_provider_id) || null,
                });
              }
            }
          }
        }
      }

      const enriched: InterestedProvider[] = connData.map((c) => ({
        ...c,
        providerProfile: profileMap.get(c.from_profile_id) || null,
      }));

      setAll(enriched);
      setError(null);
    } catch (err: unknown) {
      console.error("[olera] fetchInterestedProviders failed:", err);
      setError(
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err)
      );
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateLocal = useCallback(
    (connectionId: string, update: Partial<InterestedProvider> | "remove") => {
      setAll((prev) => {
        if (update === "remove") {
          return prev.filter((c) => c.id !== connectionId);
        }
        return prev.map((c) =>
          c.id === connectionId ? { ...c, ...update } : c
        );
      });
    },
    []
  );

  const pending = useMemo(
    () => all.filter((c) => c.status === "pending"),
    [all]
  );
  const declined = useMemo(
    () => all.filter((c) => c.status === "declined"),
    [all]
  );

  return {
    pending,
    declined,
    pendingCount: pending.length,
    loading,
    error,
    refetch: fetchData,
    updateLocal,
  };
}
