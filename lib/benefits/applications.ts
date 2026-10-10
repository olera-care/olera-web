/**
 * The applications a family told us they sent through an apply-along.
 *
 * The first apply-along (Medicare Savings through Social Security, 7 Oct 2026)
 * stored one application at `benefits_cascade.applied`. The second (senior
 * SNAP, 10 Oct 2026) needs both side by side, so every other route lives in
 * `benefits_cascade.applications`, one entry per route, and `applied` stays
 * where it is: no stored row moves. Read and write through these helpers,
 * never the two fields directly. Client-safe.
 */
import type { ApplyRoute } from "@/lib/benefits/apply-along";
import type { BenefitsApplication, BenefitsCascadeMeta } from "@/lib/family-comms/benefits-cascade.server";

export type ApplicationDecision = NonNullable<BenefitsApplication["decision"]>;

/** Every application on the record, oldest first. */
export function applicationsOf(cascade: BenefitsCascadeMeta): BenefitsApplication[] {
  const list = [cascade.applied, ...(cascade.applications ?? [])].filter((a): a is BenefitsApplication => Boolean(a?.at));
  return list.sort((a, b) => a.at.localeCompare(b.at));
}

export function applicationFor(cascade: BenefitsCascadeMeta, route: ApplyRoute): BenefitsApplication | null {
  return applicationsOf(cascade).find((a) => a.route === route) ?? null;
}

/** Writes one application back to wherever its route is stored. */
export function withApplication(cascade: BenefitsCascadeMeta, app: BenefitsApplication): BenefitsCascadeMeta {
  if (app.route === "ssa_extra_help") return { ...cascade, applied: app };
  const others = (cascade.applications ?? []).filter((a) => a.route !== app.route);
  return { ...cascade, applications: [...others, app] };
}

const settled = (a: BenefitsApplication) => a.decision === "approved" || a.decision === "denied" || a.decision === "stuck";

/**
 * The application a reply with no program named ("APPROVED") is about: the
 * undecided one we asked about most recently, else the newest undecided one,
 * else the newest. With one application this is always that one.
 */
export function currentApplication(cascade: BenefitsCascadeMeta): BenefitsApplication | null {
  const all = applicationsOf(cascade);
  if (!all.length) return null;
  const open = all.filter((a) => !settled(a));
  const pool = open.length ? open : all;
  const lastAsked = (a: BenefitsApplication) => a.decision_check_at || a.letter_check_at || "";
  const asked = pool.filter((a) => lastAsked(a)).sort((a, b) => lastAsked(b).localeCompare(lastAsked(a)));
  return asked[0] ?? pool[pool.length - 1];
}

/** Records a decision on one application (by route), or on the current one. */
export function withDecision(
  cascade: BenefitsCascadeMeta,
  decision: ApplicationDecision,
  at: string,
  route?: ApplyRoute | null,
): BenefitsCascadeMeta {
  const target = route ? applicationFor(cascade, route) : currentApplication(cascade);
  if (!target) return cascade;
  return withApplication(cascade, { ...target, decision, decision_at: at });
}

export function isApplyRoute(value: unknown): value is ApplyRoute {
  return value === "ssa_extra_help" || value === "state_snap";
}

const DAY = 86_400_000;

/**
 * Which B3 check-in is due for this application, if any. The first asks
 * whether anything came (Extra Help: a letter, about a week in; SNAP: the
 * interview call, about five days in, since a missed interview ends a SNAP
 * application). The second asks what was decided, about five weeks in. Each
 * once, each inside a window so a stale stamp can't fire months later, and
 * none once the family has told us an answer.
 */
export function applyCheckStage(app: BenefitsApplication, now: number): "letter" | "decision" | null {
  if (settled(app)) return null;
  const since = now - Date.parse(app.at);
  const [from, to] = app.route === "state_snap" ? [5, 14] : [7, 21];
  if (!app.letter_check_at && !app.decision_check_at && since >= from * DAY && since <= to * DAY) return "letter";
  if (!app.decision_check_at && since >= 35 * DAY && since <= 70 * DAY) return "decision";
  return null;
}

/**
 * Did the family already apply for their plan's first step through an
 * apply-along? Then the first-step letter and its check-in (B1, B2) have
 * nothing left to ask. The Medicare Savings apply-along was only ever offered
 * as a first step; SNAP counts only when SNAP was the first step.
 */
export function appliedForFirstStep(cascade: BenefitsCascadeMeta): boolean {
  return applicationsOf(cascade).some(
    (a) => a.route === "ssa_extra_help" || (!!cascade.first_step_program_id && a.program_id === cascade.first_step_program_id),
  );
}
