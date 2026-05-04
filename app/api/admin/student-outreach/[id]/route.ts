/**
 * GET    /api/admin/student-outreach/[id]   — drawer detail
 * POST   /api/admin/student-outreach/[id]   — actions, dispatched on body.action
 *
 * One endpoint, many actions. Every mutation logs a touchpoint and updates
 * the row's last_edited_*; every stage transition cancels obsolete tasks
 * and queues stage-entry tasks per state-machine.ts.
 *
 * Response shape: refreshed DrawerContext, so UI re-renders without a follow-up fetch.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  onStageEnter,
  tasksToCancelOnExit,
  validateTransition,
} from "@/lib/student-outreach/state-machine";
import { nextSeasonalDate } from "@/lib/student-outreach/seasonal";
import { nextCadenceStep, CADENCE_END_DAY } from "@/lib/student-outreach/cadence";
import type {
  ApprovalStatus,
  ApprovalType,
  Campus,
  ContactPermission,
  ContactStatus,
  DistributionEvidence,
  DrawerContext,
  OutreachRow,
  StakeholderType,
  Status,
  TaskType,
  TouchpointType,
  Channel,
} from "@/lib/student-outreach/types";

type DB = ReturnType<typeof getServiceClient>;
const DAY_MS = 86_400_000;

// ── GET ─────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const ctx = await loadDrawerContext(id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ctx);
}

// ── POST ────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const action = body.action as string;

  const db = getServiceClient();
  const { data: outreach, error: fetchErr } = await db
    .from("student_outreach")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr || !outreach) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const row = outreach as OutreachRow;

  try {
    switch (action) {
      // ── Field updates ───────────────────────────────────────────────
      case "update_research":
        await handleUpdateResearch(db, row, body, user.id);
        break;
      case "update_outreach":
        await handleUpdateOutreach(db, row, body, user.id);
        break;
      case "add_note":
        await handleAddNote(db, row, body, user.id);
        break;

      // ── Stage transitions ───────────────────────────────────────────
      case "mark_research_complete":
        await transitionStage(db, row, "researched", user.id);
        break;
      case "mark_engaged":
        await transitionStage(db, row, "engaged", user.id, body.notes);
        break;
      case "mark_meeting_scheduled":
        await handleMarkMeetingScheduled(db, row, body, user.id);
        break;
      case "mark_agreed":
        await transitionStage(db, row, "agreed", user.id, body.notes);
        break;
      case "mark_distributed":
        await handleMarkDistributed(db, row, body, user.id);
        break;
      case "mark_active_partner":
        await handleMarkActivePartner(db, row, user.id);
        break;
      case "mark_not_interested":
        await transitionStage(db, row, "not_interested", user.id, body.notes);
        break;
      case "mark_dnc":
        await transitionStage(db, row, "do_not_contact", user.id, body.notes);
        break;
      case "mark_wrong_contact":
        await transitionStage(db, row, "wrong_contact", user.id, body.notes);
        break;
      case "mark_no_response_closed":
        await transitionStage(db, row, "no_response_closed", user.id, body.notes);
        break;
      case "reopen":
        await handleReopen(db, row, user.id);
        break;

      // ── Channel logs ────────────────────────────────────────────────
      case "log_email_sent":
        await handleLogTouch(db, row, body, user.id, "email_sent", "email");
        break;
      case "log_email_replied":
        await handleLogReply(db, row, body, user.id, "email_replied", "email");
        break;
      case "log_email_bounced":
        await handleLogTouch(db, row, body, user.id, "email_bounced", "email");
        break;
      case "log_call":
        await handleLogCall(db, row, body, user.id);
        break;
      case "log_ig_dm_sent":
        await handleLogTouch(db, row, body, user.id, "ig_dm_sent", "ig_dm");
        break;
      case "log_ig_dm_replied":
        await handleLogReply(db, row, body, user.id, "ig_dm_replied", "ig_dm");
        break;
      case "log_contact_form":
        await handleLogTouch(db, row, body, user.id, "contact_form_submitted", "contact_form");
        break;

      // ── Meetings ────────────────────────────────────────────────────
      case "log_meeting_held":
        await handleLogMeetingHeld(db, row, body, user.id);
        break;
      case "log_meeting_no_show":
        await handleLogTouch(db, row, body, user.id, "meeting_no_show", "meeting");
        break;
      case "log_meeting_rescheduled":
        await handleLogMeetingRescheduled(db, row, body, user.id);
        break;

      // ── Contacts ────────────────────────────────────────────────────
      case "add_contact":
        await handleAddContact(db, row, body, user.id);
        break;
      case "update_contact":
        await handleUpdateContact(db, row, body, user.id);
        break;
      case "mark_contact_stale":
      case "mark_contact_incorrect":
      case "mark_contact_no_longer_valid":
        await handleMarkContactStatus(db, row, body, user.id, action);
        break;

      // ── Approvals ───────────────────────────────────────────────────
      case "request_approval":
        await handleRequestApproval(db, row, body, user.id);
        break;
      case "resolve_approval":
        await handleResolveApproval(db, row, body, user.id);
        break;
      case "unlock_professors_via_dept":
        await handleUnlockProfessors(db, row, body, user.id);
        break;

      // ── Tasks ───────────────────────────────────────────────────────
      case "complete_task":
        await handleCompleteTask(db, row, body, user.id);
        break;
      case "cancel_task":
        await handleCancelTask(db, row, body, user.id);
        break;
      case "reschedule_task":
        await handleRescheduleTask(db, row, body, user.id);
        break;
      case "queue_manual_task":
        await handleQueueManualTask(db, row, body, user.id);
        break;

      // ── Snooze / redirect ───────────────────────────────────────────
      case "snooze":
        await handleSnooze(db, row, body, user.id);
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Action failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const refreshed = await loadDrawerContext(id);
  return NextResponse.json(refreshed);
}

// ── Loader ──────────────────────────────────────────────────────────────

async function loadDrawerContext(outreachId: string): Promise<DrawerContext | null> {
  const db = getServiceClient();

  const { data: outreach } = await db
    .from("student_outreach")
    .select("*")
    .eq("id", outreachId)
    .single();
  if (!outreach) return null;
  const row = outreach as OutreachRow;

  const [
    { data: campus },
    { data: contacts },
    { data: touchpoints },
    { data: approvals },
    { data: pending_tasks },
    referredFrom,
    redirectedTo,
    permissionDep,
  ] = await Promise.all([
    db.from("student_outreach_campuses").select("*").eq("id", row.campus_id).single(),
    db
      .from("student_outreach_contacts")
      .select("*")
      .eq("outreach_id", outreachId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true }),
    db
      .from("student_outreach_touchpoints")
      .select("*")
      .eq("outreach_id", outreachId)
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("student_outreach_approvals")
      .select("*")
      .eq("outreach_id", outreachId)
      .order("requested_at", { ascending: false }),
    db
      .from("student_outreach_tasks")
      .select("*")
      .eq("outreach_id", outreachId)
      .eq("status", "pending")
      .order("due_at", { ascending: true }),
    row.referred_from_id
      ? db
          .from("student_outreach")
          .select("id, organization_name, stakeholder_type")
          .eq("id", row.referred_from_id)
          .single()
      : Promise.resolve({ data: null }),
    row.redirected_to_id
      ? db
          .from("student_outreach")
          .select("id, organization_name, stakeholder_type")
          .eq("id", row.redirected_to_id)
          .single()
      : Promise.resolve({ data: null }),
    row.permission_dependency_id
      ? db
          .from("student_outreach")
          .select("id, organization_name, stakeholder_type, status")
          .eq("id", row.permission_dependency_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  if (!campus) return null;

  return {
    outreach: row,
    campus: campus as Campus,
    contacts: (contacts ?? []) as DrawerContext["contacts"],
    touchpoints: (touchpoints ?? []) as DrawerContext["touchpoints"],
    approvals: (approvals ?? []) as DrawerContext["approvals"],
    pending_tasks: (pending_tasks ?? []) as DrawerContext["pending_tasks"],
    referred_from: (referredFrom.data ?? null) as DrawerContext["referred_from"],
    redirected_to: (redirectedTo.data ?? null) as DrawerContext["redirected_to"],
    permission_dependency: (permissionDep.data ?? null) as DrawerContext["permission_dependency"],
  };
}

// ── Core helpers ────────────────────────────────────────────────────────

async function insertTouchpoint(
  db: DB,
  outreachId: string,
  type: TouchpointType,
  createdBy: string | null,
  fields: {
    notes?: string | null;
    payload?: Record<string, unknown>;
    contact_id?: string | null;
    channel?: Channel | null;
    outcome?: string | null;
  } = {},
) {
  await db.from("student_outreach_touchpoints").insert({
    outreach_id: outreachId,
    contact_id: fields.contact_id ?? null,
    touchpoint_type: type,
    channel: fields.channel ?? null,
    outcome: fields.outcome ?? null,
    notes: fields.notes ?? null,
    payload: fields.payload ?? {},
    created_by: createdBy,
  });
}

async function touchOutreach(
  db: DB,
  outreachId: string,
  userId: string,
  patch: Record<string, unknown> = {},
) {
  await db
    .from("student_outreach")
    .update({
      ...patch,
      last_edited_by: userId,
      last_edited_at: new Date().toISOString(),
    })
    .eq("id", outreachId);
}

async function cancelTasksByType(
  db: DB,
  outreachId: string,
  taskTypes: TaskType[],
  userId: string,
) {
  if (taskTypes.length === 0) return;
  const { data: cancelled } = await db
    .from("student_outreach_tasks")
    .update({ status: "superseded", completed_at: new Date().toISOString(), completed_by: userId })
    .eq("outreach_id", outreachId)
    .eq("status", "pending")
    .in("task_type", taskTypes)
    .select("id");
  if (cancelled && cancelled.length > 0) {
    await insertTouchpoint(db, outreachId, "task_superseded", userId, {
      payload: { cancelled_task_ids: cancelled.map((c) => (c as { id: string }).id), reason: "stage_change" },
    });
  }
}

async function queueTask(
  db: DB,
  outreachId: string,
  task: { task_type: TaskType; due_at: Date; payload?: Record<string, unknown> },
  userId: string,
  approval_id: string | null = null,
) {
  await db.from("student_outreach_tasks").insert({
    outreach_id: outreachId,
    approval_id,
    task_type: task.task_type,
    due_at: task.due_at.toISOString(),
    payload: task.payload ?? {},
    created_by: userId,
  });
}

/**
 * Stage-transition primitive: validate, cancel obsolete tasks, update row,
 * log stage_change touchpoint, queue new entry tasks via state-machine.
 */
