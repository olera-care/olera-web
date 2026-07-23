/**
 * Auto Re-Engage Function for Provider Outreach
 *
 * Purpose:
 *   Automatically process providers who have been in the re_engage stage for
 *   at least RE_ENGAGE_WAITING_PERIOD_DAYS (30 days).
 *
 * Logic:
 *   - Cycle 1 providers → Automatically start Cycle 2 (move to in_sequence, create email tasks)
 *   - Cycle 2 providers → Move to "not_interested" (soft terminal)
 *
 * Key Point: Cycle 2 starts AUTOMATICALLY - no manual re-launch needed.
 * The cron creates email tasks and moves providers directly to in_sequence.
 *
 * Terminal States:
 *   - not_interested = soft terminal (stops outreach, questions/connections still flow)
 *   - archived = hard terminal (system-wide block, only set via explicit Archive action)
 */

import { createClient } from "@supabase/supabase-js";
import { RE_ENGAGE_WAITING_PERIOD_DAYS, generateTaskSchedule } from "./cadence";

// Re-export the constant for external visibility
export { RE_ENGAGE_WAITING_PERIOD_DAYS };

/**
 * Result of processing a single provider
 */
interface ProcessResult {
  provider_id: string;
  action: "cycle_started" | "soft_terminal" | "error" | "skipped";
  new_cycle?: number;
  new_stage?: string;
  tasks_created?: number;
  error?: string;
  skip_reason?: string;
}

/**
 * Result of the batch processing operation
 */
export interface AutoReEngageResult {
  processed: number;
  cycle_started: number;
  soft_terminal: number;
  skipped: number;
  errors: number;
  results: ProcessResult[];
}

/**
 * Extended tracking record with provider info needed for task creation
 */
interface EligibleProvider {
  id: string;
  provider_id: string;
  cycle_number: number;
  re_engage_entered_at: string;
  city: string | null;
  state: string | null;
  assigned_to: string | null;
  // From olera-providers join
  email: string | null;
  provider_name: string | null;
  provider_category: string | null;
}

/**
 * Find providers eligible for automatic re-engagement.
 *
 * Eligibility criteria:
 *   - Stage is "re_engage"
 *   - re_engage_entered_at is at least RE_ENGAGE_WAITING_PERIOD_DAYS ago
 *
 * @param db - Supabase client with service role access
 * @returns Array of eligible provider tracking records with provider info
 */
export async function findEligibleReEngageProviders(
  db: ReturnType<typeof createClient>
): Promise<EligibleProvider[]> {
  // Calculate the cutoff date (30 days ago)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RE_ENGAGE_WAITING_PERIOD_DAYS);
  const cutoffIso = cutoffDate.toISOString();

  // Get tracking records
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trackingData, error: trackingError } = await (db as any)
    .from("provider_outreach_tracking")
    .select("id, provider_id, cycle_number, re_engage_entered_at, city, state, assigned_to")
    .eq("stage", "re_engage")
    .not("re_engage_entered_at", "is", null)
    .lte("re_engage_entered_at", cutoffIso);

  if (trackingError) {
    console.error("[auto-re-engage] Query error:", trackingError);
    throw new Error("Failed to query eligible providers");
  }

  if (!trackingData || trackingData.length === 0) {
    return [];
  }

  // Get provider info for all eligible providers
  const providerIds = trackingData.map((t: { provider_id: string }) => t.provider_id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: providerData, error: providerError } = await (db as any)
    .from("olera-providers")
    .select("provider_id, email, provider_name, provider_category")
    .in("provider_id", providerIds);

  if (providerError) {
    console.error("[auto-re-engage] Provider query error:", providerError);
    // Continue with empty provider data - we'll skip providers without email
  }

  const providerMap = new Map<string, { email: string | null; provider_name: string | null; provider_category: string | null }>(
    (providerData || []).map((p: { provider_id: string; email: string | null; provider_name: string | null; provider_category: string | null }) => [
      p.provider_id,
      { email: p.email, provider_name: p.provider_name, provider_category: p.provider_category },
    ])
  );

  // Merge tracking + provider data
  return trackingData.map((t: { id: string; provider_id: string; cycle_number: number; re_engage_entered_at: string; city: string | null; state: string | null; assigned_to: string | null }) => {
    const provider = providerMap.get(t.provider_id) || { email: null, provider_name: null, provider_category: null };
    return {
      id: t.id,
      provider_id: t.provider_id,
      cycle_number: t.cycle_number,
      re_engage_entered_at: t.re_engage_entered_at,
      city: t.city,
      state: t.state,
      assigned_to: t.assigned_to,
      email: provider.email || null,
      provider_name: provider.provider_name || null,
      provider_category: provider.provider_category || null,
    };
  });
}

/**
 * Process a single provider's re-engagement action.
 *
 * For Cycle 1:
 *   - Move directly to in_sequence (NOT to Ready/not_contacted)
 *   - Create email tasks automatically
 *   - No manual intervention needed
 *
 * For Cycle 2:
 *   - Move to not_interested (soft terminal)
 *
 * @param db - Supabase client with service role access
 * @param provider - The provider's tracking record with provider info
 * @param systemUserId - User ID for audit logging (null for system/cron actions)
 * @returns Processing result
 */
