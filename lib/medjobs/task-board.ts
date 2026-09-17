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
  /** Typed values the rung asked for, keyed by LadderInput.key — a meeting
   *  time, a posting link, hours worked. Read back in the record history. */
  fields?: Record<string, string>;
  /** Nth reschedule round after a no-show. */
  resched?: number;
  /** Where the record stood before this task completed. */
  prev?: { step: number | null; round: number; state: string | null };
}

/**
 * A North American number, punctuated so a column of them scans.
 *
 * Deliberately conservative. Ten digits become 352-327-3877 and a leading
 * country code is dropped; anything else — an extension, an international
 * number, a note somebody typed into the field — is returned untouched,
 * because a formatter that mangles the unusual case is worse than no
 * formatter at all.
 */
export function formatPhone(raw: string): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  // Letters or an extension marker mean this is not a bare number.
  if (/[a-z]/i.test(v)) return v;
  const d = v.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith("1")) {
    const t = d.slice(1);
    return `${t.slice(0, 3)}-${t.slice(3, 6)}-${t.slice(6)}`;
  }
  return v;
}

export interface BoardRecord {
  id: string;
  section: SectionKey;
  name: string;
  contact: string;
  /** What the contact is to the organisation — president, chair, director. */
  role: string;
  phone: string;
  email: string;
  /**
   * Where to look them up. For a provider this comes from the directory
   * unless an admin has corrected it; for an advising office there is no
   * directory row, so it is only ever what somebody typed.
   */
  website: string;
  /** True when the website above is an admin correction, not the directory. */
  websiteEdited?: boolean;
  /**
   * Where they actually are. Worth showing next to the campus: a record can
   * sit on a board because the directory geocoded it wrongly, and a street
   * address makes that obvious in a way coordinates never do.
   */
  address: string;
  /** True when the address is an admin correction, not the directory. */
  addressEdited?: boolean;
  /**
   * The second person at this organisation, if there is one. Kept behind a
   * disclosure in the UI: one contact is the normal case and two should not
   * cost the normal case any attention.
   */
  contact2?: { contact: string; role: string; phone: string; email: string };
  /**
   * Job board only. A channel is not a person, so none of the fields above
   * describe it: what it has is a way in and, once there is one, a listing.
   * Both live on the record and are filled at different rungs — the way in
   * during Research, the listing when it is approved — but neither is
   * locked to its rung, because finding the listing early is not a reason
   * to make somebody wait to write it down.
   */
  boardUrl?: string;
  postingUrl?: string;
  /** Job board only: the inbox career services answer from, if there is one. */
  servicesEmail?: string;
  /**
   * What the system already knows to be true about this record, keyed by the
   * fact name a rung names in `satisfiedBy`. The value is when it became
   * true where we know, and simply true where we do not.
   *
   * Computed on every read rather than stored. These are facts about other
   * tables — an application marked complete, an interview on the calendar, a
   * placement accepted — and a copy of a fact is a fact that can go stale.
   */
  facts?: Record<string, string | true>;
  /**
   * Students only: the two screens that are actually theirs. The admin one
   * is where a student is edited, which is not here; the public one is what
   * a provider sees when we send them a candidate, which is worth being able
   * to check before you send it.
   */
  profileUrl?: string;
  publicUrl?: string;
  /** Students only: the day they applied, which is the day their account began. */
  appliedOn?: string;
  /** Students only: what they are studying toward. */
  program?: string;
  /** Students only: how much of the application is filled in, and what is not. */
  completeness?: number;
  missing?: string[];
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
  /**
   * Where campus is, for a directions link: "33.4242,-111.9281" when we hold
   * coordinates, the town otherwise, null when we hold neither. Resolved on
   * the server because the catchment file that knows it is server-side.
   */
  mapsDestination: string | null;
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
  // A missed career fair is not a next-month problem. Roughly a term out,
  // which is when the same event comes round again.
  { label: "Next season", days: 120 },
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

/** A date with its year, for something that may be a term ago. */
export function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    role: "",
    phone: "",
    email: "",
    website: "",
    address: "",
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
    // A rung that is already waiting is not queued twice. Rungs opened as a
    // block are all pending from the start, so finishing the first would
    // otherwise add a second copy of the second.
    const open = record.tasks.find((t) => !t.done && t.step === step && t.round === round);
    if (open) {
      record.step = step;
      record.round = round;
      landRecord = record;
      return;
    }
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
  const forward = (from: number): number | null =>
    forwardStep(record.section, from, record.facts);

  /** The rung of this name, branch or not, if the ladder has one. */
  const branchAt = (name: string): number =>
    ladder.steps.findIndex((s) => (s.branch ?? s.name) === name);

