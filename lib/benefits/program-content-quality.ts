import type { WaiverProgram } from "@/data/waiver-library";

/**
 * A program page needs at least one rich V3 body field before we should invite
 * search engines to index it. Legacy scaffold fields can render a hero, but
 * without these fields the actual page body is effectively empty.
 */
export function hasRichProgramContent(program: WaiverProgram): boolean {
  const guide = program.applicationGuide;

  return Boolean(
    program.intro?.trim() ||
      program.sourceUrl?.trim() ||
      guide?.summary?.trim() ||
      guide?.processingTime?.trim() ||
      guide?.waitlist?.trim() ||
      guide?.tip?.trim() ||
      (Array.isArray(guide?.steps) && guide.steps.length > 0) ||
      (program.structuredEligibility &&
        (!Array.isArray(program.structuredEligibility.summary) ||
          program.structuredEligibility.summary.length > 0)) ||
      (Array.isArray(program.documentsNeeded) && program.documentsNeeded.length > 0) ||
      (Array.isArray(program.contacts) && program.contacts.length > 0) ||
      (Array.isArray(program.faqs) && program.faqs.length > 0) ||
      (Array.isArray(program.contentSections) && program.contentSections.length > 0)
  );
}
