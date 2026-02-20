/**
 * Utility functions for the provider details page.
 */

import type { ProfileCategory } from "@/lib/types";
import type { Provider } from "@/components/providers/ProviderCard";
import { createClient } from "@/lib/supabase/server";
import {
  type Provider as IOSProvider,
  PROVIDERS_TABLE,
  toCardFormat,
} from "@/lib/types/provider";

// ============================================================
// Initials
// ============================================================

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ============================================================
// Category formatting
// ============================================================

const categoryLabels: Record<ProfileCategory, string> = {
  home_care_agency: "Home Care",
  home_health_agency: "Home Health",
  hospice_agency: "Hospice",
  independent_living: "Independent Living",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
  nursing_home: "Nursing Home",
  inpatient_hospice: "Inpatient Hospice",
  rehab_facility: "Rehabilitation",
  adult_day_care: "Adult Day Care",
  wellness_center: "Wellness Center",
  private_caregiver: "Private Caregiver",
};

export function formatCategory(category: ProfileCategory | null): string | null {
  if (!category) return null;
  return categoryLabels[category] || null;
}

// ============================================================
// Category-inferred highlights (used when real data is sparse)
// ============================================================

const categoryHighlights: Record<ProfileCategory, string[]> = {
  home_care_agency:    ["In-Home Care", "Certified Caregivers", "Companionship", "Light Housekeeping"],
  home_health_agency:  ["Skilled Nursing", "Health Monitoring", "In-Home Care", "Licensed Providers"],
  hospice_agency:      ["Nursing Care", "Wellness Support", "Community Resources", "Medication Management"],
  inpatient_hospice:   ["Nursing Care", "Medical Support", "Community Resources", "Wellness Programs"],
  assisted_living:     ["Licensed Community", "Social Activities", "Health Services", "Light Housekeeping"],
  memory_care:         ["Licensed Community", "Certified Staff", "Health Monitoring", "Social Activities"],
  independent_living:  ["Community Living", "Social Activities", "Light Housekeeping", "Wellness Programs"],
  nursing_home:        ["Skilled Nursing", "Licensed Facility", "Medical Care", "Rehabilitation"],
  rehab_facility:      ["Rehabilitation", "Medical Care", "Licensed Facility", "Exercise & Wellness"],
  adult_day_care:      ["Social Activities", "Health Services", "Community Programs", "Light Housekeeping"],
  wellness_center:     ["Exercise & Wellness", "Health Services", "Community Programs", "Certified Staff"],
  private_caregiver:   ["Certified Caregiver", "In-Home Care", "Companionship", "Light Housekeeping"],
};

export function getCategoryHighlights(category: ProfileCategory): string[] {
  return categoryHighlights[category] ?? [];
}

// ============================================================
// Category-inferred description (fallback when provider_description is null)
// ============================================================

const categoryDescriptionTemplates: Record<ProfileCategory, (name: string, location: string | null) => string> = {
  home_care_agency: (name, loc) =>
    `${name} is a home care agency${loc ? ` serving the ${loc} area` : ""}. They provide non-medical in-home care services including personal care assistance, companionship, meal preparation, and light housekeeping to help seniors and individuals live safely and comfortably at home.`,
  home_health_agency: (name, loc) =>
    `${name} is a home health agency${loc ? ` serving the ${loc} area` : ""}. They provide skilled medical services in the home including nursing care, physical therapy, occupational therapy, and health monitoring under the direction of a physician.`,
  hospice_agency: (name, loc) =>
    `${name} is a hospice care provider${loc ? ` serving the ${loc} area` : ""}. They offer compassionate end-of-life care focused on comfort, pain management, emotional support, and family counseling for patients and their loved ones.`,
  inpatient_hospice: (name, loc) =>
    `${name} is an inpatient hospice facility${loc ? ` in ${loc}` : ""}. They provide round-the-clock hospice care in a comfortable facility setting, offering pain management, symptom control, emotional support, and family services.`,
  assisted_living: (name, loc) =>
    `${name} is an assisted living community${loc ? ` in ${loc}` : ""}. They offer a supportive residential environment with personal care assistance, medication management, meals, housekeeping, and social activities for seniors who need help with daily living.`,
  memory_care: (name, loc) =>
    `${name} is a memory care community${loc ? ` in ${loc}` : ""}. They provide specialized care for individuals living with Alzheimer's disease and other forms of dementia in a secure, structured environment with trained staff and cognitive support programs.`,
  independent_living: (name, loc) =>
    `${name} is an independent living community${loc ? ` in ${loc}` : ""}. They offer maintenance-free residential living with amenities including dining, housekeeping, social activities, fitness programs, and transportation for active seniors.`,
  nursing_home: (name, loc) =>
    `${name} is a skilled nursing facility${loc ? ` in ${loc}` : ""}. They provide 24-hour nursing care, rehabilitation services, medication management, and personal care for residents who require ongoing medical supervision and support.`,
  rehab_facility: (name, loc) =>
    `${name} is a rehabilitation facility${loc ? ` in ${loc}` : ""}. They offer physical therapy, occupational therapy, speech therapy, and other rehabilitation services to help patients recover strength, mobility, and independence after illness, injury, or surgery.`,
  adult_day_care: (name, loc) =>
    `${name} is an adult day care center${loc ? ` in ${loc}` : ""}. They provide daytime supervision, social activities, meals, health monitoring, and therapeutic programs for seniors and adults who need assistance during the day.`,
  wellness_center: (name, loc) =>
    `${name} is a wellness center${loc ? ` in ${loc}` : ""}. They offer health and fitness programs, wellness education, preventive screenings, and community activities designed to support healthy aging and overall well-being.`,
  private_caregiver: (name, loc) =>
    `${name} is a private caregiver${loc ? ` serving the ${loc} area` : ""}. They provide one-on-one personal care, companionship, meal preparation, light housekeeping, and assistance with daily activities to help individuals maintain their independence at home.`,
};

