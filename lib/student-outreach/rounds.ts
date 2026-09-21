/**
 * Round arithmetic for the provider follow-up loop.
 *
 * The cadence stores a business-day offset on each task payload (`day`), and
 * rounds sit two business days apart, so round = day / 2 + 1. Round 1 is the
 * qualifying call plus the first email, worked by hand in the Providers tab
 * and never scheduled — which is why the scheduled cadence starts at day 2.
 *
 * A "set" is one pass through the loop. A provider who replies and needs more
 * chasing gets another set, and the set number is stamped on the tasks so the
 * drawer can say "Set 2 · Round 3" rather than restarting the count.
 */

import { PROVIDER_TOTAL_ROUNDS } from "./cadence";
import type { Task } from "./types";

export { PROVIDER_TOTAL_ROUNDS };

/** Business-day offset → round number. Day 2 is round 2, day 12 is round 7. */
export function roundFromDay(day: number): number {
  return Math.floor(day / 2) + 1;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Which set a task belongs to. Absent on tasks queued before sets existed. */
export function setOfTask(t: Task): number {
  return num(t.payload?.set) ?? 1;
}

/** Which round a task belongs to, or null when it carries no cadence day. */
export function roundOfTask(t: Task): number | null {
  const explicit = num(t.payload?.round);
  if (explicit != null) return explicit;
  const day = num(t.payload?.day);
  return day == null ? null : roundFromDay(day);
}

function stamped(t: Task, key: "call_logged_at" | "email_logged_at"): boolean {
  return typeof t.payload?.[key] === "string";
}

export interface RoundState {
  /** Current set — 1 unless the row has been round-tripped. */
  set: number;
  /** Round the operator is being asked to work right now. */
  round: number;
  /** Always PROVIDER_TOTAL_ROUNDS; carried so callers need not import it. */
  totalRounds: number;
  /** Rounds fully behind us — drives the progress dots. */
  completedRounds: number;
  /** The pending contact task for this round, if there is one. */
  task: Task | null;
  /** Halves of this round already logged. */
  callLogged: boolean;
  emailLogged: boolean;
  /** True when no pending round task remains — the set is spent. */
  setExhausted: boolean;
}

/**
 * Work out where a row stands from its pending tasks.
 *
 * The earliest pending round task is the one being asked for, and its round
 * number is the current round. Everything before it is done. When nothing is
 * pending the set is exhausted and the row belongs in Archive.
 */
export function roundStateFrom(pendingTasks: Task[]): RoundState {
  const roundTasks = pendingTasks.filter((t) => roundOfTask(t) != null);

  if (roundTasks.length === 0) {
    return {
      set: pendingTasks.length > 0 ? setOfTask(pendingTasks[0]) : 1,
      round: PROVIDER_TOTAL_ROUNDS,
      totalRounds: PROVIDER_TOTAL_ROUNDS,
      completedRounds: PROVIDER_TOTAL_ROUNDS,
      task: null,
      callLogged: false,
      emailLogged: false,
      setExhausted: true,
    };
  }

  const head = [...roundTasks].sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  const round = roundOfTask(head) as number;

  return {
    set: setOfTask(head),
    round,
    totalRounds: PROVIDER_TOTAL_ROUNDS,
    // Round 1 is manual, so reaching round 3 means rounds 1 and 2 are behind us.
    completedRounds: Math.max(0, round - 1),
    task: head,
    callLogged: stamped(head, "call_logged_at"),
    emailLogged: stamped(head, "email_logged_at"),
    setExhausted: false,
  };
}
