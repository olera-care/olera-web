import { allStates } from "@/data/waiver-library";

/** Map of state abbreviation (e.g., "TX") → waiver library slug (e.g., "texas") */
const codeToSlug: Record<string, string> = {};
for (const state of allStates) {
  codeToSlug[state.abbreviation] = state.id;
}

/** Convert a state abbreviation to a waiver library slug. */
export function stateCodeToSlug(code: string): string | null {
  return codeToSlug[code.toUpperCase()] ?? null;
}

/** Build the waiver library URL for a specific program. */
export function buildWaiverLibraryUrl(
  stateCode: string,
  programId: string
): string | null {
  const slug = stateCodeToSlug(stateCode);
  if (!slug) return null;
  return `/waiver-library/${slug}/${programId}`;
}
