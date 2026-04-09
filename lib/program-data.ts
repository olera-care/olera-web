/**
 * Data merge layer — combines hand-curated WaiverProgram data with
 * pipeline-generated PipelineDraft content at read-time.
 *
 * Priority: hand-curated fields in waiver-library.ts always win.
 * Pipeline drafts fill gaps where waiver-library has no data.
 */

import {
  getProgramById,
  allStates,
  type WaiverProgram,
} from "@/data/waiver-library";
import {
  pipelineDrafts,
  type PipelineDraft,
  type PipelineStateOverview,
} from "@/data/pipeline-drafts";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type ProgramType = "benefit" | "resource" | "navigator" | "employment";
export type Complexity = "deep" | "medium" | "simple";

export interface ProgramTab {
  label: string;
  href: string;
}

export interface EnrichedProgram extends WaiverProgram {
  // These are required on EnrichedProgram (optional on WaiverProgram)
  programType: ProgramType;
  complexity: Complexity;
}

// ─── State abbreviation lookup ──────────────────────────────────────────────────

const stateIdToAbbreviation = new Map<string, string>();
const abbreviationToStateId = new Map<string, string>();

for (const state of allStates) {
  stateIdToAbbreviation.set(state.id, state.abbreviation);
  abbreviationToStateId.set(state.abbreviation, state.id);
}

// ─── Pipeline draft lookup ──────────────────────────────────────────────────────

function getPipelineDraft(
  stateId: string,
  programId: string
): PipelineDraft | undefined {
  const abbr = stateIdToAbbreviation.get(stateId);
  if (!abbr) return undefined;
  const stateDrafts = pipelineDrafts[abbr];
  if (!stateDrafts) return undefined;
  // Match by ID — pipeline IDs may differ slightly, try exact match first
  let draft = stateDrafts.programs.find((d) => d.id === programId);
  if (!draft) {
    // Fuzzy match: normalize both IDs and compare
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalizedTarget = normalize(programId);
    draft = stateDrafts.programs.find(
      (d) => normalize(d.id) === normalizedTarget
    );
  }
  return draft;
}

export function getPipelineStateOverview(
  stateId: string
): PipelineStateOverview | undefined {
  const abbr = stateIdToAbbreviation.get(stateId);
  if (!abbr) return undefined;
  return pipelineDrafts[abbr]?.stateOverview ?? undefined;
}

// ─── Program type detection ─────────────────────────────────────────────────────

const RESOURCE_PATTERNS =
  /ombudsman|legal\s+(services|hotline|aid)|ship\s+counsel|medicare\s+counsel|companion\s+program|information\s+&?\s*referral/i;
const NAVIGATOR_PATTERNS =
  /area\s+agency|aging.*disability.*resource|adrc|211|benefits\s+counsel/i;
const EMPLOYMENT_PATTERNS = /scsep|employment\s+program|job\s+training/i;

export function getProgramType(program: WaiverProgram): ProgramType {
  // Manual override takes priority
  if (program.programType) return program.programType;

  // Check pipeline draft
  const name = program.name + " " + program.id;
  if (EMPLOYMENT_PATTERNS.test(name)) return "employment";
  if (NAVIGATOR_PATTERNS.test(name)) return "navigator";
  if (RESOURCE_PATTERNS.test(name)) return "resource";
  return "benefit";
}

export function getComplexity(program: WaiverProgram): Complexity {
  if (program.complexity) return program.complexity;

  // Heuristic based on data richness
  let signals = 0;
  const elig = program.structuredEligibility;
  if (elig?.incomeTable?.length) signals++;
  if (elig?.assetLimits) signals++;
  if (elig?.functionalRequirement) signals++;
  if (program.geographicScope?.localEntities?.length) signals++;

  if (signals >= 3) return "deep";
  if (signals >= 1) return "medium";
  return "simple";
}

// ─── Tab availability ───────────────────────────────────────────────────────────

export function getAvailableTabs(
  program: EnrichedProgram,
  basePath: string
): ProgramTab[] {
  const type = program.programType;
  const tabs: ProgramTab[] = [{ label: "About", href: basePath }];

  if (type === "benefit") {
    // Eligibility tab: show if we have structured eligibility or highlights
    const hasEligibility =
      program.structuredEligibility ||
      program.eligibilityHighlights?.length > 0;
    if (hasEligibility) {
      tabs.push({ label: "Eligibility", href: `${basePath}/eligibility` });
    }

    // Apply tab: show if we have application guide or documents or steps
    const hasApply =
      program.applicationGuide ||
      program.documentsNeeded?.length ||
      program.applicationSteps?.length > 0;
    if (hasApply) {
      tabs.push({ label: "How to Apply", href: `${basePath}/apply` });
    }
  }

  if (type === "employment") {
    // Employment programs have apply steps but not detailed eligibility
    const hasApply =
      program.applicationGuide ||
      program.documentsNeeded?.length ||
      program.applicationSteps?.length > 0;
    if (hasApply) {
      tabs.push({ label: "How to Apply", href: `${basePath}/apply` });
    }
  }

  // Resources tab: show if we have contacts, related programs, forms, or links
  const hasResources =
    program.contacts?.length ||
    program.relatedPrograms?.length ||
    program.forms?.length ||
    program.applicationGuide?.urls?.length ||
    program.sourceUrl;
  if (hasResources) {
    tabs.push({ label: "Resources", href: `${basePath}/resources` });
  }

  return tabs;
}