async function transitionStage(
  db: DB,
  row: OutreachRow,
  to: Status,
  userId: string,
  notes?: string | null,
  extraPatch: Record<string, unknown> = {},
) {
  if (row.status === to && Object.keys(extraPatch).length === 0) return;
  const { ok, reason } = validateTransition(row.status, to);
  if (!ok) throw new Error(reason ?? "Illegal transition");

  // Cancel obsolete tasks for the stage we're leaving.
  await cancelTasksByType(db, row.id, tasksToCancelOnExit(row.status), userId);

  // Apply state-machine entry effects.
  const effects = onStageEnter(to, { stakeholderType: row.stakeholder_type });
  await touchOutreach(db, row.id, userId, {
    status: to,
    ...(effects.fieldsToUpdate ?? {}),
    ...extraPatch,
  });

  await insertTouchpoint(db, row.id, "stage_change", userId, {
    notes: notes ?? null,
    payload: { from: row.status, to },
  });

  if (effects.taskToQueue) {
    await queueTask(db, row.id, effects.taskToQueue, userId);
  }
}

// ── Field-update handlers ───────────────────────────────────────────────

async function handleUpdateResearch(
  db: DB,
  row: OutreachRow,
  body: { research?: Record<string, unknown> },
  userId: string,
) {
  const merged = { ...row.research_data, ...(body.research ?? {}) };
  await touchOutreach(db, row.id, userId, { research_data: merged });
  await insertTouchpoint(db, row.id, "note_added", userId, {
    payload: { fields_updated: Object.keys(body.research ?? {}) },
  });
}

