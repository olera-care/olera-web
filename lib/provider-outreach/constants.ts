/**
 * Provider Outreach Constants
 *
 * Shared constants used across frontend and backend for provider outreach.
 */

/**
 * Valid reasons for marking a provider as "not_interested".
 * These help track why providers aren't claiming to identify conversion blockers.
 *
 * Used by:
 * - record-outcome API (Follow Up tab)
 * - update-stage API (action modal)
 * - Frontend confirmation dialogs
 */
export const NOT_INTERESTED_REASONS = [
  { value: "declined_explicitly", label: "Declined explicitly" },
  { value: "wrong_business_type", label: "Wrong business type" },
  { value: "out_of_business", label: "Out of business" },
  { value: "already_has_solution", label: "Already has a solution" },
  { value: "no_response_exhausted", label: "No response (exhausted)" },
  { value: "contact_unreachable", label: "Contact unreachable" },
  { value: "other", label: "Other" },
] as const;

export type NotInterestedReason = (typeof NOT_INTERESTED_REASONS)[number]["value"];

/**
 * Get array of just the reason values for validation
 */
export const NOT_INTERESTED_REASON_VALUES = NOT_INTERESTED_REASONS.map((r) => r.value);
