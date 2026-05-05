/**
 * GET   /api/admin/student-outreach/campuses/[slug]   — campus + stakeholders
 * PATCH /api/admin/student-outreach/campuses/[slug]   — update campus
 *
 * The GET response groups stakeholders by type and includes a status
 * summary so the campus page can render coverage at a glance.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type { Campus, OutreachRow, StakeholderType, Status } from "@/lib/student-outreach/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  const db = getServiceClient();

  const { data: campus, error: campusErr } = await db
    .from("student_outreach_campuses")
    .select("*")
    .eq("slug", slug)
    .single();
  if (campusErr || !campus) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: stakeholders } = await db
    .from("student_outreach")
    .select("*")
    .eq("campus_id", (campus as Campus).id)
    .order("stakeholder_type", { ascending: true })
    .order("organization_name", { ascending: true });

  const grouped: Record<StakeholderType, OutreachRow[]> = {
    student_org: [],
    advisor: [],
    dept_head: [],
    professor: [],
  };
  for (const r of (stakeholders ?? []) as OutreachRow[]) {
    grouped[r.stakeholder_type].push(r);
  }

  const statusSummary: Partial<Record<Status, number>> = {};
  for (const r of (stakeholders ?? []) as OutreachRow[]) {
    statusSummary[r.status] = (statusSummary[r.status] ?? 0) + 1;
  }

  return NextResponse.json({
    campus,
    stakeholders_by_type: grouped,
    total: stakeholders?.length ?? 0,
    status_summary: statusSummary,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  const body = await req.json();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (body.city !== undefined) patch.city = body.city || null;
  if (body.state !== undefined) patch.state = body.state ? String(body.state).toUpperCase() : null;
  if (body.notes !== undefined) patch.notes = body.notes ?? null;
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (typeof body.research_complete === "boolean") patch.research_complete = body.research_complete;

  const db = getServiceClient();
  const { data, error } = await db
    .from("student_outreach_campuses")
    .update(patch)
    .eq("slug", slug)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ campus: data });
}
