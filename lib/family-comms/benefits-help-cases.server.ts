/**
 * Owned help cases for benefits families who asked for a person.
 *
 * Two doors lead here: the "I'd like help" chip on /benefits-outcome (writes
 * benefits_cascade.outcome = "wants_help") and a STUCK text (writes
 * application_status = "stuck"). Both used to page Slack once and then rely
 * on someone remembering. Of six families who tapped the chip, one heard from
 * a person, against a page that promised "within a day or two".
 *
 * This sweep turns each request into a case with a named owner and a due
 * time (two business days, the promise the family now sees), and escalates
 * once if the due time passes with no contact logged. It runs hourly inside
 * the navigator scheduler cron, so a request is owned within the hour even
 * when it arrived through a path that does not open the case itself.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { readBenefitsCascade } from "./benefits-cascade.server";
import {
  helpCaseWaiting,
  openHelpCase,
  type BenefitsHelpCase,
} from "./benefits-automation";

export function formatDueEt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
  });
}

export interface HelpSweepResult {
  candidates: number;
  opened: number;
  escalated: number;
  lines: string[];
}

export async function sweepBenefitsHelpCases(
  db: SupabaseClient,
  opts: { dryRun?: boolean; siteUrl: string },
): Promise<HelpSweepResult> {
  const { data: rows, error } = await db
    .from("business_profiles")
    .select("id, display_name, state, metadata")
    .eq("type", "family")
    .or(
      "metadata->benefits_cascade->>outcome.eq.wants_help,metadata->benefits_cascade->>application_status.eq.stuck",
    )
    .limit(500);
  if (error) throw error;

  const result: HelpSweepResult = { candidates: rows?.length ?? 0, opened: 0, escalated: 0, lines: [] };
  const nowIso = new Date().toISOString();

  for (const row of rows ?? []) {
    const meta = (row.metadata as Record<string, unknown>) || {};
    const cascade = readBenefitsCascade(meta);
    const caseMeta = ((meta.benefits_case as BenefitsHelpCase | undefined) ?? {}) as BenefitsHelpCase;
    const reason: "wants_help" | "stuck" = cascade.outcome === "wants_help" ? "wants_help" : "stuck";
    const askedAt =
      (reason === "wants_help" ? cascade.outcome_at : cascade.application_status_at) ?? null;
    if (!askedAt) continue;

    // Already handled by a person after they asked: nothing to own.
    const handledAt = [caseMeta.contacted_at, caseMeta.resolved_at].filter(Boolean).sort().pop();
    if (handledAt && handledAt >= askedAt) continue;

    const who = row.display_name && row.display_name !== "Care Seeker" ? row.display_name : "A family";
    const program = cascade.first_step_program_name || "their program";
    const where = row.state ? ` in ${row.state}` : "";

    // A case opened for an EARLIER ask does not cover this one: they asked
    // again after it opened, so this is a new request with a new clock.
    const base: BenefitsHelpCase =
      caseMeta.help_opened_at && caseMeta.help_opened_at < askedAt
        ? { ...caseMeta, help_opened_at: undefined }
        : caseMeta;
    const opened = openHelpCase(base, reason, nowIso);
    if (opened) {
      result.opened++;
      result.lines.push(
        `🆘 ${who}${where} ${reason === "stuck" ? "texted STUCK" : "asked for a person"} about ${program}. Owner: ${opened.help_owner}. Due ${formatDueEt(opened.help_due_at!)} ET.`,
      );
      if (!opts.dryRun) {
        await writeCase(
          db,
          row.id,
          {
            help_opened_at: opened.help_opened_at,
            help_reason: opened.help_reason,
            help_owner: opened.help_owner,
            help_due_at: opened.help_due_at,
            help_escalated_at: undefined,
          },
          true,
        );
      }
      continue;
    }

    if (
      helpCaseWaiting(caseMeta) &&
      caseMeta.help_due_at &&
      caseMeta.help_due_at < nowIso &&
      !caseMeta.help_escalated_at
    ) {
      result.escalated++;
      result.lines.push(
        `⏰ OVERDUE: ${who}${where} asked for help about ${program}. Owner ${caseMeta.help_owner ?? "unassigned"}, was due ${formatDueEt(caseMeta.help_due_at)} ET. Nobody has logged a contact.`,
      );
      if (!opts.dryRun) await writeCase(db, row.id, { help_escalated_at: nowIso }, false);
    }
  }
  return result;
}

/** Fresh-read merge so a concurrent write (a text arriving, a case note) is
 *  never lost to the sweep's list-time copy. `reopen` drops a resolution
 *  that predates this request: lifecycleStatus treats any resolved_at as
 *  resolved, so a stale one would hide the new ask from the queue. */
async function writeCase(
  db: SupabaseClient,
  profileId: string,
  patch: Partial<BenefitsHelpCase>,
  reopen: boolean,
) {
  const { data: fresh } = await db
    .from("business_profiles")
    .select("metadata")
    .eq("id", profileId)
    .maybeSingle();
  const freshMeta = (fresh?.metadata as Record<string, unknown> | null) || {};
  const freshCase = (freshMeta.benefits_case as BenefitsHelpCase | undefined) ?? {};
  const nextCase: BenefitsHelpCase = { ...freshCase, ...patch };
  if (reopen) delete nextCase.resolved_at;
  await db
    .from("business_profiles")
    .update({ metadata: { ...freshMeta, benefits_case: nextCase } })
    .eq("id", profileId);
}
