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
    "Paid, hands-on caregiving experience for your pre-health students — around their class schedule.",
  heroSubhead:
    "Olera places pre-health students into paid caregiving jobs with licensed local home care agencies, helping older adults with supervision, medication reminders, transfers, companionship and personal care.",

  benefitsHeading: "WHY OFFICES SHARE THIS",
  benefits: [
    {
      title: "A specific answer to \u201cHow do I get experience?\u201d",
      body: "A program they can apply to this week: paid, hands-on direct care with older adults.",
    },
    {
      title: "Paid, and no cost to anyone here",
      body: "Students are paid by the agency that hires them. There is no fee to the student, the office or the university.",
    },
    {
      title: "Built around coursework",
      body: "Shifts work around a class schedule, and our partnering home care agencies are vetted to be student-friendly.",
    },
    {
      title: "Easy to share with students",
      body: "A flyer and an approved university job-board posting — for your newsletter, listserv, or students directly.",
    },
  ],

  steps: [
    {
      title: "You share our flyer.",
      body: "In a newsletter, on a listserv, or in an advising appointment.",
    },
    {
      title: "Students apply.",
      body: "We match them to student-friendly agencies near campus.",
    },
    {
      title: "They get hired and paid.",
      body: "The local agency employs them. We help them make the most of it.",
    },
  ],

  vetting: [],

  story: {
    heading: "Why this program exists",
    body: "Pre-health students are advised to get hands-on experience providing care, and then struggle to find it. Meanwhile home care agencies near every campus cannot fill their shifts, and families who need personal care are turned away. Olera built the Student Caregiver Program to meet these needs. We would like your office to be part of it and help us spread the word.",
  },

  offer: {
    headline: "What a student gets",
    ask: "Paid caregiving experience, references and letters, hours for their application, and mentorship.",
    body: "Students gain valuable caregiving experience with older adults in their community. We mentor them on explaining it on an application, asking employers for letters, documenting hours, and talking about it at interview.",
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
      body: "Last page. Share it in a listserv, newsletter or advising session.",
    },
    {
      title: "Repeat every semester.",
      body: "We want an ongoing relationship with you and your office.",
    },
  ],

  // One box, not two. "The easiest next step" and "Reply with one word"
  // were the same instruction given twice, one immediately above the other,
  // and the reader had to work out that they were not two separate asks.
  replyBlock: {
    label: "THE EASIEST NEXT STEP \u2014 REPLY WITH ONE WORD",
    word: "INTERESTED",
    tail: "We\u2019ll send more information from there.",
  },

  footerLine: "Olera Student Caregiver Program • For pre-health advising and career centers",
  ctaLabel: "See the student page",
};
