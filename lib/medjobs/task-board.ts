/**
 * The board: every university, its records, and the tasks on them.
 *
 * One model, two readers. The Tasks tab renders it and applies changes
 * optimistically; the API route replays the same functions against the
 * database. Keeping both on this file is what stops the screen and the
 * tables from drifting apart.
 */

import {
  LADDERS,
  SECTION_ORDER,
  rungAt,
  type LadderAction,
  type SectionKey,
} from "./ladders";

export type ChannelStatus = "not_yet" | "in_progress" | "live" | "not_available";

export interface BoardTask {
  id: string;
  section: SectionKey;
  /** Index into the ladder. */
  step: number;
  /** 1-based round inside a follow-up block; 0 outside one. */
  round: number;
  /** ISO date. A task is ready when this is today or earlier. */
  dueAt: string;
  done: boolean;
  outcome: string | null;
  note: string;
  /** ISO date it was logged. Null while pending. */
  loggedOn: string | null;
  /** Tasks this one generated, so finishing it can be unwound. */
  spawned: string[];
  /** Records this one created, for the same reason. */
  spawnedRecords: string[];
  /** A deliberate repeat: records itself and generates nothing. */
  redo?: boolean;
  /** On a research rung: the names the operator actually found. Each one
   *  becomes its own record when the task is finished. */
  found?: string[];
  /** Nth reschedule round after a no-show. */
  resched?: number;
  /** Where the record stood before this task completed. */
  prev?: { step: number | null; round: number; state: string | null };
}

export interface BoardRecord {
  id: string;
  section: SectionKey;
  name: string;
  contact: string;
  phone: string;
  email: string;
  /** Null once the record has stopped climbing — reached its goal or stopped. */
  step: number | null;
  round: number;
  state: string | null;
  /** Where it stopped, so it can be started up again. */
  deadAt?: { step: number; round: number };
  reschedules?: number;
  tasks: BoardTask[];
}

export interface BoardUniversity {
  id: string;
  slug: string;
  name: string;
  /** Straight from campus_channels — the dots keep their current meaning. */
  channels: Partial<Record<"st3" | "st4" | "st5" | "st6" | "st7", ChannelStatus>>;
  records: Record<SectionKey, BoardRecord[]>;
}

/** Why a record was stopped. The one list, so the reasons stay comparable. */
export const STOP_REASONS = [
  "Wrong number or email",
  "The person has left",
  "Not a fit / out of business",
  "They asked us to stop",
] as const;

/** How long "Not yet" puts something off for. */
export const DEFERRALS: Array<{ label: string; days: number }> = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
  { label: "Next month", days: 30 },
];

// ── dates ────────────────────────────────────────────────────────────

const DAY = 86_400_000;

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** N days out, as a plain ISO date. Weekends are skipped for 1–14 day gaps. */
export function dueIn(days: number): string {
  const d = startOfToday();
  if (days <= 0) return iso(d);
  if (days > 14) return iso(new Date(d.getTime() + days * DAY));
  let left = days;
  while (left > 0) {
    d.setTime(d.getTime() + DAY);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) left -= 1;
  }
  return iso(d);
}

export const iso = (d: Date): string => d.toISOString().slice(0, 10);

export function isReady(t: BoardTask): boolean {
  return !t.done && t.dueAt <= iso(startOfToday());
}