export function getCategoryDescription(
  category: ProfileCategory,
  providerName: string,
  location: string | null,
): string {
  const template = categoryDescriptionTemplates[category];
  return template ? template(providerName, location) : "";
}

// ============================================================
// Category-inferred care services (used when real data is sparse)
// ============================================================

const categoryServices: Record<ProfileCategory, string[]> = {
  home_care_agency: [
    "Personal care assistance", "Bathing and grooming", "Meal preparation",
    "Medication reminders", "Light housekeeping", "Companionship",
    "Transportation services", "Mobility assistance", "Errands and shopping",
  ],
  home_health_agency: [
    "Skilled nursing", "Physical therapy", "Occupational therapy",
    "Medication management", "Wound care", "Health monitoring",
    "Speech therapy", "IV therapy", "Patient education",
  ],
  hospice_agency: [
    "Pain management", "Nursing care", "Emotional support",
    "Spiritual counseling", "Family support", "Bereavement services",
    "Medication management", "Respite care", "Comfort care",
  ],
  inpatient_hospice: [
    "24-hour nursing care", "Pain management", "Symptom management",
    "Emotional support", "Spiritual counseling", "Family support",
    "Bereavement services", "Comfort care", "Medication management",
  ],
  assisted_living: [
    "Personal care assistance", "Medication management", "Meals and dining",
    "Housekeeping and laundry", "Social activities", "Transportation",
    "Exercise and wellness", "Health monitoring", "Emergency response",
  ],
  memory_care: [
    "Cognitive stimulation", "Personal care assistance", "Medication management",
    "Structured daily activities", "Secure environment", "Meals and dining",
    "Behavioral support", "Health monitoring", "Family education",
  ],
  independent_living: [
    "Meals and dining", "Housekeeping", "Social activities",
    "Fitness and wellness", "Transportation", "Community events",
    "Maintenance services", "Recreational programs", "Concierge services",
  ],
  nursing_home: [
    "Skilled nursing", "Medication management", "Physical therapy",
    "Occupational therapy", "Meals and dining", "Personal care assistance",
    "Social activities", "Wound care", "Rehabilitation services",
  ],
  rehab_facility: [
    "Physical therapy", "Occupational therapy", "Speech therapy",
    "Pain management", "Skilled nursing", "Mobility training",
    "Strength conditioning", "Post-surgical care", "Patient education",
  ],
  adult_day_care: [
    "Social activities", "Health monitoring", "Meals and snacks",
    "Exercise programs", "Cognitive activities", "Personal care assistance",
    "Medication management", "Transportation", "Therapeutic recreation",
  ],
  wellness_center: [
    "Exercise programs", "Health screenings", "Nutrition counseling",
    "Fitness classes", "Wellness education", "Social activities",
    "Stress management", "Balance and fall prevention", "Community programs",
  ],
  private_caregiver: [
    "Personal care assistance", "Companionship", "Meal preparation",
    "Light housekeeping", "Medication reminders", "Transportation",
    "Mobility assistance", "Errands and shopping", "Overnight care",
  ],
};

export function getCategoryServices(category: ProfileCategory): string[] {
  return categoryServices[category] ?? [];
}

// ============================================================
// Quick Facts builder
// ============================================================

export interface QuickFact {
  label: string;
  value: string;
  icon: "category" | "location" | "calendar" | "users" | "award" | "shield" | "dollar";
}

interface QuickFactsInput {
  yearFounded?: number;
  bedCount?: number;
  yearsExperience?: number;
  acceptsMedicaid?: boolean;
  acceptsMedicare?: boolean;
  backgroundChecked?: boolean;
  licensed?: boolean;
}

