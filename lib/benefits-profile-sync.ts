import type { BenefitsIntakeAnswers, CarePreference, PrimaryNeed } from "@/lib/types/benefits";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

// Maps care preference → living_situation (must match LIVING_OPTIONS in ProfileEditContent)
const CARE_PREF_TO_LIVING: Record<CarePreference, string | null> = {
  stayHome: "Lives alone",
  exploringFacility: "Assisted living facility",
  unsure: null,
};

// Maps primary needs → care_types display names (must match CARE_TYPES in ProfileEditContent)
const NEED_TO_CARE_TYPE: Record<PrimaryNeed, string | null> = {
  personalCare: "Home Care",
  householdTasks: "Home Care",
  healthManagement: "Home Health Care",
  companionship: "Home Care",
  financialHelp: null,
  memoryCare: "Memory Care",
  mobilityHelp: "Rehabilitation",
};

interface ProfileSyncPayload {
  city?: string;
  state?: string;
  care_types?: string[];
  metadata: Partial<FamilyMetadata>;
}

/**
 * Compute what fields should be written from benefits intake to a profile.
 * Returns null if nothing needs updating (all fields already populated).
 */
export function computeBenefitsProfileSync(
  answers: BenefitsIntakeAnswers,
  locationDisplay: string,
  currentProfile: BusinessProfile
): ProfileSyncPayload | null {
  const meta = (currentProfile.metadata || {}) as FamilyMetadata;
  const payload: ProfileSyncPayload = { metadata: {} };
  let hasChanges = false;

  // Location → city + state (only if empty)
  if (!currentProfile.city && locationDisplay) {
    const parts = locationDisplay.split(", ");
    if (parts.length >= 2) {
      payload.city = parts[0].trim();
      payload.state = parts[1].trim();
      hasChanges = true;
    }
  }

  // Care preference → living_situation (only if empty)
  if (!meta.living_situation && answers.carePreference) {
    const mapped = CARE_PREF_TO_LIVING[answers.carePreference];
    if (mapped) {
      payload.metadata.living_situation = mapped;
      hasChanges = true;
    }
  }

  // Primary needs → care_types (only if empty)
  if ((!currentProfile.care_types || currentProfile.care_types.length === 0) && answers.primaryNeeds.length > 0) {
    const mapped = new Set<string>();
    for (const need of answers.primaryNeeds) {
      const ct = NEED_TO_CARE_TYPE[need];
      if (ct) mapped.add(ct);
    }
    if (mapped.size > 0) {
      payload.care_types = Array.from(mapped);
      hasChanges = true;
    }
  }

  // Medicaid → append to payment_methods (don't overwrite)
  if (answers.medicaidStatus === "alreadyHas" || answers.medicaidStatus === "applying") {
    const current = meta.payment_methods || [];
    if (!current.includes("Medicaid")) {
      payload.metadata.payment_methods = [...current, "Medicaid"];
      hasChanges = true;
    }
  }

  return hasChanges ? payload : null;
}

/**
 * Read current profile, compute sync, and write to DB.
 * Fire-and-forget — logs errors but never throws.
 */
export async function syncBenefitsToProfile(
  answers: BenefitsIntakeAnswers,
  locationDisplay: string,
  profileId: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = createClient();

    const { data: current } = await supabase
      .from("business_profiles")
      .select("city, state, care_types, metadata")
      .eq("id", profileId)
      .single();

    if (!current) return;

    const payload = computeBenefitsProfileSync(
      answers,
      locationDisplay,
      current as unknown as BusinessProfile
    );

    if (!payload) return;

    const currentMeta = (current.metadata || {}) as FamilyMetadata;
    const update: Record<string, unknown> = {
      metadata: { ...currentMeta, ...payload.metadata },
    };

    if (payload.city) update.city = payload.city;
    if (payload.state) update.state = payload.state;
    if (payload.care_types) update.care_types = payload.care_types;

    await supabase
      .from("business_profiles")
      .update(update)
      .eq("id", profileId);
  } catch (err) {
    console.error("[olera] Benefits profile sync failed:", err);
  }
}
