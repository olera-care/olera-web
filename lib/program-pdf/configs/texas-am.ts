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
  /**
   * "How it works" — numbered steps.
   *
   * A plain string on the student flyer, where a step is one clause. The
   * provider brochure gives each step a bold lead and a sentence, because an
   * agency is deciding whether the process fits around how they already
   * hire, and a single clause cannot answer that.
   */
  steps: Array<string | { title: string; body: string }>;
  /** "Student vetting" — 4 short bullets. */
  vetting: string[];
  /** "Participation & pricing" — two-line block. headline carries
   *  trial + monthly cost + cancel terms; body carries what the fee
   *  covers and what's included. Rendered hero-style (single styled
   *  block) below the vetting section. */
  pricing?: { headline: string; body: string };
  /**
   * What replaced pricing on the provider brochure.
   *
   * There is no number on it any more. The first student is free, the ask is
   * one word, and what it costs afterwards is a conversation we have once it
   * has worked — so the panel carries the offer rather than a price list.
   */
  offer?: { headline: string; ask: string; body: string };
  /** The closing panel on the team page. */
  nextStep?: { heading: string; kicker: string; ask: string; body: string };
  /** The one-word reply block that ends the brochure. */
  replyBlock?: { label: string; word: string; tail: string };
  /** The rule-line at the very bottom of the last page. */
  footerLine?: string;
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
  afterReply?: Array<{ title: string; body: string }>;
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
    "Pre-health students, ready to help fill the shifts you need covered.",
  heroSubhead:
    "Olera recruits and qualifies local pre-health students \u2014 future nurses, doctors and allied health professionals \u2014 and connects them with your agency. Students gain real healthcare experience, and you gain reliable caregiver candidates.",
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
      body: "Your ideal caregiver, preferred shifts, and how many students.",
    },
    {
      title: "We send qualified matches.",
      body: "We recruit and screen students, then send candidates to review.",
    },
    {
      title: "You decide who to hire.",
      body: "You remain the employer and run your normal hiring process.",
    },
  ],
  vetting: [],
  offer: {
    headline: "Try the program at no cost.",
    ask: "Simply reply \u201cInterested\u201d to the email that included this flyer.",
    body: "This is all we need to start. We will answer any questions, learn what you are looking for, and set you up with your first student.",
  },
  afterReply: [
    {
      title: "We learn your needs.",
      body: "Preferred shifts, candidate profile, and any non-negotiables.",
    },
    {
      title: "We send a student.",
      body: "When one is available near you, we send a short profile.",
    },
    {
      title: "You interview and decide.",
      body: "If there is a fit, you hire through your normal process.",
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
      bio: "Coordinates provider and student onboarding, matching, and follow-up.",
      photo: "chantel",
    },
    {
      name: "Graize Belandres",
      role: "Assistant to Dr. Logan DuBose",
      email: "graize@olera.care",
      bio: "Supports provider and student communication and administration.",
      photo: "grazie",
    },
    {
      name: "Sara Conkling",
      role: "Assistant to Dr. Logan DuBose",
      email: "sara@olera.care",
      bio: "Pre-medical student at Clemson who supports provider coordination.",
      photo: "sara",
    },
  ],
  nextStep: {
    heading: "The easiest next step",
    kicker: "No form. No commitment. No pricing decision today.",
    ask: "Reply to this email.",
    body: "We will answer your questions and learn what kind of caregiver would help your agency. If you would like to try the program, we can set you up at no cost.",
  },
  replyBlock: {
    label: "REPLY WITH ONE WORD",
    word: "INTERESTED",
    tail: "We\u2019ll take it from there.",
  },
  footerLine: "Olera Student Caregiver Program \u2022 For home care agencies",
  ctaLabel: "Learn more",
};