async function handleUpdateOutreach(
  db: DB,
  row: OutreachRow,
  body: {
    organization_name?: string;
    department?: string | null;
    programs?: string[];
    notes?: string | null;
  },
  userId: string,
) {
  const patch: Record<string, unknown> = {};
  if (typeof body.organization_name === "string" && body.organization_name.trim()) {
    patch.organization_name = body.organization_name.trim();
  }
  if (body.department !== undefined) patch.department = body.department || null;
  if (Array.isArray(body.programs)) patch.programs = body.programs;
  if (body.notes !== undefined) patch.notes = body.notes;
  if (Object.keys(patch).length === 0) return;
  await touchOutreach(db, row.id, userId, patch);
}

async function handleAddNote(
  db: DB,
  row: OutreachRow,
  body: { notes?: string },
  userId: string,
) {
  if (!body.notes?.trim()) throw new Error("Note text required");
  await insertTouchpoint(db, row.id, "note_added", userId, { notes: body.notes.trim() });
  await touchOutreach(db, row.id, userId);
}

// ── Stage-specific handlers ─────────────────────────────────────────────

async function handleMarkMeetingScheduled(
  db: DB,
  row: OutreachRow,
  body: { meeting_at?: string; meeting_kind?: string; meeting_link?: string; notes?: string },
  userId: string,
) {
  if (!body.meeting_at) throw new Error("meeting_at required");
  const meetingAt = new Date(body.meeting_at);
  if (isNaN(meetingAt.getTime())) throw new Error("Invalid meeting_at");

  const research = {
    ...row.research_data,
    meeting_at: meetingAt.toISOString(),
    meeting_kind: body.meeting_kind ?? row.research_data.meeting_kind,
    meeting_link: body.meeting_link ?? row.research_data.meeting_link,
  };

  await transitionStage(db, row, "meeting_scheduled", userId, body.notes, {
    research_data: research,
  });

  // Queue a "log meeting outcome" task at meeting time.
  await queueTask(
    db,
    row.id,
    { task_type: "meeting_held_logging", due_at: meetingAt },
    userId,
  );

  await insertTouchpoint(db, row.id, "meeting_scheduled", userId, {
    channel: "meeting",
    notes: body.notes ?? null,
    payload: { meeting_at: meetingAt.toISOString(), kind: body.meeting_kind ?? null },
  });
}

