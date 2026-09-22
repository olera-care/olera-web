import { LADDERS, SECTION_ORDER, type SectionKey } from "./ladders";
import { SWEEPS, sweepId, type BoardRecord, type BoardTask, type BoardUniversity } from "./task-board";

/**
 * Demo University — a campus that exists only in the browser.
 *
 * Somewhere to learn the board, or show it, without the practice landing in
 * the database. The last teaching campus was a real row, which meant every
 * click on it wrote a real record, and clearing it up afterwards took a
 * migration.
 *
 * This one is never fetched and never posted. It is built here, appended to
 * the board after the real universities load, and thrown away on refresh.
 * The guarantee is structural rather than a rule somebody has to remember:
 * every write out of the drawer goes through one function, and that function
 * returns success without making a request when the university is this one.
 *
 * It starts where a campus genuinely starts. Four agencies just arrived from
 * the directory and have been researched by nobody; the job board has not
 * been looked up; there are no advising offices until somebody goes and finds
 * them, and no students until one applies.
 */

// The same prefix isSaved() excludes, so nothing on this campus is ever
// treated as having a row behind it.
export { DEMO_RECORD_PREFIX as DEMO_PREFIX } from "./task-board";
const DEMO_PREFIX = "demo:";
export const DEMO_SLUG = "demo-university";

export const isDemoUniversity = (u: { slug: string }) => u.slug === DEMO_SLUG;

/** Plausible rather than "Test Provider 1". A row that reads like the real
 *  thing is the point — you are rehearsing the real work. */
const AGENCIES = [
  "Riverbend Home Care",
  "Cardinal Senior Services",
  "Maple Street Caregivers",
  "Hearthside In-Home Support",
];

const today = () => new Date().toISOString().slice(0, 10);

let seq = 0;
const id = (kind: string) => `${DEMO_PREFIX}${kind}-${(seq += 1).toString(36)}`;

function task(section: SectionKey, step: number): BoardTask {
  const rung = LADDERS[section].steps[step];
  return {
    id: id("task"),
    section,
    step,
    round: rung?.rounds ? 1 : 0,
    dueAt: today(),
    done: false,
    outcome: null,
    note: "",
    loggedOn: null,
    spawned: [],
    spawnedRecords: [],
  };
}

function record(section: SectionKey, name: string, steps: number[]): BoardRecord {
  return {
    id: id(section),
    section,
    name,
    contact: "",
    role: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    step: steps[0] ?? null,
    round: 0,
    state: null,
    tasks: steps.map((s) => task(section, s)),
  };
}

/** The sweep row, built the way the board builds it for a real campus. */
function sweep(kind: "map" | "advisor", campusId: string, campusName: string): BoardRecord {
  const { section, branch } = SWEEPS[kind];
  const step = LADDERS[section].steps.findIndex((r) => r.branch === branch);
  const rowId = sweepId(kind, campusId);
  const search: Record<string, string> =
    kind === "map"
      ? {
          maps_url:
            "https://www.google.com/maps/search/" +
            encodeURIComponent(`home care near ${campusName}`),
        }
      : {
          advisor_search_url:
            "https://www.google.com/search?q=" +
            encodeURIComponent(`${campusName} pre-health advising OR "career center"`),
        };
  return {
    id: rowId,
    section,
    name: LADDERS[section].steps[step]?.title ?? "Sweep",
    contact: "",
    role: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    step,
    round: 0,
    state: null,
    tasks: [{ ...task(section, step), id: `${rowId}:task`, fields: search }],
  };
}

export function demoUniversity(): BoardUniversity {
  seq = 0;
  const campusId = `${DEMO_PREFIX}campus`;
  const name = "Demo University";

  const records = Object.fromEntries(
    SECTION_ORDER.map((s) => [s, [] as BoardRecord[]]),
  ) as Record<SectionKey, BoardRecord[]>;

  // Every agency opens the block its ladder opens — one sitting's work,
  // asked of the ladder so the demo cannot drift from the real thing.
  const block = Math.max(1, LADDERS.providers.openTogether ?? 1);
  const first = Math.max(0, LADDERS.providers.steps.findIndex((r) => !r.branch));
  records.providers = AGENCIES.map((a) =>
    record("providers", a, Array.from({ length: block }, (_, k) => first + k)),
  );
  records.providers.push(sweep("map", campusId, name));

  // Nobody has looked the job board up yet.
  records.jobboard = [
    record("jobboard", "University job board", [
      Math.max(0, LADDERS.jobboard.steps.findIndex((r) => !r.branch)),
    ]),
  ];

  // No advising offices until somebody goes and finds them.
  records.advisors = [sweep("advisor", campusId, name)];

  return {
    id: campusId,
    slug: DEMO_SLUG,
    name,
    mapsDestination: null,
    isDemo: true,
    channels: {},
    records,
  };
}
