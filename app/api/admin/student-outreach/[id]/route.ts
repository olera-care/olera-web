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
import { type TemplateKey } from "@/lib/student-outreach/cadence";
import { getTemplate } from "@/lib/student-outreach/templates";
import {
  planSequence,
  type EmailSnapshot,
} from "@/lib/student-outreach/sequencer";
import { executeEmailTask } from "@/lib/student-outreach/auto-send-executor";
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
      case "flag_wants_meeting":
        await handleFlagWantsMeeting(db, row, body, user.id);
        break;
      case "mark_meeting_followup":
        await handleMarkMeetingFollowup(db, row, body, user.id);
        break;
      case "mark_partner":
      case "mark_active_partner":
        await handleMarkPartner(db, row, body, user.id);
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
      case "resume_outreach":
        await handleResumeOutreach(db, row, body, user.id);
        break;
      case "classify_reply":
        await handleClassifyReply(db, row, body, user.id);
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

      // ── v4 auto-send outreach ───────────────────────────────────────
      case "schedule_sequence":
        await handleScheduleSequence(db, row, body, user.id);
        break;
      case "offer_call":
        await handleOfferCall(db, row, body, user.id);
        break;
      case "edit_pending_email":
        await handleEditPendingEmail(db, row, body, user.id);
        break;
      case "skip_pending_email":
        await handleSkipPendingEmail(db, row, body, user.id);
        break;
      case "mark_engaged_bulk":
        await handleMarkEngagedBulk(db, body, user.id);
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

  // Hydrate admin first names for any user IDs referenced by touchpoints,
  // tasks, approvals, contacts, or the outreach row itself. Keeps history
  // narration self-contained without follow-up fetches.
  const adminIds = new Set<string>();
  for (const t of (touchpoints ?? []) as Array<{ created_by: string | null }>) {
    if (t.created_by) adminIds.add(t.created_by);
  }
  if (row.last_edited_by) adminIds.add(row.last_edited_by);
  if (row.created_by) adminIds.add(row.created_by);

  const adminFirstNames: Record<string, string> = {};
  if (adminIds.size > 0) {
    const { data: admins } = await db
      .from("admin_users")
      .select("user_id, email")
      .in("user_id", Array.from(adminIds));
    for (const a of (admins ?? []) as Array<{ user_id: string; email: string }>) {
      adminFirstNames[a.user_id] = firstNameFromEmail(a.email);
    }
  }

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
    admin_first_names: adminFirstNames,
  };
}

function firstNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  // "tj.alohun" → "Tj"; "logan" → "Logan"
  const first = local.split(/[._-]/)[0] ?? local;
  return first.charAt(0).toUpperCase() + first.slice(1);
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

/**
 * v7: log that a meeting is on the calendar (Calendly auto-booked or
 * admin manually created in Google Cal). No stage transition — meeting
 * state lives purely in touchpoint payloads. Marks engaged if not yet.
 */
async function handleMarkMeetingScheduled(
  db: DB,
  row: OutreachRow,
  body: { meeting_at?: string; notes?: string },
  userId: string,
) {
  let meetingAt: Date | null = null;
  if (body.meeting_at) {
    meetingAt = new Date(body.meeting_at);
    if (isNaN(meetingAt.getTime())) throw new Error("Invalid meeting_at");
  }

  // Ensure the row is engaged (cancels remaining cadence).
  if (row.status === "outreach_sent" || row.status === "researched" || row.status === "prospect") {
    await transitionStage(db, row, "engaged", userId, "meeting scheduled");
  }

  await insertTouchpoint(db, row.id, "meeting_scheduled", userId, {
    channel: "meeting",
    notes: body.notes ?? null,
    payload: meetingAt
      ? { meeting_at: meetingAt.toISOString() }
      : { meeting_at: null },
  });

  // v8: supersede any in-flight email cadence — the conversation has moved on.
  await supersedePendingOutreachEmails(db, row.id, userId);
  await touchOutreach(db, row.id, userId);
}

/**
 * v7: admin saw a reply expressing interest in a meeting — flag the row
 * as "wants meeting (in flight)". Surfaces in Meetings tab as
 * "Finding a time" and stays in Replies for ongoing email coordination.
 */
