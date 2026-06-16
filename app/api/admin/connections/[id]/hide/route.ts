import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/connections/[id]/hide
 *
 * Hides a connection from the admin connections page.
 * This is purely cosmetic for cleaning up test data - it does NOT:
 * - Delete the connection from the database
 * - Affect the provider's view of the lead
 * - Affect the family's experience
 * - Stop email sequences
 *
 * The connection remains fully functional, just invisible in admin UI.
 *
 * Body: { action: "hide" | "unhide" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin auth check
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: connectionId } = await params;

    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Parse body
    let body: { action?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { action } = body;

    if (action !== "hide" && action !== "unhide") {
      return NextResponse.json(
        { error: "action must be 'hide' or 'unhide'" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Fetch connection
    const { data: connection, error: fetchError } = await db
      .from("connections")
      .select("id, metadata")
      .eq("id", connectionId)
      .maybeSingle();

    if (fetchError) {
      console.error("[hide-connection] Fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch connection" },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    const meta = (connection.metadata as Record<string, unknown>) ?? {};
    const now = new Date().toISOString();

    if (action === "hide") {
      const updatedMeta = {
        ...meta,
        admin_hidden: true,
        admin_hidden_at: now,
        admin_hidden_by: user.email,
      };

      const { error: updateError } = await db
        .from("connections")
        .update({ metadata: updatedMeta })
        .eq("id", connectionId);

      if (updateError) {
        console.error("[hide-connection] Update error:", updateError);
        return NextResponse.json(
          { error: "Failed to hide connection" },
          { status: 500 }
        );
      }

      console.log(
        `[hide-connection] Hidden connection ${connectionId} by ${user.email}`
      );

      return NextResponse.json({
        success: true,
        connection_id: connectionId,
        admin_hidden: true,
        hidden_at: now,
        hidden_by: user.email,
      });
    } else {
      // Unhide
      const updatedMeta = { ...meta };
      delete updatedMeta.admin_hidden;
      delete updatedMeta.admin_hidden_at;
      delete updatedMeta.admin_hidden_by;

      const { error: updateError } = await db
        .from("connections")
        .update({ metadata: updatedMeta })
        .eq("id", connectionId);

      if (updateError) {
        console.error("[hide-connection] Unhide error:", updateError);
        return NextResponse.json(
          { error: "Failed to unhide connection" },
          { status: 500 }
        );
      }

      console.log(
        `[hide-connection] Unhidden connection ${connectionId} by ${user.email}`
      );

      return NextResponse.json({
        success: true,
        connection_id: connectionId,
        admin_hidden: false,
      });
    }
  } catch (err) {
    console.error("[hide-connection] Fatal error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
