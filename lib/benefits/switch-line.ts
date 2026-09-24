/**
 * One plain line explaining why a family's plan does not start with the
 * program they came for (TJ, 2026-09-24: the program they came for leads
 * unless ruled out, and every switch must be explained).
 *
 * Pure and client-safe. Takes the switch fields selectFirstStepProgram puts on
 * its pick; returns null when there was no switch.
 */
export interface SwitchFields {
  shortName: string;
  switchReason?: "ruled_out" | "no_contact" | "no_steps";
  switchedFromName?: string;
  switchDetail?: string | null;
}

export function switchLine(pick: SwitchFields | null | undefined): string | null {
  if (!pick?.switchReason || !pick.switchedFromName) return null;
  const from = pick.switchedFromName;
  const to = pick.shortName;
  if (from === to) return null;
  if (pick.switchReason === "no_contact") {
    return `We don't have a working number for ${from} yet, so we'd start with ${to}.`;
  }
  if (pick.switchReason === "no_steps") {
    return `We're still putting together the steps for ${from}, so we'd start with ${to}.`;
  }
  const d = (pick.switchDetail || "").trim();
  if (/^needs medicaid first$/i.test(d)) return `${from} needs Medicaid first, so we'd start with ${to}.`;
  if (/^for veteran families$/i.test(d)) return `${from} is for veteran families, so we'd start with ${to}.`;
  const age = d.match(/^for age (\d+) and up$/i);
  if (age) return `${from} is for age ${age[1]} and up, so we'd start with ${to}.`;
  if (/income/i.test(d)) return `${from} has a lower income limit than what you shared, so we'd start with ${to}.`;
  return `${from} doesn't look like a fit from what you shared, so we'd start with ${to}.`;
}
