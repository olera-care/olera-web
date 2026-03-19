import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * PATCH /api/admin/removal-requests/[id]
 *
 * Approve or reject a removal request.
 * Body: { action: "approve" | "reject" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = getServiceClient();

    // Update the request status
    const { error: updateErr } = await db
      .from("removal_requests")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      console.error("Update removal request error:", updateErr);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    // If approved, soft-delete the provider in olera-providers
    if (action === "approve") {
      const { data: req } = await db
        .from("removal_requests")
        .select("provider_id, provider_slug, action")
        .eq("id", id)
        .single();

      if (req) {
        // Mark as deleted in olera-providers
        await db
          .from("olera-providers")
          .update({ deleted: true, deleted_at: new Date().toISOString() })
          .eq("provider_id", req.provider_id);

        // Also mark business_profile if it exists
        if (req.provider_slug) {
          await db
            .from("business_profiles")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("slug", req.provider_slug);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin removal request action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
