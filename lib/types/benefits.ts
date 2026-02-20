// Senior Benefits Finder types — ported from iOS BenefitsModels.swift

// ─── Enums ────────────────────────────────────────────────────────────────────

export type BenefitCategory =
  | "healthcare"
  | "income"
  | "housing"
  | "food"
  | "utilities"
  | "caregiver";

export const BENEFIT_CATEGORIES: Record<
  BenefitCategory,
  { displayTitle: string; icon: string; color: string; shortDescription: string }
> = {
  healthcare: {
    displayTitle: "Healthcare",
    icon: "🏥",
    color: "blue",
    shortDescription: "Medical coverage & health services",
  },
  income: {
    displayTitle: "Income Support",
    icon: "💰",
    color: "green",
    shortDescription: "Financial assistance & cash benefits",
  },
  housing: {
    displayTitle: "Housing",
    icon: "🏠",
    color: "purple",
    shortDescription: "Housing assistance & home modifications",
  },
  food: {
    displayTitle: "Food & Nutrition",
    icon: "🍎",
    color: "orange",
    shortDescription: "Food assistance & meal programs",
  },
  utilities: {
    displayTitle: "Utilities",
    icon: "⚡",
    color: "yellow",
    shortDescription: "Help with utility bills & energy costs",
  },
  caregiver: {
    displayTitle: "Caregiver Support",
    icon: "🤝",
    color: "pink",
    shortDescription: "Support for family caregivers",
  },
};

export type CarePreference = "stayHome" | "exploringFacility" | "unsure";

export const CARE_PREFERENCES: Record<
  CarePreference,
  { displayTitle: string; icon: string }
> = {
  stayHome: { displayTitle: "Stay at home", icon: "🏠" },
  exploringFacility: { displayTitle: "Exploring facilities", icon: "🏢" },
  unsure: { displayTitle: "Not sure yet", icon: "🤔" },
};

export type PrimaryNeed =
  | "personalCare"
  | "householdTasks"
  | "healthManagement"
  | "companionship"
  | "financialHelp"
  | "memoryCare"
  | "mobilityHelp";

export const PRIMARY_NEEDS: Record<
  PrimaryNeed,
  { displayTitle: string; shortDescription: string; icon: string }
> = {
  personalCare: {
    displayTitle: "Personal Care",
    shortDescription: "Bathing, dressing, grooming",
    icon: "🛁",
  },
  householdTasks: {
    displayTitle: "Household Tasks",
    shortDescription: "Cooking, cleaning, laundry",
    icon: "🧹",
  },
  healthManagement: {
    displayTitle: "Health Management",
    shortDescription: "Medications, doctor visits",
    icon: "💊",
  },
  companionship: {
    displayTitle: "Companionship",
    shortDescription: "Social interaction, activities",
    icon: "👋",
  },
  financialHelp: {
    displayTitle: "Financial Help",
    shortDescription: "Paying for care, benefits",
    icon: "💵",
  },
  memoryCare: {
    displayTitle: "Memory Care",
    shortDescription: "Alzheimer's, dementia support",
    icon: "🧠",
  },
  mobilityHelp: {
    displayTitle: "Mobility Help",
    shortDescription: "Walking, transfers, wheelchair",
    icon: "🦽",
  },
};

export type IncomeRange =
  | "under1500"
  | "under2500"
  | "under4000"
  | "under6000"
  | "over6000"
  | "preferNotToSay";

export const INCOME_RANGES: Record<
  IncomeRange,
  { displayTitle: string; midpointMonthly: number | null; maxMonthly: number | null }
> = {
  under1500: { displayTitle: "Under $1,500/mo", midpointMonthly: 1000, maxMonthly: 1500 },
  under2500: { displayTitle: "$1,500 – $2,500/mo", midpointMonthly: 2000, maxMonthly: 2500 },
  under4000: { displayTitle: "$2,500 – $4,000/mo", midpointMonthly: 3250, maxMonthly: 4000 },
  under6000: { displayTitle: "$4,000 – $6,000/mo", midpointMonthly: 5000, maxMonthly: 6000 },
  over6000: { displayTitle: "Over $6,000/mo", midpointMonthly: 8000, maxMonthly: null },
  preferNotToSay: { displayTitle: "Prefer not to say", midpointMonthly: null, maxMonthly: null },
};

export type MedicaidStatus =
  | "alreadyHas"
  | "applying"
  | "notSure"
  | "doesNotHave";

