// ============================================================
// ConnectionCard Types
// ============================================================

export type CardState =
  | "default" // State 1: Anonymous / no connection
  | "intent" // State 2: Intent capture (steps 1-3)
  | "returning" // State 3: Returning user (prior connection or past)
  | "pending" // State 4: Request sent, awaiting reply
  | "responded" // State 5: Provider accepted
  | "inactive"; // State 6: Provider not accepting

export type IntentStep = 0 | 1 | 2;

export type CareRecipient = "self" | "parent" | "spouse" | "other";

export type CareTypeValue =
  | "assisted_living"
  | "home_care"
  | "memory_care"
  | "home_health";

export type UrgencyValue =
  | "asap"
  | "within_month"
  | "few_months"
  | "researching";

export interface IntentData {
  careRecipient: CareRecipient | null;
  careType: CareTypeValue | null;
  urgency: UrgencyValue | null;
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
