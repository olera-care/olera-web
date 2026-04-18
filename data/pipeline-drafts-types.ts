/**
 * Canonical TypeScript shapes for pipeline draft content.
 *
 * Hand-maintained — this is the single source of truth for the PipelineDraft
 * interface. The barrel (data/pipeline-drafts.ts) re-exports these types, and
 * each per-state data/pipeline/{DIR}/drafts.ts imports the types from here.
 *
 * Changes here require `node scripts/benefits-pipeline.js --regen-index` to
 * propagate any formatting refresh to the per-state files. The underlying
 * data (drafts.json) is unaffected by edits in this file.
 */

export interface PipelineDraft {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  programType: string;
  complexity: string;
  intro: string;
  savingsRange: string;
  savingsSource: string;
  savingsVerified: boolean;
  structuredEligibility?: {
    summary: string[];
    ageRequirement?: string | null;
    incomeTable?: { householdSize: number; monthlyLimit: number }[] | null;
    assetLimits?: {
      individual?: number | null;
      couple?: number | null;
      countedAssets?: string[] | null;
      exemptAssets?: string[] | null;
      homeEquityCap?: number | null;
    } | null;
    functionalRequirement?: string | null;
    otherRequirements?: string[];
    povertyLevelReference?: string | null;
  };
  applicationGuide?: {
    method: string;
    summary: string;
    steps?: { step: number; title: string; description: string }[];
    processingTime?: string | null;
    waitlist?: string | null;
    tip?: string | null;
    urls?: { label: string; url: string }[];
  };
  contentSections?: { type: string; [key: string]: unknown }[];
  faqs?: { question: string; answer: string }[];
  phone?: string | null;
  sourceUrl?: string | null;
  // v3 fields
  documentsNeeded?: string[] | null;
  contacts?: { label: string; description?: string | null; phone?: string | null; hours?: string | null }[] | null;
  applicationNotes?: string[] | null;
  relatedPrograms?: string[] | null;
  regionalApplications?: { region: string; counties?: string[]; url: string; isPdf?: boolean }[] | null;
  layoutIntent?: {
    aboutHighlight?: string | null;
    eligibilityDisplay?: string | null;
    applyDisplay?: string | null;
    hasLocationFinder?: boolean;
    hasDocumentChecklist?: boolean;
    visualTone?: string | null;
  } | null;
  icon?: string | null;
  contentStatus: string;
  draftedAt: string;
  geographicScope?: { type: string; stateVariation?: boolean; localEntities?: { name: string; type: string; phone?: string; address?: string; url?: string }[] };
}

export interface PipelineStateOverview {
  intro: string;
  startHere: { name: string; programId: string; why: string }[];
  byNeed: { need: string; programs: string[]; description: string }[];
  quickFacts: string[];
  resourcesVsBenefits: string;
}

export interface PipelineStateDrafts {
  draftedAt: string;
  programs: PipelineDraft[];
  stateOverview?: PipelineStateOverview | null;
  // Region metadata (present for non-state entities)
  regionName?: string;
  parentState?: string | null;
  slug?: string;
  isRegion?: boolean;
}
