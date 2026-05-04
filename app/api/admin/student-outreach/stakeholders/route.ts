/**
 * POST /api/admin/student-outreach/stakeholders
 *
 * Create a new stakeholder row + optional first contact. Auto-queues the
 * Day-0 research task per state-machine.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { onStageEnter } from "@/lib/student-outreach/state-machine";
import type { StakeholderType, ContactPermission } from "@/lib/student-outreach/types";

const STAKEHOLDER_TYPES: StakeholderType[] = [
  "student_org",
  "advisor",
  "professor",
  "dept_head",
];

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const campus_slug = (body.campus_slug as string)?.trim();
  const stakeholder_type = body.stakeholder_type as StakeholderType;
  const organization_name = (body.organization_name as string)?.trim();
  const department = (body.department as string)?.trim() || null;
  const programs = Array.isArray(body.programs) ? (body.programs as string[]) : [];
  const notes = (body.notes as string)?.trim() || null;
  const research_data = body.research_data ?? {};
  const initial_contact = body.initial_contact ?? null;

  // Professor-specific
  const contact_permission: ContactPermission = body.contact_permission ?? "not_yet";
  const permission_dependency_id = body.permission_dependency_id ?? null;

  if (!campus_slug) return NextResponse.json({ error: "campus_slug required" }, { status: 400 });
  if (!stakeholder_type || !STAKEHOLDER_TYPES.includes(stakeholder_type)) {
    return NextResponse.json({ error: "Invalid stakeholder_type" }, { status: 400 });
  }
  if (!organization_name) {
    return NextResponse.json({ error: "organization_name required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: campus } = await db
    .from("student_outreach_campuses")
    .select("id")
    .eq("slug", campus_slug)
    .single();
  if (!campus) return NextResponse.json({ error: "Campus not found" }, { status: 404 });

  const { data: created, error } = await db
    .from("student_outreach")
    .insert({
      campus_id: (campus as { id: string }).id,
      stakeholder_type,
      organization_name,
      department,
      programs,
      notes,
      research_data,
      contact_permission: stakeholder_type === "professor" ? contact_permission : "not_yet",
      permission_dependency_id: stakeholder_type === "professor" ? permission_dependency_id : null,
      status: "prospect",
      created_by: user.id,
      last_edited_by: user.id,
    })
    .select("*")
    .single();
  if (error || !created) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 400 });
  }

  const newId = (created as { id: string }).id;

  // Optional first contact
  if (initial_contact && initial_contact.name?.trim()) {
    await db.from("student_outreach_contacts").insert({
      outreach_id: newId,
      name: initial_contact.name.trim(),
      role: initial_contact.role ?? null,
      email: initial_contact.email ?? null,
      phone: initial_contact.phone ?? null,
      instagram: initial_contact.instagram ?? null,
      contact_form_url: initial_contact.contact_form_url ?? null,
      is_primary: true,
      created_by: user.id,
    });
    await db.from("student_outreach_touchpoints").insert({
      outreach_id: newId,
      touchpoint_type: "contact_added",
      created_by: user.id,
      payload: { initial: true },
    });
  }

  // Queue prospect-stage task per state machine.
  const effects = onStageEnter("prospect", { stakeholderType: stakeholder_type });
  if (effects.taskToQueue) {
    await db.from("student_outreach_tasks").insert({
      outreach_id: newId,
      task_type: effects.taskToQueue.task_type,
      due_at: effects.taskToQueue.due_at.toISOString(),
      created_by: user.id,
    });
  }

  // Optional: dept-head form's "ask for prof permission" shortcut.
  // Auto-creates the approval row + the 5-day follow-up task so the
  // admin doesn't have to remember to do it later.
  if (stakeholder_type === "dept_head" && body.request_professor_approval) {
    const followupAt = new Date(Date.now() + 5 * 86_400_000);
    const { data: approval } = await db
      .from("student_outreach_approvals")
      .insert({
        outreach_id: newId,
        approval_type: "department",
        approval_for: "Contact professors in this department",
        next_followup_at: followupAt.toISOString(),
        created_by: user.id,
        last_updated_by: user.id,
      })
      .select("id")
      .single();
    if (approval) {
      await db.from("student_outreach_tasks").insert({
        outreach_id: newId,
        approval_id: (approval as { id: string }).id,
        task_type: "approval_request_followup",
        due_at: followupAt.toISOString(),
        payload: { approval_for: "Contact professors in this department", approval_type: "department" },
        created_by: user.id,
      });
      await db.from("student_outreach_touchpoints").insert({
        outreach_id: newId,
        touchpoint_type: "approval_requested",
        created_by: user.id,
        payload: {
          approval_id: (approval as { id: string }).id,
          approval_type: "department",
          approval_for: "Contact professors in this department",
          source: "dept_head_form",
        },
      });
    }
  }

  return NextResponse.json({ outreach: created });
}
