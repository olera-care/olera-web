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
import { GENERIC_ADVISOR } from "./generic-advisor";
import type { ProgramPdfConfig } from "./texas-am";

export type { ProgramPdfConfig };

/** Audience for a program PDF. Provider = agency brochure; student = the flyer
 *  partners share with pre-health students. */
/**
 * Who a Program PDF is written for.
 *
 * "recruit" is the one-page student recruitment flyer on its own — the same
 * page the advisor document carries as its last sheet. A student org is
 * forwarding something to its members, not reading a brochure about the
 * programme, so one page they can post is the whole job.
 */
export type PdfAudience = "provider" | "student" | "advisor" | "recruit";

/** The campus-agnostic floor config per audience. Every campus resolves to one
 *  of these when it has no campus-specific config, so outreach is never blocked
 *  on a missing per-university PDF. */
export const GENERIC_SLUG = "generic";

export const PROGRAM_PDF_CONFIGS: Record<string, ProgramPdfConfig> = {
  [TEXAS_AM.slug]: TEXAS_AM,
  [GENERIC_PROVIDER.slug]: GENERIC_PROVIDER,
};

/** The advising-office flyer. An office is not buying anything and is not the
 *  employer, so this is the student's opportunity described to the person who
 *  can put it in front of them. */
export const PROGRAM_PDF_CONFIGS_ADVISOR: Record<string, ProgramPdfConfig> = {
  [GENERIC_ADVISOR.slug]: GENERIC_ADVISOR,
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
  const map =
    // "recruit" renders a fixed page and reads nothing from the config, but it
    // still needs one to load the shared assets — the student map is the
    // closest thing it belongs to.
    audience === "student" || audience === "recruit"
      ? PROGRAM_PDF_CONFIGS_STUDENT
      : audience === "advisor"
        ? PROGRAM_PDF_CONFIGS_ADVISOR
        : PROGRAM_PDF_CONFIGS;
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
