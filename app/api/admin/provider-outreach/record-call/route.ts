import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/record-call
 *
 * Record that an admin called a provider (for generic email verification).
 * Creates a touchpoint of type "call_verified".
 *
 * Request body:
 *   - provider_id: string (required)
 *   - notes?: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { provider_id, notes } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();
    const nowIso = new Date().toISOString();

    // Insert touchpoint
    const { error: touchpointError } = await db
      .from("provider_outreach_touchpoints")
      .insert({
        provider_id,
        touchpoint_type: "call_verified",
        details: {
          trigger: "generic_email_warning",
          ...(notes?.trim() && { notes: notes.trim() }),
        },
        admin_user_id: adminUser.id,
        created_at: nowIso,
      });

    if (touchpointError) {
      console.error("[record-call] Touchpoint insert error:", touchpointError);
      return NextResponse.json({ error: "Failed to record call" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[record-call] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
