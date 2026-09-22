/**
 * The ADVISOR-facing flyer: pre-health advising offices, career centres,
 * programme directors, deans.
 *
 * Not the provider brochure with the nouns swapped. An advising office is not
 * buying anything and is not the employer — what they have is students who
 * need hands-on patient experience before they apply, and no good answer when
 * those students ask where to get it. So the document is about the student,
 * and everything the office might fear is answered on the page: no cost, no
 * endorsement, no paperwork, nothing that competes with coursework.
 *
 * Same renderer as every other config (Template.tsx).
 */

import type { ProgramPdfConfig } from "./texas-am";

export const GENERIC_ADVISOR: ProgramPdfConfig = {
  slug: "generic",
  audience: "advisor",
  universityName: "Pre-Health Students",
  universityShort: "",
  localArea: "your area",
  universityAccent: "#047857",
  ctaUrl: "https://olera.care/medjobs/candidates",
  eyebrow: "FOR PRE-HEALTH ADVISING AND CAREER CENTERS",
  heroHeadline:
    "Paid, hands-on patient experience for your pre-health students — around their class schedule.",
  heroSubhead:
    "Olera places pre-health students into paid caregiving shifts with licensed local home care agencies. They get direct patient contact, a reference, and hours that admissions committees recognise. Your office does nothing but tell them it exists.",

  benefitsHeading: "WHY OFFICES SHARE THIS",
  benefits: [
    {
      title: "Something to point students to",
      body: "Every pre-health student asks where to get patient experience. This is a specific answer, not a suggestion to go and look.",
    },
    {
      title: "Paid, and no cost to anyone here",
      body: "Students are paid by the agency that hires them. There is no fee to the student, the office or the university.",
    },
    {
      title: "Built around coursework",
      body: "Shifts are arranged around a class schedule. This is not something that competes with the semester.",
    },
    {
      title: "Nothing for you to administer",
      body: "We recruit, qualify and follow up. You do not vet, place, supervise or track anybody.",
    },
  ],

  steps: [
    {
      title: "You share it.",
      body: "A newsletter, a listserv, an advising appointment — whatever you already use.",
    },
    {
      title: "Students apply to us.",
      body: "We qualify them and match them to licensed agencies near campus.",
    },
    {
      title: "They are hired and paid.",
      body: "The agency is the employer. We confirm the hire and stay in touch with the student.",
    },
  ],

  vetting: [],

  story: {
    heading: "Why this program exists",
    body: "Pre-health students are told to get patient experience and are rarely told where. Meanwhile home care agencies near every campus cannot fill shifts. Olera built the Student Caregiver Program to put those two facts together — students get paid clinical hours before they apply, and families get reliable support at home.",
  },

  offer: {
    headline: "What a student gets",
    ask: "Paid direct patient care, a professional reference, and hours that count.",
    body: "Students work alongside licensed caregivers doing real, supervised, patient-facing work — the kind of experience an admissions committee asks about and a personal statement can be written from.",
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
      bio: "Coordinates student onboarding, matching, and follow-up.",
      photo: "chantel",
    },
    {
      name: "Graize Belandres",
      role: "Assistant to Dr. Logan DuBose",
      email: "graize@olera.care",
      bio: "Supports student and provider communication and administration.",
      photo: "grazie",
    },
    {
      name: "Sara Conkling",
      role: "Assistant to Dr. Logan DuBose",
      email: "sara@olera.care",
      bio: "Pre-medical student at Clemson who supports student coordination.",
      photo: "sara",
    },
  ],

  afterReply: [
    {
      title: "We answer your questions.",
      body: "What we ask of students, who the agencies are, and what we do not do.",
    },
    {
      title: "We send you something to forward.",
      body: "A short student-facing version, written to be pasted into a newsletter.",
    },
    {
      title: "We tell you what happened.",
      body: "How many of your students applied, and how many were hired.",
    },
  ],

  nextStep: {
    heading: "The easiest next step",
    kicker: "No endorsement. No paperwork. No commitment from the office.",
    ask: "Reply to this email.",
    body: "We will answer your questions and send a short version you can forward to students. If you would rather talk it through first, we will find fifteen minutes.",
  },

  replyBlock: {
    label: "REPLY WITH ONE WORD",
    word: "INTERESTED",
    tail: "We’ll take it from there.",
  },

  footerLine: "Olera Student Caregiver Program • For pre-health advising and career centers",
  ctaLabel: "See the student page",
};
