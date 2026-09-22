/**
 * The ADVISOR-facing flyer: pre-health advising offices, career centres,
 * programme directors, deans.
 *
 * Not the provider brochure with the nouns swapped. An advising office is not
 * buying anything and is not the employer — what they have is students who
 * need hands-on experience before they apply, and no specific answer when
 * those students ask where to get it. So the document is about the student,
 * and what it asks of the office is only that they pass it on.
 *
 * Same renderer as every other config (Template.tsx), plus the student
 * recruitment flyer appended as a final page — the office is being asked to
 * share something, so the thing they would share is in their hands already.
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
    "Paid, hands-on bedside experience for your pre-health students — around their class schedule.",
  heroSubhead:
    "Olera places pre-health students into paid caregiving shifts with licensed local agencies: bedside experience, references and hours admissions committees value. Your office can help us spread the word.",

  benefitsHeading: "WHY OFFICES SHARE THIS",
  benefits: [
    {
      title: "A specific answer to \u201cHow do I get experience?\u201d",
      body: "Not a suggestion to go and look. A program they can apply to this week.",
    },
    {
      title: "Paid, and no cost to anyone here",
      body: "Students are paid by the agency that hires them. There is no fee to the student, the office or the university.",
    },
    {
      title: "Built around coursework",
      body: "Shifts are arranged around a class schedule, and our partnering agencies are vetted to be student-friendly.",
    },
    {
      title: "Easy to share",
      body: "We provide the flyer and an approved job-board posting, ready for a newsletter or listserv.",
    },
  ],

  steps: [
    {
      title: "You share our flyer.",
      body: "A newsletter, a listserv, or an advising appointment.",
    },
    {
      title: "Students apply.",
      body: "We qualify them and match them to agencies near campus.",
    },
    {
      title: "They are hired and paid.",
      body: "The local agency employs them. We stay with the student.",
    },
  ],

  vetting: [],

  story: {
    heading: "Why this program exists",
    body: "Pre-health students are advised to get hands-on experience providing care, and then struggle to find it. Meanwhile home care agencies near every campus cannot fill their shifts, and families who need personal care are turned away. Olera built the Student Caregiver Program to meet both needs at once. We would like your office to help us spread the word.",
  },

  offer: {
    headline: "What a student gets",
    ask: "Paid bedside care, references and letters, hours for their application, and mentorship from our team.",
    body: "Students work for a licensed partnering agency — supervision, medication reminders, transfers, companionship. Afterwards we help them write it up, ask for a letter and document their hours.",
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
      body: "How the program works, and how we keep agencies student-friendly.",
    },
    {
      title: "You share our recruitment flyer.",
      body: "The last page of this document, with the link and posting.",
    },
    {
      title: "Repeat every semester.",
      body: "We keep you updated on how your students did.",
    },
  ],

  nextStep: {
    heading: "The easiest next step",
    ask: "Reply to this email.",
    body: "We will answer your questions so you are confident sharing our recruitment flyer (the last page of this document) with your students.",
  },

  replyBlock: {
    label: "REPLY WITH ONE WORD",
    word: "INTERESTED",
    tail: "We’ll send more information from there.",
  },

  footerLine: "Olera Student Caregiver Program • For pre-health advising and career centers",
  ctaLabel: "See the student page",
};
