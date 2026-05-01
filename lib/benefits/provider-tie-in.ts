/**
 * Provider tie-in: connect the benefits matches back to the provider page
 * the user came from. The "moment of genuine surprise" — *"oh, you understood
 * why I was here"* — that no other benefits-finder we know of does.
 *
 * Called from ResultsSheet (overlay + standalone). Returns null if there's
 * no honest tie-in to surface.
 */
import type { WaiverProgram } from "@/data/waiver-library";

export interface MatchableProvider {
  /** Display name shown in the tie-in copy */
  display_name: string | null;
  /** care_types array on business_profiles — values like "home_care", "memory_care", etc. */
  care_types?: string[] | null;
  /** category string — values like "home_care", "assisted_living", etc. */
  category?: string | null;
}

// Heuristic: provider care types/category → keywords that suggest overlap
// with a matched program's name/tagline. We DON'T pretend a one-to-one
// program-to-provider match — we just say "may help cover services at X"
// when there's plausible overlap. Honest framing under uncertainty.
const PROVIDER_KEYWORD_MAP: Record<string, RegExp> = {
  home_care: /\b(home|hcbs|in.home|attendant|personal care|community.based)\b/i,
  in_home_care: /\b(home|hcbs|in.home|attendant|personal care|community.based)\b/i,
  assisted_living: /\b(facility|assisted|residential|long.term|nursing|smmc|star.plus)\b/i,
  memory_care: /\b(memory|alzheimer|dementia|pace|nursing)\b/i,
  nursing_home: /\b(nursing|skilled|smmc|long.term|institutional)\b/i,
  adult_day_care: /\b(adult day|cbas|day services)\b/i,
  hospice: /\b(hospice|end.of.life|palliative)\b/i,
  independent_living: /\b(home|assistance|community)\b/i,
};

/**
 * Returns a contextual tie-in phrase if there's plausible program/provider
 * overlap, or null otherwise.
 *
 * Examples:
 *   - "Some of these may help cover services at Aggie Assisted Living."
 *   - "One of these may help cover services at Aggie Assisted Living."
 *
 * The phrase is *capability* language ("may help cover"), not a promise.
 */
export function getProviderTieIn(
  matched: WaiverProgram[],
  provider: MatchableProvider | null,
): string | null {
  if (!provider || !provider.display_name) return null;

  // Build the keyword pattern set from provider's care_types + category.
  const careKeys: string[] = [];
  if (Array.isArray(provider.care_types)) {
    for (const t of provider.care_types) careKeys.push(t.toLowerCase());
  }
  if (provider.category) careKeys.push(provider.category.toLowerCase());

  const patterns = careKeys
    .map((k) => PROVIDER_KEYWORD_MAP[k])
    .filter((p): p is RegExp => !!p);

  if (patterns.length === 0) return null;

  // Count overlapping programs.
  const overlapping = matched.filter((p) => {
    const text = `${p.name} ${p.shortName ?? ""} ${p.tagline ?? ""}`.toLowerCase();
    return patterns.some((re) => re.test(text));
  });

  if (overlapping.length === 0) return null;

  const word =
    overlapping.length === 1 ? "One" :
    overlapping.length === 2 ? "Two" :
    overlapping.length === 3 ? "A few" :
    "Several";

  return `${word} of these may help cover services at ${provider.display_name}.`;
}