export function buildQuickFacts(input: QuickFactsInput): QuickFact[] {
  const facts: QuickFact[] = [];

  if (input.yearFounded) {
    const yearsInBusiness = new Date().getFullYear() - input.yearFounded;
    facts.push({ label: "Founded", value: `Est. ${input.yearFounded} (${yearsInBusiness} yrs)`, icon: "calendar" });
  }

  if (input.bedCount) {
    facts.push({ label: "Capacity", value: `${input.bedCount} beds`, icon: "users" });
  }

  if (input.yearsExperience) {
    facts.push({ label: "Experience", value: `${input.yearsExperience} years`, icon: "award" });
  }

  if (input.acceptsMedicare || input.acceptsMedicaid) {
    const types = [];
    if (input.acceptsMedicare) types.push("Medicare");
    if (input.acceptsMedicaid) types.push("Medicaid");
    facts.push({ label: "Insurance", value: types.join(" & "), icon: "shield" });
  }

  if (input.backgroundChecked) {
    facts.push({ label: "", value: "Background Checked", icon: "shield" });
  }

  if (input.licensed) {
    facts.push({ label: "", value: "Licensed & Insured", icon: "award" });
  }

  return facts;
}

// ============================================================
// Default Q&A (category-aware)
// ============================================================

export interface QAItem {
  question: string;
  answer: string;
}

export function getDefaultQA(
  category: ProfileCategory | null,
  providerName: string
): QAItem[] {
  const faqs: QAItem[] = [
    {
      question: `What should I expect during my first visit to ${providerName}?`,
      answer:
        "We encourage families to schedule a tour to see our community firsthand. During your visit, you'll meet our care team, see available living spaces, and learn about our daily programs and activities.",
    },
    {
      question: "What is included in the monthly cost?",
      answer:
        "Our base fee typically covers housing, meals, housekeeping, and basic care services. Additional services such as medication management or specialized care programs may have additional fees. Contact us for a detailed breakdown.",
    },
    {
      question: "How do you handle medical emergencies?",
      answer:
        "Our staff is trained in emergency response protocols. We maintain 24/7 on-call medical support and have established relationships with local hospitals and emergency services for immediate care when needed.",
    },
  ];

  // Add category-specific questions
  if (category === "memory_care") {
    faqs.push({
      question: "What specialized memory care programs do you offer?",
      answer:
        "We offer evidence-based memory care programs including cognitive stimulation therapy, reminiscence activities, and structured daily routines designed to support individuals living with Alzheimer's and other forms of dementia.",
    });
  } else if (category === "home_care_agency" || category === "home_health_agency") {
    faqs.push({
      question: "How are your caregivers screened and trained?",
      answer:
        "All caregivers undergo thorough background checks, reference verification, and skills assessments. They receive ongoing training in areas including fall prevention, medication management, and dementia care techniques.",
    });
  } else if (category === "hospice_agency" || category === "inpatient_hospice") {
    faqs.push({
      question: "What support do you provide for family members?",
      answer:
        "We offer comprehensive family support including counseling, bereavement services, respite care, and educational resources. Our social workers and chaplains are available to help families navigate this journey.",
    });
  } else if (category === "independent_living") {
    faqs.push({
      question: "Can residents personalize their living spaces?",
      answer:
        "Yes, we encourage residents to bring personal belongings, furniture, and decorations to make their space feel like home. Our team can help with the transition and setup.",
    });
  }

  return faqs;
}

// ============================================================
// Similar providers (fetched from Supabase)
// ============================================================

// Map ProfileCategory to Supabase provider_category values
const categoryToSupabaseCategory: Record<string, string> = {
  home_care_agency: "Home Care (Non-medical)",
  home_health_agency: "Home Health Care",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
  independent_living: "Independent Living",
  nursing_home: "Nursing Home",
  hospice_agency: "Hospice",
  inpatient_hospice: "Hospice",
  rehab_facility: "Nursing Home",
  adult_day_care: "Home Care (Non-medical)",
  wellness_center: "Home Care (Non-medical)",
  private_caregiver: "Home Care (Non-medical)",
};

export async function getSimilarProviders(
  category: ProfileCategory | null,
  excludeSlug: string,
  limit: number = 3
): Promise<Provider[]> {
  if (!category) return [];

  const supabaseCategory = categoryToSupabaseCategory[category];
  if (!supabaseCategory) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(PROVIDERS_TABLE)
      .select("*")
      .not("deleted", "is", true)
      .ilike("provider_category", `%${supabaseCategory}%`)
      .neq("provider_id", excludeSlug)
      .not("provider_images", "is", null)
      .order("google_rating", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error || !data) return [];

    return (data as IOSProvider[]).map(toCardFormat);
  } catch {
    return [];
  }
}
