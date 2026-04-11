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

// Strip state name or abbreviation prefix from a normalized ID
// e.g., "texassnapfoodbenefits" → "snapfoodbenefits", "txsnapfoodbenefits" → "snapfoodbenefits"
function stripStatePrefix(normalizedId: string, stateAbbrev: string): string {
  const abbrevLower = stateAbbrev.toLowerCase();
  // Find the full state name from abbreviation (reverse lookup)
  const fullName = Object.entries(STATE_ABBREVS).find(([, v]) => v === stateAbbrev)?.[0]?.replace(/-/g, "") || "";

  if (fullName && normalizedId.startsWith(fullName)) return normalizedId.slice(fullName.length);
  if (normalizedId.startsWith(abbrevLower)) return normalizedId.slice(abbrevLower.length);
  return normalizedId;
}

function findDraftMatch(stateAbbrev: string, programId: string): PipelineDraft | undefined {
  const stateDrafts = pipelineDrafts[stateAbbrev];
  if (!stateDrafts?.programs) return undefined;

  const normalizedTarget = normalizeId(programId);

  // 1. Exact ID match
  const exact = stateDrafts.programs.find((d) => d.id === programId);
  if (exact) return exact;

  // 2. Normalized ID match
  const normalized = stateDrafts.programs.find(
    (d) => normalizeId(d.id) === normalizedTarget
  );
  if (normalized) return normalized;

  // 3. State-prefix-stripped match (handles "texas-snap" vs "tx-snap")
  const strippedTarget = stripStatePrefix(normalizedTarget, stateAbbrev);
  const prefixMatch = stateDrafts.programs.find(
    (d) => stripStatePrefix(normalizeId(d.id), stateAbbrev) === strippedTarget
  );
  if (prefixMatch) return prefixMatch;

  // 4. Name-based match (handles completely different IDs like
  //    "star-plus-home-and-community-based-services" vs "tx-star-plus-medicaid-hcbs")
  // Try to find the base program name from waiver-library and match against draft names
  const state = getStateById(
    Object.entries(STATE_ABBREVS).find(([, v]) => v === stateAbbrev)?.[0] || ""
  );
  const baseProgram = state?.programs.find((p) => p.id === programId);
  if (baseProgram) {
    const baseName = normalizeId(baseProgram.name);
    const baseShort = normalizeId(baseProgram.shortName || "");
    return stateDrafts.programs.find((d) => {
      const draftName = normalizeId(d.name);
      const draftShort = normalizeId(d.shortName || "");
      return draftName === baseName || draftShort === baseShort
        || (baseShort && draftName.includes(baseShort))
        || (draftShort && baseName.includes(draftShort));
    });
  }

  return undefined;
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
      icon: draft.icon,
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
    icon: baseProgram.icon || draft.icon,
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
