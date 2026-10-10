import { getEnrichedProgram, getStateSlug } from "@/lib/program-data";
import { US_STATES } from "@/lib/us-states";
import type { ApplyHousehold } from "@/lib/benefits/apply-along";
import { buildSnapApplyAlong, snapStateFacts } from "@/lib/benefits/apply-along-snap";
import { parseCuts } from "@/lib/benefits/cut";
import type { FinderWho } from "@/lib/benefits/finder-answers";
import ApplyAlongView from "@/components/benefits/apply/ApplyAlongView";

/**
 * /benefits/apply/snap?st=TX&p=<program id>&w=parent&h=alone&i=under1500&ic=under:1330[&t=<plan token>]
 *
 * The SNAP apply-along (lib/benefits/apply-along-snap.ts). Same link shape as
 * the Medicare Savings one: answers as ranges, no personal data; `t` lets
 * "we sent it" be recorded on the family's plan.
 */
const WHO = ["me", "parent", "spouse", "other"];
const HOUSEHOLD = ["alone", "couple", "family"];
const INCOME = ["under1000", "under1500", "under2500", "under4000", "over4000"];

export default async function SnapApplyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const pick = (v: string | undefined, allowed: string[]) => (v && allowed.includes(v) ? v : null);
  const stateCode = (q.st || "").toUpperCase();
  const stateName = US_STATES.find((s) => s.value === stateCode)?.label ?? null;
  const stateSlug = stateName ? getStateSlug(stateCode) ?? null : null;
  const program = stateSlug && q.p ? getEnrichedProgram(stateSlug, q.p) : undefined;

  const who = pick(q.w, WHO) as FinderWho | null;
  const household = pick(q.h, HOUSEHOLD) as ApplyHousehold;
  const income = pick(q.i, INCOME);
  const sheet = buildSnapApplyAlong({
    who,
    household,
    income,
    incomeCut: parseCuts(q.ic) ? q.ic! : null,
    stateName: stateName ?? "your state",
    state: stateName ? snapStateFacts(stateCode) : null,
  });

  return (
    <ApplyAlongView
      sheet={sheet}
      token={q.t && /^[A-Za-z0-9_-]{16}$/.test(q.t) ? q.t : null}
      stateCode={stateName ? stateCode : null}
      stateSlug={stateSlug}
      program={program && stateSlug ? { id: program.id, name: program.name, shortName: program.shortName || null } : null}
      who={who}
      household={household}
      income={income}
    />
  );
}
