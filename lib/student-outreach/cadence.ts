/**
 * Per-stakeholder-type outreach cadence over a 14-day cycle.
 *
 * Each step is "on Day N, queue task T." Day 0 is the first attempt;
 * Day 14 is the close-out boundary (no further auto-tasks beyond it).
 *
 * Cadence is RECOMMENDED, not enforced — admin can cancel/reschedule
 * any task. The state machine consults this table when entering
 * `outreach_sent` (initial Day 0 task) and after each FU is completed
 * (queue the next Day-N task).
 */

import type { StakeholderType, TaskType } from "./types";

export interface CadenceStep {
  day: number;
  task_type: TaskType;
}

export const CADENCE_END_DAY = 14;

export const CADENCE_BY_TYPE: Record<StakeholderType, CadenceStep[]> = {
  student_org: [
    { day: 0, task_type: "outreach_multichannel_orgs" },
    { day: 3, task_type: "outreach_followup_email" },
    { day: 7, task_type: "outreach_multichannel_orgs" },
    { day: 10, task_type: "outreach_followup_email" },
  ],
  advisor: [
    // Day 0 is the email + call combo (same task type, admin runs both)
    { day: 0, task_type: "outreach_day_0" },
    { day: 3, task_type: "outreach_followup_email" },
    { day: 5, task_type: "outreach_followup_call" },
    { day: 8, task_type: "outreach_followup_call" },
    { day: 10, task_type: "outreach_followup_email" },
  ],
  dept_head: [
    { day: 0, task_type: "outreach_day_0" },
    { day: 5, task_type: "outreach_followup_email" },
    { day: 7, task_type: "outreach_followup_call" },
    { day: 11, task_type: "outreach_followup_call" },
  ],
  professor: [
    // Email-only; runs only after permission is unlocked
    { day: 0, task_type: "outreach_followup_email" },
    { day: 3, task_type: "outreach_followup_email" },
    { day: 7, task_type: "outreach_followup_email" },
    { day: 10, task_type: "outreach_followup_email" },
  ],
};

/**
 * First step on entering outreach_sent. Always day 0.
 */
export function firstCadenceStep(type: StakeholderType): CadenceStep {
  const steps = CADENCE_BY_TYPE[type];
  return steps[0] ?? { day: 0, task_type: "outreach_followup_email" };
}

/**
 * Step strictly after currentDay. Returns null if cycle exhausted.
 */
export function nextCadenceStep(
  type: StakeholderType,
  currentDay: number,
): CadenceStep | null {
  const steps = CADENCE_BY_TYPE[type];
  return steps.find((s) => s.day > currentDay) ?? null;
}

/**
 * Compute due_at for a cadence step, anchored to outreach_started_at.
 */
export function dueAtForStep(startedAt: Date, step: CadenceStep): Date {
  const d = new Date(startedAt);
  d.setUTCDate(d.getUTCDate() + step.day);
  return d;
}
