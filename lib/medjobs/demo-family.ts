/**
 * Sample "families hiring" — the cold-start device for the student board.
 *
 * Mirror of demo-candidate.ts, in the student's direction: shown ONLY on the
 * families board when a student's campus has zero real provider-partners hiring
 * yet. They render through the SAME `FamilyCard` as real listings, with a "Demo"
 * treatment. Honesty rules:
 *   - clearly labeled "Demo" everywhere
 *   - NO specific city/agency named (the board header frames them as "the kind
 *     of families hiring near {campus}"), so the same set is honest everywhere
 *   - never requestable; the card suppresses the "Request interview" action
 *
 * Curated client-side only so they can never leak into the real fetch, requests,
 * or interviews. The "family" is the care need; the agency is the honest
 * employer-of-record, named generically ("a local home care agency").
 */

import type { FamilyData } from "@/components/medjobs/FamilyCard";

/** Slug prefix marking a sample family listing (vs a real DB provider). */
export const SAMPLE_FAMILY_SLUG_PREFIX = "sample-family-";

/** True if a slug belongs to a sample family listing. */
export function isSampleFamilySlug(slug: string): boolean {
  return slug.startsWith(SAMPLE_FAMILY_SLUG_PREFIX);
}

/**
 * Four representative care opportunities spanning the common care types, so a
 * student always sees the shape of local demand even before real partners join.
 * No city/state on purpose (campus-honesty) — the board header supplies the
 * "near {campus}" framing; display_name is a generic agency phrase.
 */
export const SAMPLE_FAMILIES: FamilyData[] = [
  {
    id: "sample-family-inhome",
    slug: "sample-family-inhome",
    display_name: "a local home care agency",
    city: null,
    state: null,
    category: "home_care",
    image_url: null,
    description:
      "A family looking for steady daytime and weekend help with mobility, meals, and companionship for an older parent at home.",
    care_types: ["Companion Care", "Personal Care", "Mobility"],
  },
  {
    id: "sample-family-memory",
    slug: "sample-family-memory",
    display_name: "a local memory care provider",
    city: null,
    state: null,
    category: "memory_care",
    image_url: null,
    description:
      "A family caring for a loved one with early dementia, looking for a patient, consistent caregiver for evenings.",
    care_types: ["Memory Care", "Companion Care"],
  },
  {
    id: "sample-family-assisted",
    slug: "sample-family-assisted",
    display_name: "a local assisted living community",
    city: null,
    state: null,
    category: "assisted_living",
    image_url: null,
    description:
      "A community hiring student caregivers for recurring shifts supporting residents with daily activities.",
    care_types: ["Personal Care", "Companion Care"],
  },
  {
    id: "sample-family-homehealth",
    slug: "sample-family-homehealth",
    display_name: "a local home health agency",
    city: null,
    state: null,
    category: "home_health",
    image_url: null,
    description:
      "A family needing reliable post-hospital support at home, including medication reminders and light personal care.",
    care_types: ["Personal Care", "Post-Surgical"],
  },
];
