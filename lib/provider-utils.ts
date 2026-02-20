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
