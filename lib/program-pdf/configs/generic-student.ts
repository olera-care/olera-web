/**
 * Generic (campus-agnostic) STUDENT-facing program flyer config.
 *
 * Serves the public /medjobs#help share card, where no campus is in scope, and
 * acts as the fallback for any campus that doesn't yet have its own student
 * config. Per-campus personalization (Texas A&M, etc.) still flows through the
 * partner portal + outreach emails, which know the slug — this is the "any
 * pre-health student, any school" version.
 *
 * Same one-page renderer as every other config (Template.tsx); it just leaves
 * the university-specific labels generic. The QR/CTA goes to the application
 * tagged src=flyer (no campus attribution, since the channel is open share).
 */

import type { ProgramPdfConfig } from "./texas-am";
import { studentApplyUrl } from "@/lib/medjobs/apply-link";

export const GENERIC_STUDENT: ProgramPdfConfig = {
  slug: "generic",
  audience: "student",
  universityName: "Pre-Health Students",
  universityShort: "", // Title collapses to "Olera's Student Caregiver Program"
  localArea: "your area",
  universityAccent: "#047857", // Olera emerald (no university accent for the generic flyer)
  ctaUrl: studentApplyUrl({
    source: "flyer",
    siteUrl: "https://olera.care",
  }),
  universityTagLine: "Paid caregiving program",
  subtitle: "A paid Student Caregiver Program for pre-nursing and pre-medical students",
  documentSubject: "Student Caregiver Program flyer",
  sectionHeaders: {
    benefits: "Why students join",
    steps: "How to join",
    vetting: "Who can join",
    pricing: "What to expect",
  },
  heroHeadline: "Get paid for real caregiving experience that strengthens your health-school application.",
  heroSubhead:
    "Olera matches pre-nursing and pre-medical students with local home care agencies as paid caregivers. You get hands-on patient-care experience, mentorship, references, and a recommendation letter — the kind of record that strengthens your application to nursing, PA, medical, and other health programs, on a schedule that works around your classes. Agencies near you are hiring student caregivers now.",
  benefits: [
    { title: "Get paid", body: "Earn an hourly wage for meaningful work — a real job, not a volunteer gig." },
    { title: "Real patient-care hours", body: "Hands-on experience caring for older adults, exactly what health programs look for." },
    { title: "References + a recommendation letter", body: "Build a record from people who watched you work, for your nursing, PA, and medical school applications." },
    { title: "Mentorship around your classes", body: "Guidance from Dr. DuBose's team, on a schedule that fits your course load." },
  ],
  steps: [
    "Check your eligibility in a few minutes.",
    "Quick screening and onboarding.",
    "Get matched with a local home care agency that needs caregivers.",
    "Start your shifts and start earning.",
  ],
  vetting: [
    "Open to any pre-health major — no prior experience required.",
    "Must be a currently enrolled student.",
    "Training and support provided before your first shift.",
    "Background check handled as part of onboarding.",
  ],
  pricing: {
    headline: "Paid hourly · flexible hours · free to join",
    body: "You choose how much you work. Olera handles the match, the training, and ongoing support, so you can focus on doing great work and building your health-career story.",
  },
  ctaLabel: "Check eligibility: scan or visit",
};
