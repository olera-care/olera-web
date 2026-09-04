import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * PATCH /api/admin/provider-outreach/update-fax
 *
 * Update a provider's fax number in provider_outreach_tracking table.
 *
 * Body:
 *   - provider_id: string (required)
 *   - fax: string (required) - new fax to set (can be empty to clear)
 */
export async function PATCH(request: NextRequest) {
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
    const { provider_id, fax } = body;

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (fax === undefined) {
      return NextResponse.json({ error: "fax is required" }, { status: 400 });
    }

    const db = getServiceClient();
    const trimmedFax = (fax || "").trim();

    // Get current tracking data
    const { data: tracking } = await db
      .from("provider_outreach_tracking")
      .select("id, fax_number")
      .eq("provider_id", provider_id)
      .maybeSingle();

    if (!tracking) {
      return NextResponse.json({ error: "Provider tracking not found" }, { status: 404 });
    }

    // Update the fax number
    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update({
        fax_number: trimmedFax || null,
        fax_confidence: trimmedFax ? "manual" : null,
      })
      .eq("id", tracking.id);

    if (updateError) {
      console.error("[provider-outreach/update-fax] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update fax" }, { status: 500 });
    }

    // Log audit action
    await logAuditAction({
      adminUserId: adminUser.id,
      action: "update_provider_fax",
      targetType: "provider",
      targetId: provider_id,
      details: {
        old_fax: tracking.fax_number,
        new_fax: trimmedFax || null,
      },
    });

    return NextResponse.json({
      success: true,
      fax: trimmedFax || null,
    });
  } catch (err) {
    console.error("[provider-outreach/update-fax] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
