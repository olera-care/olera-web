/**
 * What a student application holds, and what it is still missing.
 *
 * The weights are the ones the application form itself scores with, in
 * `app/api/medjobs/apply/route.ts`. They are repeated here rather than
 * imported because that file is a route handler and this is read by the
 * board — but they are one table, in one order, so a field cannot be worth
 * ten points in one place and five in the other.
 *
 * `profile_completeness` is also stored on the record. It is not read: it is
 * written at apply time and never recomputed, so a student who uploads a
 * licence afterwards still reads as whatever they were when they applied.
 * Counting it here from the fields themselves cannot go stale.
 *
 * Complete is not the same as full marks. `application_completed` is set by
 * the go-live route, which is the student saying they are ready and the
 * server agreeing. That flag is the answer; the percentage is only there to
 * say how far off the ones who are not ready are.
 */

export interface StudentRow {
  display_name?: string | null;
  city?: string | null;
  state?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface Field {
  /** What an admin would call it when asking the student for it. */
  label: string;
  weight: number;
  has: (m: Record<string, unknown>, row: StudentRow) => boolean;
}

const filled = (v: unknown): boolean =>
  Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim().length > 0 : Boolean(v);

const FIELDS: Field[] = [
  { label: "name", weight: 10, has: (_m, r) => filled(r.display_name) },
  { label: "university", weight: 10, has: (m) => filled(m.university) },
  { label: "major", weight: 5, has: (m) => filled(m.major) },
  { label: "intended school", weight: 5, has: (m) => filled(m.intended_professional_school) },
  { label: "where they live", weight: 10, has: (_m, r) => filled(r.city) && filled(r.state) },
  { label: "availability", weight: 10, has: (m) => filled(m.availability_types) },
  { label: "certifications", weight: 5, has: (m) => filled(m.certifications) },
  { label: "care experience", weight: 5, has: (m) => filled(m.care_experience_types) },
  { label: "intro video", weight: 15, has: (m) => filled(m.video_intro_url) },
  { label: "driver's licence", weight: 10, has: (m) => filled(m.drivers_license_url) },
  { label: "car insurance", weight: 10, has: (m) => filled(m.car_insurance_url) },
  { label: "acknowledgements", weight: 5, has: (m) => filled(m.acknowledgments_completed) },
];

export interface ApplicationState {
  /** They went live: the one signal that means ready, not merely thorough. */
  complete: boolean;
  /** How much of the form is filled in, 0 to 100. */
  percent: number;
  /** What is not, in the words you would use asking for it. */
  missing: string[];
}

export function applicationState(row: StudentRow): ApplicationState {
  const m = (row.metadata ?? {}) as Record<string, unknown>;
  let percent = 0;
  const missing: string[] = [];
  for (const f of FIELDS) {
    if (f.has(m, row)) percent += f.weight;
    else missing.push(f.label);
  }
  return { complete: m.application_completed === true, percent, missing };
}

/**
 * Which interview rows mean "an interview is on the calendar".
 *
 * A no-show counts. Somebody did put that student in front of a provider,
 * which is what the rung asks; whether the student turned up is the next
 * rung's problem. Only a cancelled interview means it never happened.
 */
export const INTERVIEW_BOOKED = ["proposed", "confirmed", "rescheduled", "completed", "no_show"];

/** Which placement rows mean hired. An offer nobody accepted is not one. */
export const PLACEMENT_HIRED = ["accepted", "confirmed", "completed"];

/**
 * The facts the students ladder reads, from whatever the caller managed to
 * find. The board gathers them for everybody at once and the write path for
 * one student at a time, so the fetching differs — but which facts exist and
 * what counts as one is decided here, once.
 */
export function studentFacts(input: {
  applicationComplete: boolean;
  interviewOn?: string | null;
  placedOn?: string | null;
}): Record<string, string | true> {
  const facts: Record<string, string | true> = {};
  if (input.applicationComplete) facts.application_complete = true;
  if (input.interviewOn) facts.interview_booked = input.interviewOn;
  if (input.placedOn) facts.hired = input.placedOn;
  return facts;
}
