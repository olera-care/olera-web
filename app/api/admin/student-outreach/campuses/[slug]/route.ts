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

  // v8.6: pull approvals for every stakeholder at this campus and group
  // by outreach_id. The Professor permission gate in the bulk modal uses
  // this to detect whether any dept head has a granted "Email professors
  // directly" approval before showing the import flow.
  const stakeholderIds = ((stakeholders ?? []) as OutreachRow[]).map((s) => s.id);
  const approvalsByOutreach: Record<
    string,
    Array<{ approval_for: string; status: string; resolved_at: string | null }>
  > = {};
  if (stakeholderIds.length > 0) {
    const { data: approvals } = await db
      .from("student_outreach_approvals")
      .select("outreach_id, approval_for, status, resolved_at")
      .in("outreach_id", stakeholderIds);
    for (const a of (approvals ?? []) as Array<{
      outreach_id: string;
      approval_for: string;
      status: string;
      resolved_at: string | null;
    }>) {
      if (!approvalsByOutreach[a.outreach_id]) approvalsByOutreach[a.outreach_id] = [];
      approvalsByOutreach[a.outreach_id].push({
        approval_for: a.approval_for,
        status: a.status,
        resolved_at: a.resolved_at,
      });
    }
  }

  return NextResponse.json({
    campus,
    stakeholders_by_type: grouped,
    approvals_by_outreach: approvalsByOutreach,
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

  // Partner manual-audit gate (Chunk 1.3): merge per-subtype checklist state
  // into partner_research.audit[subtype]. Body shape:
  //   { partner_audit: { subtype, steps: {key:bool}, complete: bool } }
  if (body.partner_audit && typeof body.partner_audit === "object") {
    const pa = body.partner_audit as {
      subtype?: string;
      steps?: Record<string, boolean>;
      complete?: boolean;
    };
    const validSubtypes = ["advisor", "student_org", "dept_head"];
    if (pa.subtype && validSubtypes.includes(pa.subtype)) {
      const { data: cur } = await db
        .from("student_outreach_campuses")
        .select("partner_research")
        .eq("slug", slug)
        .maybeSingle();
      const pr = ((cur?.partner_research as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
      const audit = (pr.audit ?? {}) as Record<string, unknown>;
      audit[pa.subtype] = {
        steps: pa.steps ?? {},
        complete_at: pa.complete ? new Date().toISOString() : null,
      };
      patch.partner_research = { ...pr, audit };

      // Task B: once the audit is complete for ALL partner subtypes, the
      // Site's partner prospecting is done — set research_complete so the
      // campus research card leaves the In-Basket/Prospects queue. (The Site
      // card persists in Sites regardless.)
      const allSubtypesDone = validSubtypes.every(
        (st) => (audit[st] as { complete_at?: string | null } | undefined)?.complete_at,
      );
      if (allSubtypesDone) patch.research_complete = true;
    }
  }

  const { data, error } = await db
    .from("student_outreach_campuses")
    .update(patch)
    .eq("slug", slug)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ campus: data });
}
