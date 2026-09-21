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
    "Pre-health students, ready for your hardest shifts.",
  heroSubhead:
    "We recruit and qualify college students on a pre-health track and match them to your agency. You interview and hire them as caregivers, on your own terms. They want supervised hours, mentorship and a recommendation for health school, so they commit to a semester of recurring availability and take the work seriously. Clients notice the difference.",
  benefits: [
    {
      title: "We run the university funnel",
      body: "Recruitment and qualification happen on campus, before anybody reaches you. You get candidates, not a hiring project.",
    },
    {
      title: "Coverage you can schedule around",
      body: "Students commit to a semester of recurring availability: nights, weekends, and standing schedules.",
    },
    {
      title: "Motivated by more than pay",
      body: "They need supervised hours, mentorship and a recommendation for health school, so they show up and take it seriously.",
    },
    {
      title: "A new cohort every semester",
      body: "Local students, available term after term, from the same university.",
    },
  ],
  steps: [
    "Tell us your ideal caregiver and how many you want each semester.",
    "We recruit and qualify students, then send you matches to interview.",
    "Interview, hire, and they start.",
  ],
  vetting: [
    "Screened pre-nursing and pre-medical students.",
    "Committed to at least a semester of recurring availability.",
    "Professionalism and scheduling expectations set before they reach you.",
    "We only send students we are confident in.",
  ],
  pricing: {
    headline: "Your first hire is free. $250 per confirmed hire after that.",
    body: "No subscription, and nothing to sign to start. The fee pays the staff who run the university recruitment funnels and keep students coming to you. You remain the employer and run your own hiring and onboarding.",
  },
  story: {
    heading: "Why this program exists",
    body: "Dr. DuBose was a pre-med student who found hands-on clinical experience hard to come by. Later, doing research funded by the National Institute on Aging, he found that 63% of home care agencies face staffing shortages. Students need hours. Agencies need caregivers. Families need someone reliable at home. The program was built to serve all three.",
  },
  afterReply: [
    "We set up what you want in a caregiver: hours, shift types, anything you will not move on.",
    "When a student near you is ready, we send you their one-page profile and a short video.",
    "You interview, you decide, and you hire on your own terms. We confirm it with both of you.",
  ],
  team: [
    {
      name: "Logan DuBose, MD, MBA",
      role: "Director, Olera Student Caregiver Program",
      bio: "Texas A&M College of Medicine, 2022. Primary care physician and NIH-funded researcher.",
      photo: "logan",
    },
    {
      name: "Chantel Wright",
      role: "Lead Program Coordinator",
      email: "chantel@olera.care",
      bio: "Two years with the team. Coordinates providers and students end to end: onboarding, qualifying, matching, and following up after a hire.",
      photo: "chantel",
    },
    {
      name: "Graize Belandres",
      role: "Assistant to Dr. Logan DuBose",
      email: "graize@olera.care",
      bio: "Four years with the team and ten in healthcare documentation and administrative support. Handles provider and student relations.",
      photo: "grazie",
    },
    {
      name: "Sara Conkling",
      role: "Assistant to Dr. Logan DuBose",
      email: "sara@olera.care",
      bio: "Pre-medical student at Clemson University. Helps coordinate providers and students, alongside research and healthcare work on campus.",
      photo: "sara",
    },
  ],
  ctaLabel: "Learn more",
};

