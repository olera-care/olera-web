/**
 * Shared helper to sync care seeker intent data from connections
 * back to their business_profiles record.
 *
 * Used by:
 * - POST /api/connections/request (auth + guest flows)
 * - PATCH /api/connections/update-intent
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export interface IntentData {
  careRecipient?: string | null;
  careType?: string | null;
  urgency?: string | null;
  additionalNotes?: string | null;
  phone?: string | null;
  notifyChannel?: string | null;
  /** Provider's city — used to pre-fill seeker location if empty */
  providerCity?: string | null;
  /** Provider's state — used to pre-fill seeker location if empty */
  providerState?: string | null;
  // Extended enrichment fields (post-CTA flow)
  /** Care need selected in enrichment (maps to metadata.care_needs[]) */
  careNeed?: string | null;
  /** Payment method selected in enrichment (maps to metadata.payment_methods[]) */
  paymentMethod?: string | null;
  /** Seeker's name from enrichment (maps to display_name if placeholder) */
  seekerName?: string | null;
  /** Seeker's city from enrichment (maps to city if empty) */
  seekerCity?: string | null;
  /** Seeker's state from enrichment (maps to state if empty) */
  seekerState?: string | null;
}

const recipientMap: Record<string, string> = {
  self: "Myself",
  parent: "My parent",
  spouse: "My spouse",
  other: "Someone else",
};

const timelineMap: Record<string, string> = {
  // Old format (from legacy enrichment)
  asap: "immediate",
  within_month: "within_1_month",
  few_months: "within_3_months",
  researching: "exploring",
  // New format (matches profile wizard) - pass through as-is
  immediate: "immediate",
  within_1_month: "within_1_month",
  within_3_months: "within_3_months",
  exploring: "exploring",
};

const careTypeMap: Record<string, string> = {
  home_care: "Home Care",
  home_health: "Home Health Care",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
  nursing_home: "Nursing Home",
  independent_living: "Independent Living",
};

/** Maps enrichment careNeed value → profile metadata.care_needs[] display value */
const careNeedMap: Record<string, string> = {
  // Current options
  daily_living: "Daily living help", // Merged from personal_care + household_tasks
  health_management: "Health management",
  companionship: "Companionship",
  memory_care: "Memory care",
  mobility_help: "Mobility help",
  // Legacy values (for backward compatibility with existing data)
  personal_care: "Personal care",
  household_tasks: "Household tasks",
};

/** Maps enrichment paymentMethod value → profile metadata.payment_methods[] display value */
const paymentMap: Record<string, string> = {
  medicare: "Medicare",
  medicaid: "Medicaid",
  private_insurance: "Private insurance",
  private_pay: "Private pay",
  veterans_benefits: "Veterans benefits",
  long_term_care_insurance: "Long-term care insurance",
};

export async function syncIntentToProfile(
  db: SupabaseClient,
  profileId: string,
  intent: IntentData
): Promise<void> {
  const { data: currentProfile } = await db
    .from("business_profiles")
    .select("metadata, care_types, phone, city, state, display_name")
    .eq("id", profileId)
    .single();

  if (!currentProfile) return;

  const currentMeta = (currentProfile.metadata || {}) as Record<string, unknown>;
  const currentCareTypes: string[] = currentProfile.care_types || [];
  const currentCareNeeds: string[] = (currentMeta.care_needs as string[]) || [];
  const currentPaymentMethods: string[] = (currentMeta.payment_methods as string[]) || [];
  const updates: Record<string, unknown> = {};

  // Map care_recipient → metadata.relationship_to_recipient
  if (intent.careRecipient && recipientMap[intent.careRecipient]) {
    currentMeta.relationship_to_recipient = recipientMap[intent.careRecipient];
  }

  // Map urgency → metadata.timeline
  if (intent.urgency && timelineMap[intent.urgency]) {
    currentMeta.timeline = timelineMap[intent.urgency];
  }

  // Map additionalNotes → metadata.about_situation
  if (intent.additionalNotes) {
    currentMeta.about_situation = intent.additionalNotes;
  }

  // Map notifyChannel → metadata.contact_preference
  // Supports both old format (text, whatsapp, email) and new format (Call, Text, Email)
  const contactPrefMap: Record<string, string> = {
    // Old format (from legacy enrichment)
    text: "Text",
    whatsapp: "Text", // WhatsApp maps to text preference (phone-based)
    email: "Email",
    // New format (matches profile wizard)
    Call: "Call",
    Text: "Text",
    Email: "Email",
  };
  if (intent.notifyChannel && contactPrefMap[intent.notifyChannel]) {
    currentMeta.contact_preference = contactPrefMap[intent.notifyChannel];
    if (intent.notifyChannel === "whatsapp") {
      currentMeta.whatsapp_opted_in = true;
    }
  }

  updates.metadata = currentMeta;

  // Map careType → care_types[] (append-only)
  if (intent.careType && careTypeMap[intent.careType]) {
    const displayName = careTypeMap[intent.careType];
    if (!currentCareTypes.includes(displayName)) {
      updates.care_types = [...currentCareTypes, displayName];
    }
  }

  // Map careNeed → metadata.care_needs[] (append single value)
  if (intent.careNeed && careNeedMap[intent.careNeed]) {
    const displayName = careNeedMap[intent.careNeed];
    if (!currentCareNeeds.includes(displayName)) {
      currentMeta.care_needs = [...currentCareNeeds, displayName];
    }
  }

  // Map paymentMethod → metadata.payment_methods[] (append single value)
  if (intent.paymentMethod && paymentMap[intent.paymentMethod]) {
    const displayName = paymentMap[intent.paymentMethod];
    if (!currentPaymentMethods.includes(displayName)) {
      currentMeta.payment_methods = [...currentPaymentMethods, displayName];
    }
  }

  // Sync phone only if profile phone is currently null
  if (intent.phone && !currentProfile.phone) {
    updates.phone = intent.phone;
  }

  // Sync seeker name from enrichment (only if profile name is placeholder or empty)
  const isPlaceholderName = !currentProfile.display_name || currentProfile.display_name === "Care Seeker";
  if (intent.seekerName && isPlaceholderName) {
    updates.display_name = intent.seekerName;
  }

  // Sync seeker city/state from enrichment (only if profile location is empty)
  if (intent.seekerCity && !currentProfile.city) {
    updates.city = intent.seekerCity;
  }
  if (intent.seekerState && !currentProfile.state) {
    updates.state = intent.seekerState;
  }

  // Pre-fill seeker location from provider's city if seeker has none (fallback)
  if (intent.providerCity && !currentProfile.city && !updates.city) {
    updates.city = intent.providerCity;
  }
  if (intent.providerState && !currentProfile.state && !updates.state) {
    updates.state = intent.providerState;
  }

  await db
    .from("business_profiles")
    .update(updates)
    .eq("id", profileId);
}

export { recipientMap, timelineMap, careTypeMap, careNeedMap, paymentMap };
