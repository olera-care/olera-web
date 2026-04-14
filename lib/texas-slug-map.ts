/**
 * Mapping between old waiver-library program IDs and new SEO-friendly slugs
 * for the /texas/benefits/ URL structure.
 */

export const TX_OLD_TO_NEW: Record<string, string> = {
  "star-plus-home-and-community-based-services": "star-plus",
  "texas-medicare-savings-programs": "medicare-savings",
  "texas-snap-food-benefits": "snap-food-benefits",
  "texas-medicaid-for-the-elderly-and-people-with-disabilities": "medicaid",
  "texas-ship-medicare-counseling": "ship-medicare-counseling",
  "texas-comprehensive-energy-assistance-program-ceap-liheap": "energy-assistance",
  "primary-home-care-community-care": "primary-home-care",
  "texas-respite-care-services": "respite-care",
  "texas-meals-on-wheels": "meals-on-wheels",
  "texas-pace-programs": "pace",
  "texas-long-term-care-ombudsman": "ombudsman",
  "texas-weatherization-assistance-program": "weatherization",
  "texas-legal-services-for-seniors": "legal-services",
  "texas-senior-companion-program": "senior-companion",
  "senior-community-service-employment-program-scsep": "scsep",
};

export const TX_NEW_TO_OLD: Record<string, string> = Object.fromEntries(
  Object.entries(TX_OLD_TO_NEW).map(([old, slug]) => [slug, old])
);

export function getTexasNewSlug(oldId: string): string | undefined {
  return TX_OLD_TO_NEW[oldId];
}

export function getTexasOldId(newSlug: string): string | undefined {
  return TX_NEW_TO_OLD[newSlug];
}

/** Build the URL for a state listing page. */
export function buildStateUrl(stateId: string): string {
  return stateId === "texas" ? "/texas/benefits" : `/senior-benefits/${stateId}`;
}

/** Build the URL for a program detail page. */
export function buildProgramUrl(stateId: string, programId: string): string {
  if (stateId === "texas") {
    const newSlug = TX_OLD_TO_NEW[programId];
    if (newSlug) return `/texas/benefits/${newSlug}`;
  }
  return `/senior-benefits/${stateId}/${programId}`;
}
