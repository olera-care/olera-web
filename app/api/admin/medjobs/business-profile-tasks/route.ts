import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * v9.0 Phase 7 Commit B: business_profile_tasks API.
 *
 * Custom-only "Step Board" tasks attached to a provider (Client) or
 * student (Candidate) business_profile. Mirrors the shape of the
 * stakeholder-side queue_manual_task action — text-only, due_at=now,
 * task_type=manual_followup. The full state machine lives on
 * student_outreach; this surface is intentionally simpler.
 *
 *   GET ?business_profile_id=&kind=  → list pending tasks for a profile
 *   POST { business_profile_id, kind, summary } → create a custom task
 */

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const profileId = url.searchParams.get("business_profile_id");
  if (!profileId) {
    return NextResponse.json({ error: "business_profile_id required" }, { status: 400 });
  }
  const kindParam = url.searchParams.get("kind");

  const db = getServiceClient();
  let q = db
    .from("business_profile_tasks")
    .select("id, business_profile_id, kind, task_type, due_at, status, payload, notes, completed_at, created_at, created_by")
    .eq("business_profile_id", profileId)
    .order("created_at", { ascending: false });
  if (kindParam) q = q.eq("kind", kindParam);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    business_profile_id?: string;
    kind?: "client" | "candidate";
    summary?: string;
  };
  const profileId = body.business_profile_id;
  const kind = body.kind;
  const summary = (body.summary ?? "").trim();

  if (!profileId) {
    return NextResponse.json({ error: "business_profile_id required" }, { status: 400 });
  }
  if (kind !== "client" && kind !== "candidate") {
    return NextResponse.json({ error: "kind must be 'client' or 'candidate'" }, { status: 400 });
  }
  if (!summary) {
    return NextResponse.json({ error: "summary required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("business_profile_tasks")
    .insert({
      business_profile_id: profileId,
      kind,
      task_type: "manual_followup",
      due_at: new Date().toISOString(),
      status: "pending",
      payload: { reason: "custom", summary },
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ task: data });
}