async function handleLogMeetingHeld(
  db: DB,
  row: OutreachRow,
  body: { outcome?: string; notes?: string },
  userId: string,
) {
  await insertTouchpoint(db, row.id, "meeting_held", userId, {
    channel: "meeting",
    outcome: body.outcome ?? null,
    notes: body.notes ?? null,
  });
  // Cancel the "log meeting" task that fired this.
  await db
    .from("student_outreach_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString(), completed_by: userId })
    .eq("outreach_id", row.id)
    .eq("status", "pending")
    .eq("task_type", "meeting_held_logging");
  await touchOutreach(db, row.id, userId);
}

async function handleLogMeetingRescheduled(
  db: DB,
  row: OutreachRow,
  body: { meeting_at?: string; notes?: string },
  userId: string,
) {
  if (!body.meeting_at) throw new Error("meeting_at required");
  const meetingAt = new Date(body.meeting_at);
  if (isNaN(meetingAt.getTime())) throw new Error("Invalid meeting_at");

  // Reschedule the existing meeting_held_logging task.
  await db
    .from("student_outreach_tasks")
    .update({ due_at: meetingAt.toISOString() })
    .eq("outreach_id", row.id)
    .eq("status", "pending")
    .eq("task_type", "meeting_held_logging");

  const research = { ...row.research_data, meeting_at: meetingAt.toISOString() };
  await touchOutreach(db, row.id, userId, { research_data: research });

  await insertTouchpoint(db, row.id, "meeting_rescheduled", userId, {
    channel: "meeting",
    notes: body.notes ?? null,
    payload: { meeting_at: meetingAt.toISOString() },
  });
}

async function handleMarkDistributed(
  db: DB,
  row: OutreachRow,
  body: { evidence?: DistributionEvidence; evidence_notes?: string; notes?: string },
  userId: string,
) {
  if (!body.evidence) throw new Error("evidence required");
  await transitionStage(db, row, "distributed", userId, body.notes, {
    distribution_evidence: body.evidence,
    distribution_evidence_notes: body.evidence_notes ?? null,
  });
  await insertTouchpoint(db, row.id, "distribution_confirmed", userId, {
    notes: body.evidence_notes ?? null,
    payload: { evidence: body.evidence },
  });
}

async function handleMarkActivePartner(db: DB, row: OutreachRow, userId: string) {
  await transitionStage(db, row, "active_partner", userId);
  // Queue first seasonal check-in.
  const seasonal = nextSeasonalDate(new Date());
  await queueTask(
    db,
    row.id,
    {
      task_type: "partner_seasonal_checkin",
      due_at: seasonal.due_at,
      payload: { season: seasonal.label },
    },
    userId,
  );
  // Yearly leadership recheck for student orgs.
  if (row.stakeholder_type === "student_org") {
    await queueTask(
      db,
      row.id,
      {
        task_type: "yearly_leadership_recheck",
        due_at: new Date(Date.now() + 365 * DAY_MS),
      },
      userId,
    );
  }
}

async function handleReopen(db: DB, row: OutreachRow, userId: string) {
  if (row.status !== "no_response_closed" && row.status !== "wrong_contact") {
    throw new Error(`Cannot reopen from status "${row.status}"`);
  }
  // Reset cadence and go back to researched (admin already did the research before closing).
  await touchOutreach(db, row.id, userId, {
    status: "researched",
    cadence_day: 0,
    reopen_at: null,
    snoozed_until: null,
  });
  await insertTouchpoint(db, row.id, "stage_change", userId, {
    payload: { from: row.status, to: "researched", reopen: true },
  });
  // Queue Day 0 again.
  await queueTask(
    db,
    row.id,
    { task_type: "outreach_day_0", due_at: new Date() },
    userId,
  );
}

// ── Channel logging ─────────────────────────────────────────────────────

async function handleLogTouch(
  db: DB,
  row: OutreachRow,
  body: { contact_id?: string; outcome?: string; notes?: string; payload?: Record<string, unknown> },
  userId: string,
  type: TouchpointType,
  channel: Channel,
) {
  await insertTouchpoint(db, row.id, type, userId, {
    contact_id: body.contact_id ?? null,
    channel,
    outcome: body.outcome ?? null,
    notes: body.notes ?? null,
    payload: body.payload ?? {},
  });

  // If the row is still in researched/prospect, advance to outreach_sent
  // because logging an outreach touchpoint means we DID outreach.
  if (row.status === "researched" || row.status === "prospect") {
    await transitionStage(db, row, "outreach_sent", userId);
  } else {
    // Advance cadence step if applicable.
    await advanceCadenceIfApplicable(db, row, userId);
    await touchOutreach(db, row.id, userId);
  }
}

async function handleLogReply(
  db: DB,
  row: OutreachRow,
  body: { contact_id?: string; notes?: string },
  userId: string,
  type: TouchpointType,
  channel: Channel,
) {
  await insertTouchpoint(db, row.id, type, userId, {
    contact_id: body.contact_id ?? null,
    channel,
    notes: body.notes ?? null,
  });
  // A reply jumps the row to engaged (cadence freezes).
  if (row.status === "outreach_sent" || row.status === "researched" || row.status === "prospect") {
    await transitionStage(db, row, "engaged", userId, body.notes ?? null);
  } else {
    await touchOutreach(db, row.id, userId);
  }
}

async function handleLogCall(
  db: DB,
  row: OutreachRow,
  body: { disposition?: string; contact_id?: string; notes?: string },
  userId: string,
) {
  const dispositionMap: Record<string, TouchpointType> = {
    no_answer: "call_no_answer",
    voicemail: "call_voicemail",
    connected: "call_connected",
    wrong_number: "call_wrong_number",
  };
  const type = dispositionMap[body.disposition ?? ""];
  if (!type) throw new Error("Invalid disposition");

  await insertTouchpoint(db, row.id, type, userId, {
    contact_id: body.contact_id ?? null,
    channel: "phone",
    outcome: body.disposition ?? null,
    notes: body.notes ?? null,
  });

  if (type === "call_wrong_number") {
    await transitionStage(db, row, "wrong_contact", userId, body.notes ?? null);
    return;
  }

  if (type === "call_connected") {
    if (row.status === "outreach_sent" || row.status === "researched" || row.status === "prospect") {
      await transitionStage(db, row, "engaged", userId, body.notes ?? null);
      return;
    }
  }

  if (row.status === "researched" || row.status === "prospect") {
    await transitionStage(db, row, "outreach_sent", userId);
  } else {
    await advanceCadenceIfApplicable(db, row, userId);
    await touchOutreach(db, row.id, userId);
  }
}

// Advance cadence_day to the next step and queue the next task.
// Schedule relative to NOW (delta = next.day - current.day), not row birth,
// so cadences that lag behind real time don't backdate.
async function advanceCadenceIfApplicable(db: DB, row: OutreachRow, userId: string) {
  if (row.status !== "outreach_sent") return;
  const next = nextCadenceStep(row.stakeholder_type, row.cadence_day);
  if (!next || next.day > CADENCE_END_DAY) return;
  const deltaDays = Math.max(0, next.day - row.cadence_day);
  const dueAt = new Date(Date.now() + deltaDays * DAY_MS);
  await touchOutreach(db, row.id, userId, { cadence_day: next.day });
  await queueTask(
    db,
    row.id,
    { task_type: next.task_type, due_at: dueAt },
    userId,
  );
}

// ── Contacts ────────────────────────────────────────────────────────────

async function handleAddContact(
  db: DB,
  row: OutreachRow,
  body: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    instagram?: string;
    contact_form_url?: string;
    is_primary?: boolean;
    notes?: string;
  },
  userId: string,
) {
  if (!body.name?.trim()) throw new Error("Contact name required");
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    throw new Error("Invalid email");
  }

  // If marking primary, demote existing primaries.
  if (body.is_primary) {
    await db
      .from("student_outreach_contacts")
      .update({ is_primary: false })
      .eq("outreach_id", row.id);
  }

  const { data: contact, error } = await db
    .from("student_outreach_contacts")
    .insert({
      outreach_id: row.id,
      name: body.name.trim(),
      role: body.role ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      instagram: body.instagram ?? null,
      contact_form_url: body.contact_form_url ?? null,
      is_primary: body.is_primary ?? false,
      notes: body.notes ?? null,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error || !contact) throw new Error(error?.message ?? "Contact insert failed");

  await insertTouchpoint(db, row.id, "contact_added", userId, {
    contact_id: (contact as { id: string }).id,
    notes: body.notes ?? null,
  });
  await touchOutreach(db, row.id, userId);

  // If this row was marked wrong_contact, prompt-friendly: silently surface
  // the row again by setting reopen_at = today. Admin still has to reopen.
  if (row.status === "wrong_contact") {
    await db
      .from("student_outreach")
      .update({ reopen_at: new Date().toISOString().slice(0, 10) })
      .eq("id", row.id);
  }
}

