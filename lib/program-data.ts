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
 * Get all program IDs for a state — both waiver-library and pipeline-only.
 * Used by generateStaticParams to create pages for all known programs.
 */
export function getAllProgramIds(stateId: string): string[] {
  const state = getStateById(stateId);
  const ids = new Set<string>();

  // Waiver-library programs
  if (state) {
    for (const p of state.programs) ids.add(p.id);
  }

  // Pipeline-only programs (not in waiver-library)
  const stateAbbrev = STATE_ABBREVS[stateId] || stateId.toUpperCase();
  const drafts = pipelineDrafts[stateAbbrev]?.programs || [];
  for (const d of drafts) ids.add(d.id);

  return Array.from(ids);
}

/**
 * Get an enriched program by merging waiver-library base data with pipeline draft.
 * Hand-curated fields from waiver-library always win over pipeline-generated.
 * Also returns pipeline-only programs that don't exist in waiver-library.
 */
export function getEnrichedProgram(
  stateId: string,
  programId: string
): WaiverProgram | undefined {
  const baseProgram = getProgramById(stateId, programId);

  // Find matching pipeline draft
  const stateAbbrev = STATE_ABBREVS[stateId] || stateId.toUpperCase();
  const draft = findDraftMatch(stateAbbrev, programId);

  // Pipeline-only program — create synthetic WaiverProgram from draft
  if (!baseProgram && draft) {
    return {
      id: draft.id,
      name: draft.name,
      shortName: draft.shortName,
      tagline: draft.tagline,
      savingsRange: draft.savingsRange,
      description: draft.intro || draft.tagline,
      eligibilityHighlights: draft.structuredEligibility?.summary || [],
      applicationSteps: draft.applicationGuide?.steps || [],
      forms: [],
      // Pipeline fields
      programType: draft.programType as WaiverProgram["programType"],
      complexity: draft.complexity as WaiverProgram["complexity"],
      geographicScope: draft.geographicScope as WaiverProgram["geographicScope"],
      intro: draft.intro,
      structuredEligibility: draft.structuredEligibility as WaiverProgram["structuredEligibility"],
      applicationGuide: draft.applicationGuide as WaiverProgram["applicationGuide"],
      contentSections: draft.contentSections as WaiverProgram["contentSections"],
      faqs: draft.faqs,
      savingsSource: draft.savingsSource,
      savingsVerified: draft.savingsVerified,
      phone: draft.phone || undefined,
      sourceUrl: draft.sourceUrl || undefined,
      contentStatus: draft.contentStatus as WaiverProgram["contentStatus"],
      draftedAt: draft.draftedAt,
      documentsNeeded: draft.documentsNeeded,
      contacts: draft.contacts,
      applicationNotes: draft.applicationNotes,
      relatedPrograms: draft.relatedPrograms,
      regionalApplications: draft.regionalApplications,
      layoutIntent: draft.layoutIntent as WaiverProgram["layoutIntent"],
    };
  }

  if (!baseProgram) return undefined;
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
    // v3 fields — pass through from pipeline (base rarely has these)
    documentsNeeded: baseProgram.documentsNeeded || draft.documentsNeeded,
    contacts: baseProgram.contacts || draft.contacts,
    applicationNotes: baseProgram.applicationNotes || draft.applicationNotes,
    relatedPrograms: baseProgram.relatedPrograms || draft.relatedPrograms,
    regionalApplications: baseProgram.regionalApplications || draft.regionalApplications,
    layoutIntent: baseProgram.layoutIntent || draft.layoutIntent as WaiverProgram["layoutIntent"],
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
