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
  universityShort: "", // Title collapses to "Olera's Pre-Health Caregiving Internship"
  localArea: "your area",
  universityAccent: "#047857", // Olera emerald (no university accent for the generic flyer)
  ctaUrl: studentApplyUrl({
    source: "flyer",
    siteUrl: "https://olera.care",
  }),
  universityTagLine: "Paid caregiving internship",
  subtitle: "A paid pre-health caregiving internship for pre-nursing and pre-medical students",
  documentSubject: "Student internship flyer",
  sectionHeaders: {
    benefits: "Why students join",
    steps: "How to join",
    vetting: "Who can join",
    pricing: "What to expect",
  },
  heroHeadline: "Get paid for real caregiving experience that counts toward your health career.",
  heroSubhead:
    "Olera's pre-health caregiving internship places students in paid caregiver roles for older adults near campus. It's hands-on patient experience, plus a credential and references, that strengthens your application to nursing, PA, medical, and other health programs, on a schedule that works around your classes. Families near you are hiring student caregivers now.",
  benefits: [
    { title: "Get paid", body: "Earn an hourly wage doing meaningful work — a paid internship, not a volunteer gig." },
    { title: "Real patient-care hours", body: "Direct experience caring for older adults — exactly what health programs look for." },
    { title: "A credential + references", body: "Earn a credential and recommendation letters for medical, PA, and nursing school applications." },
    { title: "Mentorship around your classes", body: "Guidance from Dr. DuBose's team, on a schedule that fits your course load." },
  ],
  steps: [
    "Apply online in a few minutes.",
    "Quick screening + onboarding.",
    "Get matched with a local family who needs care.",
    "Start your shifts and start earning.",
  ],
  vetting: [
    "Open to any pre-health major — no prior experience required.",
    "Must be a currently enrolled student.",
    "Training and support provided before your first shift.",
    "Background check handled as part of onboarding.",
  ],
  pricing: {
    headline: "Paid hourly · flexible hours · start this semester",
    body: "You choose how much you work. We provide the training, the match, and ongoing support so you can focus on doing great work and building your health-career story.",
  },
  ctaLabel: "Apply now: scan or visit",
};
