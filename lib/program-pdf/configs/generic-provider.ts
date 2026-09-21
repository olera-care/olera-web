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
    "Pre-health students, ready to help fill the shifts you need covered.",
  heroSubhead:
    "Olera recruits and qualifies local pre-health college students and connects them with your agency. You interview and hire the students who fit your needs. Students gain meaningful healthcare experience, and your agency gains another source of reliable caregiver candidates.",
  benefits: [
    {
      title: "We recruit the students",
      body: "We handle university outreach and initial qualification before a candidate reaches you.",
    },
    {
      title: "Recurring availability",
      body: "We look for students who can commit to consistent shifts for at least one semester.",
    },
    {
      title: "Strong motivation",
      body: "Students are building healthcare experience and value mentorship, supervised hours, and future recommendations.",
    },
    {
      title: "A renewable local pipeline",
      body: "New student cohorts create an opportunity to recruit from nearby universities each semester.",
    },
  ],
  steps: [
    {
      title: "Tell us what you need.",
      body: "Share your ideal caregiver, preferred shifts, and how many students you may want.",
    },
    {
      title: "We send qualified matches.",
      body: "We recruit and screen students, then send candidates for you to review and interview.",
    },
    {
      title: "You decide who to hire.",
      body: "You remain the employer and handle your normal hiring, onboarding, and supervision.",
    },
  ],
  vetting: [],
  offer: {
    headline: "Try your first student at no cost.",
    ask: "Simply reply \u201cInterested\u201d to the email that included this flyer.",
    body: "That is all we need to start. We will answer any questions, learn what you are looking for, and set you up to try the program with one student at no cost.",
  },
  afterReply: [
    {
      title: "We learn your needs.",
      body: "We confirm preferred shifts, candidate profile, and any non-negotiables.",
    },
    {
      title: "We send a student.",
      body: "When a qualified student is available near you, we send a short profile for review.",
    },
    {
      title: "You interview and decide.",
      body: "If there is a fit, you hire the student through your normal process.",
    },
  ],
  story: {
    heading: "Why this program exists",
    body: "Pre-health students often need meaningful, hands-on experience before professional school. Home care agencies often need dependable caregivers. Olera built the Student Caregiver Program to connect those needs while helping families receive reliable support at home.",
  },
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
      bio: "Coordinates provider and student onboarding, qualification, matching, and follow-up.",
      photo: "chantel",
    },
    {
      name: "Graize Belandres",
      role: "Assistant to Dr. Logan DuBose",
      email: "graize@olera.care",
      bio: "Supports provider and student communication and program administration.",
      photo: "grazie",
    },
    {
      name: "Sara Conkling",
      role: "Assistant to Dr. Logan DuBose",
      email: "sara@olera.care",
      bio: "Pre-medical student at Clemson University who supports provider and student coordination.",
      photo: "sara",
    },
  ],
  nextStep: {
    heading: "The easiest next step",
    kicker: "No form. No commitment. No pricing decision today.",
    ask: "Reply \u201cInterested\u201d to the email that included this flyer.",
    body: "We will answer your questions, learn what kind of caregiver would be useful to your agency, and explain the program. If you would like to try it, we will set you up with your first student at no cost.",
  },
  replyBlock: {
    label: "REPLY WITH ONE WORD",
    word: "INTERESTED",
    tail: "We\u2019ll take it from there.",
  },
  footerLine: "Olera Student Caregiver Program \u2022 For home care agencies",
  ctaLabel: "Learn more",
};


