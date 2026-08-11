/**
 * Which public content pages roll up into which admin Overview card.
 *
 * Both the count (api/admin/network-health) and the trend line
 * (api/admin/network-health/trend) read these rules, so a page can never be
 * counted by one and missed by the other.
 *
 * Classification is by path prefix against `page_events.page`. The benefits
 * tree lives entirely under /benefits/** after the Tier 7 redirects in
 * next.config.ts (/senior-benefits/:state/** 301s to /benefits/**); only the
 * /senior-benefits root survives as the Benefits Hub landing page, so it is
 * listed explicitly.
 */
export type ContentPageClass = "benefit" | "guide";

/** The public surfaces that make up Olera's organic growth engine. */
export type OrganicPageCategory = "provider" | "benefit" | "editorial";

const PROVIDER_APP_ROUTES = new Set([
  "boost",
  "campaign-outcome",
  "caregivers",
  "connections",
  "growth",
  "inbox",
  "lead-outcome",
  "matches",
  "medjobs",
  "onboarding",
  "outreach",
  "pro",
  "profile",
  "qna",
  "reviews",
]);

/**
 * PostgREST `or=` filter selecting every page in a class. Values contain no
 * commas, so they are safe to join into the comma-separated or() syntax.
 */
export const CONTENT_PAGE_FILTERS: Record<ContentPageClass, string> = {
  // Everything under /benefits counts — hub, state, program, and the finder /
  // spend-down calculator tools. Plus the surviving /senior-benefits hub.
  //
  // The wildcard requires the trailing slash on purpose: a bare `/benefits%`
  // also swallows the unrelated /benefits-outcome route.
  benefit: "page.eq./senior-benefits,page.eq./benefits,page.like./benefits/%",
  // Editorial: the Caregiver Support index and every article beneath it.
  guide: "page.eq./caregiver-support,page.like./caregiver-support/%",
};

/** Same rules in code form, for classifying rows already in hand. */
export function classifyContentPage(page: string): ContentPageClass | null {
  if (
    page === "/senior-benefits" ||
    page === "/benefits" ||
    page.startsWith("/benefits/")
  ) {
    return "benefit";
  }
  if (page === "/caregiver-support" || page.startsWith("/caregiver-support/")) {
    return "guide";
  }
  return null;
}

/**
 * Normalize GA4 paths and absolute Search Console URLs into one canonical key.
 * Query strings and fragments are intentionally discarded because this is a
 * content-performance view, not a campaign-attribution report.
 */
export function normalizeOrganicPagePath(value: string): string | null {
  if (!value || value === "(not set)" || value === "Unknown") return null;
  let path = value.trim();
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  } catch {
    return null;
  }
  path = path.split(/[?#]/, 1)[0] || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  try {
    path = decodeURI(path);
  } catch {
    // A malformed escape should not prevent the remaining weekly collection.
  }
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path;
}

/** Classify only canonical, public organic destinations. */
export function classifyOrganicPage(value: string): OrganicPageCategory | null {
  const page = normalizeOrganicPagePath(value);
  if (!page) return null;

  const provider = page.match(/^\/provider\/([^/]+)$/);
  if (provider && !PROVIDER_APP_ROUTES.has(provider[1].toLowerCase())) return "provider";

  if (
    page === "/benefits" ||
    page.startsWith("/benefits/") ||
    page === "/senior-benefits"
  ) {
    return "benefit";
  }

  if (page === "/caregiver-support" || page.startsWith("/caregiver-support/")) {
    return "editorial";
  }

  return null;
}