async function handleFlagWantsMeeting(
  db: DB,
  row: OutreachRow,
  body: { notes?: string },
  userId: string,
) {
  // Mark engaged if not yet — cancels cadence so we're not still emailing
  // while coordinating a meeting.
  if (row.status === "outreach_sent" || row.status === "researched" || row.status === "prospect") {
    await transitionStage(db, row, "engaged", userId, "wants a meeting");
  }
  await insertTouchpoint(db, row.id, "note_added", userId, {
    notes: body.notes ?? null,
    payload: { reason: "meeting_in_flight" },
  });
  // v8: supersede any pending cadence emails — we're coordinating a meeting now.
  await supersedePendingOutreachEmails(db, row.id, userId);
  await touchOutreach(db, row.id, userId);
}

/**
 * v7: meeting happened — admin wants to keep the row in dialogue (NOT
 * graduate to Active Partner). Logs the meeting outcome notes which
 * surface in the Replies tab so the team knows context for follow-up.
 */
async function handleMarkMeetingFollowup(
  db: DB,
  row: OutreachRow,
  body: { notes?: string },
  userId: string,
) {
  if (!body.notes?.trim()) throw new Error("Follow-up notes required so the team has context");
  await insertTouchpoint(db, row.id, "meeting_held", userId, {
    channel: "meeting",
    outcome: "needs_followup",
    notes: body.notes.trim(),
  });
  await insertTouchpoint(db, row.id, "note_added", userId, {
    notes: body.notes.trim(),
    payload: { reason: "post_meeting_followup", notes: body.notes.trim() },
  });
  await touchOutreach(db, row.id, userId);
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

/**
 * The unified "Mark as Partner" graduation. Replaces the v1
 * mark_agreed + mark_distributed pair: one stage (active_partner),
 * with evidence captured on the row + as a touchpoint.
 *
 * Auto-queues the first seasonal check-in and (for student orgs) the
 * yearly leadership recheck.
 */
async function handleMarkPartner(
  db: DB,
  row: OutreachRow,
  body: { evidence?: DistributionEvidence; evidence_notes?: string; notes?: string },
  userId: string,
) {
  if (!body.evidence) throw new Error("evidence required");
  await transitionStage(db, row, "active_partner", userId, body.notes, {
    distribution_evidence: body.evidence,
    distribution_evidence_notes: body.evidence_notes ?? null,
  });
  await insertTouchpoint(db, row.id, "distribution_confirmed", userId, {
    notes: body.evidence_notes ?? null,
    payload: { evidence: body.evidence },
  });

  // v4: queue the first seasonal email as an outreach_email_send task
  // with a snapshot of the seasonal template body. The cron picks it
  // up, sends, and queues the next seasonal automatically.
  const { data: campus } = await db
    .from("student_outreach_campuses")
    .select("name")
    .eq("id", row.campus_id)
    .single();
  const seasonal = nextSeasonalDate(new Date());
  const tpl = getTemplate("seasonal", {
    stakeholder_type: row.stakeholder_type,
    organization_name: row.organization_name,
    campus_name: (campus as { name: string } | null)?.name ?? "your campus",
  });
  await queueTask(
    db,
    row.id,
    {
      task_type: "outreach_email_send",
      due_at: seasonal.due_at,
      payload: {
        day: -1,
        template: "seasonal" as TemplateKey,
        season: seasonal.label,
        subject: tpl.subject,
        body: tpl.body,
      },
    },
    userId,
  );

  // Yearly leadership recheck for student orgs (officer turnover).
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

  // If still in researched/prospect, advance to outreach_sent — we DID outreach.
  // Cadence advancement to NEXT day is now explicit (advance_to_next_day action),
  // not implicit on every logged touchpoint.
  if (row.status === "researched" || row.status === "prospect") {
    await transitionStage(db, row, "outreach_sent", userId);
  } else {
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
  // v8: a reply supersedes any pending email_send tasks so the cron
  // doesn't fire after they've already replied.
  await supersedePendingOutreachEmails(db, row.id, userId);
  // A reply jumps the row to engaged (cadence freezes).
  if (row.status === "outreach_sent" || row.status === "researched" || row.status === "prospect") {
    await transitionStage(db, row, "engaged", userId, body.notes ?? null);
  } else {
    await touchOutreach(db, row.id, userId);
  }
}

/**
 * v8: cancel any pending outreach_email_send tasks for this row. Called
 * when admin signals they've heard back (reply, callback, classify_reply,
 * mark_meeting_scheduled, flag_wants_meeting). Prevents the cron from
 * firing the next cadence email after the conversation has moved on.
 */
async function supersedePendingOutreachEmails(db: DB, outreachId: string, userId: string) {
  const { data: cancelled } = await db
    .from("student_outreach_tasks")
    .update({
      status: "superseded",
      completed_at: new Date().toISOString(),
      completed_by: userId,
    })
    .eq("outreach_id", outreachId)
    .eq("status", "pending")
    .eq("task_type", "outreach_email_send")
    .select("id");
  if (cancelled && cancelled.length > 0) {
    await insertTouchpoint(db, outreachId, "task_superseded", userId, {
      payload: {
        cancelled_task_ids: cancelled.map((c) => (c as { id: string }).id),
        reason: "reply_received",
      },
    });
  }
}

/**
 * v8: cancel any pending outreach_followup_call tasks for this row. Called
 * when admin logs voicemail or "they'll call back" — the row moves to
 * Replies (awaiting_callback) so we shouldn't keep prompting a call.
 * Admin's "Resume outreach" action re-queues a fresh call task.
 */
async function supersedePendingFollowupCalls(db: DB, outreachId: string, userId: string) {
  const { data: cancelled } = await db
    .from("student_outreach_tasks")
    .update({
      status: "superseded",
      completed_at: new Date().toISOString(),
      completed_by: userId,
    })
    .eq("outreach_id", outreachId)
    .eq("status", "pending")
    .eq("task_type", "outreach_followup_call")
    .select("id");
  if (cancelled && cancelled.length > 0) {
    await insertTouchpoint(db, outreachId, "task_superseded", userId, {
      payload: {
        cancelled_task_ids: cancelled.map((c) => (c as { id: string }).id),
        reason: "awaiting_callback",
      },
    });
  }
}

/**
 * v8: log a phone-call outcome from the Calls-tab Log Call Outcome modal.
 *
 * Six outcomes drive different downstream effects:
 *   - no_answer            → log call_no_answer (cadence continues)
 *   - voicemail            → log call_voicemail{awaiting_callback:true},
 *                             supersede pending call task → row moves to
 *                             Replies as `awaiting_callback`
 *   - promised_callback    → log call_connected{awaiting_callback:true},
 *                             supersede pending call task → Replies tab
 *   - connected_engaged    → log call_connected, transition to engaged,
 *                             supersede pending email tasks
 *   - connected_not_interested → log call_connected, transition to not_interested
 *   - wrong_number         → log call_wrong_number, transition to wrong_contact
 *
 * Also supports the legacy `disposition` shape from OutreachStepList.
 */
async function handleLogCall(
  db: DB,
  row: OutreachRow,
  body: {
    disposition?: string;
    outcome?: string;
    contact_id?: string;
    notes?: string;
  },
  userId: string,
) {
  // v8 outcome routing (preferred). Falls back to legacy disposition map.
  const outcome = body.outcome ?? legacyDispositionToOutcome(body.disposition);
  if (!outcome) throw new Error("Invalid call outcome");

  switch (outcome) {
    case "no_answer": {
      await insertTouchpoint(db, row.id, "call_no_answer", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
      });
      // Cadence continues. If we were still researched/prospect, advance to outreach_sent.
      if (row.status === "researched" || row.status === "prospect") {
        await transitionStage(db, row, "outreach_sent", userId);
      } else {
        await touchOutreach(db, row.id, userId);
      }
      return;
    }
    case "voicemail": {
      await insertTouchpoint(db, row.id, "call_voicemail", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
        payload: { awaiting_callback: true },
      });
      await supersedePendingFollowupCalls(db, row.id, userId);
      if (row.status === "researched" || row.status === "prospect") {
        await transitionStage(db, row, "outreach_sent", userId);
      } else {
        await touchOutreach(db, row.id, userId);
      }
      return;
    }
    case "promised_callback": {
      await insertTouchpoint(db, row.id, "call_connected", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
        payload: { awaiting_callback: true },
      });
      await supersedePendingFollowupCalls(db, row.id, userId);
      // Connected — even briefly — moves us to engaged.
      if (row.status === "outreach_sent" || row.status === "researched" || row.status === "prospect") {
        await transitionStage(db, row, "engaged", userId, body.notes ?? null);
      } else {
        await touchOutreach(db, row.id, userId);
      }
      return;
    }
    case "connected_engaged": {
      await insertTouchpoint(db, row.id, "call_connected", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
      });
      await supersedePendingOutreachEmails(db, row.id, userId);
      await supersedePendingFollowupCalls(db, row.id, userId);
      if (row.status === "outreach_sent" || row.status === "researched" || row.status === "prospect") {
        await transitionStage(db, row, "engaged", userId, body.notes ?? null);
      } else {
        await touchOutreach(db, row.id, userId);
      }
      return;
    }
    case "connected_not_interested": {
      await insertTouchpoint(db, row.id, "call_connected", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
      });
      await transitionStage(db, row, "not_interested", userId, body.notes ?? null);
      return;
    }
    case "wrong_number": {
      await insertTouchpoint(db, row.id, "call_wrong_number", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
      });
      await transitionStage(db, row, "wrong_contact", userId, body.notes ?? null);
      return;
    }
    default:
      throw new Error(`Unknown call outcome: ${outcome}`);
  }
}

