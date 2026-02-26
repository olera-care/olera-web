// Display maps for building auto-intro messages.
// Shared between connection creation and care-request update routes.

export const CARE_TYPE_DISPLAY: Record<string, string> = {
  home_care: "Home Care",
  home_health: "Home Health Care",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
};

export const RECIPIENT_DISPLAY: Record<string, string> = {
  self: "myself",
  Myself: "myself",
  parent: "my parent",
  "My parent": "my parent",
  spouse: "my spouse",
  "My spouse": "my spouse",
  other: "my loved one",
  "Someone else": "my loved one",
  // Backward compat
  "A loved one": "my loved one",
};

export const TIMELINE_DISPLAY: Record<string, string> = {
  asap: "I need care as soon as possible.",
  immediate: "I need care as soon as possible.",
  within_month: "I'm hoping to get started within a month.",
  within_1_month: "I'm hoping to get started within a month.",
  few_months: "I'm hoping to get started within a few months.",
  within_3_months: "I'm hoping to get started within a few months.",
  researching: "I'm currently researching options.",
  exploring: "I'm currently researching options.",
};

/**
 * Build a natural intro message from the care seeker's profile + intent data.
 * Uses intentData (CTA) when available, falls back to profile fields (matches).
 */
export function buildIntroMessage(
  profileCareTypes: string[],
  providerCareTypes: string[],
  relationship: string | undefined,
  timeline: string | undefined,
  intentCareType: string | null | undefined,
  intentRecipient: string | null | undefined,
  intentUrgency: string | null | undefined,
): string {
  // Resolve care type: prefer intent → match provider → first from profile
  let careType: string | null = null;
  if (intentCareType) {
    careType = CARE_TYPE_DISPLAY[intentCareType] || intentCareType;
  } else if (profileCareTypes.length > 0) {
    const match = profileCareTypes.find(ct =>
      providerCareTypes.some(pct => pct.toLowerCase() === ct.toLowerCase())
    );
    careType = match || profileCareTypes[0];
  }

  // Resolve recipient: prefer intent → profile
  let recipientPhrase: string | null = null;
  const recipientKey = intentRecipient || relationship;
  if (recipientKey) {
    recipientPhrase = RECIPIENT_DISPLAY[recipientKey] || recipientKey.toLowerCase();
  }

  // Resolve timeline: prefer intent → profile
  const timelineKey = intentUrgency || timeline;
  const timelinePhrase = timelineKey ? TIMELINE_DISPLAY[timelineKey] || null : null;

  // Build the looking-for clause
  let lookingFor: string;
  if (careType && recipientPhrase) {
    lookingFor = `I'm looking for ${careType} for ${recipientPhrase}.`;
  } else if (careType) {
    lookingFor = `I'm looking for ${careType}.`;
  } else if (recipientPhrase) {
    lookingFor = `I'm looking for care for ${recipientPhrase}.`;
  } else {
    lookingFor = `I'd love to learn more about your services.`;
  }

  // Assemble
  const parts = [`Hi, ${lookingFor}`];
  if (timelinePhrase) parts.push(timelinePhrase);
  if (careType || recipientPhrase) {
    parts.push("I'd love to learn more about your services.");
  }

  return parts.join(" ");
}