async function processProvider(
  db: ReturnType<typeof createClient>,
  provider: EligibleProvider,
  systemUserId: string | null
): Promise<ProcessResult> {
  const { id, provider_id, cycle_number, email, provider_name, provider_category, city, state } = provider;
  const nowIso = new Date().toISOString();
  const now = new Date();

  try {
    if (cycle_number === 1) {
      // ── Cycle 1 → Start Cycle 2 AUTOMATICALLY ──
      // Move directly to in_sequence and create email tasks

      // Skip if no email - can't send sequence without email
      if (!email) {
        console.log(`[auto-re-engage] Skipping ${provider_id}: no email address`);
        return {
          provider_id,
          action: "skipped",
          skip_reason: "no_email",
        };
      }

      // 1. Update tracking record to in_sequence
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (db as any)
        .from("provider_outreach_tracking")
        .update({
          stage: "in_sequence",
          stage_changed_at: nowIso,
          sequence_started_at: nowIso,
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

      // 2. Create email tasks for all 4 cadence steps
      const schedule = generateTaskSchedule(now);
      const taskRows = schedule.map((step) => ({
        tracking_id: id,
        provider_id,
        task_type: "outreach_email_send",
        cadence_day: step.day,
        template_key: step.templateKey,
        due_at: step.dueAt.toISOString(),
        status: "pending",
        payload: {
          provider_name: provider_name || "Provider",
          email,
          city: city || "",
          state: state || "",
          category: provider_category || "",
          cycle: 2,
        },
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: tasksError } = await (db as any)
        .from("provider_outreach_tasks")
        .insert(taskRows);

      if (tasksError) {
        console.error(`[auto-re-engage] Task creation failed for ${provider_id}:`, tasksError);
        // Don't fail the whole operation - provider is in in_sequence, tasks can be manually created
      }

      // 3. Log touchpoints
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from("provider_outreach_touchpoints").insert([
        {
          provider_id,
          touchpoint_type: "cycle_started",
          details: {
            cycle: 2,
            previous_stage: "re_engage",
            new_stage: "in_sequence",
            trigger: "auto_re_engage",
            wait_days: RE_ENGAGE_WAITING_PERIOD_DAYS,
            tasks_created: taskRows.length,
            automatic: true,
          },
          admin_user_id: systemUserId,
          created_at: nowIso,
        },
        {
          provider_id,
          touchpoint_type: "stage_changed",
          details: {
            old_stage: "re_engage",
            new_stage: "in_sequence",
            trigger: "auto_re_engage_cycle_start",
            cycle: 2,
          },
          admin_user_id: systemUserId,
          created_at: nowIso,
        },
        {
          provider_id,
          touchpoint_type: "sequence_launched",
          details: {
            cycle: 2,
            trigger: "auto_re_engage",
            emails_scheduled: taskRows.length,
          },
          admin_user_id: systemUserId,
          created_at: nowIso,
        },
      ]);

      return {
        provider_id,
        action: "cycle_started",
        new_cycle: 2,
        new_stage: "in_sequence",
        tasks_created: taskRows.length,
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
 * For Cycle 1 providers: Automatically moves to in_sequence and creates email tasks.
 * For Cycle 2 providers: Moves to not_interested (soft terminal).
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
      skipped: 0,
      errors: 0,
      results: [],
    };
  }

  // Process each provider
  const results: ProcessResult[] = [];
  let cycleStarted = 0;
  let softTerminal = 0;
  let skipped = 0;
  let errors = 0;

  for (const provider of eligible) {
    const result = await processProvider(db, provider, systemUserId);
    results.push(result);

    switch (result.action) {
      case "cycle_started":
        cycleStarted++;
        break;
      case "soft_terminal":
        softTerminal++;
        break;
      case "skipped":
        skipped++;
        break;
      case "error":
        errors++;
        break;
    }
  }

  console.log(
    `[auto-re-engage] Completed: ${eligible.length} processed, ` +
    `${cycleStarted} cycle started (in_sequence), ${softTerminal} soft terminal, ` +
    `${skipped} skipped, ${errors} errors`
  );

  return {
    processed: eligible.length,
    cycle_started: cycleStarted,
    soft_terminal: softTerminal,
    skipped,
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
  would_skip_no_email: number;
  providers: Array<{
    provider_id: string;
    cycle_number: number;
    days_waiting: number;
    has_email: boolean;
    would_action: "cycle_started" | "soft_terminal" | "skipped";
  }>;
}> {
  const eligible = await findEligibleReEngageProviders(db);

  const providers = eligible.map((record) => {
    const daysWaiting = Math.floor(
      (Date.now() - new Date(record.re_engage_entered_at).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    let wouldAction: "cycle_started" | "soft_terminal" | "skipped";
    if (record.cycle_number === 1) {
      wouldAction = record.email ? "cycle_started" : "skipped";
    } else {
      wouldAction = "soft_terminal";
    }

    return {
      provider_id: record.provider_id,
      cycle_number: record.cycle_number,
      days_waiting: daysWaiting,
      has_email: !!record.email,
      would_action: wouldAction,
    };
  });

  return {
    eligible_count: eligible.length,
    would_start_cycle_2: providers.filter((p) => p.would_action === "cycle_started").length,
    would_soft_terminal: providers.filter((p) => p.would_action === "soft_terminal").length,
    would_skip_no_email: providers.filter((p) => p.would_action === "skipped").length,
    providers,
  };
}
