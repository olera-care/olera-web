/**
 * v9 final: per-university Program PDF configuration.
 *
 * Each university config drives the React-PDF Template (one file
 * in this directory per campus slug). To add a new university:
 *   1. Copy texas-am.ts → <slug>.ts
 *   2. Swap the copy + accent color + assets
 *   3. Register in configs/index.ts
 *   4. /api/medjobs/program-pdf?university=<slug> renders it
 *
 * IMPORTANT: the `slug` field below MUST match
 * student_outreach_campuses.slug. The attachment wiring looks up
 * the config by outreach.campus.slug at send time — a mismatch
 * means no PDF attaches (silent fallback to the env-var generic).
 * Texas A&M's canonical slug is `texas-am` (see
 * lib/student-outreach/universities.ts + migration 064 seed).
 *
 * The Template component (lib/program-pdf/Template.tsx) consumes
 * this shape only — no university-specific code in the renderer
 * means future universities are pure data adds.
 */

export interface ProgramPdfConfig {
  /** Stable slug — matches student_outreach_campuses.slug so the
   *  attachment can be looked up by outreach.campus.slug. */
  slug: string;
  /** University display name used in the title + body. */
  universityName: string;
  /** University short-form (for the hero line). */
  universityShort: string;
  /** Local area phrase ("Bryan/College Station area").
   *
   *  Unused by the provider brochure since the redesign — the hero now names
   *  the university in the band instead. Kept because the student flyer
   *  configs still carry it. */
  localArea: string;
  /** University secondary accent colour.
   *
   *  Unused by the provider brochure since the redesign. One brand across
   *  every campus reads as a programme; a different accent per university
   *  read as a different leaflet each time, and the agency is buying into
   *  Olera rather than into the university. Kept for the student flyer. */
  universityAccent: string;
  /** Public URL that the QR code resolves to. Defaults to the
   *  Olera medjobs provider landing page; per-university overrides
   *  are possible if we add deep-link routes later. */
  ctaUrl: string;
  /** Hero value-prop headline (~2 lines). Short, benefit-led. */
  heroHeadline: string;
  /** Hero subhead paragraph (~3 sentences). Slightly more
   *  marketing-flavored than the email copy — this is the brochure. */
  heroSubhead: string;
  /** "Why agencies participate" — 4 short benefit cards. Each
   *  is 1 short title + 1-sentence supporting text. */
  benefits: Array<{ title: string; body: string }>;
  /** "How it works" — 4 numbered steps. Single-clause each. */
  steps: string[];
  /** "Student vetting" — 4 short bullets. */
  vetting: string[];
  /** "Participation & pricing" — two-line block. headline carries
   *  trial + monthly cost + cancel terms; body carries what the fee
   *  covers and what's included. Rendered hero-style (single styled
   *  block) below the vetting section. */
  pricing: { headline: string; body: string };
  /** Bottom CTA line ("Schedule a call · Learn more"). */
  ctaLabel: string;

  /**
   * Why the programme exists, in the founder's words.
   *
   * The brochure's job is not only to explain the offer. An agency deciding
   * whether to let a stranger send them a caregiver is deciding whether to
   * trust the people behind it, and a paragraph on how this started does more
   * for that than another benefit card.
   */
  story?: { heading: string; body: string };
  /**
   * What happens once they reply, on the team page.
   *
   * It is the same sequence the onboarding email describes. Saying it on the
   * brochure means the first thing they agree to is something they have
   * already read, rather than a process that appears after they commit.
   */
  afterReply?: string[];
  /**
   * The people an agency will actually deal with.
   *
   * `photo` names an asset the renderer has loaded. A name with no photo
   * still renders, with its initials in place, so a missing headshot never
   * blocks the PDF.
   */
  team?: Array<{
    name: string;
    role: string;
    email?: string;
    bio: string;
    photo?: "logan" | "chantel" | "sara" | "grazie";
  }>;

  // ── Audience variants (student-facing flyer vs provider brochure) ──
  // The renderer reads the fields below with PROVIDER defaults when omitted,
  // so the existing provider config needs no changes. The student config sets
  // them to flip every audience-specific label.
  /** Who this config addresses. Drives the registry lookup + filename; the
   *  renderer keys off the header/subtitle fields below. Defaults to "provider". */
  audience?: "provider" | "student";
  /** Subtitle under the title. Provider default:
   *  "Pre-nursing and pre-medical student staffing pipeline for home care agencies". */
  subtitle?: string;
  /** Top-right university tagline. Provider default: "Pre-health staffing pipeline". */
  universityTagLine?: string;
  /** Section headers. Provider defaults: "Why agencies participate" / "How it
   *  works" / "Student vetting" / "Participation & pricing". */
  sectionHeaders?: { benefits: string; steps: string; vetting: string; pricing: string };
  /** PDF metadata subject. Provider default: "Provider outreach packet". */
  documentSubject?: string;
}

export const TEXAS_AM: ProgramPdfConfig = {
  slug: "texas-am",
  universityName: "Texas A&M University",
  universityShort: "Texas A&M",
  localArea: "Bryan/College Station area",
  universityAccent: "#500000", // Aggie maroon
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

