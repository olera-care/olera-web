import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * v9.0 Phase 7 Commit B: site_tasks API.
 *
 * Custom-only "Step Board" tasks attached to a site
 * (student_outreach_campuses row — the DB column is still campus_id).
 * Same shape as business_profile_tasks but parent FK differs.
 *
 *   GET ?campus_id= → list pending tasks for a site
 *   POST { campus_id, summary } → create a custom task
 */

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const campusId = url.searchParams.get("campus_id");
  if (!campusId) {
    return NextResponse.json({ error: "campus_id required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("site_tasks")
    .select("id, campus_id, task_type, due_at, status, payload, notes, completed_at, created_at, created_by")
    .eq("campus_id", campusId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    campus_id?: string;
    summary?: string;
  };
  const campusId = body.campus_id;
  const summary = (body.summary ?? "").trim();
  if (!campusId) {
    return NextResponse.json({ error: "campus_id required" }, { status: 400 });
  }
  if (!summary) {
    return NextResponse.json({ error: "summary required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("site_tasks")
    .insert({
      campus_id: campusId,
      task_type: "manual_followup",
      due_at: new Date().toISOString(),
      status: "pending",
      payload: { reason: "custom", summary },
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
