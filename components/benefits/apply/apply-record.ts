/**
 * What every apply-along does with the family's record, in one place:
 * recording "we sent it" on their plan (the check-ins read it), and the plan
 * save that creates a record for a family who has none yet. Used by the
 * Medicare Savings sheet (ApplyAlongView) and the SNAP flow (SnapApplyFlow).
 */
import type { ApplyHousehold, ApplyRoute } from "@/lib/benefits/apply-along";
import { incomeRangeFromFinder, relationshipFromFinder, type FinderIncome, type FinderWho } from "@/lib/benefits/finder-answers";
import { studyCohort } from "@/lib/benefits/study-cohort";
import { getOrCreateSessionId, getOrCreateVisitId } from "@/lib/analytics/session";

const FINDER_KEY = "olera-finder-v2";

export async function recordApplied(token: string, route: ApplyRoute, programId: string | null, stateSlug: string | null): Promise<void> {
  const res = await fetch("/api/families/benefits-journey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, action: "applied", route, programId: programId ?? undefined, stateId: stateSlug ?? undefined }),
  });
  if (!res.ok) throw new Error("We couldn't save that just now. Please try again.");
}

/** Contact as typed: an email, or a phone number with at least 10 digits. */
export function parseContact(raw: string): { email?: string; phone?: string } | null {
  const value = raw.trim();
  if (value.includes("@")) return { email: value };
  return value.replace(/\D/g, "").length >= 10 ? { phone: value } : null;
}

/**
 * The plan save: creates the family's record (or finds it) and texts or
 * emails their plan. Returns the plan token when the record could be written
 * from this browser; a returning family's record isn't changed from an
 * unverified browser, so there's no token to record against.
 */
export async function savePlan(p: {
  contact: { email?: string; phone?: string };
  program: { id: string; name: string; shortName: string | null };
  stateCode: string;
  stateSlug: string;
  who: FinderWho | null;
  household: ApplyHousehold;
  income: string | null;
  entrySource: string;
}): Promise<{ token: string | null }> {
  // The family's whole plan, when this browser still holds it, so their saved
  // plan isn't cut down to this one program.
  let planIds: string[] = [];
  try {
    const saved = JSON.parse(localStorage.getItem(FINDER_KEY) || "null");
    const r = saved?.result;
    if (r && r.stateCode === p.stateCode) planIds = [r.firstStep, ...(r.programs || [])].filter((x: { id?: string } | null) => x?.id && x.id !== "local-agency").map((x: { id: string }) => x.id);
  } catch {
    // No saved plan in this browser.
  }
  const ids = [p.program.id, ...planIds.filter((id) => id !== p.program.id)].slice(0, 30);
  const res = await fetch("/api/benefits/save-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      careNeed: "payingForCare",
      careNeedSource: "stated",
      incomeRange: incomeRangeFromFinder(p.income as FinderIncome | null),
      stateCode: p.stateCode,
      contactChannel: p.contact.email ? "email" : "sms",
      email: p.contact.email,
      phone: p.contact.phone,
      relationship: relationshipFromFinder(p.who),
      householdSize: p.household === "alone" ? "1" : p.household === "couple" ? "2" : p.household === "family" ? "3" : undefined,
      entrySource: p.entrySource,
      sessionId: getOrCreateSessionId(),
      visitId: getOrCreateVisitId(),
      matchedPrograms: [{ programId: p.program.id, stateId: p.stateSlug, name: p.program.name, shortName: p.program.shortName ?? undefined, programType: "benefit" }],
      matchCount: ids.length,
      firstStepProgramId: p.program.id,
      finderProgramIds: ids,
      cohort: studyCohort() ?? undefined,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "We couldn't save that just now. Please try again.");
  return { token: typeof body.token === "string" ? body.token : null };
}
