import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/update-assignment
 *
 * Update the assigned_to field for a provider.
 *
 * Body:
 *   - provider_id: string (required) - The provider to update
 *   - assigned_to: string | null - Admin user ID to assign, or null to remove assignment
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
    const { provider_id, assigned_to } = body;

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Update the tracking record
    const { error } = await db
      .from("provider_outreach_tracking")
      .update({ assigned_to })
      .eq("provider_id", provider_id);

    if (error) {
      console.error("[update-assignment] Update error:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    // Log touchpoint
    await db.from("provider_outreach_touchpoints").insert({
      provider_id,
      touchpoint_type: "assignment_changed",
      details: {
        assigned_to,
        changed_by: adminUser.id,
        action: assigned_to ? "assigned" : "unassigned",
      },
      admin_user_id: adminUser.id,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[update-assignment] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
