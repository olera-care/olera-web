import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Frequency cap for the bidirectional "ready" fan-outs:
 *   - candidate-ready → providers, fired on a student go-live
 *   - job-ready       → students, fired on a provider's first terms acceptance
 *
 * Both are catchment-wide blasts triggered by common events, so without a cap a
 * burst near one campus (10 students going live in a day, several providers
 * accepting terms) would hit the same recipient repeatedly. We cap to at most
 * one email of a given type per recipient per rolling window.
 */
export const READY_NOTIFY_WINDOW_DAYS = 7;

/**
 * Return the lowercased set of addresses that have ALREADY received `emailType`
 * within the window and should therefore be SUPPRESSED on this run. One query
 * for the whole batch (not per-recipient). Recipients are compared
 * case-insensitively. Fails OPEN: on any error the set is empty → nobody is
 * suppressed → sends proceed (a missed cap is better than dropping mail).
 */
export async function recentlyNotifiedEmails(
  db: SupabaseClient<any, any, any>,
  emailType: string,
  windowDays: number = READY_NOTIFY_WINDOW_DAYS,
): Promise<Set<string>> {
  const suppress = new Set<string>();
  try {
    const windowStart = new Date(Date.now() - windowDays * 86_400_000).toISOString();
    const { data } = await db
      .from("email_log")
      .select("recipient")
      .eq("email_type", emailType)
      .eq("status", "sent")
      .gte("created_at", windowStart);
    for (const row of (data ?? []) as Array<{ recipient: string | null }>) {
      if (row.recipient) suppress.add(row.recipient.trim().toLowerCase());
    }
  } catch (err) {
    console.error("[ready-notify] frequency-cap query failed (sending anyway):", err);
  }
  return suppress;
}
