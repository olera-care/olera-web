import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * v9.0 Phase 7 Commit B: PATCH a site_task.
 *
 *   { action: "complete" }       → status=completed
 *   { action: "cancel"   }       → status=cancelled
 *   { action: "edit", summary }  → update payload.summary
 */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { taskId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: "complete" | "cancel" | "edit";
    summary?: string;
  };

  const db = getServiceClient();

  if (body.action === "complete") {
    const { error } = await db
      .from("site_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: user.id,
      })
      .eq("id", taskId)
      .eq("status", "pending");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "cancel") {
    const { error } = await db
      .from("site_tasks")
      .update({ status: "cancelled" })
      .eq("id", taskId)
      .eq("status", "pending");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "edit") {
    const summary = (body.summary ?? "").trim();
    if (!summary) return NextResponse.json({ error: "summary required" }, { status: 400 });
    const { data: existing, error: readErr } = await db
      .from("site_tasks")
      .select("payload")
      .eq("id", taskId)
      .eq("status", "pending")
      .single();
    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
    const payload = { ...((existing?.payload as Record<string, unknown>) ?? {}), summary };
    const { error } = await db
      .from("site_tasks")
      .update({ payload })
      .eq("id", taskId)
      .eq("status", "pending");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
