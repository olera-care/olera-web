/**
 * Facebook links on provider pages.
 *
 * `olera-providers.facebook_url` comes from the website sweep (migration 273):
 * 27,870 rows hold a value, and on 9 October 2026 about 3,230 of them were not
 * a provider's page. The sweep matched the old `xmlns:fb` namespace
 * (`facebook.com/2008/fbml`), dropped the `?id=` from `profile.php` links, and
 * picked up site-builder footers (`wix`, `wordpresscom`) and share or plugin
 * links. Salvaged from PR #2449 so any page that shows the link (the new home
 * care page, Phase 6) only ever shows a real page.
 */
const NOT_A_PAGE = new Set([
  "2008", "profile.php", "wix", "wordpresscom", "wordpress", "squarespace", "weebly", "godaddy",
  "share", "sharer", "sharer.php", "plugins", "dialog", "tr", "login", "policies", "help",
  "groups", "events", "hashtag", "watch", "photo", "photo.php", "photos", "video", "videos",
]);

/**
 * Accept only a plain https Facebook page URL. The sweep normalizes to
 * https://www.facebook.com/<path>, so anything else is a bad row, not a link.
 */
export function safeFacebookUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/^https:\/\/(?:www\.)?facebook\.com\/([A-Za-z0-9._\-/]+)$/);
  if (!m) return null;
  const path = m[1].toLowerCase();
  if (path.includes("fbml") || NOT_A_PAGE.has(path.split("/")[0])) return null;
  return url;
}
