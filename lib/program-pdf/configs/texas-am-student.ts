/**
 * Texas A&M — STUDENT-facing program flyer config.
 *
 * The partner channel (advising offices + student organizations) shares this
 * with pre-health students. It reuses the same one-page renderer as the
 * provider brochure (lib/program-pdf/Template.tsx) but flips every
 * audience-specific label via the optional fields on ProgramPdfConfig, so the
 * sections read for a student deciding whether to JOIN — not for an agency
 * deciding whether to hire (no pricing/vetting/agency framing).
 *
 * To add another university's student flyer: copy this file, swap the name +
 * accent + ctaUrl, and register it in configs/index.ts under the student map.
 */

import type { ProgramPdfConfig } from "./texas-am";
import { studentApplyUrl } from "@/lib/medjobs/apply-link";

export const TEXAS_AM_STUDENT: ProgramPdfConfig = {
  slug: "texas-am",
  audience: "student",
  universityName: "Texas A&M University",
  universityShort: "Texas A&M",
  localArea: "Bryan/College Station area",
  universityAccent: "#500000",
  // The QR/CTA goes straight to the application, pre-filled to this campus and
  // tagged for attribution (campus-level — one flyer serves every partner).
  // Hardcode the production base so the shared artifact never points at a
  // preview deployment. The displayed URL under the QR is cleaned in Template.
  ctaUrl: studentApplyUrl({
    campusSlug: "texas-am",
    universityName: "Texas A&M University",
    source: "flyer",
    siteUrl: "https://olera.care",
  }),
  universityTagLine: "Paid pre-health caregiving internship",
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
    "Olera's pre-health caregiving internship places Texas A&M students in paid caregiver roles for older adults in the Bryan/College Station area. It's hands-on patient experience — plus a credential and references — that strengthens your application to nursing, PA, medical, and other health programs, on a schedule that works around your classes.",
  benefits: [
    { title: "Get paid", body: "Earn an hourly wage doing meaningful work — a paid internship, not a volunteer gig." },
    { title: "Real patient-care hours", body: "Direct experience caring for older adults — exactly what health programs look for." },
    { title: "A credential + references", body: "Earn a credential and recommendation letters for medical, PA, and nursing school applications." },
    { title: "Mentorship around your classes", body: "Guidance from Dr. DuBose's team, on a schedule that fits your course load." },
  ],
  steps: [
    "Apply online in a few minutes.",
    "Quick screening + onboarding.",
    "Get matched with a local family or agency.",
    "Start your shifts and start earning.",
  ],
  // Repurposed "vetting" section → eligibility for students.
  vetting: [
    "Open to any Texas A&M pre-health major — no prior experience required.",
    "Must be a currently enrolled student.",
    "Training and support provided before your first shift.",
    "Background check handled as part of onboarding.",
  ],
  // Repurposed "pricing" block → what to expect.
  pricing: {
    headline: "Paid hourly · flexible hours · start this semester",
    body: "You choose how much you work. We provide the training, the match, and ongoing support so you can focus on doing great work and building your health-career story.",
  },
  ctaLabel: "Apply now — scan or visit",
};
