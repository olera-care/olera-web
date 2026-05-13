/**
 * v9 final: per-university Program PDF configuration.
 *
 * Each university config drives the React-PDF Template (one file
 * in this directory per campus slug). To add a new university:
 *   1. Copy texas-a-and-m.ts → <slug>.ts
 *   2. Swap the copy + accent color + assets
 *   3. Register in configs/index.ts
 *   4. /api/medjobs/program-pdf?university=<slug> renders it
 *
 * The Template component (lib/program-pdf/Template.tsx) consumes
 * this shape only — no university-specific code in the renderer
 * means future universities are pure data adds.
 */

export interface ProgramPdfConfig {
  /** Stable slug — matches student_outreach_campuses.slug so the
   *  attachment can be looked up by outreach.campus_slug. */
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
  /** Bottom CTA line ("Schedule a call · Learn more"). */
  ctaLabel: string;
}

export const TEXAS_A_AND_M: ProgramPdfConfig = {
  slug: "texas-a-and-m",
  universityName: "Texas A&M University",
  universityShort: "Texas A&M",
  localArea: "Bryan/College Station area",
  universityAccent: "#500000", // Aggie maroon
  ctaUrl: "https://olera.care/medjobs/providers",
  heroHeadline:
    "Local Texas A&M pre-health students ready to supplement your caregiver workforce.",
  heroSubhead:
    "Olera connects pre-nursing and pre-medical students from Texas A&M with home care agencies for paid caregiving experience. Students get the clinical hours and recommendation letters that strengthen their applications to medical, PA, and nursing school. Agencies get reliable, motivated staffing support from a local university talent pool.",
  benefits: [
    {
      title: "Fill vacant shifts and PRN gaps",
      body: "Reliable student caregivers supplement your team for nights, weekends, and short-notice coverage.",
    },
    {
      title: "Motivated by experience, not just pay",
      body: "Students prioritize clinical hours, mentorship, and recommendation letters that support their applications.",
    },
    {
      title: "Local Aggie talent pipeline",
      body: "Pre-health students from Bryan/College Station, available semester after semester.",
    },
    {
      title: "Pathway to long-term hires",
      body: "Strong-fit students often stay on after graduation in caregiver or care-coordinator roles.",
    },
  ],
  steps: [
    "Agency joins the program with a 15-minute call with Dr. DuBose.",
    "Olera refers screened, interested Texas A&M students.",
    "Agency interviews and selects who fits their care model.",
    "Students start supplementing your caregiver team.",
  ],
  vetting: [
    "Screened pre-nursing and pre-medical applicants.",
    "Committed to healthcare careers; in it for the experience.",
    "Professionalism + scheduling expectations set up-front.",
    "Background-check support coordinated with your standard onboarding.",
  ],
  ctaLabel: "Schedule a 15-minute call with Dr. Logan DuBose",
};
