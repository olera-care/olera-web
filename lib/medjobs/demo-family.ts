/**
 * Sample "families hiring" — the cold-start device for the student board.
 *
 * Mirror of demo-candidate.ts, in the student's direction: shown ONLY on the
 * families board when a student's campus has zero real provider-partners hiring
 * yet. They render through the SAME `BrowseCard` (student variant, isDemo) as
 * real listings, with a dashed "Demo" treatment. Honesty rules:
 *   - clearly labeled "Demo" everywhere
 *   - NO specific city/agency named (the board header frames them as "the kind
 *     of families hiring near {campus}"), so the same set is honest everywhere
 *   - never requestable; non-clickable (no real agency page behind them)
 *
 * Shaped as ProviderCardData so they flow through BrowseCard exactly like real
 * agency listings — the student variant leads with the care opportunity and
 * names the agency generically ("a local home care agency").
 */

import type { ProviderCardData } from "@/lib/types/provider";

/** Slug prefix marking a sample family listing (vs a real DB provider). */
export const SAMPLE_FAMILY_SLUG_PREFIX = "sample-family-";

/** True if a slug belongs to a sample family listing. */
export function isSampleFamilySlug(slug: string): boolean {
  return slug.startsWith(SAMPLE_FAMILY_SLUG_PREFIX);
}

/** Resolve a sample family by slug, for the read-only sample detail page. */
export function getSampleFamilyBySlug(slug: string): ProviderCardData | null {
  return SAMPLE_FAMILIES.find((f) => f.slug === slug) ?? null;
}

function sample(
  id: string,
  name: string,
  providerCategory: string,
  primaryCategory: string,
  highlights: string[],
): ProviderCardData {
  return {
    id,
    slug: id,
    name,
    image: "",
    imageType: "placeholder", // renders gradient + initials, never a fake photo
    images: [],
    address: "", // no city claimed — board header frames "near {campus}"
    rating: 0,
    priceRange: "",
    primaryCategory,
    providerCategory,
    careTypes: [],
    highlights,
    acceptedPayments: [],
    verified: false,
  };
}

/**
 * Four representative care opportunities spanning the common care types, so a
 * student always sees the shape of local demand even before real partners join.
 */
export const SAMPLE_FAMILIES: ProviderCardData[] = [
  sample("sample-family-inhome", "a local home care agency", "home_care", "Home Care", [
    "Evenings & weekends",
    "Companionship & mobility",
  ]),
  sample("sample-family-memory", "a local memory care provider", "memory_care", "Memory Care", [
    "Patient, consistent shifts",
    "Dementia care",
  ]),
  sample("sample-family-assisted", "a local assisted living community", "assisted_living", "Assisted Living", [
    "Recurring shifts",
    "Daily-living support",
  ]),
  sample("sample-family-homehealth", "a local home health agency", "home_health", "Home Health", [
    "Post-hospital support",
    "Medication reminders",
  ]),
];
