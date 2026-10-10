/**
 * Apply-along for senior SNAP (Phase 5 of the benefits caseworker, 10 Oct
 * 2026), the second after Medicare Savings.
 *
 * There is no national form: every state takes its own application, so the
 * flow (components/benefits/apply/SnapApplyFlow.tsx) stands on a verified
 * table of each state's door (data/benefits/snap-states.json: the online
 * application, the phone line and whether it takes applications, a shorter
 * senior form). Olera's earlier SNAP links sent Kansans to an Arkansas site.
 *
 * The flow stays general (TJ, 10 Oct 2026): specific only on rules that are
 * the same everywhere, the family's own answers, and the state's door. The
 * federal rules it stands on, 7 CFR part 273:
 *   - 273.9(a): a household with someone 60+ faces the net income test only.
 *   - 273.9(d)(3): medical costs over $35 a month for that person lower the
 *     income counted (Medicare premiums, prescriptions, dental, glasses,
 *     hearing aids, rides to treatment, paid help at home). Many states use
 *     a set amount instead of the receipts (a Standard Medical Deduction).
 *   - 273.9(d)(6)(ii): no cap on the shelter deduction for those households.
 *   - 273.1(a)(2), (b)(1): an adult 22+ who buys and cooks apart from the
 *     people they live with is their own household; spouses always apply
 *     together.
 *   - 273.2(n): a relative can be named the authorized representative and do
 *     the interview. 273.2(c)(1)(iii): a name, address and signature is
 *     enough to file, and the 30 days (273.2(g)) start then.
 *
 * Server-side (loads the 51-state table); the client pieces are in
 * lib/benefits/snap-match.ts. States no dollar figure about the family.
 */
import snapStates from "@/data/benefits/snap-states.json";

export { isSnapProgram, snapApplyHref } from "@/lib/benefits/snap-match";

export interface SnapState {
  code: string;
  /** What the state calls SNAP ("CalFresh", "Basic Food", or "SNAP"). */
  name: string;
  applyUrl: string | null;
  phone: string;
  /** Can you apply by phone on that line? null when the state doesn't say. */
  phoneApplies: boolean | null;
  phoneNote: string | null;
  seniorForm: { name: string; url: string | null } | null;
  /** "standard": a set amount once costs pass $35. "actual": the costs over $35. */
  medicalDeduction: "standard" | "actual";
  interviewNote: string | null;
  paperOnly: boolean;
  paperUrl: string | null;
  confidence: string;
  sources: string[];
}

export const SNAP_STATES_CHECKED: string = snapStates.checked;

export function snapStateFacts(code: string | null): SnapState | null {
  if (!code) return null;
  return ((snapStates.states as SnapState[]).find((s) => s.code === code.toUpperCase())) ?? null;
}
