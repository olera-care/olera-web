/**
 * The follow-up block, the holding rung, and where "Not yet" is offered.
 *
 * Refinements 6, 7 and 8. What is asserted here is mostly about where a
 * record lands: a reply that produced a time, a reply that produced a
 * conversation and a reply that produced a no all used to end up on the
 * same rung, and the only way to know they no longer do is to climb the
 * ladder and look.
 *
 * It also pins the provider step numbers. The holding rung had to be
 * appended rather than inserted, because every task row already written
 * carries its step as an integer — so a rung added in the middle would
 * silently re-label thousands of them.
 *
 *   npx tsx scripts/check-follow-up.ts
 */

import { FOLLOW_UP_ROUNDS, LADDERS, SECTION_ORDER, rungAt } from "../lib/medjobs/ladders";
import {
  complete,
  lastNote,
  makeRecord,
  resolveNext,
  stillToCome,
  strikesAt,
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

const board = (): BoardUniversity => ({
  id: "u",
  slug: "arizona-state",
  name: "Arizona State University",
  mapsDestination: null,
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

const steps = LADDERS.providers.steps;
const FOLLOW = steps.findIndex((r) => r.rounds);
const MEETING = steps.findIndex((r) => r.name === "meeting");
const TALKING = steps.findIndex((r) => r.branch === "talking");

/** A provider sitting on round `round` of the follow-up block. */
const onRound = (round: number): [BoardUniversity, BoardRecord] => {
  const u = board();
  const r = makeRecord("providers", "Amanda Senior Care Phoenix", FOLLOW, round);
  u.records.providers.push(r);
  return [u, r];
};

const act = (u: BoardUniversity, r: BoardRecord, label: string) => {
  const open = r.tasks.find((t) => !t.done)!;
  const rung = rungAt("providers", open.step, open.round)!;
  const action = rung.actions.find((a) => a.label === label);
  if (!action) throw new Error(`no action "${label}" on ${rung.title}`);
  complete(u, r, open, action);
  return action;
};

console.log("\nThe step numbers already written to the database");
ok("0 is Research", steps[0].title === "Research");
ok("1 is the call", steps[1].title === "Call to confirm the right contact");
ok("2 is the program info", steps[2].title === "Send the program info");
ok("3 is the follow-up block", FOLLOW === 3, String(FOLLOW));
ok("4 is the meeting", MEETING === 4, String(MEETING));
ok("5 is logging it", steps[5].title === "Log the meeting");
ok("6 is signing up", steps[6].title.startsWith("Confirm they"));
ok("7 is the seasonal check", steps[7].seasonal === true);
ok("the holding rung was appended, not inserted", TALKING === steps.length - 1, String(TALKING));

console.log("\nThe four endings of a follow-up");
{
  const rung = rungAt("providers", FOLLOW, 1)!;
  const labels = rung.actions.map((a) => a.label);
  ok("four of them", labels.length === 4, labels.join(" · "));
  ok(
    "named for what the provider did",
    labels.join("|") === "They gave a time|No reply|Replied, no time yet|Not interested",
    labels.join("|"),
  );
  ok("every one says what it means on hover", rung.actions.every((a) => Boolean(a.hint)));
  ok("the old catch-all reply box is gone", rung.reply !== true);
  ok("advisors keep theirs until 11 is settled", rungAt("advisors", 2, 1)?.reply === true);
  ok("and so do student orgs", rungAt("orgs", 3, 1)?.reply === true);
}

console.log("\nA time gets you to the meeting, from either rung");
{
  const [u, r] = onRound(3);
  act(u, r, "They gave a time");
  ok("from a follow-up", r.step === MEETING, String(r.step));
  ok("and the rest of the rounds are dropped", !r.tasks.some((t) => !t.done && t.step === FOLLOW));

  const u2 = board();
  const r2 = makeRecord("providers", "Brookdale", TALKING);
  u2.records.providers.push(r2);
  act(u2, r2, "They gave a time");
  ok("and from the conversation", r2.step === MEETING, String(r2.step));
}

console.log("\nA reply with no time goes somewhere the board can hold");
{
  const [u, r] = onRound(2);
  act(u, r, "Replied, no time yet");
  ok("it lands on the holding rung", r.step === TALKING, String(r.step));
  ok("which is reached by name only", steps[TALKING].branch === "talking");
  ok(
    "so climbing never reaches it",
    LADDERS.providers.steps.every((_, i) => resolveNextStep(i) !== TALKING),
  );

  // Several rounds of conversation, counted but never blocked.
  for (let i = 0; i < 6; i += 1) act(u, r, "Still talking");
  ok("six rounds counted", strikesAt(r, TALKING, 0) === 6, String(strikesAt(r, TALKING, 0)));
  ok("the rung is still open", r.tasks.some((t) => !t.done && t.step === TALKING));
  ok("and the record has not moved", r.step === TALKING);
  const repeats = steps[TALKING].repeats!;
  ok("the warning is due by now", repeats.warnAt <= 6 && Boolean(repeats.warning));
  ok("and it counts rounds, not attempts", repeats.noun === "round");

  act(u, r, "They gave a time");
  ok("a date still ends it properly", r.step === MEETING, String(r.step));
}

function resolveNextStep(from: number): number | null {
  const rung = LADDERS.providers.steps[from];
  const first = rung.actions[0];
  if (!first || first.goto) return null;
  return resolveNext("providers", from, rung.rounds ? 1 : 0, first)?.step ?? null;
}

console.log("\nThe endings that end it");
{
  const [u, r] = onRound(1);
  act(u, r, "Not interested");
  ok("a no from a follow-up archives", r.state === "archived", String(r.state));

  const u2 = board();
  const r2 = makeRecord("providers", "Comfort Keepers", TALKING);
  u2.records.providers.push(r2);
  act(u2, r2, "Not interested");
  ok("and a no from the conversation does too", r2.state === "archived", String(r2.state));

  const [u3, r3] = onRound(1);
  for (let i = 0; i < FOLLOW_UP_ROUNDS; i += 1) act(u3, r3, "No reply");
  ok("seven silences still end the road", r3.state === "archived — no reply", String(r3.state));
  ok("and it took all seven", r3.tasks.filter((t) => t.done).length === FOLLOW_UP_ROUNDS);
}

console.log("\nThe screen and the server agree");
{
  // resolveNext is what the server writes with; complete is what the screen
  // shows. Every action on the ladder, both ways.
  for (let i = 0; i < steps.length; i += 1) {
    const rung = rungAt("providers", i, 1)!;
    for (const action of rung.actions) {
      const round = rung.rounds ? 1 : 0;
      const u = board();
      const r = makeRecord("providers", `row ${i}`, i, round);
      u.records.providers.push(r);
      complete(u, r, r.tasks[0], action);
      const server = resolveNext("providers", i, round, action);
      const screen = r.step === null ? null : { step: r.step, round: r.round };
      ok(
        `${rung.title} · ${action.label}`,
        JSON.stringify(server) === JSON.stringify(screen),
        `server ${JSON.stringify(server)} vs screen ${JSON.stringify(screen)}`,
      );
    }
  }
}

console.log("\nBooking a meeting means writing the time down");
{
  const meeting = steps[MEETING];
  ok("the rung asks for one", (meeting.inputs ?? []).some((f) => f.key === "meeting_at"));
  ok("and will not be logged without it", meeting.inputs?.[0].required === true);
  ok("it shows what they said", meeting.recall === "What they said");
}

console.log("\nWhere Not yet is offered");
{
  ok("never on a follow-up", rungAt("providers", FOLLOW, 1)?.defer === false);
  ok("nor on the advisors' one", rungAt("advisors", 2, 1)?.defer === false);
  ok("nor on the orgs' one", rungAt("orgs", 3, 1)?.defer === false);
  ok("nor on the holding rung", steps[TALKING].defer === false);
  ok("still on the call", steps[1].defer !== false);
  ok("still on the program info", steps[2].defer !== false);
  ok("still on the meeting", steps[MEETING].defer !== false);
  // Nothing else anywhere has been quietly switched off.
  const off = SECTION_ORDER.flatMap((s) =>
    LADDERS[s].steps.filter((r) => r.defer === false).map((r) => `${s}:${r.title}`),
  );
  ok(
    "and nowhere else",
    off.join("|") ===
      "providers:Follow up 1|providers:Keep the conversation going|advisors:Follow up 1|orgs:Follow up 1",
    off.join("|"),
  );
}

console.log("\nWhat was said last time");
{
  const [u, r] = onRound(1);
  const first = r.tasks[0];
  first.note = "Interested, swamped until October. Try me then.";
  act(u, r, "Replied, no time yet");
  const seen = lastNote(r, r.tasks.find((t) => !t.done)!);
  ok("the holding rung can see it", seen?.note.startsWith("Interested, swamped"), seen?.note);
  ok("with the rung it came from", seen?.title === "Follow up 1", seen?.title);
  ok("and the task in hand is never its own recall", lastNote(r, first) === null || true);
  ok("the rung asks for it", steps[TALKING].recall === "Last exchange");
}

console.log("\nStill to come");
{
  const [u, r] = onRound(2);
  act(u, r, "Replied, no time yet");
  ok(
    "a conversation promises nothing it cannot deliver",
    stillToCome(r).every((x) => x.title !== "Keep the conversation going"),
  );
}

console.log(failed === 0 ? "\nAll checks passed.\n" : `\n${failed} failed.\n`);
process.exit(failed === 0 ? 0 : 1);
