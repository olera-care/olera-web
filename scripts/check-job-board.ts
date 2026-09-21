/**
 * The job board ladder, checked against the board model.
 *
 * Three things here are easy to get wrong and invisible when they are:
 * a rung that nothing ever queues, a fork that falls off the end of the
 * ladder into the goal, and the screen and the server disagreeing about
 * where an action leads. All three are asserted rather than read.
 *
 *   npx tsx scripts/check-job-board.ts
 */

import { readFileSync } from "node:fs";
import { CHANNELS, deriveStatus } from "../lib/medjobs/activation";
import { LADDERS, rungAt } from "../lib/medjobs/ladders";
import {
  complete,
  isCheck,
  makeRecord,
  resolveNext,
  stillToCome,
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

const board = (): BoardUniversity => ({
  id: "u",
  slug: "arizona-state",
  name: "Arizona State University",
  mapsDestination: null,
  channels: { st3: "not_yet" },
  records: {
    providers: [], students: [], jobboard: [], advisors: [],
    orgs: [], events: [], professors: [],
  },
});

const steps = LADDERS.jobboard.steps;
const titleAt = (i: number) => steps[i]?.title ?? "(none)";

console.log("\nThe ladder");
ok("it is a singleton — one board, no list", LADDERS.jobboard.singleton === true);
ok("rung 0 is Research", titleAt(0) === "Research", titleAt(0));
ok("rung 0 is worked on the record", steps[0]?.check === true);
ok("rung 1 is Confirm it's submitted", titleAt(1) === "Confirm it's submitted", titleAt(1));
ok("rung 2 is Confirm it's approved", titleAt(2) === "Confirm it's approved", titleAt(2));
ok(
  "rung 3 is the first applicant",
  titleAt(3) === "Confirm the first student has applied",
  titleAt(3),
);
ok("rung 4 is the seasonal check", steps[4]?.seasonal === true && steps[4]?.name === "seasonal");
ok("rung 5 is the relist branch", steps[5]?.branch === "relist");

console.log("\nThe timers");
ok("Research hands over the same day", steps[0]?.actions[0].delay === 0);
ok("submitted waits two days for approval", steps[1]?.actions[0].delay === 2);
ok("approved waits two days for an applicant", steps[2]?.actions[0].delay === 2);

console.log("\nWhat each rung answers");
ok("submitted ticks submitted", steps[1]?.actions[0].ticks?.[0] === "submitted");
ok("approved ticks approved", steps[2]?.actions[0].ticks?.[0] === "approved");
ok("the first applicant ticks visible", steps[3]?.actions[0].ticks?.[0] === "visible");
ok(
  "between them they are every criterion the channel needs",
  CHANNELS.st3.criteria.every((c) =>
    steps.some((s) => s.actions.some((a) => a.ticks?.includes(c.key))),
  ),
);

console.log("\nThe green light");
const lit = Object.fromEntries(CHANNELS.st3.criteria.map((c) => [c.key, "now"]));
ok("all three ticked reads live", deriveStatus(lit, CHANNELS.st3) === "live");
ok(
  "two of three does not",
  deriveStatus({ submitted: "now", approved: "now" }, CHANNELS.st3) === "in_progress",
);
ok("none of them reads not yet", deriveStatus({}, CHANNELS.st3) === "not_yet");

console.log("\nWhere every action leads — the screen and the server agree");
for (let step = 0; step < steps.length; step += 1) {
  const rung = steps[step];
  rung.actions.forEach((action, i) => {
    const u = board();
    const rec = makeRecord("jobboard", "University job board", step);
    u.records.jobboard.push(rec);
    complete(u, rec, rec.tasks[0], action);
    const queued = rec.tasks.find((t) => !t.done) ?? null;
    const server = resolveNext("jobboard", step, 0, action);
    const same =
      queued === null
        ? server === null
        : Boolean(server && server.step === queued.step && server.round === queued.round);
    ok(
      `${rung.title} · ${action.label} → ${server === null ? "nothing" : titleAt(server.step)}`,
      same,
      `screen ${queued ? queued.step : "null"} vs server ${server ? server.step : "null"}`,
    );
    void i;
  });
}

console.log("\nThe loop closes");
{
  const u = board();
  const rec = makeRecord("jobboard", "University job board", 3);
  u.records.jobboard.push(rec);
  complete(u, rec, rec.tasks[0], steps[3].actions[0]);
  const queued = rec.tasks.find((t) => !t.done);
  ok("reaching the goal earns the seasonal check", queued?.step === 4, String(queued?.step));
  ok("and the channel reads live", rec.state === "live", String(rec.state));
}
{
  const u = board();
  const rec = makeRecord("jobboard", "University job board", 4);
  u.records.jobboard.push(rec);
  const gone = steps[4].actions.find((a) => a.label === "It's gone")!;
  complete(u, rec, rec.tasks[0], gone);
  const queued = rec.tasks.find((t) => !t.done);
  ok("a lost listing reaches the relist rung", queued?.step === 5, String(queued?.step));
  ok("and does not mark the board live", rec.state !== "live", String(rec.state));
}

console.log("\nThe drawer");
{
  const rec = makeRecord("jobboard", "University job board", 0);
  ok("the first task is the checkbox", isCheck(rec.tasks[0]));
  ok(
    "what is still to come starts with submitted",
    stillToCome(rec)[0]?.title === "Confirm it's submitted",
    stillToCome(rec)[0]?.title,
  );
  ok(
    "the seasonal check is listed, and marked recurring",
    stillToCome(rec).some((x) => x.recurring && x.title.startsWith("Confirm the listing")),
  );
}

console.log("\nDocuments");
const sop = readFileSync("app/api/admin/medjobs/sop/route.ts", "utf8");
for (const s of steps) {
  if (!s.attachment) continue;
  ok(
    `"${s.title}" links a document the route serves`,
    new RegExp(`\\n  ${s.attachment.doc}: \\{`).test(sop),
    s.attachment.doc,
  );
}

console.log("\nCopy that renders as written");
// Only the email bodies are filled from the record. A token anywhere else
// reaches the screen as a token, which is how the Research tooltip shipped
// reading "Find where {university} lets an employer post a job".
{
  const raw: string[] = [];
  for (const key of Object.keys(LADDERS) as Array<keyof typeof LADDERS>) {
    for (const rung of LADDERS[key].steps) {
      for (const text of [rung.what, rung.why, ...rung.steps, rung.title]) {
        if (/\{\w+\}/.test(text)) raw.push(`${key}: ${text}`);
      }
    }
  }
  ok("no unfilled token outside the email copy", raw.length === 0, raw[0]);
}

console.log("\nNothing else changed");
ok("rungAt still reads the providers ladder", rungAt("providers", 0, 0)?.title === "Research");

console.log(failed === 0 ? "\nAll checks passed.\n" : `\n${failed} check(s) failed.\n`);
process.exit(failed === 0 ? 0 : 1);
