import { createBrowserClient } from "@supabase/ssr";

interface SaveProfileArgs {
  profileId: string;
  /** Top-level column updates (display_name, city, etc.) */
  topLevelFields?: Record<string, unknown>;
  /** Metadata JSONB field updates (merged with existing metadata) */
  metadataFields?: Record<string, unknown>;
}

/**
 * Save student profile changes to Supabase.
 * Always fetches fresh metadata before merging to prevent data loss.
 */
export async function saveStudentProfile({
  profileId,
  topLevelFields = {},
  metadataFields = {},
}: SaveProfileArgs): Promise<void> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Always fetch fresh metadata to prevent overwriting concurrent changes
  const { data: current } = await supabase
    .from("business_profiles")
    .select("metadata")
    .eq("id", profileId)
    .single();

  const existingMetadata = (current?.metadata || {}) as Record<string, unknown>;

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
