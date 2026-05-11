// Category-specific questions for the inbox_preview CTA variant.
// Each category has 5 questions: first 3 shown by default, remaining 2
// shown when user expands "More questions".

export interface CTAQuestion {
  id: string;
  text: string;
}

export interface CategoryQuestions {
  category: string;
  questions: CTAQuestion[];
}

const ASSISTED_LIVING_QUESTIONS: CTAQuestion[] = [
  { id: "al_accepting", text: "Are you accepting new residents?" },
  { id: "al_included", text: "What's included in the monthly fee?" },
  { id: "al_waitlist", text: "Is there a waitlist?" },
  { id: "al_tour", text: "Can I schedule a tour?" },
  { id: "al_respite", text: "Do you offer respite stays?" },
];

const INDEPENDENT_LIVING_QUESTIONS: CTAQuestion[] = [
  { id: "il_accepting", text: "Are you accepting new residents?" },
  { id: "il_included", text: "What's included in the monthly fee?" },
  { id: "il_waitlist", text: "Is there a waitlist?" },
  { id: "il_tour", text: "Can I schedule a tour?" },
  { id: "il_respite", text: "Do you offer respite stays?" },
];

const MEMORY_CARE_QUESTIONS: CTAQuestion[] = [
  { id: "mc_accepting", text: "Are you accepting new residents?" },
  { id: "mc_level", text: "What level of memory care do you provide?" },
  { id: "mc_waitlist", text: "Is there a waitlist?" },
  { id: "mc_tour", text: "Can I schedule a tour?" },
  { id: "mc_included", text: "What's included in the monthly fee?" },
];

const NURSING_HOME_QUESTIONS: CTAQuestion[] = [
  { id: "nh_accepting", text: "Are you accepting new patients?" },
  { id: "nh_medicare", text: "Do you accept Medicare/Medicaid?" },
  { id: "nh_waitlist", text: "Is there a waitlist?" },
  { id: "nh_tour", text: "Can I schedule a tour?" },
  { id: "nh_rehab", text: "What rehabilitation services do you offer?" },
];

const HOME_CARE_QUESTIONS: CTAQuestion[] = [
  { id: "hc_accepting", text: "Are you accepting new clients?" },
  { id: "hc_services", text: "What services do you provide?" },
  { id: "hc_rates", text: "What are your hourly rates?" },
  { id: "hc_livein", text: "Do you offer live-in care?" },
  { id: "hc_background", text: "Are your caregivers background-checked?" },
];

const HOME_HEALTH_QUESTIONS: CTAQuestion[] = [
  { id: "hh_accepting", text: "Are you accepting new clients?" },
  { id: "hh_services", text: "What services do you provide?" },
  { id: "hh_rates", text: "What are your hourly rates?" },
  { id: "hh_livein", text: "Do you offer live-in care?" },
  { id: "hh_background", text: "Are your caregivers background-checked?" },
];

const HOSPICE_QUESTIONS: CTAQuestion[] = [
  { id: "ho_accepting", text: "Are you accepting new patients?" },
  { id: "ho_inhome", text: "Do you provide in-home hospice?" },
  { id: "ho_medicare", text: "What's covered by Medicare?" },
  { id: "ho_quickly", text: "How quickly can care begin?" },
  { id: "ho_respite", text: "Do you offer respite care for families?" },
];

const DEFAULT_QUESTIONS: CTAQuestion[] = [
  { id: "default_accepting", text: "Are you accepting new clients?" },
  { id: "default_services", text: "What services do you provide?" },
  { id: "default_rates", text: "What are your rates?" },
  { id: "default_visit", text: "Can I schedule a visit?" },
  { id: "default_waitlist", text: "Is there a waitlist?" },
];

// Mapping of category slugs/names to question sets
const CATEGORY_QUESTION_MAP: Record<string, CTAQuestion[]> = {
  // Assisted Living variants
  "assisted-living": ASSISTED_LIVING_QUESTIONS,
  "assisted_living": ASSISTED_LIVING_QUESTIONS,
  "Assisted Living": ASSISTED_LIVING_QUESTIONS,
  "Assisted Living Facility": ASSISTED_LIVING_QUESTIONS,

  // Independent Living variants
  "independent-living": INDEPENDENT_LIVING_QUESTIONS,
  "independent_living": INDEPENDENT_LIVING_QUESTIONS,
  "Independent Living": INDEPENDENT_LIVING_QUESTIONS,
  "Independent Living Facility": INDEPENDENT_LIVING_QUESTIONS,

  // Memory Care variants
  "memory-care": MEMORY_CARE_QUESTIONS,
  "memory_care": MEMORY_CARE_QUESTIONS,
  "Memory Care": MEMORY_CARE_QUESTIONS,
  "Memory Care Facility": MEMORY_CARE_QUESTIONS,

  // Nursing Home variants
  "nursing-home": NURSING_HOME_QUESTIONS,
  "nursing_home": NURSING_HOME_QUESTIONS,
  "Nursing Home": NURSING_HOME_QUESTIONS,
  "Skilled Nursing Facility": NURSING_HOME_QUESTIONS,
  "SNF": NURSING_HOME_QUESTIONS,

  // Home Care variants
  "home-care": HOME_CARE_QUESTIONS,
  "home_care": HOME_CARE_QUESTIONS,
  "Home Care": HOME_CARE_QUESTIONS,
  "Non-Medical Home Care": HOME_CARE_QUESTIONS,
  "In-Home Care": HOME_CARE_QUESTIONS,

  // Home Health variants
  "home-health": HOME_HEALTH_QUESTIONS,
  "home_health": HOME_HEALTH_QUESTIONS,
  "Home Health": HOME_HEALTH_QUESTIONS,
  "Home Health Care": HOME_HEALTH_QUESTIONS,
  "Home Health Agency": HOME_HEALTH_QUESTIONS,

  // Hospice variants
  "hospice": HOSPICE_QUESTIONS,
  "Hospice": HOSPICE_QUESTIONS,
  "Hospice Care": HOSPICE_QUESTIONS,
};

/**
 * Returns category-specific questions for the inbox_preview CTA variant.
 * Falls back to default questions if category is not recognized.
 *
 * @param category - The provider category (slug, display name, or null)
 * @returns Array of 5 questions (first 3 visible by default, 2 more on expand)
 */
export function getQuestionsForCategory(
  category: string | null | undefined
): CTAQuestion[] {
  if (!category) return DEFAULT_QUESTIONS;

  // Try direct lookup first
  const direct = CATEGORY_QUESTION_MAP[category];
  if (direct) return direct;

  // Try case-insensitive lookup
  const lowerCategory = category.toLowerCase();
  for (const [key, questions] of Object.entries(CATEGORY_QUESTION_MAP)) {
    if (key.toLowerCase() === lowerCategory) {
      return questions;
    }
  }

  // Try partial match (e.g., "assisted" matches "assisted-living")
  for (const [key, questions] of Object.entries(CATEGORY_QUESTION_MAP)) {
    if (
      key.toLowerCase().includes(lowerCategory) ||
      lowerCategory.includes(key.toLowerCase().replace(/[-_]/g, " "))
    ) {
      return questions;
    }
  }

  return DEFAULT_QUESTIONS;
}

/**
 * Splits questions into initial (visible) and expanded (hidden) groups.
 */
export function splitQuestions(questions: CTAQuestion[]): {
  initial: CTAQuestion[];
  expanded: CTAQuestion[];
} {
  return {
    initial: questions.slice(0, 3),
    expanded: questions.slice(3, 5),
  };
}
