/**
 * POST /api/admin/student-outreach/bulk-engaged
 *
 * Bulk-mark multiple outreach rows as `engaged`. Used by the inbox
 * check panel: admin reads their email, identifies who replied, and
 * checks them off here. Each transition runs the full state-machine
 * cancellation hooks, so all pending email tasks for those rows get
 * superseded.
 *
 * Body: { outreach_ids: string[], notes?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  onStageEnter,
  tasksToCancelOnExit,
  validateTransition,
} from "@/lib/student-outreach/state-machine";
import type { OutreachRow, TaskType } from "@/lib/student-outreach/types";

type DB = ReturnType<typeof getServiceClient>;

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const ids = body.outreach_ids as string[] | undefined;
  const notes = (body.notes as string | undefined) ?? null;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "outreach_ids required" }, { status: 400 });
  }
  if (ids.length > 50) {
    return NextResponse.json({ error: "Max 50 rows at once" }, { status: 400 });
  }

  const db = getServiceClient();
  const results: Array<{ id: string; ok: boolean; reason?: string }> = [];

  for (const id of ids) {
    try {
      const ok = await markRowEngaged(db, id, user.id, notes);
      results.push({ id, ok, reason: ok ? undefined : "not in outreach_sent" });
    } catch (err) {
      results.push({ id, ok: false, reason: err instanceof Error ? err.message : "failed" });
    }
  }

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    skipped: results.filter((r) => !r.ok).length,
    results,
  });
}

async function markRowEngaged(db: DB, id: string, userId: string, notes: string | null): Promise<boolean> {
  const { data: rowData } = await db.from("student_outreach").select("*").eq("id", id).single();
  if (!rowData) return false;
  const row = rowData as OutreachRow;
  if (row.status !== "outreach_sent") return false;

  const { ok, reason } = validateTransition(row.status, "engaged");
  if (!ok) throw new Error(reason ?? "Illegal transition");

  // Cancel obsolete tasks (all the legacy + new outreach_email_send, etc).
  const cancelTypes = tasksToCancelOnExit(row.status);
  if (cancelTypes.length > 0) {
    await db
      .from("student_outreach_tasks")
      .update({ status: "superseded", completed_at: new Date().toISOString(), completed_by: userId })
      .eq("outreach_id", id)
      .eq("status", "pending")
      .in("task_type", cancelTypes as TaskType[]);
  }

  // Apply onStageEnter side-effects for engaged.
  const effects = onStageEnter("engaged", { stakeholderType: row.stakeholder_type });
  await db
    .from("student_outreach")
    .update({
      status: "engaged",
      ...(effects.fieldsToUpdate ?? {}),
      last_edited_by: userId,
      last_edited_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Stage_change touchpoint.
  await db.from("student_outreach_touchpoints").insert({
    outreach_id: id,
    touchpoint_type: "stage_change",
    notes: notes ?? "via inbox check",
    payload: { from: row.status, to: "engaged", source: "inbox_check_bulk" },
    created_by: userId,
  });

  // Queue the engaged-stage continue-dialogue followup task if returned.
  if (effects.taskToQueue) {
    await db.from("student_outreach_tasks").insert({
      outreach_id: id,
      task_type: effects.taskToQueue.task_type,
      due_at: effects.taskToQueue.due_at.toISOString(),
      payload: effects.taskToQueue.payload ?? {},
      created_by: userId,
    });
  }

  return true;
}
