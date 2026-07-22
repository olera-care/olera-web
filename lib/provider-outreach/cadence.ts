/**
 * Provider Outreach Cadence Configuration
 *
 * Defines the email sequence timing for provider cold outreach.
 * Each provider goes through a 4-email sequence:
 *   Day 0: Intro email
 *   Day 3: Follow-up email (profile gaps)
 *   Day 7: Summary email (everything in one place)
 *   Day 14: Breakup email (just the claim link)
 *
 * After the final email (Day 14) with no claim, the provider moves to
 * "needs_call" stage for manual follow-up.
 */

import type { ProviderOutreachTemplateKey } from "./templates";

/**
 * Cadence step definition
 */
export interface CadenceStep {
  day: number;
  templateKey: ProviderOutreachTemplateKey;
  description: string;
}

/**
 * The email cadence sequence.
 * Array index = step number (0-indexed).
 */
export const PROVIDER_OUTREACH_CADENCE: CadenceStep[] = [
  {
    day: 0,
    templateKey: "intro",
    description: "Introduction email - explain value of claiming profile",
  },
  {
    day: 3,
    templateKey: "followup",
    description: "Follow-up email - profile gaps and value",
  },
  {
    day: 7,
    templateKey: "final",
    description: "Summary email - everything in one place, full value prop",
  },
  {
    day: 14,
    templateKey: "breakup",
    description: "Breakup email - just the claim link, easy to find",
  },
];

/**
 * Number of days after final email before moving to "needs_call" stage.
 * If no claim after this period, provider needs manual follow-up.
 */
export const DAYS_AFTER_FINAL_TO_NEEDS_CALL = 7;

/**
 * Number of days a provider must wait in the re_engage stage before
 * being eligible for another outreach cycle.
 *
 * After this period:
 *   - Cycle 1 providers move to "ready" stage as cycle 2
 *   - Cycle 2 providers are auto-archived (two cycles exhausted)
 *
 * This constant is the single source of truth for the waiting period.
 * Change this value to adjust the re-engagement timing system-wide.
 */
export const RE_ENGAGE_WAITING_PERIOD_DAYS = 30;

/**
 * Get all cadence days as an array.
 * Useful for scheduling all tasks at once.
 */
export function getCadenceDays(): number[] {
  return PROVIDER_OUTREACH_CADENCE.map((step) => step.day);
}

/**
 * Get the cadence step for a given day.
 */
export function getCadenceStepByDay(day: number): CadenceStep | undefined {
  return PROVIDER_OUTREACH_CADENCE.find((step) => step.day === day);
}

/**
 * Get the template key for a given cadence day.
 */
export function getTemplateKeyForDay(
  day: number
): ProviderOutreachTemplateKey | undefined {
  const step = getCadenceStepByDay(day);
  return step?.templateKey;
}

/**
 * Get the next cadence step after the given day.
 * Returns undefined if the given day is the last step.
 */
export function getNextCadenceStep(
  currentDay: number
): CadenceStep | undefined {
  const currentIndex = PROVIDER_OUTREACH_CADENCE.findIndex(
    (step) => step.day === currentDay
  );
  if (currentIndex === -1 || currentIndex === PROVIDER_OUTREACH_CADENCE.length - 1) {
    return undefined;
  }
  return PROVIDER_OUTREACH_CADENCE[currentIndex + 1];
}

/**
 * Check if a given day is the final step in the cadence.
 */
export function isFinalCadenceStep(day: number): boolean {
  const lastStep = PROVIDER_OUTREACH_CADENCE[PROVIDER_OUTREACH_CADENCE.length - 1];
  return lastStep?.day === day;
}

/**
 * Calculate the due date for a cadence step.
 *
 * @param sequenceStartDate - When the sequence started (entered "in_sequence" stage)
 * @param cadenceDay - The cadence day number (0, 3, 7)
 * @returns The due date for that cadence step
 */
export function calculateDueDate(
  sequenceStartDate: Date,
  cadenceDay: number
): Date {
  const dueDate = new Date(sequenceStartDate);
  dueDate.setDate(dueDate.getDate() + cadenceDay);

  // Set to 9:00 AM local time for sends
  // (Adjust as needed for your target timezone)
  dueDate.setHours(9, 0, 0, 0);

  return dueDate;
}

/**
 * Calculate the date when a provider should move to "needs_call" stage.
 * This is DAYS_AFTER_FINAL_TO_NEEDS_CALL days after the final email.
 */
export function calculateNeedsCallDate(sequenceStartDate: Date): Date {
  const finalStep = PROVIDER_OUTREACH_CADENCE[PROVIDER_OUTREACH_CADENCE.length - 1];
  const finalEmailDate = calculateDueDate(sequenceStartDate, finalStep.day);
  const needsCallDate = new Date(finalEmailDate);
  needsCallDate.setDate(
    needsCallDate.getDate() + DAYS_AFTER_FINAL_TO_NEEDS_CALL
  );
  return needsCallDate;
}

/**
 * Generate all task due dates for a provider entering the sequence.
 *
 * @param sequenceStartDate - When the provider enters "in_sequence" stage
 * @returns Array of { day, templateKey, dueAt } for each email task
 */
export function generateTaskSchedule(sequenceStartDate: Date): Array<{
  day: number;
  templateKey: ProviderOutreachTemplateKey;
  dueAt: Date;
}> {
  return PROVIDER_OUTREACH_CADENCE.map((step) => ({
    day: step.day,
    templateKey: step.templateKey,
    dueAt: calculateDueDate(sequenceStartDate, step.day),
  }));
}
