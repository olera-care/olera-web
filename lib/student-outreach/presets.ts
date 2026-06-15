/**
 * Curated preset values for structured form fields.
 *
 * Free-text "Other" is always offered when the listed options don't fit;
 * the actual value is then stored verbatim alongside the canonical list.
 * As "Other" write-ins accumulate, we promote the popular ones to
 * presets in this file.
 */

import type { StakeholderType } from "./types";

export const OTHER = "Other";

/** Pre-health programs. Multi-select for orgs/dept_heads, single for advisors. */
export const PROGRAMS: string[] = [
  "General Pre-Health",
  "Pre-Med",
  "Pre-PA",
  "Pre-Nursing",
  "Pre-Dental",
  "Pre-Vet",
  "Pre-Pharmacy",
  "Pre-PT",
  "Pre-OT",
  "Public Health",
  OTHER,
];

/** Roles per stakeholder type. Used for the contact's `role` field. */
export const ROLES_BY_TYPE: Record<StakeholderType, string[]> = {
  student_org: [
    "President",
    "Vice President",
    "Treasurer",
    "Secretary",
    "Outreach / Events Officer",
    "Member",
    "Faculty Advisor",
    OTHER,
  ],
  advisor: [
    "Pre-Health Advisor",
    "Pre-Med Advisor",
    "Health Professions Advisor",
    "Career Services Advisor",
    "Academic Advisor",
    OTHER,
  ],
  dept_head: [
    "Department Chair",
    "Associate Chair",
    "Director of Undergraduate Studies",
    "Dean",
    "Vice Dean",
    "Program Director",
    OTHER,
  ],
  professor: [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Adjunct Professor",
    "Lecturer",
    OTHER,
  ],
};

/**
 * v9 provider contact roles. The SnapshotCard's multi-contact list
 * uses these as the dropdown options when adding/editing a contact
 * on a provider outreach row. Tags the contact so future outreach
 * can address the right person (Owner vs Receptionist matters for
 * tone; General Office tells us we're emailing a queue / calling
 * the front desk, not a named person).
 *
 * Free-text fallback via "Other" — the role field on
 * student_outreach_contacts is just TEXT, no DB check.
 *
 * v9 Phase 9 (current): renamed "General Inbox" → "General Office"
 * since the role now covers both the general email destination
 * AND the general office phone line on the same contact. Added
 * Operator / Executive Director / Recruiter / HR / Admissions to
 * match the operational vocabulary admins encounter.
 *
 * The General Office tag drives template selection in
 * providerSalutation: contacts with this role get the "Hello,"
 * general greeting (with optional team reference) rather than the
 * personalized "Hi {first_name}," greeting reserved for named
 * recipients.
 */
/**
 * v9 final: General Office removed. The General Contact lives at the
 * outreach row level (business_profiles.email/phone + research_data.
 * general_contact overrides) — not as a Specific Contact. Specific
 * Contacts are reserved for NAMED individuals. Two cleanly separated
 * concepts per the user's spec.
 */
export const PROVIDER_CONTACT_ROLES: string[] = [
  "Owner",
  "Operator",
  "Hiring Manager",
  "Executive Director",
  "Administrator",
  "Recruiter",
  "HR",
  "Admissions",
  OTHER,
];

/** Common pre-health-relevant academic departments — broad on purpose: any
 *  undergraduate department that commonly serves pre-med / pre-nursing / pre-PA
 *  / pre-PT / pre-pharmacy / allied-health prerequisite coursework. */
export const DEPARTMENTS: string[] = [
  "Biology",
  "Chemistry",
  "Biochemistry",
  "Microbiology",
  "Neuroscience",
  "Psychology",
  "Public Health",
  "Health Sciences",
  "Kinesiology / Exercise Science",
  "Nutrition / Dietetics",
  "Biomedical Sciences",
  "Human Development / Family Sciences",
  "Nursing",
  "Allied Health",
  "Physiology / Anatomy",
  OTHER,
];

/** Whether the type tracks multiple contacts (orgs) or just one (everyone else). */
export function supportsMultipleContacts(type: StakeholderType): boolean {
  return type === "student_org";
}

/** Whether the type's outreach involves phone (advisors and dept heads). */
export function supportsPhoneOutreach(type: StakeholderType): boolean {
  return type === "advisor" || type === "dept_head";
}

/** Whether the type uses Instagram / contact-form channels (orgs only). */
export function supportsAltChannels(type: StakeholderType): boolean {
  return type === "student_org";
}

/** Whether the type ever needs the approvals subsystem.
 *  v8.7: dept_head needs Email-professors + job-board; advisor needs job-board. */
export function supportsApprovals(type: StakeholderType): boolean {
  return type === "dept_head" || type === "advisor";
}

/** Single program (advisors) vs. multi (everyone else). */
export function singleProgram(type: StakeholderType): boolean {
  return type === "advisor";
}
