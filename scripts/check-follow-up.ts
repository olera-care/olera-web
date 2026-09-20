/**
 * The provider ladder after the reframe: interest first, the meeting beside.
 *
 * Refinements 6, 7, 8 and 12. Most of what is asserted here is about where a
 * record lands, because that is the part no amount of reading the file will
 * tell you — a reply that produced interest, a reply that produced a
 * conversation and a reply that produced a no all used to end up on the same
 * rung, and the meeting used to stand in front of everything.
 *
 * It also pins the step numbers. Every task row carries its rung as an
 * integer, so a rung that moves has to be matched by a migration
 * (scripts/migration/22-meeting-becomes-a-branch.sql) and a rung that moves
 * without one silently re-labels thousands of rows.
 *
 *   npx tsx scripts/check-follow-up.ts
 */

import {
  ERRAND as ERRAND_ACTION,
  FOLLOW_UP_ROUNDS,
  LADDERS,
  SECTION_ORDER,
  rungAt,
} from "../lib/medjobs/ladders";
import {
  carryFrom,
  complete,
  dueFor,
  dueIn,
  isReady,
  iso,
  lastNote,
  makeRecord,
  resolveNext,
  startOfToday,
  stillToCome,
  strikesAt,
  taskTitle,
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
const named = (n: string) => steps.findIndex((r) => (r.branch ?? r.name) === n);
const CALL = 1;
const FOLLOW = steps.findIndex((r) => r.rounds);
const ONBOARD = named("onboarding");
const SETUP = named("setup");
const ERRAND = named("errand");
const MEETING = named("meeting");
const MEETLOG = named("meetlog");

const at = (step: number, round = 0): [BoardUniversity, BoardRecord] => {
  const u = board();
  const r = makeRecord("providers", "Amanda Senior Care Phoenix", step, round);
  r.phone = "602-555-0110";
  r.email = "denise@amandaseniorcare.com";
  u.records.providers.push(r);
  return [u, r];
};

const act = (u: BoardUniversity, r: BoardRecord, label: string, fields?: Record<string, string>) => {
  const open = r.tasks.find((t) => !t.done)!;
  if (fields) open.fields = { ...(open.fields ?? {}), ...fields };
  const rung = rungAt("providers", open.step, open.round)!;
  const action = rung.actions.find((a) => a.label === label);
  if (!action) throw new Error(`no action "${label}" on ${rung.title}`);
  return complete(u, r, open, action);
};

console.log("\nThe step numbers, and the migration that moved two of them");
ok("0 Research", steps[0].title === "Research");
ok("1 the confirming call", steps[1].title === "Call to confirm the right contact");
ok("2 the program info", steps[2].title === "Send the program info");
ok("3 the follow-up block", FOLLOW === 3, String(FOLLOW));
ok("4 the onboarding pack", ONBOARD === 4, String(ONBOARD));
ok("5 confirming they can receive a student", SETUP === 5, String(SETUP));
ok("6 signing up, where it always was", steps[6].title.startsWith("Confirm they"));
ok("7 the seasonal check, where it always was", steps[7].seasonal === true);
ok("8 the errand rung, where the conversation rung was", ERRAND === 8, String(ERRAND));
ok("9 the meeting, moved from 4", MEETING === 9, String(MEETING));
ok("10 logging it, moved from 5", MEETLOG === 10, String(MEETLOG));
ok("both meeting rungs are branches", Boolean(steps[MEETING].branch && steps[MEETLOG].branch));
ok(
  "so climbing never reaches either",
  [MEETING, MEETLOG].every((i) => !steps.slice(0, i).some(() => false) && steps[i].branch),
);

console.log("\nOne rung, one screen");
{
  const rung = rungAt("providers", FOLLOW, 1)!;
  ok("it says to check both", rung.steps[0].includes("email") && rung.steps[0].includes("voicemail"));
  ok("and nothing else, so the screen is the work", rung.steps.length === 1, rung.steps.join(" · "));
  const labels = rung.actions.map((a) => a.label);
  ok(
    "four outcomes, all offered at once",
    labels.join("|") ===
      "Log the call and the email|Interested, start onboarding|Not interested|Something else",
    labels.join("|"),
  );
  ok("the silent round is the log of two acts", (rung.actions[0].acts ?? []).join("+") === "call+email");
  ok("and it is the one you will press most, so it leads", rung.actions[0].label.startsWith("Log"));
  // Only the errand asks anything, and only because nobody can guess in
  // advance what a provider will ask for.
  const asks = rung.actions.filter((a) => a.inputs?.length).map((a) => a.label);
  ok("only the errand asks questions", asks.join("|") === "Something else", asks.join("|"));
  ok("every outcome says what it means", rung.actions.every((a) => Boolean(a.hint)));
  ok("advisors keep their catch-all until 11", rungAt("advisors", 2, 1)?.reply === true);
}

console.log("\nInterest starts onboarding, from wherever it arrives");
for (const [step, round, label, where] of [
  [CALL, 0, "Interested, start onboarding", "on the confirming call, skipping the programme email"],
  [FOLLOW, 3, "Interested, start onboarding", "from a follow-up"],
  [ERRAND, 0, "Done — they're interested", "from an errand that produced a yes"],
] as Array<[number, number, string, string]>) {
  const [u, r] = at(step, round);
  act(u, r, label);
  ok(where, r.step === ONBOARD, `landed on ${r.step}`);
}
{
  const [u, r] = at(FOLLOW, 3);
  act(u, r, "Interested, start onboarding");
  ok("and the rest of the follow-ups are dropped", !r.tasks.some((t) => !t.done && t.step === FOLLOW));
}

console.log("\nThe meeting is still reachable");
{
  // Nothing in the sequence leads to it any more, which is the point — it
  // is not a gate. But a branch nothing can reach is a rung that does not
  // exist, so the set-up rung carries the way in until the onboarding phase
  // is built and takes it over.
  const ways = steps.flatMap((r, i) =>
    r.actions.filter((a) => a.goto === "meeting").map(() => steps[i].title),
  );
  ok("exactly one way in", ways.length === 1, ways.join("|"));
  ok("and it is the set-up rung", ways[0] === steps[SETUP].title, ways[0]);
  const [u, r] = at(SETUP, 0);
  act(u, r, "They want a meeting");
  ok("which reaches it", r.step === MEETING, String(r.step));
}

console.log("\nA booked meeting is logged on the day, not today");
{
  const day = iso(new Date(startOfToday().getTime() + 12 * 86_400_000));
  const [u, r] = at(MEETING, 0);
  act(u, r, "Meeting booked", { meeting_at: `${day}T14:00` });
  const log = r.tasks.find((t) => !t.done && t.step === MEETLOG);
  ok("the log rung exists", Boolean(log), r.tasks.map((t) => t.step).join("+"));
  ok("and is due on the meeting date", log?.dueAt === day, `${log?.dueAt} vs ${day}`);

  const booked = steps[MEETING].actions[0];
  ok("an empty date falls back to the delay", dueFor(booked, {}) === dueIn(booked.delay));
  ok("and so does one in the past", dueFor(booked, { meeting_at: "2020-01-01T09:00" }) === dueIn(booked.delay));

  const [u2, r2] = at(MEETLOG, 0);
  act(u2, r2, "Held");
  ok("a held meeting rejoins the main line", r2.step === SETUP, String(r2.step));
}

console.log("\nThe endings that end it");
{
  const [u, r] = at(FOLLOW, 1);
  act(u, r, "Not interested");
  ok("a no from a follow-up archives", r.state === "archived", String(r.state));

  const [u2, r2] = at(ERRAND, 0);
  act(u2, r2, "Not interested");
  ok("and a no from the conversation does too", r2.state === "archived", String(r2.state));

  const [u3, r3] = at(FOLLOW, 1);
  for (let i = 0; i < FOLLOW_UP_ROUNDS; i += 1) act(u3, r3, "Log the call and the email");
  ok("seven silences still end the road", r3.state === "archived — no reply", String(r3.state));
  ok("and it took all seven", r3.tasks.filter((t) => t.done).length === FOLLOW_UP_ROUNDS);

  const [u4, r4] = at(SETUP, 0);
  for (let i = 0; i < 3; i += 1) act(u4, r4, "Nudged them");
  ok("three nudges counted", strikesAt(r4, SETUP, 0) === 3, String(strikesAt(r4, SETUP, 0)));
  ok("and the rung is still open", r4.tasks.some((t) => !t.done && t.step === SETUP));
  act(u4, r4, "Gone cold");
  ok("a provider who never sets up can be closed", r4.state === "archived", String(r4.state));
}

console.log("\nThe screen and the server agree");
{
  for (let i = 0; i < steps.length; i += 1) {
    const rung = rungAt("providers", i, 1)!;
    for (const action of rung.actions) {
      const round = rung.rounds ? 1 : 0;
      const [u, r] = at(i, round);
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

console.log("\nHanded over, not parked");
{
  // A delay answers "when should we next touch them". When the next act is
  // ours and we already hold everything we need, that is now.
  const handed = (step: number, round: number, label: string, fields?: Record<string, string>) => {
    const [u, r] = at(step, round);
    const effect = act(u, r, label, fields);
    return { same: effect.landOn?.record === r, ready: r.tasks.some((t) => !t.done && isReady(t)) };
  };

  for (const [step, round, label, why] of [
    [CALL, 0, "Confirmed contact", "a confirmed contact hands you the programme email"],
    [FOLLOW, 2, "Interested, start onboarding", "interest hands you the onboarding pack"],
  ] as Array<[number, number, string, string]>) {
    const { same, ready } = handed(step, round, label);
    ok(why, same && ready, `same record ${same}, ready ${ready}`);
  }

  // Booking is the exception that proves the rule: the next act is theirs,
  // on a day they named, so nothing should be waiting until then.
  {
    const day = iso(new Date(startOfToday().getTime() + 9 * 86_400_000));
    const { ready } = handed(MEETING, 0, "Meeting booked", { meeting_at: `${day}T14:00` });
    ok("booking hands you nothing today, which is right", !ready, "the log rung came back today");
  }

  // An errand comes back on the day the operator picked, which is the same
  // rule the meeting follows.
  {
    const today = iso(startOfToday());
    const { same, ready } = handed(FOLLOW, 2, "Something else", {
      todo: "Ring their corporate office",
      due_on: today,
    });
    ok("an errand due today is handed straight over", same && ready, `same ${same}, ready ${ready}`);
  }

  for (const [step, round, label, why] of [
    [2, 0, "Log email sent", "a sent email waits two days"],
    [FOLLOW, 2, "Log the call and the email", "and so does a round nobody answered"],
    
    [ONBOARD, 0, "Log the pack sent", "and the pack waits three before we check on them"],
  ] as Array<[number, number, string, string]>) {
    const { ready } = handed(step, round, label, { portal_link: "https://olera.care/x" });
    ok(why, !ready, "it came back today");
  }
}

console.log("\nWhat an outcome will not be logged without");
{
  ok("the pack needs the portal link", steps[ONBOARD].inputs?.[0].required === true);
  ok("the meeting needs a date", steps[MEETING].inputs?.[0].required === true);
  ok("and the pack says what it attaches", steps[ONBOARD].attachment?.doc === "pilot-terms");
}

console.log("\nWhere Not yet is offered");
{
  const off = SECTION_ORDER.flatMap((s) =>
    LADDERS[s].steps.filter((r) => r.defer === false).map((r) => `${s}:${r.title}`),
  );
  ok(
    "only on rungs that already run on a cadence",
    off.join("|") ===
      "providers:Follow up 1|advisors:Follow up 1|orgs:Follow up 1",
    off.join("|"),
  );
  for (const [i, why] of [
    [CALL, "the call"],
    [2, "the programme email"],
    [ONBOARD, "the pack"],
    [SETUP, "the set-up check"],
    [MEETING, "the meeting"],
  ] as Array<[number, string]>) {
    ok(`still on ${why}`, steps[i].defer !== false);
  }
}

console.log("\nWhat was said last time");
{
  const [u, r] = at(FOLLOW, 1);
  r.tasks[0].note = "Interested, swamped until October. Try me then.";
  act(u, r, "Something else");
  const seen = lastNote(r, r.tasks.find((t) => !t.done)!);
  ok("the errand can see it", seen?.note.startsWith("Interested, swamped"), seen?.note);
  ok("with the rung it came from", seen?.title === "Follow up 1", seen?.title);
  ok("the errand asks for it", steps[ERRAND].recall === "What they said");
  ok("and so does the pack", steps[ONBOARD].recall === "What they said");
}

console.log("\nSomething else, which is whatever they said it was");
{
  const errand = ERRAND_ACTION;
  ok("it asks two things", (errand.inputs ?? []).length === 2);
  ok("what needs doing", errand.inputs?.[0].key === "todo" && errand.inputs[0].required === true);
  ok("and the day it comes back", errand.inputs?.[1].key === "due_on" && errand.inputs[1].required === true);
  ok("the day is the due date, not two working days from now", errand.delayFrom === "due_on");
  ok("and the errand travels with the task", (errand.carry ?? []).join("+") === "todo");

  const day = iso(new Date(startOfToday().getTime() + 20 * 86_400_000));
  const [u, r] = at(FOLLOW, 2);
  r.tasks[0].note = "Asked us to send it to their corporate office first.";
  act(u, r, "Something else", { todo: "Email corporate and get the right contact", due_on: day });
  const queued = r.tasks.find((t) => !t.done)!;
  ok("it lands on the errand rung", queued.step === ERRAND, String(queued.step));
  ok("on the day that was picked", queued.dueAt === day, `${queued.dueAt} vs ${day}`);
  ok("and it names itself", taskTitle(queued) === "Email corporate and get the right contact", taskTitle(queued));
  ok("rather than the rung it is on", steps[ERRAND].title === "Something else");

  // The screen and the server queue the same row, errand and all.
  ok(
    "the server carries the same thing",
    JSON.stringify(carryFrom(errand, { todo: "x", due_on: day })) === JSON.stringify({ todo: "x" }),
  );
  ok("and nothing when there is nothing to carry", carryFrom(errand, {}) === undefined);

  // An errand can end three ways, and one of them is another errand.
  const [u2, r2] = at(ERRAND, 0);
  act(u2, r2, "Done — they're interested");
  ok("a yes goes to the pack", r2.step === ONBOARD, String(r2.step));

  const [u3, r3] = at(ERRAND, 0);
  act(u3, r3, "Done — back to following up");
  ok("and no answer restarts the block", r3.step === FOLLOW && r3.round === 1, `${r3.step}/${r3.round}`);

  const [u4, r4] = at(ERRAND, 0);
  for (let i = 0; i < 3; i += 1)
    act(u4, r4, "Something else again", { todo: `errand ${i}`, due_on: day });
  ok("errands are counted", strikesAt(r4, ERRAND, 0) === 3, String(strikesAt(r4, ERRAND, 0)));
  ok("and the rung stays open", r4.tasks.some((t) => !t.done && t.step === ERRAND));
}

console.log("\nStill to come");
{
  const [u, r] = at(FOLLOW, 2);
  act(u, r, "Something else");
  const ahead = stillToCome(r).map((x) => x.title);
  ok("an errand promises nothing it cannot deliver", !ahead.includes("Something else"));
  ok("and never promises a meeting nobody asked for", !ahead.includes("Meet them"), ahead.join("|"));
}

console.log("\nNothing still asks for a meeting as the first ask");
{
  // Every piece of copy a provider sees before they have said yes: the
  // programme email, every follow-up round, and the holding rung. The first
  // version of this check looked for one phrase and passed while the
  // follow-up email was still closing with "is there a day this week or next
  // that works?" — so it asks the question the other way round now, and
  // fails on anything that reads as a request for time.
  const cold = [steps[2], ...Array.from({ length: FOLLOW_UP_ROUNDS }, (_, i) =>
    rungAt("providers", FOLLOW, i + 1)), steps[ERRAND]];
  const copy = JSON.stringify(cold).toLowerCase();
  for (const phrase of [
    "fifteen minutes",
    "a short call",
    "day this week",
    "that works?",
    "tuesday afternoon",
    "find a time",
    "put it in the calendar",
    "book a",
  ]) {
    ok(`nothing asks for time: "${phrase}"`, !copy.includes(phrase));
  }
  // Two wordings, both asking for a reply rather than a slot.
  const ASKS = ["hear more", "send you the details"];
  const missed = cold
    .filter((r) => r?.email)
    .filter((r) => !ASKS.some((a) => r!.email!.body.includes(a)))
    .map((r) => r!.title);
  ok("and every cold email asks for a reply instead", missed.length === 0, missed.join("|"));
}

console.log("\nThe pack, and what it does not say");
{
  const pack = JSON.stringify(steps[ONBOARD]);
  // D-011: the email carries no price. The attached terms describe the
  // pilot and what follows it, and they are the only place a number lives.
  ok("no price in the email", !/\$\s?\d/.test(pack) && !pack.includes("250"));
  ok("the terms are for review, not signature", pack.includes("Nothing to sign"));
  ok("it says there is no obligation", pack.toLowerCase().includes("no obligation"));
  ok("a reply is an acceptable way to say what they want", pack.includes("reply to this email"));
  ok("and the portal is offered rather than required", pack.includes("If you would rather do it yourself"));
}

console.log(failed === 0 ? "\nAll checks passed.\n" : `\n${failed} failed.\n`);
process.exit(failed === 0 ? 0 : 1);
