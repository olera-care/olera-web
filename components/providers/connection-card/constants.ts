import type { CareRecipient, CareTypeValue, UrgencyValue } from "./types";

// ============================================================
// Recipient Options
// ============================================================

export const RECIPIENT_OPTIONS: { label: string; value: CareRecipient }[] = [
  { label: "Myself", value: "self" },
  { label: "My parent", value: "parent" },
  { label: "My spouse", value: "spouse" },
  { label: "Someone else", value: "other" },
];

export const RECIPIENT_LABELS: Record<CareRecipient, string> = {
  self: "Myself",
  parent: "My parent",
  spouse: "My spouse",
  other: "Someone else",
};

// ============================================================
// Care Type Options
// ============================================================

export const CARE_TYPE_LABELS: Record<CareTypeValue, string> = {
  assisted_living: "Assisted Living",
  home_care: "Home Care",
  memory_care: "Memory Care",
  home_health: "Home Health",
};

export function mapProviderCareTypes(): CareTypeValue[] {
  // Always show all 4 standard options
  return ["assisted_living", "home_care", "memory_care", "home_health"];
}

// ============================================================
// Urgency Options
// ============================================================

export const URGENCY_OPTIONS: { label: string; value: UrgencyValue }[] = [
  { label: "Immediately", value: "asap" },
  { label: "Within a month", value: "within_month" },
  { label: "In a few months", value: "few_months" },
  { label: "Just researching", value: "researching" },
];

export const URGENCY_LABELS: Record<UrgencyValue, string> = {
  asap: "Immediately",
  within_month: "Within a month",
  few_months: "In a few months",
  researching: "Just researching",
};

// ============================================================
// Profile → CTA Mappings (for pre-filling intent from profile)
// ============================================================

/** Profile relationship_to_recipient → CTA CareRecipient */
export const RECIPIENT_FROM_PROFILE: Record<string, CareRecipient> = {
  Myself: "self",
  "My parent": "parent",
  "My spouse": "spouse",
  "Someone else": "other",
  // Backward compat for profiles saved before the 4-option update
  "A loved one": "parent",
};

/** Profile timeline → CTA UrgencyValue */
export const URGENCY_FROM_TIMELINE: Record<string, UrgencyValue> = {
  immediate: "asap",
  within_1_month: "within_month",
  within_3_months: "few_months",
  exploring: "researching",
};

/** Profile care type display name → CTA CareTypeValue */
export const CARE_TYPE_FROM_DISPLAY: Record<string, CareTypeValue> = {
  "Home Care": "home_care",
  "Home Health Care": "home_health",
  "Assisted Living": "assisted_living",
  "Memory Care": "memory_care",
};
