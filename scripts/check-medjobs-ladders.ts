/**
 * The MedJobs ladders have to stay wired to the scripts document.
 *
 * Three things on the Tasks board are the same string by construction: the
 * rung title on the task screen, the entry in the contents, and the heading
 * of the section it links to. They stay the same because both sides call
 * scriptSlug() — but that only holds if every rung actually has a section,
 * every route names a rung that exists, and no branch is left with no way in.
 *
 * None of those fail loudly. A rung with no section gives you a link to
 * nothing; a goto naming a deleted rung strands a record; TaskView renders
 * `null` for a step that is off the end, so the symptom is a blank drawer
 * rather than an error. This turns all three into a build failure.
 *
 * Run by `npm run check:ladders`, and by prebuild.
 */

import { LADDERS, SECTION_ORDER } from "../lib/medjobs/ladders";
import { scriptSlug, SWEEPS } from "../lib/medjobs/task-board";
import { seedSections } from "../lib/medjobs/scripts-seed";

const problems: string[] = [];
const note = (s: string) => problems.push(s);

const seeded = new Set(
  seedSections()
    .filter((s) => s.kind === "rung")
    .map((s) => s.slug),
);

// The two sweeps are reached by the board making a synthetic record for the
// campus, not by an action on another rung. They are branches with a door
// that is not a goto.
const sweepBranches = new Set(Object.values(SWEEPS).map((s) => s.branch));

let rungs = 0;
const reachable = new Set<string>();

for (const section of SECTION_ORDER) {
  const ladder = LADDERS[section];
  const named = new Set<string>();
  const doors = new Set<string>();

  ladder.steps.forEach((rung) => {
    if (rung.name) named.add(rung.name);
    if (rung.branch) named.add(rung.branch);
    (rung.actions ?? []).forEach((a) => a.goto && doors.add(a.goto));
  });

  ladder.steps.forEach((rung, step) => {
    rungs += 1;
    const where = `${section}[${step}] "${rung.title}"`;

    // Every rung can be finished.
    if (!(rung.actions ?? []).length) note(`${where} has no actions — it can never be completed`);

    // Every route names a rung that exists.
    (rung.actions ?? []).forEach((a) => {
      if (a.goto && !named.has(a.goto)) {
        note(`${where} routes to "${a.goto}", which names no rung on this ladder`);
      }
    });

    // Every branch has a way in.
    if (rung.branch && !doors.has(rung.branch) && !sweepBranches.has(rung.branch)) {
      note(`${where} is a branch nothing routes to — it would show in the contents and never open`);
    }

    // Every rung has a section of the document to link to.
    const slug = scriptSlug(section, step);
    if (!slug) {
      note(`${where} produces no anchor`);
      return;
    }
    reachable.add(slug);
    if (!seeded.has(slug)) note(`${where} links to #${slug}, which the document does not have`);

    // The anchor must not be derived from the title, or renaming the rung
    // orphans whatever has been written into its section.
    if (!rung.name && !rung.branch) {
      note(`${where} has no permanent name — its anchor follows its title and a rename would orphan it`);
    }
  });

  const block = ladder.openTogether ?? 0;
  if (block > ladder.steps.length) {
    note(`${section} opens ${block} rungs together but only has ${ladder.steps.length}`);
  }
}

// A section of the document nothing links to is a page somebody maintains
// and nobody is ever sent to.
for (const slug of seeded) {
  if (!reachable.has(slug)) note(`the document has #${slug}, which no rung links to`);
}

const line = `${rungs} rungs across ${SECTION_ORDER.length} ladders · ${seeded.size} document sections`;

if (problems.length) {
  console.error(`✗ MedJobs ladders — ${line}\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error("");
  process.exit(1);
}

console.log(`✓ MedJobs ladders — ${line}, every link lands and every route resolves`);
