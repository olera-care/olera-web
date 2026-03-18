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
}

const recipientMap: Record<string, string> = {
  self: "Myself",
  parent: "My parent",
  spouse: "My spouse",
  other: "Someone else",
};

const timelineMap: Record<string, string> = {
  asap: "immediate",
  within_month: "within_1_month",
  few_months: "within_3_months",
  researching: "exploring",
};

const careTypeMap: Record<string, string> = {
  home_care: "Home Care",
  home_health: "Home Health Care",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
};

export async function syncIntentToProfile(
  db: SupabaseClient,
  profileId: string,
  intent: IntentData
): Promise<void> {
  const { data: currentProfile } = await db
    .from("business_profiles")
    .select("metadata, care_types, phone")
    .eq("id", profileId)
    .single();

  if (!currentProfile) return;

  const currentMeta = (currentProfile.metadata || {}) as Record<string, unknown>;
  const currentCareTypes: string[] = currentProfile.care_types || [];
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

  updates.metadata = currentMeta;

  // Map careType → care_types[] (append-only)
  if (intent.careType && careTypeMap[intent.careType]) {
    const displayName = careTypeMap[intent.careType];
    if (!currentCareTypes.includes(displayName)) {
      updates.care_types = [...currentCareTypes, displayName];
    }
  }

  // Sync phone only if profile phone is currently null
  if (intent.phone && !currentProfile.phone) {
    updates.phone = intent.phone;
  }

  await db
    .from("business_profiles")
    .update(updates)
    .eq("id", profileId);
}

export { recipientMap, timelineMap, careTypeMap };
