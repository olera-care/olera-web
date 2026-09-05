/**
 * The breadcrumb trail for a provider page, used by both the visible
 * <Breadcrumbs> component and the BreadcrumbList JSON-LD so the two never
 * disagree.
 *
 * Why this exists (September 2026 traffic review): every provider page used to
 * point its category and city crumbs at browse query URLs
 * (`/browse?type=home-care&q=Colorado Springs, CO`), and the JSON-LD version
 * used the raw profile enum (`/browse?type=home_care_agency`). Those query URLs
 * were 14% of the 32K "Alternate page with proper canonical" bucket in Search
 * Console. The canonical hierarchy already exists as power pages:
 * /home-care, /home-care/colorado, /home-care/colorado/colorado-springs. The
 * trail now mirrors that hierarchy, so 74K provider pages tell Google their
 * real parents and pass weight to pages that can rank.
 */

import type { ProfileCategory } from "@/lib/types";
import { PROFILE_CAT_TO_SUPABASE_CAT } from "@/lib/types/provider";
import {
  categoryDbValueToSlug,
  cityToSlug,
  citySlugToDisplay,
  stateAbbrevToName,
  stateAbbrevToSlug,
  US_STATES,
} from "@/lib/power-pages";

export interface Crumb {
  name: string;
  /** Site-relative path. */
  href: string;
}

/** Categories with no power page keep a browse landing so the crumb still resolves. */
const BROWSE_FALLBACK: Partial<Record<ProfileCategory, { slug: string; label: string }>> = {
  hospice_agency: { slug: "hospice", label: "Hospice" },
  inpatient_hospice: { slug: "hospice", label: "Hospice" },
};

const CATEGORY_LABELS: Partial<Record<ProfileCategory, string>> = {
  home_care_agency: "Home Care",
  home_health_agency: "Home Health",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
  nursing_home: "Nursing Home",
  independent_living: "Independent Living",
  hospice_agency: "Hospice",
  inpatient_hospice: "Hospice",
};

/**
 * True when the city power page can find this city. The page turns the URL
 * slug back into words ("st-louis" → "St Louis") and matches with a wildcard
 * between words, so punctuation between words is fine but punctuation inside a
 * word is not: "St. Louis" links, "O'Fallon" ("ofallon") does not.
 */
export function cityHasPowerPage(city: string): boolean {
  const words = (v: string) => v.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).join(" ");
  return words(citySlugToDisplay(cityToSlug(city))) === words(city);
}

export function buildProviderBreadcrumbs(opts: {
  category: ProfileCategory | null;
  city: string | null;
  state: string | null;
  providerName: string;
  providerSlug: string;
}): Crumb[] {
  const crumbs: Crumb[] = [{ name: "Home", href: "/" }];

  const dbValue = opts.category ? PROFILE_CAT_TO_SUPABASE_CAT[opts.category] : null;
  const categorySlug = dbValue ? categoryDbValueToSlug(dbValue) : null;
  const categoryLabel = opts.category ? CATEGORY_LABELS[opts.category] : null;

  if (categorySlug && categoryLabel) {
    crumbs.push({ name: categoryLabel, href: `/${categorySlug}` });

    const stateAbbrev = opts.state?.toUpperCase() ?? null;
    if (stateAbbrev && US_STATES[stateAbbrev]) {
      const stateSlug = stateAbbrevToSlug(stateAbbrev);
      crumbs.push({ name: stateAbbrevToName(stateAbbrev), href: `/${categorySlug}/${stateSlug}` });

      if (opts.city && cityHasPowerPage(opts.city)) {
        crumbs.push({ name: opts.city, href: `/${categorySlug}/${stateSlug}/${cityToSlug(opts.city)}` });
      }
    }
  } else if (opts.category && BROWSE_FALLBACK[opts.category]) {
    const fb = BROWSE_FALLBACK[opts.category]!;
    crumbs.push({ name: fb.label, href: `/browse?type=${fb.slug}` });
  }

  crumbs.push({ name: opts.providerName, href: `/provider/${opts.providerSlug}` });
  return crumbs;
}
