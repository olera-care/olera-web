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
