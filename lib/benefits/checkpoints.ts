/**
 * The caseworker's measure (founding doc, set 9 Oct 2026): five checkpoints,
 * read in order, per family.
 *
 *   1. begun      a family answers the first question
 *   2. completed  the family reaches a plan
 *   3. started    the family opens an apply-along
 *   4. submitted  the family tells us the application went in
 *   5. accepted   the family tells us they were approved
 *
 * A family is a browser (metadata.session_id), the same unit the split
 * readout uses. 1 to 4 come from the finder, conversation and apply-along
 * events (provider_activity, provider_id "benefits-finder"). 4 also comes from
 * a family's record (benefits_cascade.applied), and 5 only from the record,
 * because a decision arrives by text or on the plan page weeks later. A record
 * joins its browser through the sessions that created or saved it; a record
 * with no known browser still counts, as its own family.
 *
 * Pure: the route and the daily brief load rows and hand them here, so both
 * read the same numbers.
 */

export const CHECKPOINTS = ["begun", "completed", "started", "submitted", "accepted"] as const;
export type Checkpoint = (typeof CHECKPOINTS)[number];

/** Which door the family came through. Only form and conversation are randomized. */
export type CheckpointArm = "form" | "conversation" | "study" | "other";
export const CHECKPOINT_ARMS: CheckpointArm[] = ["form", "conversation", "study", "other"];

/** The finder's two interviews; anything else on the key is not an interview. */
const INTERVIEW_VARIANTS = new Set(["finder_v2", "conversation_v1"]);
const APPLY_ALONG_VARIANTS = new Set(["apply_along_v1"]);

/** Families reach production only. Events carry their site from 10 Oct 2026; older rows have none. */
const PRODUCTION_HOSTS = new Set(["olera.care", "www.olera.care", "olera2-web.vercel.app"]);

/** Apply-along reached production here (#2448). Earlier opens were preview QA. */
export const APPLY_ALONG_LIVE_AT = "2026-10-07T13:30:20Z";

/**
 * Browsers known to be ours, from before events carried their site. Each one
 * opened only the apply-along, in Pennsylvania, minutes after it went live:
 * the screenshot runs for the 7 Oct team update.
 */
const KNOWN_TEST_SESSIONS = new Set([
  "23bc63a4-22a1-479b-9560-cd896b2e6743",
  "a786b6c6-afd9-49c5-9fa5-dfc836835695",
  "05afbd04-0bc1-4c5b-bb88-e8e6ce793a76",
]);

export type CheckpointEvent = {
  event_type: string;
  created_at: string;
  metadata: {
    session_id?: string | null;
    variant?: string | null;
    step_name?: string | null;
    split_arm?: string | null;
    study_cohort?: string | null;
    state?: string | null;
    host?: string | null;
  } | null;
};

export type CheckpointRecord = {
  profileId: string;
  /** Browsers that created or saved this record. */
  sessions: string[];
  state: string | null;
  studyCohort: string | null;
  applied: { at: string; decision?: string | null; decision_at?: string | null } | null;
};

export type FamilyProgress = {
  key: string;
  arm: CheckpointArm;
  state: string | null;
  /** When the family first reached each checkpoint. */
  reached: Partial<Record<Checkpoint, string>>;
};

function earliest(current: string | undefined, at: string) {
  return !current || at < current ? at : current;
}

/**
 * `from` bounds the record dates the same way the event query is bounded, so
 * a weekly read doesn't count an application submitted last month.
 */