function legacyDispositionToOutcome(disposition: string | undefined): string | null {
  if (!disposition) return null;
  switch (disposition) {
    case "no_answer": return "no_answer";
    case "voicemail": return "voicemail";
    case "connected": return "connected_engaged";
    case "wrong_number": return "wrong_number";
    default: return null;
  }
}

/**
 * v8: admin clicked "Still nothing — resume outreach" on an
 * awaiting-callback Replies row. Logs a resolver note (clears the
 * awaiting-callback state) and re-queues a follow-up call task so
 * the row reappears in the Calls tab.
 */
async function handleResumeOutreach(
  db: DB,
  row: OutreachRow,
  body: { notes?: string },
  userId: string,
) {
  await insertTouchpoint(db, row.id, "note_added", userId, {
    notes: body.notes ?? null,
    payload: { reason: "resume_outreach" },
  });
  // Re-queue a fresh call task (3 days out). Skip if there's already a pending one.
  const { data: existing } = await db
    .from("student_outreach_tasks")
    .select("id")
    .eq("outreach_id", row.id)
    .eq("status", "pending")
    .eq("task_type", "outreach_followup_call");
  if ((existing ?? []).length === 0) {
    await queueTask(
      db,
      row.id,
      {
        task_type: "outreach_followup_call",
        due_at: new Date(Date.now() + 3 * DAY_MS),
        payload: { reason: "resumed_after_callback" },
      },
      userId,
    );
  }
  await touchOutreach(db, row.id, userId);
}

