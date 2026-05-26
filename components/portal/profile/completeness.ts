import { useMemo } from "react";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";

export type SectionStatus = "complete" | "incomplete" | "empty";

interface CompletenessResult {
  percentage: number;
  firstIncompleteStep: number;
  sectionStatus: Record<number, SectionStatus>;
}

/**
 * Field weights - prioritized for enrichment flow and provider value.
 * Total: 100 points
 *
 * Weights optimized for:
 * - Higher weights for fields collected during enrichment (Steps 1-5)
 * - Lower weights for fields not in enrichment flow
 * - Name split: 5 for placeholder "Care Seeker", +5 bonus for real name
 * - Auto-filled fields (city, care_types) valued for Go Live requirements
 */
const FIELD_CHECKS: {
  weight: number;
  step: number;
  check: (p: BusinessProfile, email?: string) => boolean;
}[] = [
  // Step 0: Basic Info (20 total)
  { weight: 2, step: 0, check: (p) => !!p.image_url },
  { weight: 5, step: 0, check: (p) => !!p.display_name }, // Placeholder "Care Seeker" counts
  { weight: 5, step: 0, check: (p) => !!p.display_name && p.display_name.toLowerCase() !== "care seeker" }, // Bonus for real name
  { weight: 8, step: 0, check: (p) => !!p.city }, // Required for Go Live
  // Step 1: Contact (24 total)
  { weight: 10, step: 1, check: (_p, email) => !!email },
  { weight: 12, step: 1, check: (p) => !!p.phone }, // Enrichment Step 5
  { weight: 2, step: 1, check: (p) => !!(p.metadata as FamilyMetadata)?.contact_preference },
  // Step 2: Care Recipient (16 total)
  { weight: 10, step: 2, check: (p) => !!(p.metadata as FamilyMetadata)?.relationship_to_recipient || !!(p.metadata as FamilyMetadata)?.who_needs_care }, // Enrichment Step 1
  { weight: 2, step: 2, check: (p) => !!(p.metadata as FamilyMetadata)?.age },
  { weight: 4, step: 2, check: (p) => !!p.description || !!(p.metadata as FamilyMetadata)?.about_situation },
  // Step 3: Care Needs (28 total)
  { weight: 8, step: 3, check: (p) => (p.care_types?.length ?? 0) > 0 }, // Required for Go Live
  { weight: 6, step: 3, check: (p) => ((p.metadata as FamilyMetadata)?.care_needs?.length ?? 0) > 0 }, // Enrichment Step 3
  { weight: 12, step: 3, check: (p) => !!(p.metadata as FamilyMetadata)?.timeline }, // Enrichment Step 2
  { weight: 2, step: 3, check: (p) => !!(p.metadata as FamilyMetadata)?.schedule_preference },
  // Step 4: Payment (12 total)
  { weight: 12, step: 4, check: (p) => ((p.metadata as FamilyMetadata)?.payment_methods?.length ?? 0) > 0 }, // Enrichment Step 4
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

/**
 * Standalone calculation function (not a hook) for use in save handlers.
 * Returns just the percentage for storage in metadata.
 */
export function calculateProfileCompletenessPercentage(
  profileData: {
    display_name?: string | null;
    image_url?: string | null;
    city?: string | null;
    phone?: string | null;
    description?: string | null;
    care_types?: string[] | null;
    metadata?: FamilyMetadata | null;
  },
  email?: string | null
): number {
  const meta = (profileData.metadata || {}) as FamilyMetadata;

  // Check if name is a real name (not placeholder "Care Seeker" - case insensitive)
  const hasRealName = !!profileData.display_name && profileData.display_name.toLowerCase() !== "care seeker";

  let earned = 0;

  // Basic Info (20 total)
  if (profileData.image_url) earned += 2;
  if (profileData.display_name) earned += 5; // Placeholder counts
  if (hasRealName) earned += 5; // Bonus for real name
  if (profileData.city) earned += 8; // Required for Go Live

  // Contact (24 total)
  if (email) earned += 10;
  if (profileData.phone) earned += 12; // Enrichment Step 5
  if (meta.contact_preference) earned += 2;

  // Care Recipient (16 total)
  if (meta.relationship_to_recipient || meta.who_needs_care) earned += 10; // Enrichment Step 1
  if (meta.age) earned += 2;
  if (profileData.description || meta.about_situation) earned += 4;

  // Care Needs (28 total)
  if ((profileData.care_types?.length ?? 0) > 0) earned += 8; // Required for Go Live
  if ((meta.care_needs?.length ?? 0) > 0) earned += 6; // Enrichment Step 3
  if (meta.timeline) earned += 12; // Enrichment Step 2
  if (meta.schedule_preference) earned += 2;

  // Payment (12 total)
  if ((meta.payment_methods?.length ?? 0) > 0) earned += 12; // Enrichment Step 4

  return Math.min(earned, 100);
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