async function handleUpdateContact(
  db: DB,
  row: OutreachRow,
  body: {
    contact_id?: string;
    name?: string;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    instagram?: string | null;
    contact_form_url?: string | null;
    is_primary?: boolean;
    notes?: string | null;
  },
  userId: string,
) {
  if (!body.contact_id) throw new Error("contact_id required");
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    throw new Error("Invalid email");
  }
  if (body.is_primary) {
    await db
      .from("student_outreach_contacts")
      .update({ is_primary: false })
      .eq("outreach_id", row.id);
  }
  const patch: Record<string, unknown> = {
    last_edited_by: userId,
    last_edited_at: new Date().toISOString(),
  };
  for (const k of ["name", "role", "email", "phone", "instagram", "contact_form_url", "is_primary", "notes"] as const) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  await db
    .from("student_outreach_contacts")
    .update(patch)
    .eq("id", body.contact_id)
    .eq("outreach_id", row.id);
  await touchOutreach(db, row.id, userId);
}

async function handleMarkContactStatus(
  db: DB,
  row: OutreachRow,
  body: { contact_id?: string; notes?: string },
  userId: string,
  action: string,
) {
  if (!body.contact_id) throw new Error("contact_id required");
  const map: Record<string, ContactStatus> = {
    mark_contact_stale: "stale",
    mark_contact_incorrect: "incorrect",
    mark_contact_no_longer_valid: "no_longer_valid",
  };
  const status = map[action];
  if (!status) throw new Error("Invalid contact-status action");
  await db
    .from("student_outreach_contacts")
    .update({
      status,
      last_edited_by: userId,
      last_edited_at: new Date().toISOString(),
    })
    .eq("id", body.contact_id)
    .eq("outreach_id", row.id);
  await insertTouchpoint(db, row.id, "contact_marked_stale", userId, {
    contact_id: body.contact_id,
    notes: body.notes ?? null,
    payload: { new_status: status },
  });
  await touchOutreach(db, row.id, userId);
}

