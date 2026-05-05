/**
 * Server-only: schedule the full outreach cadence for a stakeholder.
 *
 * Called from the `schedule_sequence` API action when admin clicks
 * "Schedule sequence" in the pre-flight review. Given the stakeholder's
 * type and the admin's edited subject/body for each cadence day,
 * this:
 *
 *   1. Inserts an `outreach_email_send` task per email day (snapshot
 *      of subject + body lives in task.payload). Day-0 task is queued
 *      with due_at = now so the inline executor (or next cron tick)
 *      picks it up immediately.
 *   2. Inserts an `outreach_followup_call` task per phone day.
 *   3. Transitions stage prospect/researched → outreach_sent.
 *   4. Sets cadence_day = 0 on the row.
 *
 * The cron pipeline owns the actual sending. The optional inline send
 * for Day 0 is invoked by the API action AFTER the sequencer returns.
 */

import { OUTREACH_DAYS_BY_TYPE, type OutreachDay, type TemplateKey } from "./cadence";
import { onStageEnter } from "./state-machine";
import { getTemplate } from "./templates";
import type { StakeholderType } from "./types";

const DAY_MS = 86_400_000;

export interface EmailSnapshot {
  /** Cadence day the snapshot is for. */
  day: number;
  template: TemplateKey;
  subject: string;
  body: string;
}

export interface SequencerInput {
  outreach_id: string;
  stakeholder_type: StakeholderType;
  /** Admin's edited (or unedited) snapshots for each email day in the cadence. */
  email_snapshots: EmailSnapshot[];
  user_id: string;
  /**
   * v8.8: phone tasks are only queued when at least one active contact has
   * a phone number. Decided at schedule time by the API action; if false,
   * planSequence skips every phone step in the cadence.
   */
  has_phone?: boolean;
}

export interface QueuedTask {
  task_type: "outreach_email_send" | "outreach_followup_call";
  due_at: Date;
  payload: Record<string, unknown>;
}

/**
 * Pure: compute the list of tasks to queue. The API action does the
 * actual DB writes so we keep this testable.
 */
export function planSequence(input: SequencerInput, now: Date = new Date()): QueuedTask[] {
  const days = OUTREACH_DAYS_BY_TYPE[input.stakeholder_type];
  const snapshotByDay = new Map(input.email_snapshots.map((s) => [s.day, s]));
  const tasks: QueuedTask[] = [];

  for (const day of days) {
    for (const step of day.steps) {
      const dueAt = new Date(now.getTime() + day.day * DAY_MS);
      if (step.channel === "email") {
        const snap = snapshotByDay.get(day.day);
        if (!snap) {
          // No snapshot supplied for this day → skip queuing (admin
          // didn't include it in the pre-flight review).
          continue;
        }
        tasks.push({
          task_type: "outreach_email_send",
          due_at: dueAt,
          payload: {
            day: day.day,
            template: snap.template,
            subject: snap.subject,
            body: snap.body,
          },
        });
      } else if (step.channel === "phone") {
        // v8.8: skip phone tasks when no contact has a phone on file.
        // Avoids phantom call rows in the Calls tab.
        if (input.has_phone === false) continue;
        tasks.push({
          task_type: "outreach_followup_call",
          due_at: dueAt,
          payload: {
            day: day.day,
            label: step.label ?? "Follow-up call",
          },
        });
      }
    }
  }

  return tasks;
}

/**
 * Helper: build the default snapshot list from templates so the
 * pre-flight modal has something to display before admin edits.
 */
export function defaultSnapshotsFor(
  type: StakeholderType,
  ctx: { organization_name: string; campus_name: string; admin_first_name?: string },
): EmailSnapshot[] {
  const days = OUTREACH_DAYS_BY_TYPE[type];
  const result: EmailSnapshot[] = [];
  for (const day of days) {
    for (const step of day.steps) {
      if (step.channel !== "email" || !step.template) continue;
      const tpl = getTemplate(step.template, {
        stakeholder_type: type,
        organization_name: ctx.organization_name,
        campus_name: ctx.campus_name,
        admin_first_name: ctx.admin_first_name,
      });
      result.push({
        day: day.day,
        template: step.template,
        subject: tpl.subject,
        body: tpl.body,
      });
    }
  }
  return result;
}

/** Used by tests + UI to know the cadence structure for a given type. */
export function describeCadence(type: StakeholderType): OutreachDay[] {
  return OUTREACH_DAYS_BY_TYPE[type];
}

/** Used by API action: side effects of stage entry to outreach_sent. */
export function outreachSentEntryEffect() {
  return onStageEnter("outreach_sent", {
    stakeholderType: "student_org", // type doesn't matter — entry is a no-op in v4
    now: new Date(),
  });
}
