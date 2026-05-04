/**
 * Pure state-machine helpers for stage transitions.
 *
 * Conventions:
 *   - `onStageEnter` returns the side effects of entering a stage:
 *       a task to queue, fields to update.
 *   - `onStageExit` returns task types that should be cancelled
 *       (so a rollback like agreed→engaged doesn't leave the +10d
 *       "Confirm distribution" task floating).
 *   - `validateTransition` enforces the legal stage graph.
 *
 * Pure functions only — DB writes happen in the API route.
 */

import { firstCadenceStep, dueAtForStep } from "./cadence";
import type { StakeholderType, Status, TaskType } from "./types";

export interface StageEntryEffect {
  taskToQueue?: {
    task_type: TaskType;
    due_at: Date;
    payload?: Record<string, unknown>;
  };
  fieldsToUpdate?: Record<string, unknown>;
}

const DAY_MS = 86_400_000;

/**
 * Stages that can NEVER be the destination from a given current stage.
 * Anything not listed here is implicitly allowed — we err on flexibility
 * because admins know the workflow better than we do, and exits are
 * always allowed.
 */
const ILLEGAL_FROM_TO: Array<[Status, Status]> = [
  // Can't skip research
  ["prospect", "outreach_sent"],
  ["prospect", "engaged"],
  ["prospect", "agreed"],
  ["prospect", "distributed"],
  ["prospect", "active_partner"],
  // Can't go back to prospect (use redirected/closed exits instead)
  ["researched", "prospect"],
  ["outreach_sent", "prospect"],
  // active_partner is forward-only (use closed if relationship dies)
  ["active_partner", "prospect"],
  ["active_partner", "researched"],
  ["active_partner", "outreach_sent"],
];

const TERMINAL_STATES: Set<Status> = new Set([
  "not_interested",
  "do_not_contact",
  "wrong_contact",
  "redirected",
]);

export function isTerminal(status: Status): boolean {
  return TERMINAL_STATES.has(status);
}

export function validateTransition(from: Status, to: Status): { ok: boolean; reason?: string } {
  if (from === to) return { ok: true };
  if (TERMINAL_STATES.has(from) && from !== to) {
    // Allow re-open from no_response_closed elsewhere; hard terminals require explicit reopen flow.
    return { ok: false, reason: `Cannot transition out of terminal state "${from}"` };
  }
  for (const [f, t] of ILLEGAL_FROM_TO) {
    if (f === from && t === to) {
      return { ok: false, reason: `Illegal transition: ${from} → ${to}` };
    }
  }
  return { ok: true };
}

/**
 * Side effects of entering a new stage. The state-machine doesn't write
 * anything itself — callers consume `taskToQueue` and `fieldsToUpdate`.
 */
export function onStageEnter(
  stage: Status,
  opts: { stakeholderType: StakeholderType; now?: Date },
): StageEntryEffect {
  const now = opts.now ?? new Date();

  switch (stage) {
    case "prospect":
      return {
        taskToQueue: { task_type: "research_initial", due_at: now },
      };

    case "researched":
      // Day-0 outreach is queued for now (admin can immediately start).
      return {
        taskToQueue: { task_type: "outreach_day_0", due_at: now },
      };

    case "outreach_sent": {
      // First cadence step — typically Day 0; cadence_day stays at 0.
      const step = firstCadenceStep(opts.stakeholderType);
      return {
        taskToQueue: {
          task_type: step.task_type,
          due_at: dueAtForStep(now, step),
        },
        fieldsToUpdate: { cadence_day: step.day },
      };
    }

    case "engaged":
      return {
        // Cadence freezes; queue a soft "continue dialogue" reminder in 2d.
        taskToQueue: {
          task_type: "manual_followup",
          due_at: new Date(now.getTime() + 2 * DAY_MS),
          payload: { reason: "continue_dialogue" },
        },
      };

    case "meeting_scheduled":
      // Caller should set due_at to the actual meeting time via payload.
      return {};

    case "agreed":
      // Confirm distribution in 10 days.
      return {
        taskToQueue: {
          task_type: "agreement_followup",
          due_at: new Date(now.getTime() + 10 * DAY_MS),
        },
      };

    case "distributed":
      // Promote to active_partner in 14 days (give them time to actually share).
      return {
        taskToQueue: {
          task_type: "move_to_active_partner",
          due_at: new Date(now.getTime() + 14 * DAY_MS),
        },
      };

    case "active_partner":
      // Caller queues the next seasonal checkin via seasonal.nextSeasonalDate().
      return {
        fieldsToUpdate: { partner_health: "healthy" },
      };

    case "no_response_closed":
      // Default reopen 90 days out — admin can adjust manually.
      return {
        fieldsToUpdate: {
          reopen_at: dateOnly(new Date(now.getTime() + 90 * DAY_MS)),
        },
      };

    default:
      return {};
  }
}

/**
 * Task types that should be cancelled when leaving a stage. Prevents
 * orphaned auto-queued tasks from firing after a rollback.
 */
export function tasksToCancelOnExit(stage: Status): TaskType[] {
  switch (stage) {
    case "prospect":
      return ["research_initial"];
    case "researched":
      return ["outreach_day_0"];
    case "outreach_sent":
      return [
        "outreach_day_0",
        "outreach_multichannel_orgs",
        "outreach_followup_email",
        "outreach_followup_call",
      ];
    case "engaged":
      return ["manual_followup"];
    case "meeting_scheduled":
      return ["meeting_held_logging"];
    case "agreed":
      return ["agreement_followup"];
    case "distributed":
      return ["move_to_active_partner"];
    case "active_partner":
      return [
        "partner_seasonal_checkin",
        "partner_share_update",
        "partner_event_coordination",
        "yearly_leadership_recheck",
      ];
    default:
      return [];
  }
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}
