import { createClient } from "@/lib/supabase/client";

interface SaveProfileArgs {
  profileId: string;
  /** Top-level column updates (display_name, city, care_types, etc.) */
  topLevelFields?: Record<string, unknown>;
  /** Metadata JSONB field updates (merged with existing metadata) */
  metadataFields?: Record<string, unknown>;
  /** Raw profile.metadata — used as base for merge (NOT enriched ExtendedMetadata) */
  existingMetadata: Record<string, unknown>;
}

/**
 * Save profile changes to Supabase.
 * Merges metadata fields with existing metadata to preserve unrelated fields.
 */
export async function saveProfile({
  profileId,
  topLevelFields = {},
  metadataFields = {},
  existingMetadata,
}: SaveProfileArgs): Promise<void> {
  const supabase = createClient();

  const update: Record<string, unknown> = { ...topLevelFields };

  if (Object.keys(metadataFields).length > 0) {
    update.metadata = {
      ...existingMetadata,
      ...metadataFields,
    };
  }

  const { error } = await supabase
    .from("business_profiles")
    .update(update)
    .eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }
}
