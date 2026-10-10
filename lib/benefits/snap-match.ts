/**
 * The SNAP apply-along's client-safe pieces: recognizing a state's SNAP
 * program on a plan, and its link. Their own file so browser components can
 * use them without loading the 51-state SNAP table.
 */
import type { ApplyHousehold } from "@/lib/benefits/apply-along";

/** Is this program the state's SNAP? Matches the plan's program names and ids. */
export function isSnapProgram(name: string, id = ""): boolean {
  const text = `${name} ${id}`;
  if (/farmers|commodity|csfp|meals|congregate|tefap|emergency food|summer/i.test(text)) return false;
  return /\bsnap\b|food stamps?|supplemental nutrition|calfresh|3squares|foodshare|basic food|food supplement program|nutrition assistance|food assistance|food and nutrition services/i.test(text);
}

/** The SNAP apply-along link, carrying the answers that fill the sheet (no personal data). */
export function snapApplyHref(p: {
  stateCode: string | null;
  programId: string;
  who?: string | null;
  household?: ApplyHousehold;
  income?: string | null;
  incomeCut?: string | null;
  token?: string | null;
}): string {
  const q = new URLSearchParams();
  if (p.stateCode) q.set("st", p.stateCode);
  q.set("p", p.programId);
  if (p.who) q.set("w", p.who);
  if (p.household) q.set("h", p.household);
  if (p.income && p.income !== "unsure") q.set("i", p.income);
  if (p.incomeCut) q.set("ic", p.incomeCut);
  if (p.token) q.set("t", p.token);
  return `/benefits/apply/snap?${q.toString()}`;
}
