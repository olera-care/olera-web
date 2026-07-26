import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/admins
 *
 * Returns all admin users for autocomplete/dropdown.
 * Used for assigning providers or cities to admins.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const db = getServiceClient();

    const { data: admins, error } = await db
      .from("admin_users")
      .select("id, email, display_name")
      .order("display_name", { ascending: true });

    if (error) {
      console.error("[admins] Failed to fetch admin users:", error);
      return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
    }

    return NextResponse.json({
      admins: admins || [],
      current_admin_id: adminUser.id,
    });
  } catch (err) {
    console.error("[admins] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
