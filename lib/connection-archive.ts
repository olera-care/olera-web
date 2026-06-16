/**
 * Auto-unarchive utility for connections.
 *
 * When a provider engages with an archived lead (opens it, clicks contact info, etc.),
 * we automatically unarchive the connection to restore it to active tracking.
 *
 * This includes admin-marked "not interested" leads - if the provider later engages,
 * they clearly changed their mind, so we restore them to active tracking.
 *
 * Exclusions:
 * - Provider-level archives only - these are a hard block on ALL emails to that provider
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Events that trigger auto-unarchive when a provider engages with an archived lead.
 */
export const UNARCHIVE_TRIGGER_EVENTS = [
  "lead_opened",
  "phone_clicked",
  "email_link_clicked",
  "continue_in_inbox",
] as const;

export type UnarchiveTriggerEvent = (typeof UNARCHIVE_TRIGGER_EVENTS)[number];

export interface AutoUnarchiveResult {
  unarchived: boolean;
  skipReason?: string;
}

/**
 * Automatically unarchive a connection when a provider engages with it.
 *
 * This function:
 * - Fetches the connection and its metadata
 * - Checks if the connection should be unarchived (only excludes provider-level archives)
 * - Clears archive flags and admin_override while preserving followup_stopped_at (no email restart)
 * - Tracks the auto-unarchive event in metadata
 *
 * @param db - Supabase client with service role access
 * @param connectionId - The connection ID to potentially unarchive
 * @param reason - Why the unarchive is happening (e.g., "lead_opened")
 * @returns Result indicating whether unarchive occurred and why it was skipped if not
 */
export async function autoUnarchiveConnection(
  db: SupabaseClient,
  connectionId: string,
  reason: string
): Promise<AutoUnarchiveResult> {
  try {
    // Fetch connection with provider metadata
    const { data: connection, error: fetchError } = await db
      .from("connections")
      .select(`
        id,
        metadata,
        provider_id,
        providers!inner (
          id,
          metadata
        )
      `)
      .eq("id", connectionId)
      .single();

    if (fetchError || !connection) {
      return { unarchived: false, skipReason: "connection_not_found" };
    }

    const connectionMeta = (connection.metadata || {}) as Record<string, unknown>;
    const providerMeta = ((connection.providers as { metadata?: Record<string, unknown> } | null)?.metadata || {}) as Record<string, unknown>;

    // Skip if not archived
    if (!connectionMeta.archived) {
      return { unarchived: false, skipReason: "not_archived" };
    }

    // Skip if provider is archived at the provider level (hard block)
    // Note: We DO auto-unarchive admin "not interested" leads - that's a soft rejection
    // and if the provider engages, they clearly changed their mind
    if (providerMeta.admin_archived === true) {
      return { unarchived: false, skipReason: "provider_level_archived" };
    }

    // Clear archive flags but keep followup_stopped_at (no email restart)
    // Also clear admin_override since provider has now shown genuine interest
    const updatedMetadata: Record<string, unknown> = {
      ...connectionMeta,
      archived: false,
      archive_reason: null,
      archived_at: null,
      admin_override: null, // Clear - provider engagement overrides admin's soft rejection
      // Track when and why this was auto-unarchived
      auto_unarchived_at: new Date().toISOString(),
      auto_unarchived_reason: reason,
      // Keep followup_stopped_at and followup_stopped_reason intact
    };

    // Update connection
    const { error: updateError } = await db
      .from("connections")
      .update({ metadata: updatedMetadata })
      .eq("id", connectionId);

    if (updateError) {
      console.error("[autoUnarchiveConnection] Update failed:", updateError);
      return { unarchived: false, skipReason: "update_failed" };
    }

    return { unarchived: true };
  } catch (err) {
    console.error("[autoUnarchiveConnection] Error:", err);
    return { unarchived: false, skipReason: "error" };
  }
}
