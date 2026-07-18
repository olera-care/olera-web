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
    "Vetted pre-health student caregivers for the recurring shifts you can't fill.",
  heroSubhead:
    "Olera recruits and vets local pre-nursing and pre-medical students and matches them to your agency as caregivers. They want supervised hours, mentorship, and recommendation letters for health school, so they commit to a semester of recurring availability and take the work seriously. You get reliable coverage for the shifts that are hardest to staff. Browse and interview for free — you pay only when you hire.",
  benefits: [
    {
      title: "Cover your hardest shifts",
      body: "Students commit to a semester of recurring availability: reliable coverage for nights, weekends, and standing schedules.",
    },
    {
      title: "Motivated by more than pay",
      body: "They're after clinical hours, mentorship, and recommendation letters, so they show up and take the work seriously.",
    },
    {
      title: "Local, and back every term",
      body: "Pre-nursing and pre-medical students from your area, available semester after semester.",
    },
    {
      title: "Caregivers your clients remember",
      body: "Engaged, capable future nurses and physicians who care about the people they look after.",
    },
  ],
  steps: [
    "Create your free account and review candidates.",
    "Tell us the recurring shifts you need to cover.",
    "We match a vetted student whose availability fits.",
    "Interview, hire, and the semester begins.",
  ],
  vetting: [
    "Screened pre-nursing and pre-medical students.",
    "Committed to a semester of recurring availability.",
    "Professionalism and scheduling expectations set up front.",
    "Background-check support coordinated with your onboarding.",
  ],
  pricing: {
    headline: "Free to browse and interview. $200 once per hire — refunded if they work under 15 hours.",
    body: "No subscription, no commitment. You pay a one-time $200 only when you hire a student, fully refunded if they work fewer than 15 hours. Olera handles recruiting, vetting, and matching; you run your standard hiring and onboarding as the employer.",
  },
  ctaLabel: "Learn more",
};
