import type { WaiverProgram } from "@/data/waiver-library";

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function hasItems<T>(value: T[] | undefined | null): boolean {
  return Array.isArray(value) && value.length > 0;
}

function hasAssetLimits(program: WaiverProgram): boolean {
  const limits = program.structuredEligibility?.assetLimits;
  if (!limits) return false;

  return Boolean(
    limits.individual !== undefined ||
      limits.couple !== undefined ||
      hasItems(limits.countedAssets) ||
      hasItems(limits.exemptAssets) ||
      limits.homeEquityCap !== undefined
  );
}

function hasStructuredEligibility(program: WaiverProgram): boolean {
  const eligibility = program.structuredEligibility;
  if (!eligibility) return false;

  return Boolean(
    hasItems(eligibility.summary) ||
      hasItems(eligibility.incomeTable) ||
      hasText(eligibility.functionalRequirement) ||
      hasText(eligibility.ageRequirement) ||
      hasItems(eligibility.otherRequirements) ||
      hasText(eligibility.povertyLevelReference) ||
      hasAssetLimits(program)
  );
}

/**
 * A program page needs at least one rich V3 body field before we should invite
 * search engines to index it. Legacy scaffold fields can render a hero, but
 * without these fields the actual page body is effectively empty.
 */
export function hasRichProgramContent(program: WaiverProgram): boolean {
  const guide = program.applicationGuide;

  return Boolean(
    hasText(program.intro) ||
      hasText(program.sourceUrl) ||
      hasText(guide?.summary) ||
      hasText(guide?.processingTime) ||
      hasText(guide?.waitlist) ||
      hasText(guide?.tip) ||
      hasItems(guide?.steps) ||
      hasStructuredEligibility(program) ||
      hasItems(program.documentsNeeded) ||
      hasItems(program.contacts) ||
      hasItems(program.faqs) ||
      hasItems(program.contentSections)
  );
}