  if (task.redo) {
    // A deliberate repeat. It records itself and nothing else.
  } else if (action.goto && action.outcome !== "goal" && branchAt(action.goto) >= 0) {
    // A branch is skipped when climbing, so an outcome that exists to reach
    // one has to name it. Without this the seasonal "it's gone" fell off the
    // end of the ladder and marked the channel live.
    //
    // Reaching the goal is deliberately not handled here. A goal that names
    // a rung has two jobs — say the ladder is finished, and queue what comes
    // back later — and taking the shortcut here did only the second, so the
    // job board queued its seasonal check and never went live.
    const at = branchAt(action.goto);
    queue(at, ladder.steps[at].rounds ? 1 : 0, action.delay);
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
        // A goal that recurs — monthly hours, or the seasonal check a
        // finished channel earns. `goto` names which rung comes back; with
        // no name it is this one again.
        const back = action.goto ? branchAt(action.goto) : task.step;
        const at =
          back >= 0 && action.goto
            ? { step: back, round: ladder.steps[back].rounds ? 1 : 0 }
            : { step: task.step, round: task.round };
        stop(ladder.goal);
        if (action.delay) {
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

  /** A rung already on the record, waiting or done, is not still to come. */
  const held = new Set(record.tasks.map((t) => t.step));

  const current = ladder.steps[record.step];
  if (current?.rounds) {
    const r = run((record.round || 1) + 1, current.rounds);
    if (r) out.push(r);
  }
  for (let i = record.step + 1; i < ladder.steps.length; i += 1) {
    const s = ladder.steps[i];
    if (s.branch) continue;
    // Already true, and shown as done elsewhere. Listing it here as well
    // would promise work that is not coming.
    if (s.satisfiedBy && record.facts?.[s.satisfiedBy]) continue;
    if (held.has(i)) continue;
    if (s.rounds) {
      const r = run(1, s.rounds);
      if (r) out.push(r);
      continue;
    }
    out.push({ title: s.title, recurring: Boolean(s.seasonal || s.monthly) });
  }
  return out;
}

/**
 * Where an action sends a record: a rung, or nothing left.
 *
 * Exported because the screen and the server both have to make this call —
 * the screen to show the next task immediately, the server to write it — and
 * two copies of the rule would be two rules. `scripts/check-job-board.ts`
 * asserts this agrees with `complete()` for every rung on the ladder.
 */
export function resolveNext(
  section: SectionKey,
  step: number,
  round: number,
  action: LadderAction,
  facts?: Record<string, string | true>,
): { step: number; round: number } | null {
  const steps = LADDERS[section].steps;
  const at = (name: string) => steps.findIndex((r) => (r.branch ?? r.name) === name);

  // A named rung wins: it is the only way to reach a branch, and the only
  // way a finished ladder earns its recurring check.
  if (action.goto) {
    const i = at(action.goto);
    if (i >= 0) return { step: i, round: steps[i].rounds ? 1 : 0 };
  }

  const rung = rungAt(section, step, round);
  switch (action.outcome) {
    case "repeat":
      return { step, round };
    case "next":
      if (rung?.rounds) return round < rung.rounds ? { step, round: round + 1 } : null;
    // falls through: a rung outside a block moves on the same way a reply does
    case "replied": {
      const nxt = forwardStep(section, step + 1, facts);
      return nxt === null ? null : { step: nxt, round: steps[nxt].rounds ? 1 : 0 };
    }
    default:
      return null;
  }
}

/**
 * The next rung in the forward sequence at or after `from`, or null when the
 * ladder has run out. Branch, seasonal and monthly rungs are reached by name
 * or by the calendar, never by climbing, so they are stepped over.
 *
 * Exported because the server has to make the same decision when it queues
 * whatever a finished rung leads to, and two copies of this loop would be
 * two places for the ladder to drift.
 */
export function forwardStep(
  section: SectionKey,
  from: number,
  facts?: Record<string, string | true>,
): number | null {
  const steps = LADDERS[section].steps;
  for (let i = from; i < steps.length; i += 1) {
    const s = steps[i];
    if (s.branch || s.seasonal || s.monthly) continue;
    // Already true. Handing somebody a rung the database has answered is
    // asking them to copy it back into the database.
    if (s.satisfiedBy && facts?.[s.satisfiedBy]) continue;
    return i;
  }
  return null;
}

/** True when the system already knows this rung is done. */
export function satisfied(record: BoardRecord, step: number): boolean {
  const key = LADDERS[record.section].steps[step]?.satisfiedBy;
  return Boolean(key && record.facts?.[key]);
}

/**
 * Where a record stands before anybody has recorded anything.
 *
 * Two passes, because the two kinds of fact mean different things. A rung
 * marked `supersedes` says everything behind it happened one way or another:
 * a student with an interview booked does not need chasing for a meeting. A
 * plain fact only answers its own rung, so a finished application still
 * leaves the meeting to do.
 *
 * Returns null when the ladder has been climbed out.
 */
export function derivedStep(
  section: SectionKey,
  facts: Record<string, string | true> | undefined,
): number | null {
  const steps = LADDERS[section].steps;
  let from = 0;
  steps.forEach((s, i) => {
    if (s.supersedes && s.satisfiedBy && facts?.[s.satisfiedBy]) from = i + 1;
  });
  for (let i = from; i < steps.length; i += 1) {
    const s = steps[i];
    if (s.branch) continue;
    if (s.satisfiedBy && facts?.[s.satisfiedBy]) continue;
    return i;
  }
  return null;
}

/**
 * True when this task is worked on the record rather than on its own screen.
 *
 * The one place that decides it, so the record, the run-through and the
 * server all agree about which rungs are a checkbox — see LadderRung.check.
 */
export function isCheck(task: BoardTask): boolean {
  return rungAt(task.section, task.step, task.round)?.check === true;
}

/** The title shown for a task, follow-up numbering and all. */
export function taskTitle(task: BoardTask): string {
  if (task.resched) return `Reschedule round ${task.resched}`;
  return rungAt(task.section, task.step, task.round)?.title ?? "Task";
}
