"use client";

import { useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { FamilyMetadata } from "@/lib/types";

export function useSavedBenefits() {
  const { user, account, activeProfile, openAuth, refreshAccountData } = useAuth();
  const creatingProfile = useRef(false);

  const savedBenefits: string[] = useMemo(() => {
    if (!activeProfile) return [];
    return (activeProfile.metadata as FamilyMetadata)?.saved_benefits || [];
  }, [activeProfile]);

  const isBenefitSaved = useCallback(
    (programName: string) => savedBenefits.includes(programName),
    [savedBenefits]
  );

  const saveBenefit = useCallback(
    async (programName: string) => {
      // Not logged in at all → auth gate
      if (!user) {
        openAuth({
          defaultMode: "sign-up",
          intent: "family",
          deferred: {
            action: "save_benefit" as const,
            benefitProgramName: programName,
            returnUrl:
              typeof window !== "undefined"
                ? window.location.pathname + window.location.search
                : "/benefits",
          },
        });
        return;
      }

      // Logged in but no profile → auto-create a minimal family profile
      if (!activeProfile) {
        if (creatingProfile.current) return;
        creatingProfile.current = true;

        try {
          const displayName =
            account?.display_name || user.email?.split("@")[0] || "Family";

          const res = await fetch("/api/auth/create-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              intent: "family",
              displayName,
            }),
          });

          if (!res.ok) {
            console.error("[olera] Auto-create profile failed:", await res.text());
            return;
          }

          // Refresh so activeProfile is populated
          await refreshAccountData();

          // Now save the benefit using the fresh profile
          const supabase = createClient();
          const { data: freshAccount } = await supabase
            .from("accounts")
            .select("active_profile_id")
            .eq("user_id", user.id)
            .single();

          if (freshAccount?.active_profile_id) {
            const { data: profile } = await supabase
              .from("business_profiles")
              .select("metadata")
              .eq("id", freshAccount.active_profile_id)
              .single();

            const meta = (profile?.metadata || {}) as FamilyMetadata;
            const currentSaved = meta.saved_benefits || [];

            if (!currentSaved.includes(programName)) {
              await supabase
                .from("business_profiles")
                .update({
                  metadata: {
                    ...meta,
                    saved_benefits: [...currentSaved, programName],
                  },
                })
                .eq("id", freshAccount.active_profile_id);

              await refreshAccountData();
            }
          }
        } catch (err) {
          console.error("[olera] Failed to create profile and save benefit:", err);
        } finally {
          creatingProfile.current = false;
        }
        return;
      }

      // Already saved
      if (savedBenefits.includes(programName)) return;

      if (!isSupabaseConfigured()) return;
      const supabase = createClient();

      try {
        const { data: current } = await supabase
          .from("business_profiles")
          .select("metadata")
          .eq("id", activeProfile.id)
          .single();

        const currentMeta = (current?.metadata || {}) as FamilyMetadata;
        const currentSaved = currentMeta.saved_benefits || [];

        if (currentSaved.includes(programName)) return;

        await supabase
          .from("business_profiles")
          .update({
            metadata: {
              ...currentMeta,
              saved_benefits: [...currentSaved, programName],
            },
          })
          .eq("id", activeProfile.id);

        await refreshAccountData();
      } catch (err) {
        console.error("[olera] Failed to save benefit:", err);
      }
    },
    [user, account, activeProfile, savedBenefits, openAuth, refreshAccountData]
  );

  return { savedBenefits, isBenefitSaved, saveBenefit };
}
