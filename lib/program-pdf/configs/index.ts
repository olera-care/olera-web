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
import { GENERIC_STUDENT } from "./generic-student";
import { GENERIC_PROVIDER } from "./generic-provider";
import type { ProgramPdfConfig } from "./texas-am";

export type { ProgramPdfConfig };

/** Audience for a program PDF. Provider = agency brochure; student = the flyer
 *  partners share with pre-health students. */
export type PdfAudience = "provider" | "student";

/** The campus-agnostic floor config per audience. Every campus resolves to one
 *  of these when it has no campus-specific config, so outreach is never blocked
 *  on a missing per-university PDF. */
export const GENERIC_SLUG = "generic";

export const PROGRAM_PDF_CONFIGS: Record<string, ProgramPdfConfig> = {
  [TEXAS_AM.slug]: TEXAS_AM,
  [GENERIC_PROVIDER.slug]: GENERIC_PROVIDER,
};

export const PROGRAM_PDF_CONFIGS_STUDENT: Record<string, ProgramPdfConfig> = {
  [TEXAS_AM_STUDENT.slug]: TEXAS_AM_STUDENT,
  [GENERIC_STUDENT.slug]: GENERIC_STUDENT,
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

/** Like getProgramPdfConfig, but falls back to the generic floor config for the
 *  audience when the campus has no specific config. Returns null only if even
 *  the generic config is missing (shouldn't happen). Use this anywhere a PDF
 *  must always resolve — the API route, attachment loaders, the launch guard. */
export function resolveProgramPdfConfig(
  slug: string | null | undefined,
  audience: PdfAudience = "provider",
): ProgramPdfConfig | null {
  return getProgramPdfConfig(slug, audience) ?? getProgramPdfConfig(GENERIC_SLUG, audience);
}
