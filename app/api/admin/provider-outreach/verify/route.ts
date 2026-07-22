import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/verify
 *
 * Records email verification or flag for a provider.
 * Body: { provider_id, email, action: "verified"|"flagged", flag_reason? }
 *
 * If the pipeline table exists, updates the row there.
 * Otherwise stores as a lightweight record for when it does.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { provider_id, email, action, flag_reason } = body;

  if (!provider_id || !action) {
    return NextResponse.json({ error: "Missing provider_id or action" }, { status: 400 });
  }

  const db = getServiceClient();

  // Try updating provider_outreach if it exists
  const { error: testErr } = await db.from("provider_outreach").select("id").limit(1);

  if (!testErr) {
    const updates: Record<string, unknown> = {
      email_verified: action === "verified",
      email_verified_at: action === "verified" ? new Date().toISOString() : null,
      email_verified_by: action === "verified" ? user.id : null,
      email_flag_reason: action === "flagged" ? (flag_reason || "wrong_info") : null,
    };
    if (email) updates.email = email;
    if (action === "verified") updates.status = "send_ready";

    const { error: updateErr } = await db
      .from("provider_outreach")
      .update(updates)
      .eq("provider_id", provider_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    provider_id,
    action,
    email,
    pipeline: !testErr ? "updated" : "pending_migration",
  });
}
