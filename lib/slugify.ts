/**
 * Convert a title string into a URL-friendly slug.
 *
 * "The Complete Guide to Home Health Care" → "the-complete-guide-to-home-health-care"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // Remove non-word chars (except spaces/hyphens)
    .replace(/\s+/g, "-")        // Spaces → hyphens
    .replace(/-+/g, "-")         // Collapse consecutive hyphens
    .replace(/^-|-$/g, "");      // Trim leading/trailing hyphens
}

/**
 * Generate a URL-friendly slug for a provider.
 * Pattern: {slugified-name}-{state-abbrev-lowercase}
 *
 * Examples:
 *   ("Accel at College Station", "TX") → "accel-at-college-station-tx"
 *   ("Home Instead", "CA")            → "home-instead-ca"
 *   ("AccentCare | Home Health...", "TX") → "accentcare-home-health-tx"
 */
export function generateProviderSlug(
  name: string,
  state: string | null
): string {
  const slugifiedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!state) return slugifiedName;
  return `${slugifiedName}-${state.toLowerCase().trim()}`;
}