/**
 * v8: ReplyClassifierModal callback. Maps the four user choices to
 * existing actions. The mini-modal is shared between "they replied
 * via email" and "got a callback" paths.
 *
 *   keep_emailing      → log_email_replied (engaged + supersede emails)
 *   wants_meeting      → flag_wants_meeting (note_added meeting_in_flight)
 *   already_booked     → mark_meeting_scheduled (with optional meeting_at)
 *   committed          → mark_partner with the supplied evidence
 */
async function handleClassifyReply(
  db: DB,
  row: OutreachRow,
  body: {
    classification?: string;
    notes?: string;
    meeting_at?: string;
    evidence?: DistributionEvidence;
    evidence_notes?: string;
  },
  userId: string,
) {
  switch (body.classification) {
    case "keep_emailing":
      await handleLogReply(db, row, { notes: body.notes }, userId, "email_replied", "email");
      return;
    case "wants_meeting":
      await handleFlagWantsMeeting(db, row, { notes: body.notes }, userId);
      return;
    case "already_booked":
      await handleMarkMeetingScheduled(
        db,
        row,
        { meeting_at: body.meeting_at, notes: body.notes },
        userId,
      );
      return;
    case "committed":
      await handleMarkPartner(
        db,
        row,
        { evidence: body.evidence, evidence_notes: body.evidence_notes, notes: body.notes },
        userId,
      );
      return;
    default:
      throw new Error("Invalid classification");
  }
}

