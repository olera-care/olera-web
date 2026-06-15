/**
 * Sample candidate profiles — the cold-start "show the caliber" device.
 *
 * Shown ONLY on the candidate board when an ELIGIBLE provider's campus has
 * zero real students yet (the fallback state), and to logged-out visitors
 * before any real students exist. They render through the SAME `CandidateCard`
 * and the SAME detail page as real students — the only difference is the
 * "Sample profile" treatment (a ribbon + read-only detail with a "grab a time"
 * CTA instead of an invite). Honesty rules:
 *   - clearly labeled "Sample profile" everywhere
 *   - NO specific campus/location claimed (the board header frames them as
 *     "the caliber of {campus} caregivers joining"), so the same set is honest
 *     for every campus
 *   - initials avatars, never a fake stock face
 *   - never invitable; the detail CTA routes to a meeting / eligibility check
 *
 * These are curated `CandidateData` objects (client-side only) so they can
 * never leak into the real API, matching, invites, or the student side.
 *
 * Replaces the old single LOGAN_DEMO_CANDIDATE (founder-as-fake-student),
 * which was conceptually wrong and is now removed.
 */

import type { CandidateData } from "@/components/medjobs/CandidateRow";

/** Slug prefix that marks a candidate as a sample profile. */
export const SAMPLE_SLUG_PREFIX = "sample-";

/** True if a slug belongs to a sample profile (vs a real DB student). */
export function isSampleSlug(slug: string): boolean {
  return slug.startsWith(SAMPLE_SLUG_PREFIX);
}

const CREATED_AT = "2026-01-15T00:00:00.000Z";

/**
 * Four strong, representative samples. Coverage buckets across the set span
 * days / evenings / overnights / weekends, so any provider's screener answers
 * light up a match line on at least one card. No `university`/`city`/`state`
 * is set on purpose (campus-honesty) — the card suppresses those lines for
 * samples and the board header supplies the "near {campus}" framing.
 */
export const SAMPLE_CANDIDATES: CandidateData[] = [
  {
    id: "sample-daniel-k",
    slug: "sample-daniel-k",
    display_name: "Daniel K.",
    city: null,
    state: null,
    description:
      "Pre-med sophomore who started caregiving to get real patient time before medical school. Calm, dependable, and great with mobility support.",
    care_types: ["Companion Care", "Personal Care"],
    image_url: null,
    created_at: CREATED_AT,
    metadata: {
      major: "Biology",
      graduation_year: 2028,
      intended_professional_school: "medicine",
      certifications: ["CPR", "First Aid", "CNA"],
      years_caregiving: 1,
      care_experience_types: ["mobility", "companionship"],
      languages: ["English", "Spanish"],
      availability_types: ["overnights", "weekends"],
      hours_per_week_range: "10-15",
      duration_commitment: "multiple_semesters",
      acknowledgments_completed: true,
      ncns_pledge: true,
      school_balance_pledge: true,
      advance_notice_pledge: true,
      prn_willing: true,
      why_caregiving:
        "I want to understand patients as people before I ever see them in a hospital. Caregiving is the most honest way to learn that.",
      commitment_statement:
        "I block my caregiving hours into my semester schedule and keep them open through finals.",
      seeking_status: "actively_looking",
      profile_completeness: 100,
    },
  },
  {
    id: "sample-sofia-m",
    slug: "sample-sofia-m",
    display_name: "Sofia M.",
    city: null,
    state: null,
    description:
      "Pre-nursing junior with two years of dementia-care experience. Warm, patient, and steady with memory-care clients.",
    care_types: ["Companion Care", "Memory Care"],
    image_url: null,
    created_at: CREATED_AT,
    metadata: {
      major: "Nursing (pre)",
      graduation_year: 2027,
      intended_professional_school: "nursing",
      certifications: ["CPR", "CNA"],
      years_caregiving: 2,
      care_experience_types: ["dementia", "companionship"],
      languages: ["English"],
      availability_types: ["in_between_classes", "evenings"],
      hours_per_week_range: "15-20",
      duration_commitment: "1_plus_year",
      acknowledgments_completed: true,
      ncns_pledge: true,
      school_balance_pledge: true,
      advance_notice_pledge: true,
      prn_willing: false,
      why_caregiving:
        "My grandmother had Alzheimer's and our caregiver changed everything for our family. I want to be that person for someone else.",
      commitment_statement:
        "I commit to a consistent weekly schedule for the full semester and give two weeks' notice before any change.",
      seeking_status: "actively_looking",
      profile_completeness: 100,
    },
  },
  {
    id: "sample-marcus-t",
    slug: "sample-marcus-t",
    display_name: "Marcus T.",
    city: null,
    state: null,
    description:
      "Pre-nursing junior, open to PRN. Reliable for evening and overnight coverage and comfortable with memory care.",
    care_types: ["Personal Care", "Memory Care"],
    image_url: null,
    created_at: CREATED_AT,
    metadata: {
      major: "Kinesiology",
      graduation_year: 2027,
      intended_professional_school: "nursing",
      certifications: ["CPR", "BLS"],
      years_caregiving: 1,
      care_experience_types: ["mobility", "dementia"],
      languages: ["English"],
      availability_types: ["evenings", "overnights"],
      hours_per_week_range: "10-15",
      duration_commitment: "multiple_semesters",
      acknowledgments_completed: true,
      ncns_pledge: true,
      school_balance_pledge: true,
      advance_notice_pledge: true,
      prn_willing: true,
      why_caregiving:
        "Overnight shifts fit around my classes and give me hands-on hours toward nursing school. I take the responsibility seriously.",
      commitment_statement:
        "I keep my pledged availability open all term and am happy to be called in PRN when a shift comes up.",
      seeking_status: "actively_looking",
      profile_completeness: 100,
    },
  },
  {
    id: "sample-aaliyah-r",
    slug: "sample-aaliyah-r",
    display_name: "Aaliyah R.",
    city: null,
    state: null,
    description:
      "Pre-PA senior with post-surgical care experience and a medication aide certification. Organized and detail-oriented.",
    care_types: ["Personal Care", "Companion Care"],
    image_url: null,
    created_at: CREATED_AT,
    metadata: {
      major: "Health Sciences",
      graduation_year: 2026,
      intended_professional_school: "pa",
      certifications: ["CPR", "CNA", "Medication Aide"],
      years_caregiving: 2,
      care_experience_types: ["post_surgical", "companionship"],
      languages: ["English"],
      availability_types: ["in_between_classes", "weekends"],
      hours_per_week_range: "15-20",
      duration_commitment: "1_plus_year",
      acknowledgments_completed: true,
      ncns_pledge: true,
      school_balance_pledge: true,
      advance_notice_pledge: true,
      prn_willing: false,
      why_caregiving:
        "As a future PA, I want to learn how recovery really happens at home, not just in the clinic. Caregiving teaches me that every shift.",
      commitment_statement:
        "I schedule my shifts around my classes and protect them — clients can count on me showing up.",
      seeking_status: "actively_looking",
      profile_completeness: 100,
    },
  },
];

/** Look up a sample by slug (used by the detail page to render read-only). */
export function getSampleBySlug(slug: string): CandidateData | null {
  return SAMPLE_CANDIDATES.find((c) => c.slug === slug) ?? null;
}
