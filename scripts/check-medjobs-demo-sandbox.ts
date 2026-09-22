/**
 * The teaching campus must never reach the network.
 *
 * Demo University is built in the browser and thrown away on refresh. That
 * is only true while the one function that writes refuses to write for it —
 * and a guard nobody tests is a guard that gets removed by somebody tidying
 * up, at which point practice runs start landing in production as real
 * records nobody asked for.
 *
 * This drives the board's own model over the demo campus: every rung of
 * every record, every outcome, the way a person would. If any of it produced
 * a write, the id it wrote against would be a demo id — so the check is that
 * no id on the campus is one the system would try to save.
 *
 * Run by `npm run check:demo`, and by prebuild.
 */

import { demoUniversity, isDemoUniversity, DEMO_SLUG } from "../lib/medjobs/demo-university";
import { LADDERS, rungAt } from "../lib/medjobs/ladders";
import { complete, isSaved, readyCount, type BoardRecord } from "../lib/medjobs/task-board";

const problems: string[] = [];
const note = (s: string) => problems.push(s);

const u = demoUniversity();

if (!isDemoUniversity(u)) note("demoUniversity() does not identify as the demo");
if (u.slug !== DEMO_SLUG) note(`slug is "${u.slug}", not "${DEMO_SLUG}"`);
if (!u.isDemo) note("the demo is not badged as one");

const all = () => Object.values(u.records).flat() as BoardRecord[];

// Nothing on this campus may look saveable. isSaved() is what decides
// whether a write is attempted against an id, and what gates the attachment
// control — a demo record that reads as saved is one that would post.
for (const r of all()) {
  if (isSaved(r.id)) note(`record "${r.name}" has id ${r.id}, which reads as a real row`);
  for (const t of r.tasks) {
    if (!t.id.startsWith("demo:") && !t.id.startsWith(`sweep:`)) {
      note(`task ${t.id} on "${r.name}" is not a demo id`);
    }
  }
}

// It has to start somewhere worth starting: work waiting, at the first rung
// of each ladder, with nothing pretending to be done.
if (readyCount(u) === 0) note("the demo opens with nothing to do");
for (const r of all()) {
  for (const t of r.tasks) {
    if (t.done) note(`"${r.name}" opens with ${t.step} already logged`);
    if (!rungAt(t.section, t.step, t.round)) {
      note(`"${r.name}" opens on ${t.section}[${t.step}], which is not a rung`);
    }
  }
}

if (!u.records.providers.length) note("the demo has no providers");
if (u.records.students.length) note("the demo opens with students, before anybody applied");

// Work the whole thing, every outcome of every rung, and confirm the model
// never asks for an id the server would have to know about.
let moves = 0;
for (const r of all()) {
  for (const t of [...r.tasks]) {
    const rung = rungAt(t.section, t.step, t.round);
    if (!rung) continue;
    (rung.actions ?? []).forEach((action, i) => {
      const copy = demoUniversity();
      const rec = (Object.values(copy.records).flat() as BoardRecord[]).find(
        (x) => x.name === r.name && x.section === r.section,
      );
      const task = rec?.tasks.find((x) => x.step === t.step && x.round === t.round);
      if (!rec || !task) return;
      try {
        complete(copy, rec, task, action);
        moves += 1;
      } catch (e) {
        note(`"${r.name}" rung ${t.step} outcome ${i} ("${action.label}") threw: ${String(e)}`);
        return;
      }
      for (const made of Object.values(copy.records).flat() as BoardRecord[]) {
        if (isSaved(made.id)) {
          note(`"${r.name}" outcome "${action.label}" produced ${made.id}, which reads as a real row`);
        }
      }
    });
  }
}

const line = `${all().length} records, ${moves} outcomes exercised`;

if (problems.length) {
  console.error(`✗ Demo University — ${line}\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error("");
  process.exit(1);
}
console.log(`✓ Demo University — ${line}, nothing on it can be written`);

void LADDERS;
