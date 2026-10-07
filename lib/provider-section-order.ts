import type { ProfileCategory } from "@/lib/types";

/**
 * Category-aware section order for the provider detail page.
 *
 * One template for every category was wrong (TJ, 6 Oct 2026): a family
 * comparing nursing homes and a family comparing home care agencies ask
 * different things first. The order per category comes from what families
 * actually ask on `provider_questions` and which fields are actually populated;
 * the counts and the plan for the remaining categories are in
 * docs/providers/CATEGORY-PAGES.md.
 *
 * Every section still hides itself when its data is empty, so an order only
 * decides what comes first among the sections a provider has.
 */
export type ProviderSectionKey =
  | "reviewsTop" // Google reviews, when there are any
  | "qa"
  | "benefits"
  | "services"
  | "screening"
  | "reviewsEmpty" // "Be the first to review" prompt, when there are no Google reviews
  | "quality" // CMS star rating, 4/5 and 5/5 only
  | "trust" // AI verified credentials
  | "about"
  | "pricing"
  | "payment"
  | "team";

/** The original order, unchanged for every category without its own plan yet. */
export const DEFAULT_SECTION_ORDER: ProviderSectionKey[] = [
  "reviewsTop",
  "qa",
  "benefits",
  "services",
  "screening",
  "reviewsEmpty",
  "quality",
  "trust",
  "about",
  "pricing",
  "payment",
  "team",
];

const CATEGORY_SECTION_ORDER: Partial<Record<ProfileCategory, ProviderSectionKey[]>> = {
  // Families ask who the caregiver is (screening, meeting them first, backup)
  // and how scheduling works (minimum hours) before they ask about money.
  // Q&A stays second: it is the page's engagement engine and carries the
  // intake test (TJ, 7 Oct 2026).
  home_care_agency: [
    "services",
    "qa",
    "screening",
    "trust",
    "pricing",
    "reviewsTop",
    "benefits",
    "payment",
    "about",
    "team",
    "reviewsEmpty",
    "quality",
  ],
  // Families ask whether Medicare or Medicaid covers the stay, then about
  // staffing and visiting. Lead with the CMS rating, then payment.
  nursing_home: [
    "quality",
    "reviewsTop",
    "payment",
    "qa",
    "trust",
    "services",
    "screening",
    "benefits",
    "about",
    "pricing",
    "team",
    "reviewsEmpty",
  ],
};

export function getSectionOrder(category: ProfileCategory | null | undefined): ProviderSectionKey[] {
  return (category && CATEGORY_SECTION_ORDER[category]) || DEFAULT_SECTION_ORDER;
}

/**
 * First path segments the website sweep picks up that are not a provider's
 * page: an XML namespace (`2008/fbml`, 1,514 rows on 7 Oct 2026), a
 * `profile.php` whose `?id=` the sweep stripped (1,336), site-builder footers
 * (`wix`, `wordpresscom`) and share or plugin links.
 */
const NOT_A_PAGE = new Set([
  "2008", "profile.php", "wix", "wordpresscom", "wordpress", "squarespace", "weebly", "godaddy",
  "share", "sharer", "sharer.php", "plugins", "dialog", "tr", "login", "policies", "help",
  "groups", "events", "hashtag", "watch", "photo", "photo.php", "photos", "video", "videos",
]);

/**
 * Accept only a plain https Facebook page URL. The website sweep normalizes to
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
