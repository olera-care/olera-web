/**
 * Registry of available per-university Program PDF configs.
 * Keyed by campus slug (matches student_outreach_campuses.slug).
 *
 * To add a new university: create configs/<slug>.ts and register
 * it here. The renderer (Template.tsx) + API route are config-
 * agnostic — only this registry needs an edit.
 */

import { TEXAS_A_AND_M } from "./texas-a-and-m";
import type { ProgramPdfConfig } from "./texas-a-and-m";

export type { ProgramPdfConfig };

export const PROGRAM_PDF_CONFIGS: Record<string, ProgramPdfConfig> = {
  [TEXAS_A_AND_M.slug]: TEXAS_A_AND_M,
};

/** Returns the config for a campus slug, or null if not configured. */
export function getProgramPdfConfig(slug: string | null | undefined): ProgramPdfConfig | null {
  if (!slug) return null;
  return PROGRAM_PDF_CONFIGS[slug] ?? null;
}
