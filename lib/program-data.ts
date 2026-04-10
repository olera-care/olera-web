/**
 * Program data merge layer — combines waiver-library base data with
 * pipeline-generated draft content. Hand-curated fields always win.
 *
 * This is the single source of truth for program page rendering.
 */

import type { WaiverProgram, StateData } from "@/data/waiver-library";
import { getStateById, getProgramById } from "@/data/waiver-library";
import { pipelineDrafts, type PipelineDraft } from "@/data/pipeline-drafts";

// State name → abbreviation lookup
const STATE_ABBREVS: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new-hampshire": "NH", "new-jersey": "NJ",
  "new-mexico": "NM", "new-york": "NY", "north-carolina": "NC", "north-dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode-island": "RI",
  "south-carolina": "SC", "south-dakota": "SD", tennessee: "TN", texas: "TX",
  utah: "UT", vermont: "VT", virginia: "VA", washington: "WA", "west-virginia": "WV",
  wisconsin: "WI", wyoming: "WY", "district-of-columbia": "DC",
};

function normalizeId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findDraftMatch(stateAbbrev: string, programId: string): PipelineDraft | undefined {
  const stateDrafts = pipelineDrafts[stateAbbrev];
  if (!stateDrafts?.programs) return undefined;

  const normalizedTarget = normalizeId(programId);

  // Exact ID match first
  const exact = stateDrafts.programs.find((d) => d.id === programId);
  if (exact) return exact;

  // Normalized fuzzy match
  return stateDrafts.programs.find(
    (d) => normalizeId(d.id) === normalizedTarget
  );
}

/**
 * Get an enriched program by merging waiver-library base data with pipeline draft.
 * Hand-curated fields from waiver-library always win over pipeline-generated.
 */
export function getEnrichedProgram(
  stateId: string,
  programId: string
): WaiverProgram | undefined {
  const baseProgram = getProgramById(stateId, programId);
  if (!baseProgram) return undefined;

  // Find matching pipeline draft
  const stateAbbrev = STATE_ABBREVS[stateId] || stateId.toUpperCase();
  const draft = findDraftMatch(stateAbbrev, programId);

  if (!draft) return baseProgram;

  // Merge: base wins for existing fields, draft fills gaps
  return {
    ...baseProgram,
    // Pipeline classification — only if base doesn't have it
    programType: baseProgram.programType || (draft.programType as WaiverProgram["programType"]),
    complexity: baseProgram.complexity || (draft.complexity as WaiverProgram["complexity"]),
    geographicScope: baseProgram.geographicScope || draft.geographicScope as WaiverProgram["geographicScope"],
    // Rich content — base wins if present
    intro: baseProgram.intro || draft.intro,
    structuredEligibility: baseProgram.structuredEligibility || draft.structuredEligibility as WaiverProgram["structuredEligibility"],
    applicationGuide: baseProgram.applicationGuide || draft.applicationGuide as WaiverProgram["applicationGuide"],
    contentSections: baseProgram.contentSections || draft.contentSections as WaiverProgram["contentSections"],
    faqs: baseProgram.faqs || draft.faqs,
    // Metadata
    savingsRange: baseProgram.savingsRange || draft.savingsRange,
    savingsSource: baseProgram.savingsSource || draft.savingsSource,
    savingsVerified: baseProgram.savingsVerified ?? draft.savingsVerified,
    phone: baseProgram.phone || draft.phone || undefined,
    sourceUrl: baseProgram.sourceUrl || draft.sourceUrl || undefined,
    contentStatus: baseProgram.contentStatus || (draft.contentStatus as WaiverProgram["contentStatus"]),
    draftedAt: baseProgram.draftedAt || draft.draftedAt,
    // Use pipeline name/tagline only if base is clearly a scaffold
    tagline: baseProgram.tagline?.length > 50 ? baseProgram.tagline : (draft.tagline || baseProgram.tagline),
  };
}

/**
 * Get the state abbreviation from a state slug.
 */
export function getStateAbbrev(stateId: string): string {
  return STATE_ABBREVS[stateId] || stateId.toUpperCase();
}
