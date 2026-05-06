/**
 * Pure state-machine helpers for stage transitions.
 *
 * Conventions:
 *   - `onStageEnter` returns the side effects of entering a stage:
 *       a task to queue, fields to update.
 *   - `tasksToCancelOnExit` lists task types that should be cancelled
 *       so a rollback (e.g. engaged → outreach_sent) doesn't leave the
 *       previous stage's auto-queued task floating.
 *   - `validateTransition` enforces the legal stage graph.
 *
 * Pure functions only — DB writes happen in the API route.
 */

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
 * Anything not listed here is implicitly allowed — admins know the
 * workflow better than us, exits are always allowed, and the v2 funnel
 * deliberately permits jumping straight to active_partner from any
 * post-outreach stage if observable distribution evidence exists.
 */
const ILLEGAL_FROM_TO: Array<[Status, Status]> = [
  // Can't skip research phase.
  ["prospect", "outreach_sent"],
  ["prospect", "engaged"],
  ["prospect", "active_partner"],
  // Can't go back to prospect once research is done.
  ["researched", "prospect"],
  ["outreach_sent", "prospect"],
  // active_partner is forward-only; close out instead.
  ["active_partner", "prospect"],
  ["active_partner", "researched"],
  ["active_partner", "outreach_sent"],
  ["active_partner", "engaged"],
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
 * Side effects of entering a new stage. Callers consume `taskToQueue`
 * and `fieldsToUpdate` and execute the writes.
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
      return {
        taskToQueue: { task_type: "outreach_day_0", due_at: now },
      };

    case "outreach_sent":
      // v4: the sequencer (called from schedule_sequence) owns the cadence
      // queue. Entering outreach_sent via state-machine alone (e.g. from a
      // logged outreach touchpoint) does NOT auto-queue. This avoids
      // duplicate tasks when the admin uses the Schedule flow.
      return { fieldsToUpdate: { cadence_day: 0 } };

    case "engaged":
      return {
        taskToQueue: {
          task_type: "manual_followup",
          due_at: new Date(now.getTime() + 2 * DAY_MS),
          payload: { reason: "continue_dialogue" },
        },
      };

    case "meeting_scheduled":
      // Caller queues the meeting_held_logging task at meeting_at.
      return {};

    case "active_partner":
      // Caller queues the first seasonal check-in via seasonal.nextSeasonalDate().
      return {
        fieldsToUpdate: { partner_health: "healthy" },
      };

    case "no_response_closed":
      // Default reopen 90 days out — admin can adjust.
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
        "outreach_email_send",         // v4 auto-send
        "outreach_followup_call",      // v4 manual call task
        // Legacy v3 (kept for safety; harmless if absent):
        "outreach_day_0",
        "outreach_multichannel_orgs",
        "outreach_followup_email",
      ];
    case "engaged":
      // v8.8: also cancel any lingering email/call cadence tasks. Those
      // SHOULD have been superseded already by the action that moved the
      // row out of outreach_sent (e.g. handleLogReply, handleFlagWantsMeeting),
      // but this catches any edge case where a manual re-schedule left
      // tasks in flight.
      return [
        "manual_followup",
        "outreach_email_send",
        "outreach_followup_call",
      ];
    case "meeting_scheduled":
      return [
        "meeting_held_logging",
        "outreach_email_send",
        "outreach_followup_call",
      ];
    case "active_partner":
      return [
        "outreach_email_send",       // v4 auto-send (seasonal)
        "partner_seasonal_checkin",  // legacy
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
