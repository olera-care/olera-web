import type { WaiverProgram } from "@/data/waiver-library";
import { getEnrichedProgram } from "@/lib/program-data";

export interface BenefitsProgramEntry {
  stateId: string;
  programId: string;
  program: WaiverProgram;
}

/**
 * Resolve explicit program intent from an intake entry URL. Only the canonical
 * `/benefits/{state}/{program}` shape qualifies; broad benefits, provider, and
 * editorial pages deliberately return null. Program content always comes from
 * the server-side catalog instead of browser-supplied labels or requirements.
 */
export function resolveBenefitsProgramEntry(
  entrySource: string | null | undefined,
): BenefitsProgramEntry | null {
  if (!entrySource) return null;

  let pathname: string;
  try {
    pathname = new URL(entrySource, "https://olera.care").pathname;
  } catch {
    return null;
  }

  const match = pathname.match(/^\/benefits\/([^/]+)\/([^/]+)\/?$/);
  if (!match) return null;

  try {
    const stateId = decodeURIComponent(match[1]).toLowerCase();
    const programId = decodeURIComponent(match[2]);
    const program = getEnrichedProgram(stateId, programId);
    return program ? { stateId, programId, program } : null;
  } catch {
    return null;
  }
}
