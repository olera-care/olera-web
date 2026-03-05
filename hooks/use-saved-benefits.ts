"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getDeferredAction, clearDeferredAction } from "@/lib/deferred-action";
import type { FamilyMetadata } from "@/lib/types";

/**
 * Persists saved benefit program names to the user's profile metadata
 * in Supabase (`business_profiles.metadata.saved_benefits`).
 *
 * If the user is not logged in, triggers auth with a deferred action
 * so the save completes after sign-up/sign-in.
 */
export function useSavedBenefits() {
  const { user, activeProfile, openAuth, refreshAccountData } = useAuth();

  const savedBenefits: string[] = useMemo(() => {
    if (!activeProfile) return [];
    return (activeProfile.metadata as FamilyMetadata)?.saved_benefits ?? [];
  }, [activeProfile]);

  const isSaved = useCallback(
    (programName: string) => savedBenefits.includes(programName),
    [savedBenefits],
  );

  /** Update the saved_benefits array in the DB and refresh auth state. */
  const updateSavedBenefits = useCallback(
    async (next: string[]) => {
      if (!activeProfile || !isSupabaseConfigured()) return;
      const supabase = createClient();

      try {
        const { data: current } = await supabase
          .from("business_profiles")
          .select("metadata")
          .eq("id", activeProfile.id)
          .single();

        const meta = (current?.metadata ?? {}) as FamilyMetadata;

        await supabase
          .from("business_profiles")
          .update({ metadata: { ...meta, saved_benefits: next } })
          .eq("id", activeProfile.id);

        await refreshAccountData();
      } catch (err) {
        console.error("[olera] Failed to update saved benefits:", err);
      }
    },
    [activeProfile, refreshAccountData],
  );

  // After auth completes, check for a pending save_benefit deferred action.
  const deferredHandled = useRef(false);
  useEffect(() => {
    if (!user || !activeProfile || deferredHandled.current) return;
    const deferred = getDeferredAction();
    if (deferred?.action !== "save_benefit" || !deferred.benefitProgramName) return;

    deferredHandled.current = true;
    clearDeferredAction();

    // Only save if not already saved
    if (!savedBenefits.includes(deferred.benefitProgramName)) {
      updateSavedBenefits([...savedBenefits, deferred.benefitProgramName]);
    }
  }, [user, activeProfile, savedBenefits, updateSavedBenefits]);

  /** Save or unsave a benefit. Auth-gates unauthenticated users. */
  const toggleSave = useCallback(
    async (programName: string) => {
      if (!user) {
        openAuth({
          defaultMode: "sign-up",
          intent: "family",
          deferred: {
            action: "save_benefit",
            benefitProgramName: programName,
            returnUrl:
              typeof window !== "undefined"
                ? window.location.pathname + window.location.search
                : "/benefits/finder",
          },
        });
        return;
      }

      const alreadySaved = savedBenefits.includes(programName);
      const next = alreadySaved
        ? savedBenefits.filter((n) => n !== programName)
        : [...savedBenefits, programName];

      await updateSavedBenefits(next);
    },
    [user, savedBenefits, openAuth, updateSavedBenefits],
  );

  /** Remove a specific benefit (used from profile page). */
  const removeBenefit = useCallback(
    async (programName: string) => {
      const next = savedBenefits.filter((n) => n !== programName);
      await updateSavedBenefits(next);
    },
    [savedBenefits, updateSavedBenefits],
  );

  return {
    savedBenefits,
    savedCount: savedBenefits.length,
    isSaved,
    toggleSave,
    removeBenefit,
  };
}
