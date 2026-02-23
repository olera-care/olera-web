import { useMemo } from "react";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";

export type SectionStatus = "complete" | "incomplete" | "empty";

interface CompletenessResult {
  percentage: number;
  firstIncompleteStep: number;
  sectionStatus: Record<number, SectionStatus>;
}

const FIELD_CHECKS: {
  weight: number;
  step: number;
  check: (p: BusinessProfile, email?: string) => boolean;
}[] = [
  // Step 0: Basic Info
  { weight: 10, step: 0, check: (p) => !!p.image_url },
  { weight: 5, step: 0, check: (p) => !!p.display_name },
  { weight: 5, step: 0, check: (p) => !!p.city },
  // Step 1: Contact
  { weight: 10, step: 1, check: (_p, email) => !!email },
  { weight: 10, step: 1, check: (p) => !!p.phone },
  { weight: 5, step: 1, check: (p) => !!(p.metadata as FamilyMetadata)?.contact_preference },
  // Step 2: Care preferences
  { weight: 5, step: 2, check: (p) => !!(p.metadata as FamilyMetadata)?.relationship_to_recipient },
  { weight: 5, step: 2, check: (p) => (p.care_types?.length ?? 0) > 0 },
  { weight: 5, step: 2, check: (p) => !!(p.metadata as FamilyMetadata)?.timeline },
  { weight: 5, step: 2, check: (p) => !!p.description },
  // Step 3: Payment
  { weight: 10, step: 3, check: (p) => ((p.metadata as FamilyMetadata)?.payment_methods?.length ?? 0) > 0 },
  // Step 4: Living situation
  { weight: 5, step: 4, check: (p) => !!(p.metadata as FamilyMetadata)?.living_situation },
  // Step 5: Schedule & location
  { weight: 5, step: 5, check: (p) => !!(p.metadata as FamilyMetadata)?.schedule_preference },
  { weight: 5, step: 5, check: (p) => !!(p.metadata as FamilyMetadata)?.care_location },
  // Step 6: Language & about
  { weight: 5, step: 6, check: (p) => {
    const lang = (p.metadata as FamilyMetadata)?.language_preference;
    return Array.isArray(lang) ? lang.length > 0 : !!lang;
  }},
  { weight: 5, step: 6, check: (p) => !!(p.metadata as FamilyMetadata)?.about_situation },
];

function computeSectionStatus(
  profile: BusinessProfile,
  userEmail: string | undefined
): Record<number, SectionStatus> {
  const result: Record<number, SectionStatus> = {};

  // Group checks by step
  const byStep = new Map<number, boolean[]>();
  for (const field of FIELD_CHECKS) {
    if (!byStep.has(field.step)) byStep.set(field.step, []);
    byStep.get(field.step)!.push(field.check(profile, userEmail));
  }

  for (const [step, results] of byStep) {
    const filled = results.filter(Boolean).length;
    if (filled === results.length) {
      result[step] = "complete";
    } else if (filled === 0) {
      result[step] = "empty";
    } else {
      result[step] = "incomplete";
    }
  }

  return result;
}

export function useProfileCompleteness(
  profile: BusinessProfile | null,
  userEmail?: string
): CompletenessResult {
  return useMemo(() => {
    if (!profile) return { percentage: 0, firstIncompleteStep: 0, sectionStatus: {} };

    let earned = 0;
    let firstIncomplete = 7; // past the last step means all complete

    for (const field of FIELD_CHECKS) {
      if (field.check(profile, userEmail)) {
        earned += field.weight;
      } else if (field.step >= 0 && field.step < firstIncomplete) {
        firstIncomplete = field.step;
      }
    }

    return {
      percentage: Math.min(earned, 100),
      firstIncompleteStep: firstIncomplete >= 7 ? 0 : firstIncomplete,
      sectionStatus: computeSectionStatus(profile, userEmail),
    };
  }, [profile, userEmail]);
}
