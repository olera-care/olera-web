/**
 * Server-only: execute one scheduled outreach email task.
 *
 * Used by both the cron auto-send pipeline AND the inline Day-0 send
 * triggered by `schedule_sequence`. Same code path → same behavior.
 *
 * Semantics:
 *   1. Atomically claim the task (status: pending → completed). If
 *      claim fails (already taken by another caller), return null.
 *   2. Re-fetch the outreach row. If it's no longer `outreach_sent`
 *      or `active_partner`, mark the task with outcome
 *      `skipped_stage_changed` and don't send.
 *   3. Hydrate ACTIVE recipients (drops contacts marked stale since
 *      scheduling). If empty, mark `skipped_no_recipients`, queue a
 *      manual_followup, log a touchpoint.
 *   4. Send via Resend (per-recipient, throttled, PDF attached).
 *   5. Log one email_sent touchpoint per recipient.
 *   6. Stash outcome on the task's payload for diagnostics.
 *   7. If ALL sends failed: queue a manual_followup task.
 */

import { getServiceClient } from "@/lib/admin";
import { sendOutreachEmail, type EmailRecipient } from "./email-send";
import { nextSeasonalDate } from "./seasonal";
import { getTemplate } from "./templates";
import type { Contact, OutreachRow, TaskType, TouchpointType } from "./types";

const DAY_MS = 86_400_000;

type DB = ReturnType<typeof getServiceClient>;

export interface ExecuteResult {
  task_id: string;
  outcome:
    | "sent_all"
    | "sent_partial"
    | "failed"
    | "skipped_stage_changed"
    | "skipped_no_recipients"
    | "task_already_taken";
  recipient_count: number;
  success_count: number;
  failure_count: number;
}

