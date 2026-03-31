import type { StudentMetadata } from "@/lib/types";

/**
 * MedJobs Profile Completeness — Single Source of Truth
 *
 * Used by:
 * - Portal page (client-side UI)
 * - Nudge cron job (server-side email decisions)
 * - Activation email trigger (server-side)
 *
 * Every item here is REQUIRED for a profile to be considered 100% complete.
 */

export const SCENARIO_QUESTIONS = [
  {
    key: "scenario_reliability",
    question:
      "You have an exam tomorrow but your client's family is counting on you for a shift tonight. What do you do?",
  },
  {
    key: "scenario_judgement",
    question:
      "You arrive at a client's home and notice they seem confused and have a bruise they can't explain. What steps do you take?",
  },
  {
    key: "scenario_commitment",
    question:
      "Why do you want to commit to caregiving for multiple semesters, and how will this experience help your career in healthcare?",
  },
] as const;

export interface CompletenessItem {
  key: string;
  label: string;
  done: boolean;
  /** Category for grouping in UI */
  category: "verification" | "profile";
}

/**
 * Calculate all completeness items for a student profile.
 *
 * @param meta - StudentMetadata from the business_profiles.metadata JSONB
 * @param hasPhoto - Whether the profile has an image_url set (from business_profiles.image_url, not metadata)
 */
export function getCompletenessItems(
  meta: StudentMetadata,
  hasPhoto: boolean
): CompletenessItem[] {
  const scenarios = meta.scenario_responses || [];

  return [
    // Verification (required to go live)
    { key: "video", label: "Intro video", done: !!meta.video_intro_url, category: "verification" },
    { key: "drivers_license", label: "Driver\u2019s license", done: !!(meta.drivers_license_url && meta.drivers_license_expiration), category: "verification" },
    { key: "car_insurance", label: "Car insurance", done: !!(meta.car_insurance_url && meta.car_insurance_expiration), category: "verification" },

    // Profile
    { key: "photo", label: "Profile photo", done: hasPhoto, category: "profile" },
    { key: "schedule", label: "Semester schedule", done: !!meta.course_schedule_grid, category: "profile" },
    { key: "commitment", label: "Availability & commitment", done: !!(meta.hours_per_week_range && meta.commitment_statement && meta.commitment_statement.length >= 50), category: "profile" },
    { key: "experience", label: "Experience level", done: meta.years_caregiving != null, category: "profile" },
    { key: "care_types", label: "Care types", done: (meta.care_experience_types?.length ?? 0) > 0, category: "profile" },
    { key: "languages", label: "Languages", done: (meta.languages?.length ?? 0) > 0, category: "profile" },
    { key: "why", label: "Why I want to be a caregiver", done: !!(meta.why_caregiving && meta.why_caregiving.length >= 100), category: "profile" },
    { key: "scenarios", label: "Screening questions", done: scenarios.length >= SCENARIO_QUESTIONS.length && scenarios.every((s) => s.answer?.length >= 50), category: "profile" },
    { key: "resume_or_linkedin", label: "Resume or LinkedIn", done: !!(meta.resume_url || meta.linkedin_url), category: "profile" },
  ];
}

/**
 * Calculate the completeness percentage (0-100).
 */
export function calculateCompleteness(
  meta: StudentMetadata,
  hasPhoto: boolean
): number {
  const items = getCompletenessItems(meta, hasPhoto);
  const doneCount = items.filter((i) => i.done).length;
  return Math.round((doneCount / items.length) * 100);
}

/**
 * Get verification items only (for the verification section UI).
 */
export function getVerificationItems(meta: StudentMetadata): CompletenessItem[] {
  return getCompletenessItems(meta, false).filter((i) => i.category === "verification");
}

/**
 * Get profile items only (for the profile section UI).
 */
export function getProfileItems(
  meta: StudentMetadata,
  hasPhoto: boolean
): CompletenessItem[] {
  return getCompletenessItems(meta, hasPhoto).filter((i) => i.category === "profile");
}

/**
 * Get list of incomplete item labels (for nudge emails).
 */
export function getIncompleteItems(
  meta: StudentMetadata,
  hasPhoto: boolean
): string[] {
  return getCompletenessItems(meta, hasPhoto)
    .filter((i) => !i.done)
    .map((i) => i.label);
}
