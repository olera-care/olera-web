/**
 * Canonical skills list shared between job postings and student profiles.
 * Both sides pick from this list so matching is deterministic.
 */
export const SKILLS = [
  "Vital signs monitoring",
  "Nutrition and diet awareness",
  "Medication management familiarity",
  "Mobility and transfer assistance",
  "Fall risk management",
  "ADL support",
  "Dementia and memory care",
  "Alzheimer\u2019s care",
  "Post-operative recovery support",
  "Hospice and palliative support",
  "Infection control basics",
  "Care documentation",
  "HIPAA awareness",
  "CNA experience",
  "EMT experience",
  "Psychology",
  "Gerontology coursework",
];

export type Skill = (typeof SKILLS)[number];