// ── v4 auto-send outreach handlers ──────────────────────────────────────

/**
 * Schedule the full email cadence for a stakeholder. Inserts one
 * `outreach_email_send` task per email day (with subject/body snapshot)
 * + one `outreach_followup_call` task per phone day. Transitions stage
 * to `outreach_sent`. Then INLINE-fires Day 0 so the admin sees the
 * first email go out immediately rather than waiting for the cron.
 */
/**
 * Log that we offered a call (Calendly link sent). No stage transition.
 * The admin sends the link externally (in their reply) and clicks
 * "I sent it" in the modal, which triggers this action.
 */
async function handleOfferCall(
  db: DB,
  row: OutreachRow,
  body: { notes?: string },
  userId: string,
) {
  await insertTouchpoint(db, row.id, "note_added", userId, {
    notes: body.notes ?? "Offered Calendly link to book a 15-min call",
    payload: { reason: "call_offered", calendly: "https://calendly.com/caregivers979/olera-demo" },
  });
  await touchOutreach(db, row.id, userId);
}

async function handleScheduleSequence(
  db: DB,
  row: OutreachRow,
  body: { email_snapshots?: EmailSnapshot[] },
  userId: string,
) {
  const snapshots = body.email_snapshots ?? [];
  if (snapshots.length === 0) throw new Error("email_snapshots required");
  for (const s of snapshots) {
    if (!s.subject?.trim() || !s.body?.trim()) {
      throw new Error(`Day ${s.day} subject and body required`);
    }
  }

  // Reject if a sequence is already in flight (avoid duplicate scheduling).
  const { data: existing } = await db
    .from("student_outreach_tasks")
    .select("id")
    .eq("outreach_id", row.id)
    .eq("status", "pending")
    .eq("task_type", "outreach_email_send");
  if ((existing ?? []).length > 0) {
    throw new Error("Sequence already scheduled — cancel or wait for it to complete first");
  }

  // Plan + insert tasks.
  const plan = planSequence({
    outreach_id: row.id,
    stakeholder_type: row.stakeholder_type,
    email_snapshots: snapshots,
    user_id: userId,
  });
  const inserts = plan.map((p) => ({
    outreach_id: row.id,
    task_type: p.task_type,
    due_at: p.due_at.toISOString(),
    payload: p.payload,
    created_by: userId,
  }));
  const { data: insertedTasks, error: insertErr } = await db
    .from("student_outreach_tasks")
    .insert(inserts)
    .select("id, task_type, payload, due_at");
  if (insertErr) throw new Error(insertErr.message);

  // Transition stage prospect/researched → outreach_sent.
  if (row.status !== "outreach_sent") {
    await transitionStage(db, row, "outreach_sent", userId, "sequence_scheduled");
  } else {
    await touchOutreach(db, row.id, userId);
  }

  // Inline-fire Day 0 so admin sees immediate effect.
  const day0Task = (insertedTasks ?? []).find((t) => {
    const tt = t as { task_type: string; payload: Record<string, unknown> };
    return tt.task_type === "outreach_email_send" && tt.payload?.day === 0;
  }) as { id: string } | undefined;
  if (day0Task) {
    try {
      await executeEmailTask(day0Task.id);
    } catch (err) {
      // Inline send failed — task remains marked completed (claim-then-send
      // semantics) but with no successful sends. The auto-queued
      // manual_followup will surface this. Don't throw — admin already
      // succeeded in scheduling, the failure surfaces in history.
      console.error("Inline Day 0 send failed:", err);
    }
  }
}

/**
 * Edit the subject/body snapshot of an upcoming pending email task.
 * Server enforces: task must be `pending` and due_at must be at least
 * 15 minutes in the future (one cron interval) so we don't race the
 * executor.
 */
