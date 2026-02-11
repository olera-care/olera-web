import type { CareTypeValue, UrgencyValue } from "./types";

// ============================================================
// Care Type Display Mapping
// ============================================================

export const CARE_TYPE_LABELS: Record<CareTypeValue, string> = {
  companion: "Company & companionship",
  personal: "Help with daily activities",
  memory: "Memory & dementia support",
  skilled_nursing: "Medical or nursing care",
  other: "Something else",
};

/**
 * Map provider care_types strings to internal CareTypeValue.
 * Provider data may use human-readable names like "Personal Care".
 */
const CARE_TYPE_FROM_PROVIDER: Record<string, CareTypeValue> = {
  // Common provider category names
  "personal care": "personal",
  "companion care": "companion",
  "companionship": "companion",
  "memory care": "memory",
  "dementia care": "memory",
  "skilled nursing": "skilled_nursing",
  "nursing care": "skilled_nursing",
  "home care": "personal",
  "home health": "skilled_nursing",
  "home care (non-medical)": "personal",
  "home health care": "skilled_nursing",
  "assisted living": "personal",
  "independent living": "companion",
  "memory care | assisted living": "memory",
  "assisted living | independent living": "personal",
  "nursing home": "skilled_nursing",
};

export function mapProviderCareTypes(
  _providerCareTypes: string[]
): CareTypeValue[] {
  // Always show all standard options — the question is about
  // what the user needs, not what the provider offers
  return ["personal", "companion", "skilled_nursing", "memory"];
}

// ============================================================
// Urgency Options
// ============================================================

export const URGENCY_OPTIONS: { label: string; value: UrgencyValue }[] = [
  { label: "Within a week", value: "asap" },
  { label: "Within a month", value: "within_month" },
  { label: "In a few months", value: "few_months" },
  { label: "Just researching", value: "researching" },
];

// ============================================================
// Recipient Options
// ============================================================

export const RECIPIENT_OPTIONS = [
  { label: "Myself", value: "self" as const },
  { label: "A loved one", value: "loved_one" as const },
];

// ============================================================
// Display helpers
// ============================================================

export const RECIPIENT_LABELS: Record<string, string> = {
  self: "Myself",
  loved_one: "A loved one",
};

export const URGENCY_LABELS: Record<string, string> = {
  asap: "Within a week",
  within_month: "Within a month",
  few_months: "In a few months",
  researching: "Just researching",
};