export const MEDICAID_STATUSES: Record<
  MedicaidStatus,
  { displayTitle: string; shortTitle: string }
> = {
  alreadyHas: { displayTitle: "Already have Medicaid", shortTitle: "Has Medicaid" },
  applying: { displayTitle: "Currently applying", shortTitle: "Applying" },
  notSure: { displayTitle: "Not sure", shortTitle: "Not sure" },
  doesNotHave: { displayTitle: "Don't have it", shortTitle: "No Medicaid" },
};

export type IntakeStep = 0 | 1 | 2 | 3 | 4 | 5;

export const INTAKE_STEPS: Record<
  IntakeStep,
  { title: string; question: string }
> = {
  0: { title: "Location", question: "What's your ZIP code?" },
  1: { title: "Age", question: "How old is the person who needs care?" },
  2: { title: "Care Setting", question: "Hoping to stay at home, or exploring facilities?" },
  3: { title: "Needs", question: "What kind of help is most needed?" },
  4: { title: "Income", question: "About how much is the monthly income?" },
  5: { title: "Medicaid", question: "Do you currently have Medicaid?" },
};

export const TOTAL_INTAKE_STEPS = 6;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BenefitsIntakeAnswers {
  zipCode: string | null;
  age: number | null;
  carePreference: CarePreference | null;
  primaryNeeds: PrimaryNeed[];
  incomeRange: IncomeRange | null;
  medicaidStatus: MedicaidStatus | null;
  // Derived from ZIP
  stateCode: string | null;
  county: string | null;
}

export function createEmptyIntakeAnswers(): BenefitsIntakeAnswers {
  return {
    zipCode: null,
    age: null,
    carePreference: null,
    primaryNeeds: [],
    incomeRange: null,
    medicaidStatus: null,
    stateCode: null,
    county: null,
  };
}

/** Matches the Supabase `sbf_federal_programs` and `sbf_state_programs` schema */
export interface BenefitProgram {
  id: string;
  name: string;
  short_name: string | null;
  description: string;
  category: BenefitCategory;
  min_age: number | null;
  max_income_single: number | null;
  max_income_couple: number | null;
  requires_disability: boolean;
  requires_veteran: boolean | null;
  requires_medicaid: boolean;
  requires_medicare: boolean | null;
  phone: string | null;
  website: string | null;
  application_url: string | null;
  what_to_say: string | null;
  priority_score: number;
  is_active: boolean;
  state_code: string | null;
}

/** Matches the Supabase `sbf_area_agencies` schema */
export interface AreaAgency {
  id: string;
  name: string;
  state_code: string;
  city: string | null;
  region_name: string | null;
  counties_served: string[] | null;
  zip_codes_served: string[] | null;
  phone: string;
  website: string | null;
  email: string | null;
  address: string | null;
  services_offered: string[] | null;
  what_to_say: string | null;
  is_active: boolean;
}

export interface BenefitMatch {
  id: string;
  program: BenefitProgram;
  matchScore: number; // 0-100
  matchReasons: string[];
  tierLabel: "Top Match" | "Good Fit" | "Worth Exploring";
}

export interface BenefitsSearchResult {
  federalPrograms: BenefitProgram[];
  statePrograms: BenefitProgram[];
  localAAA: AreaAgency | null;
  matchedPrograms: BenefitMatch[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTierLabel(score: number): BenefitMatch["tierLabel"] {
  if (score >= 80) return "Top Match";
  if (score >= 60) return "Good Fit";
  return "Worth Exploring";
}

export function getEstimatedMonthlyIncome(
  incomeRange: IncomeRange | null
): number | null {
  if (!incomeRange) return null;
  return INCOME_RANGES[incomeRange].midpointMonthly;
}

/** Maps PrimaryNeed selections to BenefitCategory for matching boost */
export function needsToCategories(needs: PrimaryNeed[]): BenefitCategory[] {
  const mapping: Record<PrimaryNeed, BenefitCategory[]> = {
    personalCare: ["healthcare"],
    householdTasks: ["caregiver"],
    healthManagement: ["healthcare"],
    companionship: ["caregiver"],
    financialHelp: ["income"],
    memoryCare: ["healthcare"],
    mobilityHelp: ["healthcare"],
  };
  const categories = new Set<BenefitCategory>();
  for (const need of needs) {
    for (const cat of mapping[need]) {
      categories.add(cat);
    }
  }
  return Array.from(categories);
}