async function handleEditPendingEmail(
  db: DB,
  row: OutreachRow,
  body: { task_id?: string; subject?: string; body?: string },
  userId: string,
) {
  if (!body.task_id) throw new Error("task_id required");
  if (!body.subject?.trim() || !body.body?.trim()) {
    throw new Error("Subject and body required");
  }

  const { data: task } = await db
    .from("student_outreach_tasks")
    .select("id, status, due_at, task_type, payload")
    .eq("id", body.task_id)
    .eq("outreach_id", row.id)
    .single();
  if (!task) throw new Error("Task not found");
  const t = task as {
    status: string;
    due_at: string;
    task_type: string;
    payload: Record<string, unknown>;
  };
  if (t.status !== "pending") {
    return Promise.reject(
      Object.assign(new Error("Task is no longer pending"), { code: 409 }),
    );
  }
  if (t.task_type !== "outreach_email_send") {
    throw new Error("Can only edit outreach_email_send tasks");
  }
  const dueMs = new Date(t.due_at).getTime();
  if (dueMs - Date.now() < 15 * 60 * 1000) {
    throw new Error("Too close to send time to edit (within 15 minutes of due_at)");
  }

  const newPayload = { ...t.payload, subject: body.subject.trim(), body: body.body.trim() };
  await db
    .from("student_outreach_tasks")
    .update({ payload: newPayload })
    .eq("id", body.task_id);

  await insertTouchpoint(db, row.id, "note_added", userId, {
    payload: { edited_task_id: body.task_id, edited_day: t.payload?.day },
  });
  await touchOutreach(db, row.id, userId);
}

/** Cancel a single pending outreach_email_send task. */
async function handleSkipPendingEmail(
  db: DB,
  row: OutreachRow,
  body: { task_id?: string; reason?: string },
  userId: string,
) {
  if (!body.task_id) throw new Error("task_id required");
  const { data: task } = await db
    .from("student_outreach_tasks")
    .select("id, status, task_type, payload, due_at")
    .eq("id", body.task_id)
    .eq("outreach_id", row.id)
    .single();
  if (!task) throw new Error("Task not found");
  const t = task as { status: string; task_type: string; payload: Record<string, unknown>; due_at: string };
  if (t.status !== "pending") throw new Error("Task is no longer pending");
  if (t.task_type !== "outreach_email_send") throw new Error("Can only skip outreach_email_send tasks");
  const dueMs = new Date(t.due_at).getTime();
  if (dueMs - Date.now() < 15 * 60 * 1000) {
    throw new Error("Too close to send time to skip (within 15 minutes of due_at)");
  }

  await db
    .from("student_outreach_tasks")
    .update({
      status: "cancelled",
      completed_at: new Date().toISOString(),
      completed_by: userId,
      payload: { ...t.payload, outcome: "admin_skipped", reason: body.reason ?? null },
    })
    .eq("id", body.task_id);

  await insertTouchpoint(db, row.id, "task_cancelled", userId, {
    payload: { task_id: body.task_id, day: t.payload?.day, reason: body.reason ?? null },
  });
  await touchOutreach(db, row.id, userId);
}

/**
 * Bulk: mark multiple rows as engaged in one call (used by inbox check).
 * Each transition runs the full state-machine with cancellation hooks,
 * so all pending email tasks for those rows get superseded.
 */
async function handleMarkEngagedBulk(
  db: DB,
  body: { outreach_ids?: string[]; notes?: string },
  userId: string,
) {
  const ids = body.outreach_ids ?? [];
  if (ids.length === 0) throw new Error("outreach_ids required");
  if (ids.length > 50) throw new Error("Max 50 rows at once");

  for (const id of ids) {
    const { data: rowData } = await db
      .from("student_outreach")
      .select("*")
      .eq("id", id)
      .single();
    if (!rowData) continue;
    const r = rowData as OutreachRow;
    if (r.status !== "outreach_sent") continue; // Only flip rows currently in outreach.
    await transitionStage(db, r, "engaged", userId, body.notes ?? "via inbox check");
  }
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
