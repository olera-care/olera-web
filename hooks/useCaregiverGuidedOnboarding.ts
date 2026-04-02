"use client";

import { useState, useCallback, useMemo } from "react";
import {
  GUIDED_SECTION_ORDER,
  type CaregiverSectionId,
} from "@/components/caregiver-portal/edit-modals/types";

/** Simple item interface for completeness tracking */
interface CompletenessItem {
  key: string;
  label: string;
  done: boolean;
}

const DISMISS_KEY = "olera_caregiver_onboarding_dismissed";
const LOW_COMPLETENESS_THRESHOLD = 50;

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

/**
 * Maps completeness section IDs to caregiver modal section IDs.
 * This bridges the completeness calculation with the modal routing.
 */
const ITEM_TO_SECTION: Record<string, CaregiverSectionId> = {
  overview: "overview",
  verification: "verification",
  schedule: "schedule",
  availability: "availability",
  why: "why",
  scenarios: "scenarios",
  background: "background",
  resume: "resume",
  // Legacy mappings for backward compatibility
  commitment: "availability",
  experience: "background",
  care_types: "background",
  languages: "background",
  resume_or_linkedin: "resume",
};

interface CaregiverCompleteness {
  overall: number;
  items: CompletenessItem[];
}

export function useCaregiverGuidedOnboarding(completeness: CaregiverCompleteness) {
  const [dismissed, setDismissedState] = useState(isDismissed);
  const [active, setActive] = useState(false);

  // Find which sections are incomplete
  const incompleteSections = useMemo(() => {
    const incompleteItemKeys = completeness.items
      .filter((item) => !item.done)
      .map((item) => item.key);

    // Map item keys to section IDs and deduplicate
    const sectionSet = new Set<CaregiverSectionId>();
    for (const key of incompleteItemKeys) {
      const sectionId = ITEM_TO_SECTION[key];
      if (sectionId) {
        sectionSet.add(sectionId);
      }
    }

    // Return sections in guided order
    return GUIDED_SECTION_ORDER.filter((id) => sectionSet.has(id));
  }, [completeness.items]);

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
    (current: CaregiverSectionId): CaregiverSectionId | null => {
      const idx = incompleteSections.indexOf(current);
      return idx >= 0 && idx < incompleteSections.length - 1
        ? incompleteSections[idx + 1]
        : null;
    },
    [incompleteSections]
  );

  const getPrevSection = useCallback(
    (current: CaregiverSectionId): CaregiverSectionId | null => {
      const idx = incompleteSections.indexOf(current);
      return idx > 0 ? incompleteSections[idx - 1] : null;
    },
    [incompleteSections]
  );

  const getStepNumber = useCallback(
    (current: CaregiverSectionId): number => {
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
