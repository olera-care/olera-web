/**
 * Registry of available per-university Program PDF configs.
 * Keyed by campus slug (matches student_outreach_campuses.slug).
 *
 * To add a new university: create configs/<slug>.ts and register
 * it here. The renderer (Template.tsx) + API route are config-
 * agnostic — only this registry needs an edit.
 */

import { TEXAS_AM } from "./texas-am";
import type { ProgramPdfConfig } from "./texas-am";

export type { ProgramPdfConfig };

export const PROGRAM_PDF_CONFIGS: Record<string, ProgramPdfConfig> = {
  [TEXAS_AM.slug]: TEXAS_AM,
};

/** Returns the config for a campus slug, or null if not configured. */
export function getProgramPdfConfig(slug: string | null | undefined): ProgramPdfConfig | null {
  if (!slug) return null;
  return PROGRAM_PDF_CONFIGS[slug] ?? null;
}