// ── Approvals ───────────────────────────────────────────────────────────

async function handleRequestApproval(
  db: DB,
  row: OutreachRow,
  body: {
    approval_type?: ApprovalType;
    approval_for?: string;
    approval_from?: string;
    notes?: string;
  },
  userId: string,
) {
  if (!body.approval_type) throw new Error("approval_type required");
  if (!body.approval_for?.trim()) throw new Error("approval_for required");

  const followupAt = new Date(Date.now() + 5 * DAY_MS);
  const { data: approval, error } = await db
    .from("student_outreach_approvals")
    .insert({
      outreach_id: row.id,
      approval_type: body.approval_type,
      approval_for: body.approval_for.trim(),
      approval_from: body.approval_from?.trim() ?? null,
      next_followup_at: followupAt.toISOString(),
      notes: body.notes ?? null,
      created_by: userId,
      last_updated_by: userId,
    })
    .select("*")
    .single();
  if (error || !approval) throw new Error(error?.message ?? "Approval insert failed");

  await queueTask(
    db,
    row.id,
    {
      task_type: "approval_request_followup",
      due_at: followupAt,
      payload: { approval_for: body.approval_for, approval_type: body.approval_type },
    },
    userId,
    (approval as { id: string }).id,
  );

  await insertTouchpoint(db, row.id, "approval_requested", userId, {
    notes: body.notes ?? null,
    payload: {
      approval_id: (approval as { id: string }).id,
      approval_type: body.approval_type,
      approval_for: body.approval_for,
    },
  });
  await touchOutreach(db, row.id, userId);
}

