"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { FamilyMetadata } from "@/lib/types";

export function useSavedBenefits() {
  const { user, activeProfile, openAuth, refreshAccountData } = useAuth();

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
      // Auth gate for anonymous users
      if (!user || !activeProfile) {
        openAuth({
          defaultMode: "sign-up",
          intent: "family",
          deferred: {
            action: "save_benefit" as const,
            benefitProgramName: programName,
            returnUrl:
              typeof window !== "undefined"
                ? window.location.pathname + window.location.search
                : "/benefits/finder",
          },
        });
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
    [user, activeProfile, savedBenefits, openAuth, refreshAccountData]
  );

  return { savedBenefits, isBenefitSaved, saveBenefit };
}
