/**
 * Per-stakeholder-type outreach cadence over a 14-day cycle.
 *
 * v3 model: each cadence DAY has a list of STEPS with required/optional
 * flags. The drawer renders one day's steps as a vertical checklist; the
 * required step(s) gate advancement to the next day.
 *
 * Cadence is RECOMMENDED, not enforced — admin can cancel/reschedule
 * any task. The state machine consults `firstCadenceStep` when entering
 * `outreach_sent` to queue the initial cadence task; the step list
 * inside the drawer drives the day-to-day workflow.
 */

import type { Channel, StakeholderType, TaskType } from "./types";

export type StepId = "email" | "ig_dm" | "contact_form" | "phone";

/** Template keys used by the email step. Match templates.ts. */
export type TemplateKey =
  | "intro"
  | "followup_light"
  | "followup_socialproof"
  | "followup_final"
  | "share"
  | "seasonal";

export interface OutreachStep {
  id: StepId;
  channel: Channel;
  required: boolean;
  /** Email step pulls subject/body from this template. */
  template?: TemplateKey;
  /** Display label override (e.g. "Re-attempt multi-channel"). */
  label?: string;
}

export interface OutreachDay {
  day: number;
  /** Friendly title for the day, shown in the step-list header. */
  title: string;
  steps: OutreachStep[];
}

export const CADENCE_END_DAY = 14;

export const OUTREACH_DAYS_BY_TYPE: Record<StakeholderType, OutreachDay[]> = {
  student_org: [
    {
      day: 0,
      title: "Day 0 · intro email to officers",
      steps: [
        { id: "email", channel: "email", required: true, template: "intro" },
      ],
    },
    {
      day: 3,
      title: "Day 3 · light follow-up",
      steps: [
        { id: "email", channel: "email", required: true, template: "followup_light" },
      ],
    },
    {
      day: 7,
      title: "Day 7 · social-proof follow-up",
      steps: [
        { id: "email", channel: "email", required: true, template: "followup_socialproof" },
      ],
    },
    {
      day: 10,
      title: "Day 10 · final follow-up",
      steps: [
        { id: "email", channel: "email", required: true, template: "followup_final" },
      ],
    },
  ],
  advisor: [
    {
      day: 0,
      title: "Day 0 · email + paired call",
      steps: [
        { id: "email", channel: "email", required: true, template: "intro" },
        { id: "phone", channel: "phone", required: true, label: "Call referencing the email" },
      ],
    },
    {
      day: 3,
      title: "Day 3 · email follow-up",
      steps: [{ id: "email", channel: "email", required: true, template: "followup_light" }],
    },
    {
      day: 5,
      title: "Day 5 · call attempt",
      steps: [{ id: "phone", channel: "phone", required: true }],
    },
    {
      day: 8,
      title: "Day 8 · call attempt",
      steps: [{ id: "phone", channel: "phone", required: true }],
    },
    {
      day: 10,
      title: "Day 10 · final email",
      steps: [{ id: "email", channel: "email", required: true, template: "followup_final" }],
    },
  ],
  dept_head: [
    {
      day: 0,
      title: "Day 0 · formal intro email",
      steps: [{ id: "email", channel: "email", required: true, template: "intro" }],
    },
    {
      day: 5,
      title: "Day 5 · email follow-up",
      steps: [{ id: "email", channel: "email", required: true, template: "followup_light" }],
    },
    {
      day: 7,
      title: "Day 7 · call attempt",
      steps: [{ id: "phone", channel: "phone", required: true }],
    },
    {
      day: 11,
      title: "Day 11 · call attempt",
      steps: [{ id: "phone", channel: "phone", required: true }],
    },
  ],
  professor: [
    {
      day: 0,
      title: "Day 0 · intro email (post-permission)",
      steps: [{ id: "email", channel: "email", required: true, template: "intro" }],
    },
    {
      day: 3,
      title: "Day 3 · email follow-up",
      steps: [{ id: "email", channel: "email", required: true, template: "followup_light" }],
    },
    {
      day: 7,
      title: "Day 7 · email follow-up",
      steps: [{ id: "email", channel: "email", required: true, template: "followup_socialproof" }],
    },
    {
      day: 10,
      title: "Day 10 · final email",
      steps: [{ id: "email", channel: "email", required: true, template: "followup_final" }],
    },
  ],
};

/** First day's first step — used by state-machine on enter outreach_sent. */
export function firstCadenceStep(type: StakeholderType): { day: number; task_type: TaskType } {
  const first = OUTREACH_DAYS_BY_TYPE[type][0];
  return {
    day: first.day,
    task_type: dayToTaskType(first),
  };
}

/** Day strictly after currentDay. Returns null if cycle exhausted. */
export function nextCadenceDay(type: StakeholderType, currentDay: number): OutreachDay | null {
  return OUTREACH_DAYS_BY_TYPE[type].find((d) => d.day > currentDay) ?? null;
}

/** Day matching currentDay (for the active step list). */
export function currentCadenceDay(type: StakeholderType, currentDay: number): OutreachDay | null {
  return OUTREACH_DAYS_BY_TYPE[type].find((d) => d.day === currentDay) ?? null;
}

/** Compute due_at offset (in days) for a target day, anchored to "now". */
export function daysFromNow(deltaDays: number): Date {
  return new Date(Date.now() + Math.max(0, deltaDays) * 86_400_000);
}

/**
 * Map a cadence day to the legacy `task_type` enum value used in the
 * tasks table. Each day gets one task representing "Day N is due."
 */
export function dayToTaskType(day: OutreachDay): TaskType {
  // The day's primary step's channel decides the task category.
  const primary = day.steps[0];
  if (primary?.channel === "phone") return "outreach_followup_call";
  // Multi-channel days use the multichannel task type.
  if (day.steps.length > 1 && day.steps.some((s) => s.channel === "ig_dm")) {
    return "outreach_multichannel_orgs";
  }
  if (day.day === 0 && day.steps.some((s) => s.channel === "phone")) {
    return "outreach_day_0";
  }
  return "outreach_followup_email";
}
