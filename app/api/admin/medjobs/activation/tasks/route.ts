import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { activationError } from "@/lib/medjobs/activation-errors";
import { onTaskComplete, type Channel, type TaskType } from "@/lib/medjobs/activation";

/**
 * The Tasks tab.
 *
 * GET    open and recently completed tasks, newest work first
 * POST   create a custom task, optionally with the manager's own checklist
 * PATCH  complete, skip, or tick a checklist item
 *
 * Completing a recurring check schedules the next one. That is the whole
 * recurrence system: no scheduler, no cron, one write at the moment the
 * work is done.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const user = await getAuthUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!(await getAdminUser(user.id))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  const db = getServiceClient();

  const { data: tasks, error } = await db
    .from("site_tasks")
    .select("*")
    .in("status", ["pending", "completed"])
    .order("due_at")
    .limit(500);
  if (error) {
    console.error("[activation tasks] load:", error);
    return NextResponse.json(
      { error: activationError(error, "load the tasks") },
      { status: 500 },
    );
  }

  const campusIds = [...new Set((tasks ?? []).map((t) => t.campus_id))];
  const recordIds = [...new Set((tasks ?? []).map((t) => t.record_id).filter(Boolean))];

  const [{ data: campuses }, { data: records }] = await Promise.all([
    db.from("student_outreach_campuses").select("id, slug, name").in("id", campusIds),
    recordIds.length
      ? db.from("campus_channel_records").select("id, name, contacts").in("id", recordIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; contacts: unknown }> }),
  ]);

  const byCampus = new Map((campuses ?? []).map((c) => [c.id, c]));
  const byRecord = new Map((records ?? []).map((r) => [r.id, r]));

  // ── Contact rounds ────────────────────────────────────────────────────
  // Tasks live in three tables — site_tasks here, student_outreach_tasks for
  // contact rounds, business_profile_tasks for candidates and clients. The
  // Tasks tab is one queue, so they are unioned at read time and normalised
  // into the shape above. Read-time rather than a migration on purpose: it
  // shows what the unified shape needs before committing it to schema.
  const { data: contactTasks, error: cErr2 } = await db
    .from("student_outreach_tasks")
    .select(
      "id, outreach_id, task_type, due_at, status, payload, notes, completed_at, " +
        "student_outreach!inner(campus_id, organization_name, kind)",
    )
    .in("status", ["pending", "completed"])
    .in("task_type", ["outreach_contact", "manual_followup"])
    .order("due_at")
    .limit(500);
  if (cErr2) {
    console.error("[activation tasks] contact rounds:", cErr2);
    return NextResponse.json(
      { error: activationError(cErr2, "load the contact rounds") },
      { status: 500 },
    );
  }

  type ContactRow = {
    id: string;
    outreach_id: string;
    task_type: string;
    due_at: string;
    status: string;
    payload: Record<string, unknown> | null;
    notes: string | null;
    completed_at: string | null;
    student_outreach: { campus_id: string; organization_name: string; kind: string | null };
  };
  const contacts = (contactTasks ?? []) as unknown as ContactRow[];

  // Their campuses may not be in the site-task set, so resolve the gap.
  const extraCampusIds = [
    ...new Set(contacts.map((c) => c.student_outreach.campus_id).filter((id) => !byCampus.has(id))),
  ];
  if (extraCampusIds.length) {
    const { data: more } = await db
      .from("student_outreach_campuses")
      .select("id, slug, name")
      .in("id", extraCampusIds);
    for (const c of more ?? []) byCampus.set(c.id, c);
  }

  const contactRows = contacts.map((t) => ({
    id: t.id,
    taskType: t.task_type,
    dueAt: t.due_at,
    status: t.status,
    channel: null as string | null,
    answersCriterion: null as string | null,
    repeatMonths: null as number | null,
    notes: t.notes,
    checklist: [] as Array<{ text: string; done: boolean }>,
    payload: t.payload ?? {},
    completedAt: t.completed_at,
    university: byCampus.get(t.student_outreach.campus_id) ?? null,
    campusId: t.student_outreach.campus_id,
    record: null,
    recordId: null as string | null,
    /** Who this round is with, and what it is attached to. */
    subject: {
      kind: t.student_outreach.kind ?? "stakeholder",
      name: t.student_outreach.organization_name,
      outreachId: t.outreach_id,
    },
  }));

  return NextResponse.json({
    tasks: [
      ...contactRows,
      ...(tasks ?? []).map((t) => ({
      id: t.id,
      taskType: t.task_type,
      dueAt: t.due_at,
      status: t.status,
      channel: t.channel,
      answersCriterion: t.answers_criterion,
      repeatMonths: t.repeat_months,
      notes: t.notes,
      checklist: t.checklist ?? [],
      payload: t.payload ?? {},
      completedAt: t.completed_at,
      university: byCampus.get(t.campus_id) ?? null,
      campusId: t.campus_id,
      record: t.record_id ? byRecord.get(t.record_id) ?? null : null,
      recordId: t.record_id,
      // Site tasks belong to the campus itself (or to one of its records),
      // which is the "contact task with no profile behind it" case.
      subject: {
        kind: "campus" as const,
        name: t.record_id
          ? byRecord.get(t.record_id)?.name ?? "Record"
          : byCampus.get(t.campus_id)?.name ?? "University",
        outreachId: null as string | null,
      },
    })),
    ].sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
  });
}