// ─── Enriched program merge ─────────────────────────────────────────────────────

/**
 * Returns a program with pipeline-draft data merged in.
 * Hand-curated fields in waiver-library.ts always take priority.
 */
export function getEnrichedProgram(
  stateId: string,
  programId: string
): EnrichedProgram | undefined {
  const program = getProgramById(stateId, programId);
  if (!program) return undefined;

  const draft = getPipelineDraft(stateId, programId);
  const type = getProgramType(program);
  const complexity = getComplexity(program);

  // Start with the hand-curated program, then fill gaps from pipeline draft
  const enriched: EnrichedProgram = {
    ...program,
    programType: type,
    complexity,
  };

  if (draft) {
    // Intro — prefer hand-curated, fall back to pipeline
    if (!enriched.intro && draft.intro) {
      enriched.intro = draft.intro;
    }

    // Tagline — prefer hand-curated
    if (
      (!enriched.tagline || enriched.tagline === enriched.description) &&
      draft.tagline
    ) {
      enriched.tagline = draft.tagline;
    }

    // Structured eligibility — pipeline fills if not hand-curated
    if (!enriched.structuredEligibility && draft.structuredEligibility) {
      enriched.structuredEligibility = draft.structuredEligibility;
    }

    // Application guide
    if (!enriched.applicationGuide && draft.applicationGuide) {
      enriched.applicationGuide = draft.applicationGuide;
    }

    // Content sections
    if (!enriched.contentSections?.length && draft.contentSections?.length) {
      enriched.contentSections = draft.contentSections;
    }

    // FAQs — merge if hand-curated has fewer
    if (!enriched.faqs?.length && draft.faqs?.length) {
      enriched.faqs = draft.faqs;
    }

    // Documents needed
    if (!enriched.documentsNeeded?.length && draft.documentsNeeded?.length) {
      enriched.documentsNeeded = draft.documentsNeeded;
    }

    // Contacts
    if (!enriched.contacts?.length && draft.contacts?.length) {
      enriched.contacts = draft.contacts;
    }

    // Regional applications
    if (
      !enriched.regionalApplications?.length &&
      draft.regionalApplications?.length
    ) {
      enriched.regionalApplications = draft.regionalApplications;
    }

    // Application notes
    if (!enriched.applicationNotes?.length && draft.applicationNotes?.length) {
      enriched.applicationNotes = draft.applicationNotes;
    }

    // Related programs
    if (!enriched.relatedPrograms?.length && draft.relatedPrograms?.length) {
      enriched.relatedPrograms = draft.relatedPrograms;
    }

    // Geographic scope
    if (!enriched.geographicScope && draft.geographicScope) {
      enriched.geographicScope = draft.geographicScope;
    }

    // Phone
    if (!enriched.phone && draft.phone) {
      enriched.phone = draft.phone;
    }

    // Source URL
    if (!enriched.sourceUrl && draft.sourceUrl) {
      enriched.sourceUrl = draft.sourceUrl;
    }

    // Savings fields — only fill if waiver-library has no verified data
    if (!enriched.savingsVerified) {
      if (draft.savingsRange !== undefined && enriched.savingsRange === "") {
        enriched.savingsRange = draft.savingsRange;
      }
      if (draft.savingsSource && !enriched.savingsSource) {
        enriched.savingsSource = draft.savingsSource;
      }
    }

    // Content status from pipeline
    if (!enriched.contentStatus && draft.contentStatus) {
      enriched.contentStatus = draft.contentStatus;
    }
  }

  // Derive complexity from enriched data if not already set
  if (!enriched.complexity || enriched.complexity === "simple") {
    enriched.complexity = getComplexity(enriched);
  }

  return enriched;
}

/**
 * Convenience: check if a program is a resource/navigator (simple contact-focused page)
 */
export function isResourceProgram(program: WaiverProgram): boolean {
  const type = getProgramType(program);
  return type === "resource" || type === "navigator";
}
