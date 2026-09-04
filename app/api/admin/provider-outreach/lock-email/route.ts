import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * Toggle email lock status for a provider.
 * Simple indicator for admins to mark an email as "confirmed/locked in".
 * POST: { provider_id, locked: boolean }
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
    const { provider_id, locked } = body;

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Update the email_locked_by field
    const { error } = await db
      .from("olera-providers")
      .update({
        email_locked_by: locked ? adminUser.id : null,
      })
      .eq("provider_id", provider_id);

    if (error) {
      console.error("[lock-email] Update error:", error);
      return NextResponse.json({ error: "Failed to update lock status" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      provider_id,
      email_locked_by: locked ? adminUser.id : null,
    });
  } catch (err) {
    console.error("[lock-email] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
