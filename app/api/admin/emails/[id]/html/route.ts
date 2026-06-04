import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/emails/[id]/html
 *
 * Fetch the HTML body of a specific email for preview.
 * Admin-only endpoint.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { id } = await params;
    const db = getServiceClient();

    const { data: email, error } = await db
      .from("email_log")
      .select("id, html_body")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[emails/:id/html] query error:", error);
      return NextResponse.json({ error: "Failed to load email" }, { status: 500 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ html_body: email.html_body });
  } catch (err) {
    console.error("[emails/:id/html] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
