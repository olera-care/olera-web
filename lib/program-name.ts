/**
 * Pure helper — zero runtime dependencies — so both server routes and
 * client components can use it without pulling waiver-library or
 * pipeline-drafts into the client bundle.
 *
 * Builds a user-facing display name for a program, appending the state
 * when the program name doesn't already include it.
 *
 *   "SNAP Food Benefits" + California  →  "SNAP Food Benefits in California"
 *   "Texas Medicaid" + Texas           →  "Texas Medicaid"           (skip — state name in name)
 *   "MI Choice" + Michigan             →  "MI Choice"                (skip — state abbrev as standalone word)
 *   "CalFresh" + California            →  "CalFresh in California"   (no skip — "cal" not a standalone word)
 *
 * Used for H1, <title>, OG tags, breadcrumb last-crumb, and internal
 * link anchors on program cards. Keeps the raw program.name for
 * IDs/matching.
 */
export function getDisplayName(
  program: { name: string },
  state: { name: string; abbreviation: string }
): string {
  const name = program.name;
  // Escape regex metacharacters defensively (no common state name triggers this,
  // but cheap insurance against future additions).
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stateName = esc(state.name);
  const stateAbbrev = esc(state.abbreviation);
  // Word-boundary match, case-insensitive. Matches "Texas Medicaid" (state name)
  // or "MI Choice" (abbreviation as standalone word) but not "CalFresh" where
  // "cal" is inside another word.
  const alreadyIncludes = new RegExp(`\\b(${stateName}|${stateAbbrev})\\b`, "i").test(name);
  return alreadyIncludes ? name : `${name} in ${state.name}`;
}
