/**
 * Dead image sources.
 *
 * Two image hosts in `olera-providers.provider_images` / `provider_logo` no
 * longer serve anything:
 *
 *  - `cdn-api.olera.care` — the iOS-era image CDN. The host does not accept
 *    connections at all. ~10.9K active providers still reference it.
 *  - `lh3.googleusercontent.com/place-photos/...` — the Places API (New)
 *    `photoUri`, which is short-lived by design and now returns 403.
 *    ~5.9K active providers reference it (city-pipeline cohort, Mar–May 2026).
 *
 * Any of these URLs routed through `/_next/image` makes the optimizer answer
 * 502. Googlebot recorded ~21K such 5xx in 90 days, which Search Console counts
 * against host availability. This module is the render-time half of the fix:
 * never emit a dead URL, so pages fall through to the category stock image.
 *
 * The request-time half cannot live in code. On Vercel the image optimizer
 * answers `/_next/image` before Next middleware and before next.config
 * redirects run (both were tried on a preview and never fired). Google keeps
 * re-fetching image URLs it learned months ago, so stale requests are handled
 * by a Vercel Firewall rule: Request Path is `/_next/image` AND Query `url`
 * contains one of the dead hosts → Redirect to `DEAD_IMAGE_REDIRECT_PATH`.
 * Keep the two lists in sync by hand.
 */

export function isDeadImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false; // relative paths (/images/...) are ours and fine
  }
  const host = parsed.hostname.toLowerCase();
  if (host === "cdn-api.olera.care") return true;
  if (host === "lh3.googleusercontent.com" && parsed.pathname.startsWith("/place-photos/")) return true;
  return false;
}

/** Drop dead-host URLs from an image list, preserving order. */
export function filterDeadImageUrls(urls: string[]): string[] {
  return urls.filter((u) => !isDeadImageUrl(u));
}

/** Return the URL unless it is dead, in which case `null`. */
export function liveImageUrlOrNull(url: string | null | undefined): string | null {
  return url && !isDeadImageUrl(url) ? url : null;
}

/**
 * Static stock image the Vercel Firewall redirect rule points at when a dead
 * image URL is requested through the optimizer. A single general image on
 * purpose: the request does not carry provider category, and the point is a
 * 200 instead of a 502. Referenced here so the dashboard rule has a source of
 * truth in the repo.
 */
export const DEAD_IMAGE_REDIRECT_PATH = "/images/fallback/general-02.jpg";