/** Try to atomically claim a single task. Returns the claimed row or null. */
async function claimTask(
  db: DB,
  taskId: string,
): Promise<null | {
  id: string;
  outreach_id: string;
  payload: Record<string, unknown>;
}> {
  const { data, error } = await db
    .from("student_outreach_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("status", "pending")
    .select("id, outreach_id, payload")
    .maybeSingle();
  if (error || !data) return null;
  return data as {
    id: string;
    outreach_id: string;
    payload: Record<string, unknown>;
  };
}

/** Mark a claimed task with an outcome metadata flag (no status change). */
async function annotateOutcome(db: DB, taskId: string, outcome: string, extra: Record<string, unknown> = {}) {
  // Read current payload, merge outcome.
  const { data } = await db
    .from("student_outreach_tasks")
    .select("payload")
    .eq("id", taskId)
    .single();
  const payload = (data?.payload ?? {}) as Record<string, unknown>;
  await db
    .from("student_outreach_tasks")
    .update({ payload: { ...payload, outcome, ...extra } })
    .eq("id", taskId);
}

async function insertTouchpoint(
  db: DB,
  outreachId: string,
  type: TouchpointType,
  payload: Record<string, unknown>,
  contactId: string | null = null,
) {
  await db.from("student_outreach_touchpoints").insert({
    outreach_id: outreachId,
    contact_id: contactId,
    touchpoint_type: type,
    channel: type === "email_sent" || type === "email_bounced" ? "email" : "system",
    outcome: payload.outcome ?? null,
    notes: typeof payload.error === "string" ? payload.error : null,
    payload,
    created_by: null,
  });
}

async function queueManualFollowup(
  db: DB,
  outreachId: string,
  reason: string,
  detail: Record<string, unknown> = {},
) {
  // Idempotency: don't pile up identical manual_followup tasks.
  const { data: existing } = await db
    .from("student_outreach_tasks")
    .select("id")
    .eq("outreach_id", outreachId)
    .eq("status", "pending")
    .eq("task_type", "manual_followup");
  if ((existing ?? []).length > 0) return;
  await db.from("student_outreach_tasks").insert({
    outreach_id: outreachId,
    task_type: "manual_followup" as TaskType,
    due_at: new Date().toISOString(),
    payload: { reason, ...detail },
    created_by: null,
  });
}

const ACTIVE_STATUSES_FOR_SEND = new Set(["outreach_sent", "active_partner"]);

/**
 * Execute a single outreach_email_send task. Idempotent — calling twice
 * for the same task is safe (second call returns task_already_taken).
 */
export async function executeEmailTask(taskId: string): Promise<ExecuteResult> {
  const db = getServiceClient();

  const claimed = await claimTask(db, taskId);
  if (!claimed) {
    return {
      task_id: taskId,
      outcome: "task_already_taken",
      recipient_count: 0,
      success_count: 0,
      failure_count: 0,
    };
  }

  // Hydrate row + contacts + campus.
  const { data: rowData } = await db
    .from("student_outreach")
    .select("*")
    .eq("id", claimed.outreach_id)
    .single();
  if (!rowData) {
    await annotateOutcome(db, taskId, "skipped_stage_changed", { reason: "row_missing" });
    return {
      task_id: taskId,
      outcome: "skipped_stage_changed",
      recipient_count: 0,
      success_count: 0,
      failure_count: 0,
    };
  }
  const row = rowData as OutreachRow;

  // Smartlead owns MedJobs cold-outreach delivery. If a pre-cutover task
  // is still in the queue when the cron picks it up, short-circuit so it
  // can't fire through Resend — the row's already enrolled in Smartlead.
  // The route.ts launch path no longer queues `outreach_email_send` tasks,
  // so this is belt-and-suspenders for stale tasks queued before cutover.
  await annotateOutcome(db, taskId, "skipped_smartlead_owned", {
    reason: "MedJobs cold outreach moved to Smartlead",
    row_kind: row.kind,
  });
  return {
    task_id: taskId,
    outcome: "skipped_stage_changed",
    recipient_count: 0,
    success_count: 0,
    failure_count: 0,
  };

}

/** Queue the next seasonal `outreach_email_send` task for an active partner. */
async function queueNextSeasonal(db: DB, row: OutreachRow) {
  // Skip if a seasonal task is already pending.
  const { data: existing } = await db
    .from("student_outreach_tasks")
    .select("id")
    .eq("outreach_id", row.id)
    .eq("status", "pending")
    .eq("task_type", "outreach_email_send");
  if ((existing ?? []).length > 0) return;

  const { data: campus } = await db
    .from("student_outreach_campuses")
    .select("name, slug, program_pdf_url")
    .eq("id", row.campus_id)
    .single();

  const seasonal = nextSeasonalDate(new Date());
  const tpl = getTemplate("seasonal", {
    stakeholder_type: row.stakeholder_type,
    organization_name: row.organization_name,
    campus_name: (campus as { name: string } | null)?.name ?? "your campus",
  });
  await db.from("student_outreach_tasks").insert({
    outreach_id: row.id,
    task_type: "outreach_email_send" as TaskType,
    due_at: seasonal.due_at.toISOString(),
    payload: {
      day: -1, // seasonal marker (negative means not in primary cadence)
      template: "seasonal",
      season: seasonal.label,
      subject: tpl.subject,
      body: tpl.body,
    },
    created_by: null,
  });
}

/**
 * End-of-cadence sweep. Finds rows that have completed the email
 * sequence with no reply and no remaining tasks, and queues a
 * manual_followup so the admin can decide next steps.
 *
 * Predicate (all must hold):
 *   - row.status = 'outreach_sent'
 *   - has at least one email_sent touchpoint
 *   - has zero pending outreach_email_send tasks
 *   - last email_sent touchpoint was ≥ 4 days ago
 *   - no manual_followup task already pending for this row
 *
 * Idempotent.
 */
export async function endOfCadenceSweep(): Promise<{ queued: number }> {
  const db = getServiceClient();
  const fourDaysAgo = new Date(Date.now() - 4 * DAY_MS).toISOString();

  // Candidates: outreach_sent rows with no pending email tasks.
  const { data: candidates } = await db
    .from("student_outreach")
    .select("id")
    .eq("status", "outreach_sent");
  const candidateIds = ((candidates ?? []) as Array<{ id: string }>).map((c) => c.id);
  if (candidateIds.length === 0) return { queued: 0 };

  // Bulk-fetch pending tasks.
  const { data: pendingTasks } = await db
    .from("student_outreach_tasks")
    .select("outreach_id, task_type")
    .in("outreach_id", candidateIds)
    .eq("status", "pending");
  const hasPendingEmail = new Set<string>();
  const hasPendingFollowup = new Set<string>();
  for (const t of (pendingTasks ?? []) as Array<{ outreach_id: string; task_type: string }>) {
    if (t.task_type === "outreach_email_send") hasPendingEmail.add(t.outreach_id);
    if (t.task_type === "manual_followup") hasPendingFollowup.add(t.outreach_id);
  }

  // Bulk-fetch most-recent email_sent touchpoint per row.
  const { data: tpRows } = await db
    .from("student_outreach_touchpoints")
    .select("outreach_id, touchpoint_type, created_at")
    .in("outreach_id", candidateIds)
    .in("touchpoint_type", ["email_sent", "email_replied"])
    .order("created_at", { ascending: false });

  const lastEmailSent = new Map<string, string>();
  const hasReply = new Set<string>();
  for (const tp of (tpRows ?? []) as Array<{ outreach_id: string; touchpoint_type: string; created_at: string }>) {
    if (tp.touchpoint_type === "email_replied") hasReply.add(tp.outreach_id);
    if (tp.touchpoint_type === "email_sent" && !lastEmailSent.has(tp.outreach_id)) {
      lastEmailSent.set(tp.outreach_id, tp.created_at);
    }
  }

  let queued = 0;
  for (const id of candidateIds) {
    if (hasPendingEmail.has(id)) continue;
    if (hasPendingFollowup.has(id)) continue;
    if (hasReply.has(id)) continue;
    const lastSent = lastEmailSent.get(id);
    if (!lastSent) continue;
    if (lastSent > fourDaysAgo) continue;

    await db.from("student_outreach_tasks").insert({
      outreach_id: id,
      task_type: "manual_followup" as TaskType,
      due_at: new Date().toISOString(),
      payload: { reason: "cadence_ended_cold" },
      created_by: null,
    });
    await insertTouchpoint(db, id, "note_added", {
      reason: "cadence_ended_cold",
      auto_queued_manual_followup: true,
    });
    queued++;
  }

  return { queued };
}

// v8.8: removed awaitingCallbackSweep. Voicemail/promised_callback now
// only mark the *current* call task complete — future scheduled call
// days remain queued and fire naturally on cadence. The cron sweep that
// auto-resumed stuck rows is no longer needed.
