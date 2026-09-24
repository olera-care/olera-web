import { NextResponse } from "next/server";
import {
  getTopProgramsForState,
  getCanonicalProgramIds,
  getEnrichedProgram,
} from "@/lib/program-data";
import type { BenefitsProgram } from "@/components/providers/BenefitsDiscoveryModule";
import { pickCallContact } from "@/lib/benefits/call-script";

// Returns the program library shape that BenefitsDiscoveryModule needs
// (topPrograms, allPrograms, stateId, stateName) for a given state. Mirrors
// the server-side fetch the provider page does inline at render time.
//
// Editorial article pages can't fetch this server-side because they're
// ISR-cached and don't know visitor state until /api/geo resolves on the
// client. This endpoint fills that gap — client wrapper hits /api/geo,
// then this, then renders the module.
//
// Cheap (in-memory data lookup, no DB). Force-dynamic because we read
// searchParams per-request; force-static would prerender once with empty
// params and 400 every real call. The data underneath is in-memory so
// response time stays low without static caching.

export const dynamic = "force-dynamic";

interface ProgramsResponse {
  topPrograms: BenefitsProgram[];
  allPrograms: BenefitsProgram[];
  stateId: string;
  stateName: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stateAbbrev = searchParams.get("state")?.toUpperCase();

  if (!stateAbbrev || stateAbbrev.length !== 2) {
    return NextResponse.json({ error: "Invalid or missing state param." }, { status: 400 });
  }

  const top = getTopProgramsForState(stateAbbrev, 3);
  if (!top) {
    return NextResponse.json({ error: "No programs found for state." }, { status: 404 });
  }

  // Canonical ids: legacy duplicates of a current program are dropped, so
  // the matched set (welcome email, saved programs) lists each program once.
  const allIds = getCanonicalProgramIds(top.stateId);
  const allPrograms: BenefitsProgram[] = allIds
    .map((id) => getEnrichedProgram(top.stateId, id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => {
      const call = pickCallContact(p.contacts);
      return {
        id: p.id,
        name: p.name,
        shortName: p.shortName,
        tagline: p.tagline,
        savingsRange: p.savingsRange,
        programType: p.programType,
        structuredEligibility: p.structuredEligibility
          ? {
              ageRequirement: p.structuredEligibility.ageRequirement,
              incomeTable: p.structuredEligibility.incomeTable,
            }
          : undefined,
        callContact: call ? { label: call.label, phone: call.phone, hours: call.hours } : null,
        // "No income limits" stated outright in the program's own summary
        // (35 programs: meals, caregiver support, Seattle Gold Card...). The
        // three_tap "No" branch prefers these over a program that merely has
        // no income table. "No income limits specified" does not count.
        noIncomeLimit: (p.structuredEligibility?.summary || []).some(
          (line) => typeof line === "string" && /^\s*no income limits?\b(?!\s+specified)/i.test(line),
        ),
      };
    });

  const topPrograms: BenefitsProgram[] = top.programs.map((p) => ({
    id: p.id,
    name: p.name,
    shortName: p.shortName,
    tagline: p.tagline,
    savingsRange: p.savingsRange,
  }));

  const response: ProgramsResponse = {
    topPrograms,
    allPrograms,
    stateId: top.stateId,
    stateName: top.stateName,
  };

  return NextResponse.json(response);
}
