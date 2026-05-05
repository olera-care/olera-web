/**
 * POST /api/admin/student-outreach/bulk-professors
 *
 * Bulk-create professor stakeholder rows under a parent dept_head/advisor
 * outreach row. Used after permission has been granted.
 *
 * Body:
 *   parent_outreach_id   uuid (must be dept_head or advisor)
 *   permission           granted_direct | via_dept | via_listserv
 *   department           text (optional, mirrors parent's department)
 *   entries              [{ name, email?, role? }, ...]
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { onStageEnter } from "@/lib/student-outreach/state-machine";
import type { ContactPermission, OutreachRow } from "@/lib/student-outreach/types";

interface BulkEntry {
  name: string;
  email?: string;
  role?: string;
}

const VALID_PERMS: ContactPermission[] = ["granted_direct", "via_dept", "via_listserv"];

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parentId = body.parent_outreach_id as string;
  const permission = body.permission as ContactPermission;
  const department = (body.department as string)?.trim() || null;
  const entries = (body.entries ?? []) as BulkEntry[];

  if (!parentId) return NextResponse.json({ error: "parent_outreach_id required" }, { status: 400 });
  if (!VALID_PERMS.includes(permission)) {
    return NextResponse.json({ error: "Invalid permission" }, { status: 400 });
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "entries required" }, { status: 400 });
  }
  if (entries.length > 200) {
    return NextResponse.json({ error: "Too many entries (max 200)" }, { status: 400 });
  }

  const db = getServiceClient();

  const { data: parent } = await db
    .from("student_outreach")
    .select("*")
    .eq("id", parentId)
    .single();
  if (!parent) return NextResponse.json({ error: "Parent outreach not found" }, { status: 404 });
  const parentRow = parent as OutreachRow;
  if (parentRow.stakeholder_type !== "dept_head" && parentRow.stakeholder_type !== "advisor") {
    return NextResponse.json(
      { error: "Parent must be a dept_head or advisor" },
      { status: 400 },
    );
  }

  // Validate + dedupe entries.
  const cleaned: Array<{ name: string; email: string | null; role: string | null }> = [];
  const seen = new Set<string>();
  const errors: Array<{ index: number; reason: string }> = [];
  entries.forEach((e, i) => {
    const name = e.name?.trim();
    if (!name) {
      errors.push({ index: i, reason: "missing name" });
      return;
    }
    const email = e.email?.trim() ?? null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ index: i, reason: "invalid email" });
      return;
    }
    const dedupeKey = (email ?? name).toLowerCase();
    if (seen.has(dedupeKey)) {
      errors.push({ index: i, reason: "duplicate" });
      return;
    }
    seen.add(dedupeKey);
    cleaned.push({ name, email, role: e.role?.trim() ?? null });
  });

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "No valid entries", errors }, { status: 400 });
  }

  // Dedupe against existing professors in this campus + dept.
  const existingEmails = new Set<string>();
  if (cleaned.some((c) => c.email)) {
    const { data: existing } = await db
      .from("student_outreach_contacts")
      .select("email, student_outreach!inner(campus_id, stakeholder_type)")
      .in(
        "email",
        cleaned.map((c) => c.email).filter((e): e is string => !!e),
      )
      .eq("student_outreach.campus_id", parentRow.campus_id)
      .eq("student_outreach.stakeholder_type", "professor");
    for (const e of (existing ?? []) as Array<{ email: string }>) {
      if (e.email) existingEmails.add(e.email.toLowerCase());
    }
  }

  const created: string[] = [];
  const skipped: Array<{ name: string; reason: string }> = [];

  for (const entry of cleaned) {
    if (entry.email && existingEmails.has(entry.email.toLowerCase())) {
      skipped.push({ name: entry.name, reason: "already exists at this campus" });
      continue;
    }

    const { data: profRow, error: profErr } = await db
      .from("student_outreach")
      .insert({
        campus_id: parentRow.campus_id,
        stakeholder_type: "professor",
        organization_name: entry.name,
        department: department ?? parentRow.department,
        programs: parentRow.programs,
        contact_permission: permission,
        permission_dependency_id: parentId,
        status: "prospect",
        created_by: user.id,
        last_edited_by: user.id,
      })
      .select("id")
      .single();
    if (profErr || !profRow) {
      skipped.push({ name: entry.name, reason: profErr?.message ?? "insert failed" });
      continue;
    }
    const profId = (profRow as { id: string }).id;

    if (entry.email || entry.role) {
      // v8.7: split the parsed full name into first/last for personalization.
      const [firstWord, ...restWords] = entry.name.trim().split(/\s+/);
      const firstName = firstWord ?? null;
      const lastName = restWords.length > 0 ? restWords.join(" ") : null;
      await db.from("student_outreach_contacts").insert({
        outreach_id: profId,
        name: entry.name,
        first_name: firstName,
        last_name: lastName,
        role: entry.role,
        email: entry.email,
        is_primary: true,
        created_by: user.id,
      });
    }

    await db.from("student_outreach_touchpoints").insert({
      outreach_id: profId,
      touchpoint_type: "approval_granted",
      created_by: user.id,
      payload: { source: "bulk_unlock", parent_outreach_id: parentId, permission },
    });

    // Queue Day-0 research task; admin can trigger outreach immediately.
    const effects = onStageEnter("prospect", { stakeholderType: "professor" });
    if (effects.taskToQueue) {
      await db.from("student_outreach_tasks").insert({
        outreach_id: profId,
        task_type: effects.taskToQueue.task_type,
        due_at: effects.taskToQueue.due_at.toISOString(),
        created_by: user.id,
      });
    }

    created.push(profId);
  }

  // Log the parent-side touchpoint summarizing the unlock.
  await db.from("student_outreach_touchpoints").insert({
    outreach_id: parentId,
    touchpoint_type: "approval_granted",
    created_by: user.id,
    payload: {
      bulk_professor_unlock: true,
      created_count: created.length,
      skipped_count: skipped.length,
      permission,
    },
  });

  return NextResponse.json({
    created_count: created.length,
    created_ids: created,
    skipped,
    parse_errors: errors,
  });
}