export function familyProgress(events: CheckpointEvent[], records: CheckpointRecord[], from = ""): FamilyProgress[] {
  type Acc = FamilyProgress & { splitArm: CheckpointArm | null; study: boolean };
  const families = new Map<string, Acc>();
  const get = (key: string) => {
    let f = families.get(key);
    if (!f) {
      f = { key, arm: "other", state: null, reached: {}, splitArm: null, study: false };
      families.set(key, f);
    }
    return f;
  };
  const reach = (f: Acc, cp: Checkpoint, at: string) => {
    if (at < from) return;
    f.reached[cp] = earliest(f.reached[cp], at);
  };
  // Browsers that are ours: their events are dropped, and so is any record
  // they created (QA on a preview records an application on a real row).
  const excluded = new Set<string>(KNOWN_TEST_SESSIONS);

  for (const e of events) {
    const m = e.metadata ?? {};
    const session = m.session_id;
    if (!session || excluded.has(session)) continue;
    if (m.host && !PRODUCTION_HOSTS.has(m.host)) {
      excluded.add(session);
      continue;
    }
    const variant = m.variant ?? "";
    const interview = INTERVIEW_VARIANTS.has(variant);
    const applyAlong = APPLY_ALONG_VARIANTS.has(variant);
    if (!interview && !applyAlong) continue;
    if (applyAlong && e.created_at < APPLY_ALONG_LIVE_AT) continue;
    const f = get(session);
    if (m.split_arm === "form" || m.split_arm === "conversation") f.splitArm ??= m.split_arm;
    if (m.study_cohort) f.study = true;
    if (m.state && !f.state) f.state = m.state;

    if (interview) {
      // The plan screen: the form completes "results", the conversation views it.
      if (m.step_name === "results") reach(f, "completed", e.created_at);
      else if (e.event_type === "benefits_step_completed") reach(f, "begun", e.created_at);
    } else {
      if (e.event_type === "benefits_entry_viewed") reach(f, "started", e.created_at);
      if (e.event_type === "benefits_step_completed" && m.step_name === "applied") reach(f, "submitted", e.created_at);
    }
  }

  for (const r of records) {
    if (!r.applied?.at) continue;
    if (r.sessions.some((s) => excluded.has(s))) continue;
    const session = r.sessions.find((s) => families.has(s)) ?? r.sessions[0];
    const f = get(session ?? `record:${r.profileId}`);
    if (r.studyCohort) f.study = true;
    if (r.state && !f.state) f.state = r.state;
    reach(f, "submitted", r.applied.at);
    if (r.applied.decision === "approved") reach(f, "accepted", r.applied.decision_at || r.applied.at);
  }

  return [...families.values()].map(({ splitArm, study, ...f }) => {
    // A later checkpoint implies the earlier interview ones: a family who
    // reached a plan answered a question, even if that event was lost.
    if (f.reached.completed) f.reached.begun = earliest(f.reached.begun, f.reached.completed);
    return { ...f, arm: splitArm ?? (study ? "study" : "other") };
  });
}

/** Monday 00:00 UTC of the week holding `iso`, as YYYY-MM-DD. */
export function weekOf(iso: string) {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)).toISOString().slice(0, 10);
}

export type CheckpointCounts = Record<Checkpoint, number>;
const zero = (): CheckpointCounts => ({ begun: 0, completed: 0, started: 0, submitted: 0, accepted: 0 });

export type CheckpointSummary = {
  /** Families reaching each checkpoint, by the week they reached it, newest first. */
  weeks: Array<{ week: string; all: CheckpointCounts; byArm: Record<CheckpointArm, CheckpointCounts> }>;
  /** Families who reached each checkpoint at any point in the window. */
  total: { all: CheckpointCounts; byArm: Record<CheckpointArm, CheckpointCounts> };
  byState: Array<{ state: string; counts: CheckpointCounts }>;
};

export function summarizeCheckpoints(families: FamilyProgress[]): CheckpointSummary {
  const byArm = () => Object.fromEntries(CHECKPOINT_ARMS.map((a) => [a, zero()])) as Record<CheckpointArm, CheckpointCounts>;
  const weeks = new Map<string, { all: CheckpointCounts; byArm: Record<CheckpointArm, CheckpointCounts> }>();
  const total = { all: zero(), byArm: byArm() };
  const states = new Map<string, CheckpointCounts>();

  for (const f of families) {
    for (const cp of CHECKPOINTS) {
      const at = f.reached[cp];
      if (!at) continue;
      const wk = weekOf(at);
      let w = weeks.get(wk);
      if (!w) weeks.set(wk, (w = { all: zero(), byArm: byArm() }));
      w.all[cp] += 1;
      w.byArm[f.arm][cp] += 1;
      total.all[cp] += 1;
      total.byArm[f.arm][cp] += 1;
      const st = f.state || "Unknown";
      if (!states.has(st)) states.set(st, zero());
      states.get(st)![cp] += 1;
    }
  }

  return {
    weeks: [...weeks.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([week, w]) => ({ week, ...w })),
    total,
    byState: [...states.entries()].map(([state, counts]) => ({ state, counts })).sort((a, b) => b.counts.begun - a.counts.begun),
  };
}
