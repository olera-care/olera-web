export interface CaregiverSkill {
  id: string;
  label: string;
  description: string;
}

export const CAREGIVER_SKILLS: CaregiverSkill[] = [
  { id: "personal_care", label: "Personal Care", description: "Bathing, dressing, grooming" },
  { id: "mobility_assistance", label: "Mobility Assistance", description: "Transfers, walking, fall prevention" },
  { id: "medication_reminders", label: "Medication Reminders", description: "Organizing and reminding" },
  { id: "meal_preparation", label: "Meal Preparation", description: "Cooking, nutrition, feeding" },
  { id: "companionship", label: "Companionship", description: "Social engagement, outings" },
  { id: "dementia_support", label: "Dementia / Memory Support", description: "Alzheimer's, cognitive decline" },
  { id: "housekeeping", label: "Housekeeping", description: "Light cleaning, laundry" },
  { id: "transportation", label: "Transportation", description: "Errands, appointments" },
  { id: "overnight_care", label: "Overnight / Live-in Care", description: "Extended hour shifts" },
  { id: "hospice_support", label: "Hospice Support", description: "Palliative comfort care" },
  { id: "respite_care", label: "Respite Care", description: "Relief for primary caregivers" },
];

/** Map skill ID → display label */
export const CAREGIVER_SKILL_LABELS: Record<string, string> = Object.fromEntries(
  CAREGIVER_SKILLS.map((s) => [s.id, s.label])
);
