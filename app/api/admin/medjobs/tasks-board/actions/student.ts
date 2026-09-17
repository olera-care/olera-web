import type { SupabaseClient } from "@supabase/supabase-js";
import { rungAt } from "@/lib/medjobs/ladders";
import {
  INTERVIEW_BOOKED,
  PLACEMENT_HIRED,
  applicationState,
  studentFacts,
} from "@/lib/medjobs/student-profile";
import { dueIn, resolveNext } from "@/lib/medjobs/task-board";

/**
 * Writing a student.
 *
 * A student is a `business_profiles` row and their work lives in
 * `business_profile_tasks`, so neither the record ops nor the channel ops
 * next door reach them. Only two of their five rungs are work a person does
 * — the meeting, and the monthly hours — and those are the two this writes.
 * The other three are facts about other tables and are never written here.
 *
 * Those facts are read again on every write, rather than trusted from the
 * screen, because they decide which rung comes next. A student who went live
 * between opening the drawer and logging the meeting should land on the
 * interview, not be asked to chase an application they have already
 * finished.
 *
 * Nothing here edits the profile itself. Editing a student belongs on their
 * own screen; an outreach board that wrote to it from the side would make
 * two versions of the same person.
 */

const SECTION = "students" as const;

export interface StudentRow {
  id: string;
  display_name: string | null;
  city: string | null;
  state: string | null;
  metadata: Record<string, unknown> | null;
}

export type StudentOp =
  | {
      op: "complete_student_task";
      recordId: string;
      step: number;
      round: number;
      actionIndex: number;
      note?: string;
    }
  | { op: "reopen_student_task"; recordId: string; step: number; round: number }
  | { op: "defer_student_task"; recordId: string; step: number; round: number; days: number };

type Result =
  | { ok: true; body?: Record<string, unknown> }
  | { ok: false; error: string; status: number };

const fail = (error: string, status = 400): Result => ({ ok: false, error, status });

/** What the system already knows about this student, read fresh. */
async function factsFor(db: SupabaseClient, row: StudentRow) {
  const [interviews, placements] = await Promise.all([
    db
      .from("interviews")
      .select("created_at")
      .eq("student_profile_id", row.id)
      .in("status", INTERVIEW_BOOKED)
      .order("created_at", { ascending: true })
      .limit(1),
    db
      .from("medjobs_placements")
      .select("created_at")
      .eq("student_profile_id", row.id)
      .in("status", PLACEMENT_HIRED)
      .order("created_at", { ascending: true })
      .limit(1),
  ]);
  return studentFacts({
    applicationComplete: applicationState(row).complete,
    interviewOn: interviews.data?.[0]?.created_at ?? null,
    placedOn: placements.data?.[0]?.created_at ?? null,
  });
}

/** Every task on this student, matched by rung in memory. There are few. */
async function tasksOn(db: SupabaseClient, row: StudentRow) {
  const { data, error } = await db
    .from("business_profile_tasks")
    .select("id, status, payload, notes")
    .eq("business_profile_id", row.id)
    .eq("kind", "candidate")
    .in("status", ["pending", "completed"]);
  if (error) throw new Error(error.message);
  const at = (step: number, round?: number) =>
    (data ?? []).filter((t) => {
      const p = (t.payload ?? {}) as { step?: number; round?: number };
      return (p.step ?? 0) === step && (round === undefined || (p.round ?? 0) === round);
    });
  return { at };
}

export async function handleStudentOp(
  db: SupabaseClient,
  body: StudentOp,
  row: StudentRow,
  userId: string,
): Promise<Result> {
  const step = Number(body.step);
  const round = Number(body.round);
  if (!Number.isInteger(step) || !Number.isInteger(round)) {
    return fail("Missing step or round");
  }
  const rung = rungAt(SECTION, step, round);
  if (!rung) return fail("That rung does not exist");
  if (rung.satisfiedBy) {
    // The system answers this one. Letting the screen write it would create
    // a record of somebody doing work the database had already done.
    return fail("That rung is answered by the system, not by hand");
  }

  const { at } = await tasksOn(db, row);
  const mine = at(step, round);

  if (body.op === "defer_student_task") {
    const open = mine.find((t) => t.status === "pending");
    if (!open) return fail("Nothing to put off");
    const { error } = await db
      .from("business_profile_tasks")
      .update({ due_at: `${dueIn(Number(body.days) || 1)}T12:00:00Z` })
      .eq("id", open.id);
    if (error) return fail(error.message, 500);
    return { ok: true };
  }

  const facts = await factsFor(db, row);

  if (body.op === "reopen_student_task") {
    const action = rung.actions[0];
    const next = action ? resolveNext(SECTION, step, round, action, facts) : null;
    const after = next ? at(next.step, next.round) : [];
    if (after.some((t) => t.status === "completed" || (t.notes ?? "").trim())) {
      return fail("Work has already moved on, so this can't be undone", 409);
    }
    const ids = after.filter((t) => t.status === "pending").map((t) => t.id);
    if (ids.length) {
      const { error } = await db.from("business_profile_tasks").delete().in("id", ids);
      if (error) return fail(error.message, 500);
    }
    const closed = mine.find((t) => t.status === "completed");
    if (closed) {
      const { error } = await db
        .from("business_profile_tasks")
        .update({ status: "pending", completed_at: null, due_at: `${dueIn(0)}T12:00:00Z` })
        .eq("id", closed.id);
      if (error) return fail(error.message, 500);
    }
    return { ok: true };
  }

  const action = rung.actions[Number(body.actionIndex)];
  if (!action) return fail("That outcome does not exist on this rung");
  const note = (body.note ?? "").trim();
  const stamp = {
    status: "completed",
    completed_at: new Date().toISOString(),
    completed_by: userId,
  };

  const open = mine.find((t) => t.status === "pending");
  if (open) {
    const { error } = await db
      .from("business_profile_tasks")
      .update(note ? { ...stamp, notes: note } : stamp)
      .eq("id", open.id);
    if (error) return fail(error.message, 500);
  } else if (!mine.some((t) => t.status === "completed")) {
    // Nothing to close. Students arrive from an application rather than from
    // somebody pressing start, so the first rung they finish is usually one
    // the board drew for them and never wrote down.
    const { error } = await db.from("business_profile_tasks").insert({
      business_profile_id: row.id,
      kind: "candidate",
      task_type: "manual_followup",
      ...stamp,
      due_at: `${dueIn(0)}T12:00:00Z`,
      payload: { step, round },
      notes: note || null,
    });
    if (error) return fail(error.message, 500);
  }

  const next = resolveNext(SECTION, step, round, action, facts);
  if (next && !at(next.step, next.round).some((t) => t.status === "pending")) {
    const { error } = await db.from("business_profile_tasks").insert({
      business_profile_id: row.id,
      kind: "candidate",
      task_type: "manual_followup",
      status: "pending",
      due_at: `${dueIn(action.delay)}T12:00:00Z`,
      payload: { step: next.step, round: next.round },
    });
    if (error) return fail(error.message, 500);
  }

  return { ok: true, body: { next: next ?? null } };
}
