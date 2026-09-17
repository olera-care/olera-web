/**
 * The students ladder, checked against the board model.
 *
 * The thing worth asserting here is that order stopped mattering. Three of
 * the five rungs are facts the system can see, and the cases that used to go
 * wrong are the ones where they arrive out of order: a student who finishes
 * their own application before anybody meets them, and one who is already
 * hired and would otherwise be queued for an introductory call.
 *
 *   npx tsx scripts/check-students.ts
 */

import { LADDERS } from "../lib/medjobs/ladders";
import { applicationState, studentFacts } from "../lib/medjobs/student-profile";
import {
  complete,
  derivedStep,
  makeRecord,
  resolveNext,
  satisfied,
  stillToCome,
  type BoardRecord,
  type BoardUniversity,
} from "../lib/medjobs/task-board";

let failed = 0;
const ok = (label: string, cond: boolean, detail = "") => {
  if (cond) console.log(`  ok    ${label}`);
  else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

const steps = LADDERS.students.steps;
const titleAt = (i: number | null) => (i === null ? "nothing" : steps[i]?.title ?? "?");

const board = (): BoardUniversity => ({
  id: "u", slug: "uw-madison", name: "University of Wisconsin-Madison",
  mapsDestination: null, channels: {},
  records: { providers: [], students: [], jobboard: [], advisors: [], orgs: [], events: [], professors: [] },
});

const student = (facts: Record<string, string | true>, step?: number): BoardRecord => {
  const at = step ?? derivedStep("students", facts) ?? 0;
  const r = makeRecord("students", "A student", at);
  r.facts = facts;
  return r;
};

console.log("\nThe ladder");
ok("five rungs", steps.length === 5, String(steps.length));
ok("0 is the meeting", titleAt(0) === "Meeting with the student", titleAt(0));
ok("the meeting is nobody's fact", !steps[0].satisfiedBy);
ok("the meeting can be skipped", steps[0].actions.some((a) => a.label === "No meeting needed"));
ok("1 is the application, and the system can answer it", steps[1].satisfiedBy === "application_complete");
ok("2 is the interview, and the system can answer it", steps[2].satisfiedBy === "interview_booked");
ok("3 is the hire, and the system can answer it", steps[3].satisfiedBy === "hired");
ok("4 is the monthly hours, and only a person knows them", steps[4].monthly === true && !steps[4].satisfiedBy);
ok("an interview supersedes what came before", steps[2].supersedes === true);
ok("a hire supersedes what came before", steps[3].supersedes === true);
ok(
  "a finished application does not supersede the meeting",
  !steps[1].supersedes,
  "nobody has met that student yet",
);
ok(
  "every rung the system answers says so in the UI",
  steps.every((s) => !s.satisfiedBy || Boolean(s.satisfiedNote)),
);

console.log("\nWhere a student stands, from the facts alone");
ok("fresh applicant → the meeting", derivedStep("students", {}) === 0, titleAt(derivedStep("students", {})));
ok(
  "finished their own application → still the meeting",
  derivedStep("students", { application_complete: true }) === 0,
  titleAt(derivedStep("students", { application_complete: true })),
);
ok(
  "interview booked → confirm the hire, meeting moot",
  derivedStep("students", { interview_booked: "2026-09-10" }) === 3,
  titleAt(derivedStep("students", { interview_booked: "2026-09-10" })),
);
ok(
  "already hired → the monthly hours, nothing before it",
  derivedStep("students", { hired: "2026-09-01" }) === 4,
  titleAt(derivedStep("students", { hired: "2026-09-01" })),
);

console.log("\nMatthew: met, application half done");
{
  const u = board();
  const rec = student({});
  u.records.students.push(rec);
  ok("he is on the meeting", rec.step === 0, titleAt(rec.step));
  complete(u, rec, rec.tasks[0], steps[0].actions[0]);
  const next = rec.tasks.find((t) => !t.done);
  ok(
    "logging it moves him to the application",
    next?.step === 1,
    titleAt(next?.step ?? null),
  );
  ok("which is still his to chase", !satisfied(rec, 1));
}

console.log("\nA student who did it themselves");
{
  const u = board();
  const rec = student({ application_complete: true });
  u.records.students.push(rec);
  ok("they are on the meeting", rec.step === 0, titleAt(rec.step));
  ok("the application shows as done", satisfied(rec, 1));
  ok(
    "and is not promised again under still to come",
    !stillToCome(rec).some((x) => x.title === "Complete their application"),
  );
  complete(u, rec, rec.tasks[0], steps[0].actions[0]);
  const next = rec.tasks.find((t) => !t.done);
  ok(
    "logging the meeting skips straight to the interview",
    next?.step === 2,
    titleAt(next?.step ?? null),
  );
}

console.log("\nThe screen and the server agree");
for (const facts of [{}, { application_complete: true as const }, { interview_booked: "2026-09-10" }]) {
  for (let step = 0; step < steps.length; step += 1) {
    steps[step].actions.forEach((action, i) => {
      const u = board();
      const rec = student(facts, step);
      u.records.students.push(rec);
      complete(u, rec, rec.tasks[0], action);
      const queued = rec.tasks.find((t) => !t.done) ?? null;
      const server = resolveNext("students", step, 0, action, facts);
      const same =
        queued === null
          ? server === null
          : Boolean(server && server.step === queued.step && server.round === queued.round);
      ok(
        `${Object.keys(facts).join("+") || "nothing known"} · ${steps[step].title} · ${action.label} → ${titleAt(server?.step ?? null)}`,
        same,
        `screen ${queued ? queued.step : "null"} vs server ${server ? server.step : "null"}`,
      );
      void i;
    });
  }
}

console.log("\nReaching the goal");
{
  const u = board();
  const rec = student({}, 3);
  u.records.students.push(rec);
  complete(u, rec, rec.tasks[0], steps[3].actions[0]);
  const next = rec.tasks.find((t) => !t.done);
  ok("a hire earns the monthly hours check", next?.step === 4, titleAt(next?.step ?? null));
  ok("and the record reads hired", rec.state === "hired", String(rec.state));
}

console.log("\nReading an application");
{
  const empty = applicationState({ display_name: null, city: null, state: null, metadata: {} });
  ok("an empty one is 0%", empty.percent === 0, String(empty.percent));
  ok("and lists everything as missing", empty.missing.length === 12, String(empty.missing.length));
  ok("and is not complete", !empty.complete);

  const half = applicationState({
    display_name: "Matthew Chen",
    city: "Madison",
    state: "WI",
    metadata: { university: "University of Wisconsin-Madison", major: "Biology" },
  });
  ok("a part-filled one scores its fields", half.percent === 35, String(half.percent));
  ok("and names what is left", half.missing.includes("intro video"));

  const live = applicationState({
    display_name: "Sara", city: "Bloomington", state: "IN",
    metadata: { application_completed: true },
  });
  ok(
    "going live is what complete means, not a full score",
    live.complete && live.percent < 100,
    `${live.percent}%`,
  );
}

console.log("\nThe facts, from whatever was found");
ok("nothing found is no facts", Object.keys(studentFacts({ applicationComplete: false })).length === 0);
ok(
  "a placement date is carried through",
  studentFacts({ applicationComplete: false, placedOn: "2026-09-01" }).hired === "2026-09-01",
);

console.log(failed === 0 ? "\nAll checks passed.\n" : `\n${failed} check(s) failed.\n`);
process.exit(failed === 0 ? 0 : 1);
