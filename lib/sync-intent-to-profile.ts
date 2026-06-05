/**
 * Shared helper to sync care seeker intent data from connections
 * back to their business_profiles record.
 *
 * Used by:
 * - POST /api/connections/request (auth + guest flows)
 * - PATCH /api/connections/update-intent
 */

import { calculateProfileCompletenessPercentage } from "@/components/portal/profile/completeness";
import { resolveCoordsFromCity } from "@/lib/profile-coords";

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
  /** Provider's category — used to pre-fill seeker care_types if empty */
  providerCategory?: string | null;
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

/** Maps provider category → enrichment care type value (used to auto-fill seeker care_types) */
const categoryToCareType: Record<string, string> = {
  // Database format (from profile.category)
  home_care_agency: "home_care",
  home_health_agency: "home_health",
  hospice_agency: "home_health",
  assisted_living: "assisted_living",
  memory_care: "memory_care",
  nursing_home: "nursing_home",
  independent_living: "independent_living",
  adult_day_care: "home_care",
  inpatient_hospice: "home_health",
  rehab_facility: "home_health",
  wellness_center: "home_care",
  private_caregiver: "home_care",
  // Display format (fallback for any providers with display-format categories)
  "Home Care": "home_care",
  "Home Care (Non-medical)": "home_care",
  "Home Health Care": "home_health",
  "Home Health": "home_health",
  "Assisted Living": "assisted_living",
  "Memory Care": "memory_care",
  "Nursing Home": "nursing_home",
  "Independent Living": "independent_living",
  "Hospice": "home_health",
  "Inpatient Hospice": "home_health",
  "Adult Day Care": "home_care",
  "Rehabilitation": "home_health",
  "Wellness Center": "home_care",
  "Private Caregiver": "home_care",
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
  intent: IntentData,
  email?: string | null
): Promise<void> {
  const { data: currentProfile } = await db
    .from("business_profiles")
    .select("metadata, care_types, phone, city, state, display_name, email, image_url, description")
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
  // If no careType provided, fall back to providerCategory to auto-fill
  const effectiveCareType = intent.careType ||
    (intent.providerCategory ? categoryToCareType[intent.providerCategory] : null);
  if (effectiveCareType && careTypeMap[effectiveCareType]) {
    const displayName = careTypeMap[effectiveCareType];
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

  // Sync seeker city/state from enrichment - user's explicit input always takes precedence
  // (This is the user's actual location entered in step 6, should override any auto-fill)
  if (intent.seekerCity) {
    updates.city = intent.seekerCity;
  }
  if (intent.seekerState) {
    updates.state = intent.seekerState;
  }

  // Pre-fill seeker location from provider's city if seeker has none (fallback for bouncers)
  // Only applies when: no seekerCity provided AND profile has no city AND no pending city update
  if (intent.providerCity && !currentProfile.city && !updates.city) {
    updates.city = intent.providerCity;
  }
  if (intent.providerState && !currentProfile.state && !updates.state) {
    updates.state = intent.providerState;
  }

  // Keep coordinates in sync with the city we just settled on. The block above already
  // encodes precedence — the seeker's own city (enrichment step 6) overrides; the
  // provider's city fills only if empty — so whenever we write a city, derive matching
  // city-center coords for the "families near you" catchment. (City-center precision is
  // fine for a ~50mi radius; see lib/profile-coords.) Only when the city is set this call,
  // so we never clobber more-precise coords on an unrelated update.
  if (updates.city !== undefined) {
    const coords = resolveCoordsFromCity(
      updates.city as string,
      (updates.state as string | undefined) ?? currentProfile.state,
    );
    if (coords) { updates.lat = coords.lat; updates.lng = coords.lng; }
  }

  // Recalculate profile completeness with merged data
  const mergedProfileData = {
    display_name: (updates.display_name as string) ?? currentProfile.display_name,
    image_url: currentProfile.image_url,
    city: (updates.city as string) ?? currentProfile.city,
    phone: (updates.phone as string) ?? currentProfile.phone,
    description: currentProfile.description,
    care_types: (updates.care_types as string[]) ?? currentProfile.care_types,
    metadata: currentMeta,
  };
  const profileEmail = email ?? currentProfile.email;
  const newCompleteness = calculateProfileCompletenessPercentage(mergedProfileData, profileEmail);
  currentMeta.profile_completeness = newCompleteness;
  updates.metadata = currentMeta;

  await db
    .from("business_profiles")
    .update(updates)
    .eq("id", profileId);
}

export { recipientMap, timelineMap, careTypeMap, careNeedMap, paymentMap };
