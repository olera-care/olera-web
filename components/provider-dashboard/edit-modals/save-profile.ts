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

// Core display fields that, for a directory-linked provider, belong on the
// directory row (the single display record the public page renders). These are
// routed through the ownership-checked server API, which writes olera-providers
// AND mirrors back to business_profiles. Everything else (care_types, image_url,
// editorial metadata) stays on business_profiles as before. Photos/pricing are
// a later, careful pass (transforms / public-page change).
const DIRECTORY_CORE_FIELDS = new Set([
  "display_name",
  "description",
  "category",
  "phone",
  "email",
  "website",
  "address",
  "city",
  "state",
  "zip",
]);

/**
 * Save profile changes to Supabase.
 * Merges metadata fields with existing metadata to preserve unrelated fields.
 *
 * For a directory-linked provider (business_profiles.source_provider_id set),
 * core display fields are routed to the directory row via the server API so the
 * provider edits the same record the public page shows. Account-first providers
 * (no source_provider_id) keep the original business_profiles-only behavior.
 */
export async function saveProfile({
  profileId,
  topLevelFields = {},
  metadataFields = {},
  existingMetadata,
}: SaveProfileArgs): Promise<void> {
  const supabase = createClient();

  // Is this a directory-linked provider? RLS lets the owner read their own row.
  const { data: link } = await supabase
    .from("business_profiles")
    .select("source_provider_id")
    .eq("id", profileId)
    .maybeSingle();
  const sourceProviderId =
    (link as { source_provider_id: string | null } | null)?.source_provider_id ?? null;

  // Split top-level fields into directory-core vs business_profiles-only.
  const directoryFields: Record<string, unknown> = {};
  const bpTopLevel: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(topLevelFields)) {
    if (sourceProviderId && DIRECTORY_CORE_FIELDS.has(k)) directoryFields[k] = v;
    else bpTopLevel[k] = v;
  }

  // Route core display fields to the directory row (writes olera-providers +
  // mirrors to business_profiles) so edits appear on the public page.
  if (sourceProviderId && Object.keys(directoryFields).length > 0) {
    const res = await fetch("/api/provider/profile/directory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ profileId, fields: directoryFields }),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(b.error || "Could not save profile changes");
    }
  }

  // Everything else (bp-only top-level + metadata) writes to business_profiles.
  const update: Record<string, unknown> = { ...bpTopLevel };
  if (Object.keys(metadataFields).length > 0) {
    update.metadata = {
      ...existingMetadata,
      ...metadataFields,
    };
  }
  if (Object.keys(update).length > 0) {
    const { error } = await supabase
      .from("business_profiles")
      .update(update)
      .eq("id", profileId);
    if (error) {
      throw new Error(error.message);
    }
  }
}
