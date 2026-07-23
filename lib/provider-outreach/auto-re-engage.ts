/**
 * Auto Re-Engage Function for Provider Outreach
 *
 * Purpose:
 *   Automatically process providers who have been in the re_engage stage for
 *   at least RE_ENGAGE_WAITING_PERIOD_DAYS (30 days).
 *
 * Logic:
 *   - Cycle 1 providers → Move to "not_contacted" (Ready tab) as cycle 2
 *   - Cycle 2 providers → Move to "not_interested" (soft terminal)
 *
 * Terminal States:
 *   - not_interested = soft terminal (stops outreach, questions/connections still flow)
 *   - archived = hard terminal (system-wide block, only set via explicit Archive action)
 *
 * This ensures providers get a second chance at outreach after a cooling-off
 * period, but are moved to soft terminal after two unsuccessful cycles.
 */

import { createClient } from "@supabase/supabase-js";
import { RE_ENGAGE_WAITING_PERIOD_DAYS } from "./cadence";

// Re-export the constant for external visibility
export { RE_ENGAGE_WAITING_PERIOD_DAYS };

/**
 * Result of processing a single provider
 */
interface ProcessResult {
  provider_id: string;
  action: "cycle_started" | "soft_terminal" | "error";
  new_cycle?: number;
  new_stage?: string;
  error?: string;
}

/**
 * Result of the batch processing operation
 */
export interface AutoReEngageResult {
  processed: number;
  cycle_started: number;
  soft_terminal: number;
  errors: number;
  results: ProcessResult[];
}

/**
 * Find providers eligible for automatic re-engagement.
 *
 * Eligibility criteria:
 *   - Stage is "re_engage"
 *   - re_engage_entered_at is at least RE_ENGAGE_WAITING_PERIOD_DAYS ago
 *
 * @param db - Supabase client with service role access
 * @returns Array of eligible provider tracking records
 */
export async function findEligibleReEngageProviders(
  db: ReturnType<typeof createClient>
): Promise<Array<{
  id: string;
  provider_id: string;
  cycle_number: number;
  re_engage_entered_at: string;
  city: string | null;
  state: string | null;
}>> {
  // Calculate the cutoff date (30 days ago)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RE_ENGAGE_WAITING_PERIOD_DAYS);
  const cutoffIso = cutoffDate.toISOString();

  const { data, error } = await db
    .from("provider_outreach_tracking")
    .select("id, provider_id, cycle_number, re_engage_entered_at, city, state")
    .eq("stage", "re_engage")
    .not("re_engage_entered_at", "is", null)
    .lte("re_engage_entered_at", cutoffIso);

  if (error) {
    console.error("[auto-re-engage] Query error:", error);
    throw new Error("Failed to query eligible providers");
  }

  return data || [];
}

/**
 * Process a single provider's re-engagement action.
 *
 * This is the same logic as the manual /api/admin/provider-outreach/re-engage
 * endpoint, but designed to be called from an automated context.
 *
 * @param db - Supabase client with service role access
 * @param trackingRecord - The provider's tracking record
 * @param systemUserId - User ID for audit logging (use a system account)
 * @returns Processing result
 */
