/**
 * Generic (campus-agnostic) PROVIDER-facing program brochure config.
 *
 * The floor for the provider channel: any campus that doesn't yet have its own
 * provider config falls back to this so outreach is never blocked on a missing
 * per-university brochure (mirrors GENERIC_STUDENT on the student side). Per-
 * campus personalization (Texas A&M, etc.) still flows through configs that
 * know the slug; this is the "any home care agency, any school" version.
 *
 * Same one-page renderer as every other config (Template.tsx); it just leaves
 * the university-specific labels generic and uses Olera emerald as the accent.
 */

import type { ProgramPdfConfig } from "./texas-am";

export const GENERIC_PROVIDER: ProgramPdfConfig = {
  slug: "generic",
  audience: "provider",
  universityName: "Pre-Health Students",
  universityShort: "", // Title collapses to "Olera's Student Caregiver Program"
  localArea: "your area",
  universityAccent: "#047857", // Olera emerald (no university accent for the generic brochure)
  ctaUrl: "https://olera.care/medjobs/providers",
  heroHeadline:
    "Local pre-health student caregivers, matched to the recurring shifts you struggle to cover.",
  heroSubhead:
    "Olera runs a Student Caregiver Program that places pre-nursing and pre-medical students with home care agencies. Students commit to a semester of recurring availability, and we match them to your clients whose schedules line up. You get reliable recurring coverage; students get the supervised hours and recommendation letters that strengthen their applications to medical, PA, and nursing school.",
  benefits: [
    {
      title: "Cover recurring shifts",
      body: "Students commit to a semester of recurring availability: reliable coverage for nights, weekends, and standing schedules.",
    },
    {
      title: "Motivated by experience, not just pay",
      body: "Students prioritize clinical hours, mentorship, and recommendation letters that support their applications.",
    },
    {
      title: "Local talent, semester after semester",
      body: "Pre-nursing and pre-medical students from your area, available term after term.",
    },
    {
      title: "Caregivers your clients remember",
      body: "Intergenerational connection and high-quality engagement from future nurses and physicians who care about the work.",
    },
  ],
  steps: [
    "Create your account and accept the partner terms.",
    "Tell us about a client who needs recurring coverage.",
    "We match a committed student caregiver whose availability fits.",
    "Interview, hire, and the semester begins.",
  ],
  vetting: [
    "Screened pre-nursing and pre-medical students.",
    "Committed to a semester of recurring availability.",
    "Professionalism and scheduling expectations set up-front.",
    "Background-check support coordinated with your standard onboarding.",
  ],
  pricing: {
    headline: "No commitment up front. Matched only when you have a recurring need.",
    body: "Matching, vetting, and program management are handled by Olera. We pair you with a committed student caregiver for the semester, and you run your standard hiring and onboarding.",
  },
  ctaLabel: "Learn more",
};