/** "today", "tomorrow", "overdue", or a short date. */
export function dueLabel(dueAt: string): string {
  const today = startOfToday();
  const diff = Math.round((new Date(`${dueAt}T00:00:00`).getTime() - today.getTime()) / DAY);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return new Date(`${dueAt}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function shortDate(dueAt: string): string {
  return new Date(`${dueAt}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── counting ─────────────────────────────────────────────────────────

export const allRecords = (u: BoardUniversity): BoardRecord[] =>
  SECTION_ORDER.flatMap((s) => u.records[s] ?? []);

export const recordReady = (r: BoardRecord): number => r.tasks.filter(isReady).length;

export const sectionReady = (u: BoardUniversity, s: SectionKey): number =>
  (u.records[s] ?? []).reduce((n, r) => n + recordReady(r), 0);

export const readyCount = (u: BoardUniversity): number =>
  allRecords(u).reduce((n, r) => n + recordReady(r), 0);

export const doneToday = (u: BoardUniversity): number => {
  const today = iso(startOfToday());
  return allRecords(u).reduce(
    (n, r) => n + r.tasks.filter((t) => t.loggedOn === today).length,
    0,
  );
};

/**
 * The next thing to do. The record in hand finishes first, then the next
 * record in ladder order — so the operator never bounces back to a list.
 */
export function nextReady(
  u: BoardUniversity,
  prefer?: BoardRecord | null,
): { record: BoardRecord; task: BoardTask } | null {
  const scan = (r: BoardRecord) => {
    const t = r.tasks.find(isReady);
    return t ? { record: r, task: t } : null;
  };
  if (prefer) {
    const hit = scan(prefer);
    if (hit) return hit;
  }
  for (const section of SECTION_ORDER)
    for (const r of u.records[section] ?? []) {
      if (r === prefer) continue;
      const hit = scan(r);
      if (hit) return hit;
    }
  return null;
}

// ── changing things ──────────────────────────────────────────────────

let seq = 0;
const newId = (): string => `local-${Date.now().toString(36)}-${(seq += 1).toString(36)}`;

function makeTask(section: SectionKey, step: number, round: number, dueAt: string): BoardTask {
  return {
    id: newId(),
    section,
    step,
    round,
    dueAt,
    done: false,
    outcome: null,
    note: "",
    loggedOn: null,
    spawned: [],
    spawnedRecords: [],
  };
}

export function makeRecord(
  section: SectionKey,
  name: string,
  step: number | null,
  round = 0,
  dueDays = 0,
): BoardRecord {
  const r: BoardRecord = {
    id: newId(),
    section,
    name,
    contact: "",
    phone: "",
    email: "",
    step,
    round,
    state: null,
    tasks: [],
  };
  if (step !== null) r.tasks.push(makeTask(section, step, round, dueIn(dueDays)));
  return r;
}

/** What finishing a task did, so the caller can persist it. */
export interface Effect {
  /** Criterion keys to tick on the record's channel. */
  ticks: string[];
  /** Where the flow should land next. Null when there is nothing left. */
  landOn: { record: BoardRecord; task: BoardTask } | null;
  /** True when the record had work and now has none. */
  recordCleared: boolean;
  /** True when the university had work and now has none. */
  universityCleared: boolean;
}

/**
 * Finish a task and generate whatever comes next.
 *
 * The record is only moved after the new task exists, never before — the
 * reverse order is what let a failed insert leave a record with its rounds
 * cancelled and nothing queued.
 */
export function complete(
  u: BoardUniversity,
  record: BoardRecord,
  task: BoardTask,
  action: LadderAction,
  reason?: string,
): Effect {
  const hadRecordWork = recordReady(record) > 0;
  const hadUniWork = readyCount(u) > 0;
  const ladder = LADDERS[record.section];
  const rung = rungAt(record.section, task.step, task.round);

  task.done = true;
  task.outcome = reason ? `Can't be done — ${reason.toLowerCase()}` : action.label;
  task.loggedOn = iso(startOfToday());
  task.prev = { step: record.step, round: record.round, state: record.state };
  task.spawned = [];
  task.spawnedRecords = [];

  let landRecord: BoardRecord | null = null;

  const queue = (step: number, round: number, delay: number) => {
    const next = makeTask(record.section, step, round, dueIn(delay));
    record.tasks.push(next);
    task.spawned.push(next.id);
    record.step = step;
    record.round = round;
    landRecord = record;
  };

  const stop = (state: string) => {
    record.deadAt = { step: task.step, round: task.round };
    record.state = state;
    record.step = null;
  };

  /** The next rung that is part of the forward sequence. */
  const forward = (from: number): number | null => {
    for (let i = from; i < ladder.steps.length; i += 1) {
      const s = ladder.steps[i];
      if (s.branch || s.seasonal || s.monthly) continue;
      return i;
    }
    return null;
  };

  if (task.redo) {
    // A deliberate repeat. It records itself and nothing else.
  } else {
    switch (action.outcome) {
      case "next": {
        if (rung?.rounds && task.round < rung.rounds) {
          queue(task.step, task.round + 1, action.delay);
          break;
        }
        if (rung?.rounds) {
          // Seven follow-ups with no reply is the end of the road, not progress.
          stop("archived — no reply");
          break;
        }
        const nxt = forward(task.step + 1);
        if (nxt === null) stop(ladder.goal);
        else queue(nxt, LADDERS[record.section].steps[nxt].rounds ? 1 : 0, action.delay);
        break;
      }
      case "replied": {
        const nxt = forward(task.step + 1);
        if (nxt === null) stop(ladder.goal);
        else queue(nxt, LADDERS[record.section].steps[nxt].rounds ? 1 : 0, 0);
        break;
      }
      case "repeat":
        queue(task.step, task.round, action.delay);
        break;
      case "goal": {
        const at = { step: task.step, round: task.round };
        stop(ladder.goal);
        if (action.delay) {
          // A goal that recurs — monthly hours, the seasonal check.
          queue(at.step, at.round, action.delay);
          record.state = ladder.goal;
          record.step = null;
        }
        break;
      }
      case "archive":
        stop("archived");
        break;
      case "closed":
        stop("section closed");
        break;
      case "reschedule": {
        record.reschedules = (record.reschedules ?? 0) + 1;
        const next = makeTask(record.section, task.step, task.round, dueIn(0));
        next.resched = record.reschedules;
        record.tasks.push(next);
        task.spawned.push(next.id);
        landRecord = record;
        break;
      }
      case "fanout": {
        const after = task.step + 1;
        const startRound = ladder.steps[after]?.rounds ? 1 : 0;
        // What the operator typed, not the examples on the rung. A research
        // task that found nothing should create nothing.
        const names = (task.found ?? []).map((n) => n.trim()).filter(Boolean);
        const born = names.map((name) => {
          const r = makeRecord(record.section, name, after, startRound, 0);
          (u.records[record.section] ??= []).push(r);
          task.spawnedRecords.push(r.id);
          return r;
        });
        record.state = "done";
        record.step = null;
        if (born.length) landRecord = born[0];
        break;
      }
    }
  }

  if (reason) {
    stop(`stopped — ${reason.toLowerCase()}`);
    record.tasks = record.tasks.filter((t) => t.done);
    landRecord = null;
  }

  return {
    ticks: reason ? [] : (action.ticks ?? []),
    landOn: nextReady(u, landRecord ?? record),
    recordCleared: hadRecordWork && recordReady(record) === 0,
    universityCleared: hadUniWork && readyCount(u) === 0,
  };
}

/** Put a task off. Deferring is not an outcome: nothing else changes. */
export function defer(u: BoardUniversity, record: BoardRecord, task: BoardTask, days: number): Effect {
  const hadRecordWork = recordReady(record) > 0;
  const hadUniWork = readyCount(u) > 0;
  task.dueAt = dueIn(days);
  return {
    ticks: [],
    landOn: nextReady(u, record),
    recordCleared: hadRecordWork && recordReady(record) === 0,
    universityCleared: hadUniWork && readyCount(u) === 0,
  };
}

/** Safe to unwind only while nothing it produced has been acted on. */
export function canReopen(record: BoardRecord, task: BoardTask): boolean {
  if (task.spawnedRecords.length) return false;
  return task.spawned.every((id) => {
    const t = record.tasks.find((x) => x.id === id);
    return !t || !t.done;
  });
}

export function reopen(record: BoardRecord, task: BoardTask): void {
  for (const id of task.spawned) {
    const i = record.tasks.findIndex((t) => t.id === id);
    if (i >= 0 && !record.tasks[i].done) record.tasks.splice(i, 1);
  }
  if (task.prev) {
    record.step = task.prev.step;
    record.round = task.prev.round;
    record.state = task.prev.state;
  } else if (record.step === null) {
    record.step = task.step;
    record.round = task.round;
    record.state = null;
  }
  task.done = false;
  task.outcome = null;
  task.loggedOn = null;
  task.dueAt = dueIn(0);
  task.spawned = [];
  task.spawnedRecords = [];
}

/** Run the same task again without disturbing anything downstream. */
export function doAgain(record: BoardRecord, task: BoardTask): BoardTask {
  const copy = makeTask(record.section, task.step, task.round, dueIn(0));
  copy.redo = true;
  copy.resched = task.resched;
  record.tasks.push(copy);
  return copy;
}

/** Bring a stopped record back where it left off. People reply months later. */
export function revive(record: BoardRecord): BoardTask {
  const at = record.deadAt ?? { step: 0, round: 0 };
  record.state = null;
  record.step = at.step;
  record.round = at.round;
  const t = makeTask(record.section, at.step, at.round, dueIn(0));
  record.tasks.push(t);
  return t;
}

/**
 * The rungs ahead that have not been generated yet. No dates — they do not
 * exist. A run of follow-ups collapses to one line; it is the same act.
 */
export function stillToCome(record: BoardRecord): Array<{ title: string; recurring: boolean }> {
  if (record.step === null) return [];
  const ladder = LADDERS[record.section];
  const out: Array<{ title: string; recurring: boolean }> = [];
  const run = (from: number, to: number) =>
    from > to
      ? null
      : { title: from === to ? `Follow up ${from}` : `Follow ups ${from}–${to}`, recurring: false };

  const current = ladder.steps[record.step];
  if (current?.rounds) {
    const r = run((record.round || 1) + 1, current.rounds);
    if (r) out.push(r);
  }
  for (let i = record.step + 1; i < ladder.steps.length; i += 1) {
    const s = ladder.steps[i];
    if (s.branch) continue;
    if (s.rounds) {
      const r = run(1, s.rounds);
      if (r) out.push(r);
      continue;
    }
    out.push({ title: s.title, recurring: Boolean(s.seasonal || s.monthly) });
  }
  return out;
}

/** The title shown for a task, follow-up numbering and all. */
export function taskTitle(task: BoardTask): string {
  if (task.resched) return `Reschedule round ${task.resched}`;
  return rungAt(task.section, task.step, task.round)?.title ?? "Task";
}
