import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * v9.0 Phase 7 Commit O: unified mark-read / mark-unread for the
 * non-stakeholder entity drawers.
 *
 * Stakeholders use the existing per-row /api/admin/student-outreach/[id]
 * action endpoint with action="mark_read" / "mark_unread" (writes
 * student_outreach.viewed_at). This route mirrors that contract for
 * Sites / Clients / Candidates so every entity drawer can fire one
 * call on mount and the unread badge clears live across the In
 * Basket + sidebar.
 *
 * Body: { kind: "client" | "candidate" | "site", id: string,
 *         action?: "read" | "unread" }
 *   - kind=client / candidate → updates business_profiles
 *     metadata.admin_viewed_at
 *   - kind=site               → updates student_outreach_campuses.viewed_at
 *   - action=read (default)   → sets to NOW()
 *   - action=unread           → clears the field
 *
 * The asymmetric storage (column vs metadata) is intentional — see
 * the 076 migration comment for the reasoning. Callers don't need
 * to know which table is touched.
 */

type Kind = "client" | "candidate" | "site";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    kind?: Kind;
    id?: string;
    action?: "read" | "unread";
  };
  const kind = body.kind;
  const id = body.id?.trim();
  const action = body.action ?? "read";

  if (kind !== "client" && kind !== "candidate" && kind !== "site") {
    return NextResponse.json(
      { error: "kind must be 'client' | 'candidate' | 'site'" },
      { status: 400 },
    );
  }
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (action !== "read" && action !== "unread") {
    return NextResponse.json({ error: "action must be 'read' | 'unread'" }, { status: 400 });
  }

  const db = getServiceClient();

  if (kind === "site") {
    const { error } = await db
      .from("student_outreach_campuses")
      .update({ viewed_at: action === "read" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // client / candidate → business_profiles.metadata.admin_viewed_at
  const { data: profile, error: fetchErr } = await db
    .from("business_profiles")
    .select("metadata")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !profile) {
    return NextResponse.json(
      { error: fetchErr?.message ?? "Profile not found" },
      { status: 404 },
    );
  }

  const existing = (profile.metadata ?? {}) as Record<string, unknown>;
  let nextMetadata: Record<string, unknown>;
  if (action === "read") {
    nextMetadata = { ...existing, admin_viewed_at: new Date().toISOString() };
  } else {
    // Mark unread: drop the key entirely so unread reads as `not present`
    // rather than `present but empty`.
    nextMetadata = { ...existing };
    delete nextMetadata.admin_viewed_at;
  }

  const { error: updateErr } = await db
    .from("business_profiles")
    .update({ metadata: nextMetadata })
    .eq("id", id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
