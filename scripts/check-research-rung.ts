/**
 * The Research rung, checked against the board model.
 *
 * It is the first rung that is not an outreach event: it is worked on the
 * record, ticked rather than logged, and it is the one the server writes as
 * it happens. All of that hangs off `check` on the rung and the step numbers
 * around it, so this asserts both rather than trusting a reading of the file.
 *
 *   npx tsx scripts/check-research-rung.ts
 */

import { LADDERS, SECTION_ORDER, rungAt } from "../lib/medjobs/ladders";
import {
  complete,
  forwardStep,
  isCheck,
  makeRecord,
  reopen,
  stillToCome,
  type BoardUniversity,
} from "../lib/medjobs/task-board";

let failed = 0;
const ok = (label: string, cond: boolean, detail = "") => {
  if (cond) {
    console.log(`  ok    ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

const board = (): BoardUniversity => ({
  id: "u",
  slug: "arizona-state",
  name: "Arizona State University",
  mapsDestination: "33.4242,-111.9281",
  channels: {},
  records: {
    providers: [],
    students: [],
    jobboard: [],
    advisors: [],
    orgs: [],
    events: [],
    professors: [],
  },
});

console.log("\nThe ladder");
const steps = LADDERS.providers.steps;
ok("step 0 is Research", steps[0]?.title === "Research", steps[0]?.title);
ok("step 0 is worked on the record", steps[0]?.check === true);
ok("step 0 offers one action, Done", steps[0]?.actions.length === 1 && steps[0]?.actions[0].label === "Done");
ok("step 0 carries the three checks", (steps[0]?.steps.length ?? 0) === 3);
ok(
  "step 1 is the call, renamed",
  steps[1]?.title === "Call to confirm the right contact",
  steps[1]?.title,
);
ok("nothing still says get the right email", !JSON.stringify(LADDERS).includes("get the right email"));
ok(
  "no other ladder has a rung worked on the record",
  SECTION_ORDER.filter((s) => s !== "providers").every((s) =>
    LADDERS[s].steps.every((r) => !r.check),
  ),
);

console.log("\nWhere a rung leads");
ok("Research leads to the call", forwardStep("providers", 1) === 1);
ok("the call leads to the program info", forwardStep("providers", 2) === 2);
ok(
  "the seasonal rung is never reached by climbing",
  forwardStep("providers", steps.length - 1) === null,
);

console.log("\nA provider, from the top");
const u = board();
const rec = makeRecord("providers", "A Place At Home Southwest Valley", 0);
u.records.providers.push(rec);
const research = rec.tasks[0];
ok("the first task is the checkbox", isCheck(research));
ok(
  "what is still to come starts with the call",
  stillToCome(rec)[0]?.title === "Call to confirm the right contact",
  stillToCome(rec)[0]?.title,
);

const effect = complete(u, rec, research, steps[0].actions[0]);
const call = rec.tasks.find((t) => !t.done) ?? null;
ok("ticking it closes the rung", research.done);
ok("ticking it queues the call", call?.step === 1, String(call?.step));
ok("the call is not a checkbox", call ? !isCheck(call) : false);
ok("the call is due today", call?.dueAt === new Date(new Date().setHours(0, 0, 0, 0)).toISOString().slice(0, 10));
ok("the run-through lands on the same record", effect.landOn?.record.id === rec.id);
ok("the run-through lands on the call", effect.landOn?.task.id === call?.id);
ok("the record is not cleared — the call is waiting", !effect.recordCleared);

reopen(rec, research);
ok("unticking reopens the rung", !research.done);
ok("unticking takes the call back off", rec.tasks.filter((t) => !t.done).length === 1);
ok("unticking leaves the record on Research", rec.step === 0);
ok("the reopened rung is the checkbox again", isCheck(rec.tasks[0]));

console.log("\nTitles a person sees");
ok('rungAt(0) reads "Research"', rungAt("providers", 0, 0)?.title === "Research");
ok(
  "the help panel has a what, a why and steps",
  Boolean(steps[0]?.what && steps[0]?.why && steps[0]?.steps.length),
);

console.log(failed === 0 ? "\nAll checks passed.\n" : `\n${failed} check(s) failed.\n`);
process.exit(failed === 0 ? 0 : 1);
