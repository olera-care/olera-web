import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * PATCH /api/admin/provider-outreach/update-phone
 *
 * Update a provider's phone number in olera-providers table.
 * Also resets confirmation status since contact info has changed.
 *
 * Body:
 *   - provider_id: string (required)
 *   - phone: string (required) - new phone to set (can be empty to clear)
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
    const { provider_id, phone } = body;

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (phone === undefined) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    const db = getServiceClient();
    const trimmedPhone = (phone || "").trim();

    // Get current provider data
    const { data: existing } = await db
      .from("olera-providers")
      .select("phone, provider_name")
      .eq("provider_id", provider_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Update the phone
    const { error: updateError } = await db
      .from("olera-providers")
      .update({ phone: trimmedPhone || null })
      .eq("provider_id", provider_id);

    if (updateError) {
      console.error("[provider-outreach/update-phone] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update phone" }, { status: 500 });
    }

    // Reset confirmation status since contact info changed
    const { data: tracking } = await db
      .from("provider_outreach_tracking")
      .select("id")
      .eq("provider_id", provider_id)
      .maybeSingle();

    if (tracking) {
      await db
        .from("provider_outreach_tracking")
        .update({
          confirmed_at: null,
          confirmed_by: null,
        })
        .eq("id", tracking.id);
    }

    // Log audit action
    await logAuditAction({
      adminUserId: adminUser.id,
      action: "update_provider_phone",
      targetType: "provider",
      targetId: provider_id,
      details: {
        provider_name: existing.provider_name,
        old_phone: existing.phone,
        new_phone: trimmedPhone || null,
      },
    });

    return NextResponse.json({
      success: true,
      phone: trimmedPhone || null,
    });
  } catch (err) {
    console.error("[provider-outreach/update-phone] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
