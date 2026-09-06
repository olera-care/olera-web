/**
 * Relationships between nodes that have to hold if the map is counting
 * correctly.
 *
 * These are not style rules — each one is a statement about the funnel that
 * cannot be false unless something is wrong. A visitor cannot be more
 * numerous than the pages they viewed. A parent has to equal its parts. When
 * one breaks, the map says so rather than presenting a confident wrong
 * number, which is the failure mode worth spending code on: a number nobody
 * questions is more dangerous than a missing one.
 *
 * Checks skip themselves when an input is missing, so an unavailable node
 * reports as unavailable rather than manufacturing a failure.
 */

export interface NodeValues {
  [nodeId: string]: number | null | undefined;
}

export interface MapCheck {
  id: string;
  /** What is being asserted, in the language the map itself uses. */
  label: string;
  ok: boolean;
  /** Only set when the check fails: the numbers that did not line up. */
  detail?: string;
}

const n = (v: number | null | undefined): number | null =>
  typeof v === "number" ? v : null;

export interface CheckInputs {
  /** CR4's provider + editorial + benefits, summed by the caller. */
  cr4PartsSum?: number;
  /** CP1's claimed + unclaimed, summed by the caller. */
  cp1PartsSum?: number;
  /** CP1's unclaimed half — the set CP2 is drawn from. */
  cp1Unclaimed?: number;
}

export function runChecks(values: NodeValues, inputs: CheckInputs = {}): MapCheck[] {
  const checks: MapCheck[] = [];

  const cr6 = n(values.cr6);
  const cr6a = n(values.cr6a);
  const cr6b = n(values.cr6b);
  const cr6c = n(values.cr6c);
  if (cr6 !== null && cr6a !== null && cr6b !== null && cr6c !== null) {
    const sum = cr6a + cr6b + cr6c;
    checks.push({
      id: "cr6-parts",
      label: "CTAs submitted equals its three parts",
      ok: cr6 === sum,
      detail: cr6 === sum ? undefined : `CR6 is ${cr6}, its parts add to ${sum}`,
    });
  }

  const cr2 = n(values.cr2);
  const cr4 = n(values.cr4);
  if (cr2 !== null && cr4 !== null) {
    // One visitor produces at least one page view, so visitors can never
    // exceed views over the same window.
    checks.push({
      id: "cr2-under-cr4",
      label: "Organic visitors do not exceed page visits",
      ok: cr2 <= cr4,
      detail: cr2 <= cr4 ? undefined : `CR2 is ${cr2}, CR4 is ${cr4}`,
    });
  }

  if (typeof inputs.cr4PartsSum === "number" && n(values.cr4) !== null) {
    const total = n(values.cr4) as number;
    checks.push({
      id: "cr4-parts",
      label: "Page visits equals provider plus editorial plus benefits",
      ok: total === inputs.cr4PartsSum,
      detail:
        total === inputs.cr4PartsSum
          ? undefined
          : `CR4 is ${total}, its parts add to ${inputs.cr4PartsSum}`,
    });
  }

  const cp1 = n(values.cp1);
  const cp2 = n(values.cp2);

  if (typeof inputs.cp1PartsSum === "number" && cp1 !== null) {
    checks.push({
      id: "cp1-parts",
      label: "Providers listed equals claimed plus unclaimed",
      ok: cp1 === inputs.cp1PartsSum,
      detail:
        cp1 === inputs.cp1PartsSum
          ? undefined
          : `CP1 is ${cp1}, its parts add to ${inputs.cp1PartsSum}`,
    });
  }

  if (cp2 !== null && typeof inputs.cp1Unclaimed === "number") {
    // CP2 counts unclaimed providers, so it cannot exceed how many there are.
    checks.push({
      id: "cp2-under-unclaimed",
      label: "Providers in outreach do not exceed unclaimed providers",
      ok: cp2 <= inputs.cp1Unclaimed,
      detail:
        cp2 <= inputs.cp1Unclaimed
          ? undefined
          : `CP2 is ${cp2}, unclaimed is ${inputs.cp1Unclaimed}`,
    });
  }

  const cr5 = n(values.cr5);
  if (cr5 !== null && cr4 !== null) {
    checks.push({
      id: "cr5-under-cr4",
      label: "Questions asked do not exceed page visits",
      ok: cr5 <= cr4,
      detail: cr5 <= cr4 ? undefined : `CR5 is ${cr5}, CR4 is ${cr4}`,
    });
  }

  return checks;
}
