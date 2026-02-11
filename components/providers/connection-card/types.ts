// ============================================================
// ConnectionCard Types
// ============================================================

export type CardState =
  | "default" // State 1: All users on landing
  | "intent" // State 2: Intent capture (steps 1-3)
  | "submitting" // State 3: Auto-submitting after auth
  | "returning" // State 4: Returning user (not reachable until auth)
  | "confirmation" // State 5: Request sent
  | "pending" // State 6: Existing request
  | "inactive"; // State 7: Provider not accepting

export type IntentStep = 0 | 1 | 2;

export type CareRecipient = "self" | "loved_one";

export type CareTypeValue =
  | "companion"
  | "personal"
  | "memory"
  | "skilled_nursing"
  | "other";

export type UrgencyValue =
  | "asap"
  | "within_month"
  | "few_months"
  | "researching";

export interface IntentData {
  careRecipient: CareRecipient | null;
  careType: CareTypeValue | null;
  careTypeOtherText: string;
  urgency: UrgencyValue | null;
  additionalNotes: string;
}

export interface ConnectionCardProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  priceRange: string | null;
  oleraScore: number | null;
  reviewCount: number | undefined;
  phone: string | null;
  acceptedPayments: string[];
  careTypes: string[];
  isActive: boolean;
  responseTime: string | null; // null in v1
}
