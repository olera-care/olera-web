/**
 * The assignment rules, asserted.
 *
 * Three things this guards, all of which are quiet when they break:
 *
 *  - The section list in migration 253's CHECK has to be SECTION_ORDER. A
 *    section added to the board without a line in that CHECK would take an
 *    assignment in the UI and be refused by the database, and the only place
 *    it would show is a red toast on somebody's screen.
 *  - A filtered board must count only the filtered person's sections, and
 *    never hand them a record outside them. Both are easy to regress by
 *    reaching for readyCount or nextReady without the scope.
 *  - The roster is matched case-insensitively. Addresses get written down
 *    capitalised, and a case-sensitive compare produces an empty dropdown
 *    with nothing on screen to say why.
 *
 * Run by prebuild. Proven non-vacuous by breaking each class deliberately.
 */
import { readFileSync } from "node:fs";
import { SECTION_ORDER } from "../lib/medjobs/ladders";
import {
  ROSTER,
  assignedPeople,
  firstName,
  isAssignableSection,
  onRoster,
  sectionsFor,
  type Assignments,
  type Person,
} from "../lib/medjobs/assignments";
import {
  nextReady,
  readyCountIn,
  type BoardRecord,
  type BoardUniversity,
} from "../lib/medjobs/task-board";

const problems: string[] = [];
const check = (ok: boolean, what: string) => {
  if (!ok) problems.push(what);
};

// ── the migration and the code agree on what a section is ────────────────
const MIGRATION = "supabase/migrations/253_medjobs_assignments.sql";
const sql = readFileSync(MIGRATION, "utf8");
const checkClause = /section\s+IN\s*\(([^)]*)\)/i.exec(sql)?.[1] ?? "";
const inMigration = [...checkClause.matchAll(/'([^']+)'/g)].map((m) => m[1]);
check(
  inMigration.length > 0,
  `${MIGRATION}: could not find the section CHECK — has it been rewritten?`,
);
for (const s of SECTION_ORDER) {
  check(inMigration.includes(s), `${MIGRATION}: the CHECK does not allow "${s}"`);
}
for (const s of inMigration) {
  check(
    (SECTION_ORDER as readonly string[]).includes(s),
    `${MIGRATION}: the CHECK allows "${s}", which is not a section on the board`,
  );
}

// ── every section the board has can be assigned ──────────────────────────
for (const s of SECTION_ORDER) {
  check(isAssignableSection(s), `isAssignableSection rejects "${s}"`);
}
check(!isAssignableSection("banana"), "isAssignableSection accepts a made-up section");

// ── the roster reads the way addresses are written ───────────────────────
for (const email of ROSTER) {
  check(onRoster(email), `onRoster rejects ${email}, which is on the roster`);
  check(onRoster(email.toUpperCase()), `onRoster is case-sensitive on ${email}`);
  check(onRoster(`  ${email} `), `onRoster is confused by whitespace around ${email}`);
  check(
    firstName(email) === firstName(email.toUpperCase()),
    `firstName is case-sensitive on ${email}`,
  );
  check(/^[A-Z]/.test(firstName(email)), `firstName(${email}) is not capitalised`);
}
check(!onRoster("someengineer@olera.care"), "onRoster accepts somebody off the team");
check(!onRoster(null), "onRoster accepts null");

// ── a filtered board shows only that person's work ───────────────────────
const grazy: Person = { id: "g", email: "grazy@olera.care", name: "Grazy" };
const sarah: Person = { id: "s", email: "sarah@olera.care", name: "Sarah" };
const held: Assignments = { advisors: grazy, orgs: grazy, providers: sarah };

const ready = () =>
  ({ id: "t", step: 0, round: 1, dueAt: "2000-01-01", done: false }) as unknown as
    BoardRecord["tasks"][number];
const record = (section: string, n: number): BoardRecord =>
  ({
    id: `r-${section}`,
    section,
    name: "x",
    tasks: Array.from({ length: n }, ready),
  }) as unknown as BoardRecord;

const blank = Object.fromEntries(SECTION_ORDER.map((s) => [s, []])) as Record<
  string,
  BoardRecord[]
>;
const campus = {
  id: "u",
  slug: "iu",
  name: "IU",
  mapsDestination: null,
  channels: {},
  records: { ...blank, advisors: [record("advisors", 3)], providers: [record("providers", 9)] },
  assignments: held,
} as unknown as BoardUniversity;

check(sectionsFor(held, null).length === SECTION_ORDER.length, "no filter must mean every section");
check(sectionsFor(held, "g").join() === "advisors,orgs", "Grazy's sections are wrong");
check(sectionsFor(held, "nobody").length === 0, "somebody holding nothing here was given sections");
check(sectionsFor(undefined, "g").length === 0, "an unassigned campus gave a filtered person work");

check(readyCountIn(campus, SECTION_ORDER) === 12, "the unfiltered Tasks count is wrong");
check(readyCountIn(campus, sectionsFor(held, "g")) === 3, "Grazy's Tasks count is wrong");
check(readyCountIn(campus, sectionsFor(held, "s")) === 9, "Sarah's Tasks count is wrong");
check(readyCountIn(campus, []) === 0, "somebody with nothing here was given a count");

check(
  nextReady(campus, null, sectionsFor(held, "g"))?.record.section === "advisors",
  "Start the next task handed Grazy a section that is not hers",
);
check(
  nextReady(campus, campus.records.providers[0], sectionsFor(held, "g"))?.record.section ===
    "advisors",
  "the record in hand dragged a filtered operator out of their sections",
);
check(nextReady(campus, null, [])  === null, "an empty scope still handed over a task");

// ── the line under a university name ─────────────────────────────────────
check(
  assignedPeople(held).map((p) => p.name).join(" · ") === "Grazy · Sarah",
  "the names under a university are not distinct and alphabetical",
);
check(assignedPeople({}).length === 0, "an unassigned campus produced a name");

if (problems.length > 0) {
  console.error("✗ MedJobs assignments\n");
  for (const p of problems) console.error(`  ${p}`);
  console.error("");
  process.exit(1);
}

console.log(
  `✓ MedJobs assignments — ${SECTION_ORDER.length} assignable sections, ` +
    `${ROSTER.length} on the roster, the migration and the board agree, ` +
    `and a filter never leaks somebody else's work`,
);
