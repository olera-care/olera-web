import { SECTION_ORDER, type SectionKey } from "./ladders";

/**
 * Who owns which task type at which university.
 *
 * The unit of assignment is a pair — one campus and one task type — never an
 * individual task and never a whole campus. Owning a section means owning
 * every task in it, including the ones created after the assignment, because
 * what was assigned was the section.
 *
 * One owner per pair, enforced by a unique index in migration 253 rather than
 * by anything here. A campus can therefore have up to seven owners and a
 * person can hold pairs across as many campuses as they like.
 *
 * None of this gates anything. Any admin can still open and work any task;
 * assignment organises attention and drives the My work filter.
 */

/**
 * The MedJobs team, by email.
 *
 * admin_users holds far more people than work campuses — engineers, old
 * accounts — and a menu of fifteen names is a menu nobody reads. This is the
 * list the assignee dropdown offers, and the only list the assign route will
 * accept, so a stale tab cannot assign somebody who has left.
 *
 * Kept here rather than as a column because it changes about once a year and
 * a constant is one line to edit, where a column would be a migration plus a
 * row to remember to write.
 */
export const ROSTER: readonly string[] = [
  "logan@olera.care",
  "graize@olera.care",
  "sara@olera.care",
  "chantel@olera.care",
];

/**
 * Whether this address is on the team.
 *
 * Lowercased on both sides. Addresses get written down with a capital first
 * letter — Grazy@olera.care — and a case-sensitive comparison here would have
 * produced an empty dropdown with nothing on screen to say why.
 */
export const onRoster = (email: string | null | undefined): boolean =>
  typeof email === "string" && ROSTER.includes(email.trim().toLowerCase());

/**
 * The name to show for an address.
 *
 * Everybody's olera.care address is their first name, so the local part is
 * the name: logan@olera.care → Logan. A dotted or hyphenated address gives up
 * its first part rather than the whole thing.
 *
 * One function, used by every surface. The day an address stops matching a
 * name, this is replaced by a real column and no UI changes.
 */
export function firstName(email: string): string {
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  const head = local.split(/[._+-]/)[0] ?? "";
  if (!head) return email.trim();
  return head.charAt(0).toUpperCase() + head.slice(1);
}

/** One person who can hold assignments. */
export interface Person {
  /** admin_users.id — what an assignment stores. */
  id: string;
  email: string;
  /** Derived from the email. Never stored. */
  name: string;
}

/** Alphabetical by name, so the dropdown is the same order every time. */
export const byName = (a: Person, b: Person): number => a.name.localeCompare(b.name);

/** Who owns each task type at one university. Absent key means unassigned. */
export type Assignments = Partial<Record<SectionKey, Person>>;

/** The sections this list of keys is allowed to contain. */
export const isAssignableSection = (s: string): s is SectionKey =>
  (SECTION_ORDER as readonly string[]).includes(s);

/**
 * The distinct people holding any task type here, for the line under a
 * university's name on the board.
 */
export function assignedPeople(a: Assignments | undefined): Person[] {
  if (!a) return [];
  const seen = new Map<string, Person>();
  for (const key of SECTION_ORDER) {
    const p = a[key];
    if (p && !seen.has(p.id)) seen.set(p.id, p);
  }
  return [...seen.values()].sort(byName);
}

/**
 * The task types this person owns here.
 *
 * A null person is "everyone" — the unfiltered board — and gets every
 * section, so callers do not need a branch for the default case.
 */
export function sectionsFor(
  a: Assignments | undefined,
  personId: string | null,
): readonly SectionKey[] {
  if (!personId) return SECTION_ORDER;
  return SECTION_ORDER.filter((s) => a?.[s]?.id === personId);
}
