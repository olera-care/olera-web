"use client";

import { useState, useCallback, useMemo } from "react";
import type { ProfileCompleteness } from "@/lib/profile-completeness";
import {
  GUIDED_SECTION_ORDER,
  type SectionId,
} from "@/components/provider-dashboard/edit-modals/types";

const DISMISS_KEY = "olera_dashboard_onboarding_dismissed";
const LOW_COMPLETENESS_THRESHOLD = 30;

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function persistDismiss(): void {
  try {
    localStorage.setItem(DISMISS_KEY, "true");
  } catch {
    /* ignore */
  }
}

export function useGuidedOnboarding(completeness: ProfileCompleteness) {
  const [dismissed, setDismissedState] = useState(isDismissed);
  const [active, setActive] = useState(false);

  const incompleteSections = useMemo(
    () =>
      GUIDED_SECTION_ORDER.filter(
        (id) =>
          (completeness.sections.find((s) => s.id === id)?.percent ?? 0) < 100
      ),
    [completeness]
  );

  const shouldPrompt =
    completeness.overall < LOW_COMPLETENESS_THRESHOLD &&
    !dismissed &&
    incompleteSections.length > 0;

  const startGuided = useCallback(() => setActive(true), []);

  const dismiss = useCallback(() => {
    persistDismiss();
    setDismissedState(true);
    setActive(false);
  }, []);

  const stopGuided = useCallback(() => setActive(false), []);

  const getNextSection = useCallback(
    (current: SectionId): SectionId | null => {
      const idx = incompleteSections.indexOf(current);
      return idx >= 0 && idx < incompleteSections.length - 1
        ? incompleteSections[idx + 1]
        : null;
    },
    [incompleteSections]
  );

  const getPrevSection = useCallback(
    (current: SectionId): SectionId | null => {
      const idx = incompleteSections.indexOf(current);
      return idx > 0 ? incompleteSections[idx - 1] : null;
    },
    [incompleteSections]
  );

  const getStepNumber = useCallback(
    (current: SectionId): number => {
      return incompleteSections.indexOf(current) + 1;
    },
    [incompleteSections]
  );

  return {
    shouldPrompt,
    isGuidedActive: active,
    incompleteSections,
    totalSteps: incompleteSections.length,
    firstIncompleteSection: incompleteSections[0] ?? null,
    startGuided,
    dismiss,
    stopGuided,
    getNextSection,
    getPrevSection,
    getStepNumber,
  };
}