async function processProvider(
  db: ReturnType<typeof createClient>,
  trackingRecord: {
    id: string;
    provider_id: string;
    cycle_number: number;
    re_engage_entered_at: string;
  },
  systemUserId: string | null
): Promise<ProcessResult> {
  const { id, provider_id, cycle_number } = trackingRecord;
  const nowIso = new Date().toISOString();

  try {
    if (cycle_number === 1) {
      // ── Cycle 1 → Start Cycle 2 ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (db as any)
        .from("provider_outreach_tracking")
        .update({
          stage: "not_contacted",
          stage_changed_at: nowIso,
          cycle_number: 2,
          resend_count: 0,
          no_answer_count: 0,
          due_date: null,
          re_engage_entered_at: null,
          updated_at: nowIso,
        })
        .eq("id", id);

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      // Log touchpoints
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from("provider_outreach_touchpoints").insert([
        {
          provider_id,
          touchpoint_type: "cycle_started",
          details: {
            cycle: 2,
            previous_stage: "re_engage",
            new_stage: "not_contacted",
            trigger: "auto_re_engage",
            wait_days: RE_ENGAGE_WAITING_PERIOD_DAYS,
          },
          admin_user_id: systemUserId,
          created_at: nowIso,
        },
        {
          provider_id,
          touchpoint_type: "stage_changed",
          details: {
            old_stage: "re_engage",
            new_stage: "not_contacted",
            trigger: "auto_re_engage_cycle_start",
            cycle: 2,
          },
          admin_user_id: systemUserId,
          created_at: nowIso,
        },
      ]);

      return {
        provider_id,
        action: "cycle_started",
        new_cycle: 2,
        new_stage: "not_contacted",
      };
    } else {
      // ── Cycle 2 → Not Interested (soft terminal) ──
      // Two cycles exhausted, move to soft terminal
      // Provider stops receiving outreach but can still get questions/connections
      const terminalReason = "unresponsive_after_two_cycles";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (db as any)
        .from("provider_outreach_tracking")
        .update({
          stage: "not_interested",
          stage_changed_at: nowIso,
          notes: terminalReason,
          re_engage_entered_at: null,
          updated_at: nowIso,
        })
        .eq("id", id);

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      // Log touchpoints
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from("provider_outreach_touchpoints").insert([
        {
          provider_id,
          touchpoint_type: "cycle_exhausted",
          details: {
            cycles_completed: 2,
            reason: terminalReason,
            terminal_stage: "not_interested",
            trigger: "auto_re_engage",
            wait_days: RE_ENGAGE_WAITING_PERIOD_DAYS,
          },
          admin_user_id: systemUserId,
          created_at: nowIso,
        },
        {
          provider_id,
          touchpoint_type: "stage_changed",
          details: {
            old_stage: "re_engage",
            new_stage: "not_interested",
            trigger: "auto_re_engage_cycle_exhausted",
            reason: terminalReason,
          },
          admin_user_id: systemUserId,
          created_at: nowIso,
        },
      ]);

      // NO system-wide archive sync for not_interested (soft terminal)
      // Questions and connections still flow to this provider

      return {
        provider_id,
        action: "soft_terminal",
        new_stage: "not_interested",
      };
    }
  } catch (err) {
    console.error(`[auto-re-engage] Error processing ${provider_id}:`, err);
    return {
      provider_id,
      action: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Process all eligible re-engage providers.
 *
 * Called by /api/cron/provider-outreach-auto-re-engage (daily at 6 AM UTC).
 *
 * @param db - Supabase client with service role access
 * @param systemUserId - User ID for audit logging (null for system/cron actions)
 * @returns Summary of processing results
 */
export async function processEligibleReEngageProviders(
  db: ReturnType<typeof createClient>,
  systemUserId: string | null
): Promise<AutoReEngageResult> {
  console.log("[auto-re-engage] Starting batch processing...");

  // Find eligible providers
  const eligible = await findEligibleReEngageProviders(db);
  console.log(`[auto-re-engage] Found ${eligible.length} eligible provider(s)`);

  if (eligible.length === 0) {
    return {
      processed: 0,
      cycle_started: 0,
      soft_terminal: 0,
      errors: 0,
      results: [],
    };
  }

  // Process each provider
  const results: ProcessResult[] = [];
  let cycleStarted = 0;
  let softTerminal = 0;
  let errors = 0;

  for (const record of eligible) {
    const result = await processProvider(db, record, systemUserId);
    results.push(result);

    switch (result.action) {
      case "cycle_started":
        cycleStarted++;
        break;
      case "soft_terminal":
        softTerminal++;
        break;
      case "error":
        errors++;
        break;
    }
  }

  console.log(
    `[auto-re-engage] Completed: ${eligible.length} processed, ` +
    `${cycleStarted} cycle started, ${softTerminal} soft terminal, ${errors} errors`
  );

  return {
    processed: eligible.length,
    cycle_started: cycleStarted,
    soft_terminal: softTerminal,
    errors,
    results,
  };
}

/**
 * Dry-run version for testing - finds eligible providers without processing them.
 *
 * Safe to call anytime for inspection/debugging purposes.
 *
 * @param db - Supabase client with service role access
 * @returns Summary of what would be processed
 */
export async function dryRunAutoReEngage(
  db: ReturnType<typeof createClient>
): Promise<{
  eligible_count: number;
  would_start_cycle_2: number;
  would_soft_terminal: number;
  providers: Array<{
    provider_id: string;
    cycle_number: number;
    days_waiting: number;
    would_action: "cycle_started" | "soft_terminal";
  }>;
}> {
  const eligible = await findEligibleReEngageProviders(db);

  const providers = eligible.map((record) => {
    const daysWaiting = Math.floor(
      (Date.now() - new Date(record.re_engage_entered_at).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    return {
      provider_id: record.provider_id,
      cycle_number: record.cycle_number,
      days_waiting: daysWaiting,
      would_action: (record.cycle_number === 1 ? "cycle_started" : "soft_terminal") as "cycle_started" | "soft_terminal",
    };
  });

  return {
    eligible_count: eligible.length,
    would_start_cycle_2: providers.filter((p) => p.would_action === "cycle_started").length,
    would_soft_terminal: providers.filter((p) => p.would_action === "soft_terminal").length,
    providers,
  };
}
