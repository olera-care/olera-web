/**
 * Registry of per-university Program PDF configs, split by AUDIENCE:
 *   - provider: the agency brochure (why hire students, vetting, pricing)
 *   - student:  the student flyer the partner channel shares (why join, how to
 *               join, eligibility) — content is student-facing, no pricing.
 *
 * Keyed by campus slug (matches student_outreach_campuses.slug). To add a
 * university: create configs/<slug>.ts (+ optionally <slug>-student.ts) and
 * register below. The renderer (Template.tsx) + API route are config-agnostic.
 */

import { TEXAS_AM } from "./texas-am";
import { TEXAS_AM_STUDENT } from "./texas-am-student";
import type { ProgramPdfConfig } from "./texas-am";

export type { ProgramPdfConfig };

/** Audience for a program PDF. Provider = agency brochure; student = the flyer
 *  partners share with pre-health students. */
export type PdfAudience = "provider" | "student";

export const PROGRAM_PDF_CONFIGS: Record<string, ProgramPdfConfig> = {
  [TEXAS_AM.slug]: TEXAS_AM,
};

export const PROGRAM_PDF_CONFIGS_STUDENT: Record<string, ProgramPdfConfig> = {
  [TEXAS_AM_STUDENT.slug]: TEXAS_AM_STUDENT,
};

/** Returns the config for a campus slug + audience, or null if not configured.
 *  Audience defaults to "provider" so existing callers are unchanged. */
export function getProgramPdfConfig(
  slug: string | null | undefined,
  audience: PdfAudience = "provider",
): ProgramPdfConfig | null {
  if (!slug) return null;
  const map = audience === "student" ? PROGRAM_PDF_CONFIGS_STUDENT : PROGRAM_PDF_CONFIGS;
  return map[slug] ?? null;
}
