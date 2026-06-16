/**
 * Auto-restore utility for connections.
 *
 * When a provider engages with a lead (opens it, clicks contact info, etc.),
 * we automatically restore the connection to active tracking if needed.
 *
 * Handles two cases:
 * 1. Archived leads (provider portal declines) - unarchive and restart sequence
 * 2. Admin "not interested" leads - clear override and restart sequence
 *
 * Exclusions:
 * - Provider-level archives only - these are a hard block on ALL emails to that provider
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Events that trigger auto-restore when a provider engages with a lead.
 */
export const RESTORE_TRIGGER_EVENTS = [
  "lead_opened",
  "phone_clicked",
  "email_link_clicked",
  "continue_in_inbox",
] as const;

export type RestoreTriggerEvent = (typeof RESTORE_TRIGGER_EVENTS)[number];

export interface AutoRestoreResult {
  restored: boolean;
  action?: "unarchived" | "cleared_admin_override";
  skipReason?: string;
}

/**
 * Automatically restore a connection when a provider engages with it.
 *
 * This function:
 * - Fetches the connection and its metadata
 * - Checks if the connection needs restoration (archived OR admin "not interested")
 * - Clears archive flags and/or admin_override
 * - RESTARTS the email sequence (clears followup_stopped_at)
 * - Tracks the restore event in metadata
 *
 * @param db - Supabase client with service role access
 * @param connectionId - The connection ID to potentially restore
 * @param reason - Why the restore is happening (e.g., "lead_opened")
 * @returns Result indicating whether restore occurred and what action was taken
 */
export async function autoRestoreConnection(
  db: SupabaseClient,
  connectionId: string,
  reason: string
): Promise<AutoRestoreResult> {
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
      return { restored: false, skipReason: "connection_not_found" };
    }

    const connectionMeta = (connection.metadata || {}) as Record<string, unknown>;
    const providerMeta = ((connection.providers as { metadata?: Record<string, unknown> } | null)?.metadata || {}) as Record<string, unknown>;

    // Skip if provider is archived at the provider level (hard block)
    if (providerMeta.admin_archived === true) {
      return { restored: false, skipReason: "provider_level_archived" };
    }

    // Check what needs to be restored
    const isArchived = connectionMeta.archived === true;
    const adminOverride = connectionMeta.admin_override as { status?: string } | undefined;
    const isAdminNotInterested = adminOverride?.status === "not_interested";

    // Skip if nothing to restore
    if (!isArchived && !isAdminNotInterested) {
      return { restored: false, skipReason: "nothing_to_restore" };
    }

    // Build updated metadata
    const updatedMetadata: Record<string, unknown> = {
      ...connectionMeta,
      // Track when and why this was restored
      auto_restored_at: new Date().toISOString(),
      auto_restored_reason: reason,
      // RESTART the email sequence - provider is re-engaging
      followup_stopped_at: null,
      followup_stopped_reason: null,
    };

    // Clear archive flags if archived
    if (isArchived) {
      updatedMetadata.archived = false;
      updatedMetadata.archive_reason = null;
      updatedMetadata.archived_at = null;
    }

    // Clear admin override if admin marked "not interested"
    if (isAdminNotInterested) {
      updatedMetadata.admin_override = null;
    }

    // Update connection
    const { error: updateError } = await db
      .from("connections")
      .update({ metadata: updatedMetadata })
      .eq("id", connectionId);

    if (updateError) {
      console.error("[autoRestoreConnection] Update failed:", updateError);
      return { restored: false, skipReason: "update_failed" };
    }

    const action = isArchived ? "unarchived" : "cleared_admin_override";
    console.log(`[autoRestoreConnection] Restored connection ${connectionId}: ${action} (trigger: ${reason})`);

    return { restored: true, action };
  } catch (err) {
    console.error("[autoRestoreConnection] Error:", err);
    return { restored: false, skipReason: "error" };
  }
}

// Export old name for backwards compatibility during transition
export const autoUnarchiveConnection = autoRestoreConnection;
export const UNARCHIVE_TRIGGER_EVENTS = RESTORE_TRIGGER_EVENTS;
export type AutoUnarchiveResult = AutoRestoreResult;