export async function POST(req: NextRequest) {
  const g = await guard();
  if (g.error) return g.error;

  const { campusId, channel, recordId, title, dueAt, details, checklist, repeatMonths } =
    (await req.json()) as {
      campusId: string;
      channel?: Channel;
      recordId?: string;
      title: string;
      dueAt: string;
      details?: string;
      checklist?: Array<{ text: string; done: boolean }>;
      repeatMonths?: number;
    };
  if (!campusId || !title?.trim() || !dueAt) {
    return NextResponse.json({ error: "campusId, title and dueAt are required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("site_tasks")
    .insert({
      campus_id: campusId,
      task_type: "manual_followup",
      due_at: dueAt,
      channel: channel ?? null,
      record_id: recordId ?? null,
      repeat_months: repeatMonths ?? null,
      notes: details?.trim() || null,
      checklist: (checklist ?? []).filter((c) => c.text?.trim()),
      payload: { reason: "custom", title: title.trim() },
      created_by: g.user!.id,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[activation tasks] create:", error);
    return NextResponse.json({ error: activationError(error, "create that task") }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}

export async function PATCH(req: NextRequest) {
  const g = await guard();
  if (g.error) return g.error;

  const { taskId, action, checklist } = (await req.json()) as {
    taskId: string;
    action: "complete" | "skip" | "checklist";
    checklist?: Array<{ text: string; done: boolean }>;
  };
  if (!taskId || !action) {
    return NextResponse.json({ error: "taskId and action are required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: task } = await db.from("site_tasks").select("*").eq("id", taskId).single();
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "checklist") {
    await db.from("site_tasks").update({ checklist: checklist ?? [] }).eq("id", taskId);
    return NextResponse.json({ ok: true });
  }

  const now = new Date();
  // Skip closes the cycle without claiming the work was done. A manager who
  // genuinely could not do it this month needs a way through that does not
  // put a false completion in the record.
  await db
    .from("site_tasks")
    .update({
      status: action === "complete" ? "completed" : "cancelled",
      completed_at: action === "complete" ? now.toISOString() : null,
      completed_by: action === "complete" ? g.user!.id : null,
    })
    .eq("id", taskId);

  const next = onTaskComplete(
    {
      task_type: task.task_type as TaskType,
      channel: task.channel as Channel,
      record_id: task.record_id,
      repeat_months: task.repeat_months,
    },
    now,
  );
  if (next) {
    await db.from("site_tasks").insert({
      campus_id: task.campus_id,
      task_type: next.task_type,
      due_at: next.due_at.toISOString(),
      channel: next.channel,
      record_id: next.record_id ?? null,
      repeat_months: next.repeat_months ?? null,
      created_by: g.user!.id,
    });
  }

  return NextResponse.json({ ok: true, nextDue: next?.due_at ?? null });
}