async function handleResolveApproval(
  db: DB,
  row: OutreachRow,
  body: { approval_id?: string; resolution?: ApprovalStatus; notes?: string },
  userId: string,
) {
  if (!body.approval_id) throw new Error("approval_id required");
  if (!body.resolution || !["granted", "denied", "expired"].includes(body.resolution)) {
    throw new Error("Invalid resolution");
  }

  const { data: approval } = await db
    .from("student_outreach_approvals")
    .select("*")
    .eq("id", body.approval_id)
    .eq("outreach_id", row.id)
    .single();
  if (!approval) throw new Error("Approval not found");

  await db
    .from("student_outreach_approvals")
    .update({
      status: body.resolution,
      resolved_at: new Date().toISOString(),
      next_followup_at: null,
      notes: body.notes ?? (approval as { notes: string | null }).notes,
      last_updated_by: userId,
      last_updated_at: new Date().toISOString(),
    })
    .eq("id", body.approval_id);

  // Cancel the approval_request_followup task tied to this approval.
  await db
    .from("student_outreach_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString(), completed_by: userId })
    .eq("approval_id", body.approval_id)
    .eq("status", "pending");

  const tpType: TouchpointType =
    body.resolution === "granted"
      ? "approval_granted"
      : body.resolution === "denied"
      ? "approval_denied"
      : "approval_expired";
  await insertTouchpoint(db, row.id, tpType, userId, {
    notes: body.notes ?? null,
    payload: {
      approval_id: body.approval_id,
      approval_type: (approval as { approval_type: string }).approval_type,
    },
  });
  await touchOutreach(db, row.id, userId);
}

async function handleUnlockProfessors(
  db: DB,
  row: OutreachRow,
  body: { professor_ids?: string[]; permission?: ContactPermission },
  userId: string,
) {
  const ids = body.professor_ids ?? [];
  const permission = body.permission ?? "via_dept";
  if (ids.length === 0) throw new Error("professor_ids required");
  if (!["granted_direct", "via_dept", "via_listserv"].includes(permission)) {
    throw new Error("Invalid permission for unlock");
  }

  const { error } = await db
    .from("student_outreach")
    .update({
      contact_permission: permission,
      permission_dependency_id: row.id,
      last_edited_by: userId,
      last_edited_at: new Date().toISOString(),
    })
    .in("id", ids)
    .eq("stakeholder_type", "professor");
  if (error) throw new Error(error.message);

  // Queue Day 0 for each unlocked professor.
  const now = new Date();
  for (const profId of ids) {
    await queueTask(
      db,
      profId,
      { task_type: "outreach_followup_email", due_at: now },
      userId,
    );
    await insertTouchpoint(db, profId, "approval_granted", userId, {
      payload: { source: "unlock_via_dept", parent_outreach_id: row.id, permission },
    });
  }

  await insertTouchpoint(db, row.id, "approval_granted", userId, {
    payload: { unlocked_professor_count: ids.length, permission },
  });
}

// ── Tasks ───────────────────────────────────────────────────────────────

async function handleCompleteTask(
  db: DB,
  row: OutreachRow,
  body: { task_id?: string; notes?: string },
  userId: string,
) {
  if (!body.task_id) throw new Error("task_id required");
  const { data: task } = await db
    .from("student_outreach_tasks")
    .select("*")
    .eq("id", body.task_id)
    .eq("outreach_id", row.id)
    .single();
  if (!task) throw new Error("Task not found");
  const t = task as { task_type: TaskType; status: string };
  if (t.status !== "pending") throw new Error("Task already resolved");

  await db
    .from("student_outreach_tasks")
    .update({
      status: "completed",
      notes: body.notes ?? null,
      completed_at: new Date().toISOString(),
      completed_by: userId,
    })
    .eq("id", body.task_id);

  // Some task types trigger follow-up tasks on completion.
  if (t.task_type === "partner_seasonal_checkin" && row.status === "active_partner") {
    const seasonal = nextSeasonalDate(new Date());
    await queueTask(
      db,
      row.id,
      {
        task_type: "partner_seasonal_checkin",
        due_at: seasonal.due_at,
        payload: { season: seasonal.label },
      },
      userId,
    );
  }
  if (t.task_type === "yearly_leadership_recheck" && row.status === "active_partner") {
    await queueTask(
      db,
      row.id,
      {
        task_type: "yearly_leadership_recheck",
        due_at: new Date(Date.now() + 365 * DAY_MS),
      },
      userId,
    );
  }

  await touchOutreach(db, row.id, userId);
}

async function handleCancelTask(
  db: DB,
  row: OutreachRow,
  body: { task_id?: string; notes?: string },
  userId: string,
) {
  if (!body.task_id) throw new Error("task_id required");
  await db
    .from("student_outreach_tasks")
    .update({
      status: "cancelled",
      notes: body.notes ?? null,
      completed_at: new Date().toISOString(),
      completed_by: userId,
    })
    .eq("id", body.task_id)
    .eq("outreach_id", row.id)
    .eq("status", "pending");
  await insertTouchpoint(db, row.id, "task_cancelled", userId, {
    payload: { task_id: body.task_id },
    notes: body.notes ?? null,
  });
  await touchOutreach(db, row.id, userId);
}

async function handleRescheduleTask(
  db: DB,
  row: OutreachRow,
  body: { task_id?: string; due_at?: string },
  userId: string,
) {
  if (!body.task_id || !body.due_at) throw new Error("task_id + due_at required");
  const due = new Date(body.due_at);
  if (isNaN(due.getTime())) throw new Error("Invalid due_at");
  await db
    .from("student_outreach_tasks")
    .update({ due_at: due.toISOString() })
    .eq("id", body.task_id)
    .eq("outreach_id", row.id)
    .eq("status", "pending");
  await touchOutreach(db, row.id, userId);
}

async function handleQueueManualTask(
  db: DB,
  row: OutreachRow,
  body: { task_type?: TaskType; due_at?: string; notes?: string },
  userId: string,
) {
  if (!body.task_type) throw new Error("task_type required");
  if (!body.due_at) throw new Error("due_at required");
  const due = new Date(body.due_at);
  if (isNaN(due.getTime())) throw new Error("Invalid due_at");
  await queueTask(
    db,
    row.id,
    { task_type: body.task_type, due_at: due, payload: body.notes ? { admin_notes: body.notes } : {} },
    userId,
  );
  await touchOutreach(db, row.id, userId);
}

// ── Snooze ──────────────────────────────────────────────────────────────

async function handleSnooze(
  db: DB,
  row: OutreachRow,
  body: { snoozed_until?: string; notes?: string },
  userId: string,
) {
  if (!body.snoozed_until) throw new Error("snoozed_until required");
  const until = new Date(body.snoozed_until);
  if (isNaN(until.getTime())) throw new Error("Invalid snoozed_until");

  // Push all pending task due_ats out to the snooze date if they're before it.
  const { data: tasks } = await db
    .from("student_outreach_tasks")
    .select("id, due_at")
    .eq("outreach_id", row.id)
    .eq("status", "pending");
  for (const t of (tasks ?? []) as Array<{ id: string; due_at: string }>) {
    if (new Date(t.due_at) < until) {
      await db
        .from("student_outreach_tasks")
        .update({ due_at: until.toISOString() })
        .eq("id", t.id);
    }
  }

  await touchOutreach(db, row.id, userId, { snoozed_until: until.toISOString() });
  await insertTouchpoint(db, row.id, "snoozed", userId, {
    notes: body.notes ?? null,
    payload: { snoozed_until: until.toISOString() },
  });
}

// Suppress unused-import warning (Status is used implicitly in transitionStage signature).
const _statusKeepalive: Status[] = ["prospect"];
void _statusKeepalive;
const _stakeholderKeepalive: StakeholderType[] = ["advisor"];
void _stakeholderKeepalive;
