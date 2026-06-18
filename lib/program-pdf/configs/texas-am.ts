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
  /** Local area phrase ("Bryan/College Station area"). Used once
   *  in the hero subhead. */
  localArea: string;
  /** University secondary accent color (used sparingly — top-rule
   *  + university wordmark). Olera emerald is the primary accent
   *  across every config. */
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
    "Local Texas A&M pre-health student caregivers, matched to the recurring shifts you struggle to cover.",
  heroSubhead:
    "Olera runs a Student Caregiver Program that places pre-nursing and pre-medical students from Texas A&M with home care agencies. Students commit to a semester of recurring availability, and we match them to your clients whose schedules line up. You get reliable recurring coverage; students get the supervised hours and recommendation letters that strengthen their applications to medical, PA, and nursing school.",
  // v9.1 Graize 05.13 audit (Item 12): two benefit cards retitled
  // to better fit the program's actual value to operators + clients.
  // "Local Aggie talent pipeline" -> "Local evergreen talent pipeline"
  // makes the perennial-semester point without university-specific
  // jargon, and reads cleaner. "Pathway to long-term hires" framed
  // the program as a recruiting funnel; the bigger win is the client-
  // experience uplift from motivated pre-health caregivers — so it
  // reframes as "Caregivers your clients remember".
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
      body: "Pre-nursing and pre-medical students from the Bryan/College Station area, available term after term.",
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
  // v9.1 Graize 05.13 audit (Item 13): shorter CTA so the label
  // doesn't truncate next to the QR code. The QR target URL already
  // takes the reader to the participation page.
  ctaLabel: "Learn more",
};
