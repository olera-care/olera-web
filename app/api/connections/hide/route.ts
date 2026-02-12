import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/connections/hide
 *
 * Soft-deletes a past connection from the user's list.
 * Sets metadata.hidden = true. Only works on declined/expired connections.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId } = body as { connectionId?: string };

    if (!connectionId) {
      return NextResponse.json(
        { error: "connectionId is required" },
        { status: 400 }
      );
    }

    // Get user's active profile
    const { data: account } = await supabase
      .from("accounts")
      .select("active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json(
        { error: "No active profile" },
        { status: 400 }
      );
    }

    // Fetch the connection
    const { data: connection, error: fetchError } = await supabase
      .from("connections")
      .select("id, from_profile_id, to_profile_id, status, metadata")
      .eq("id", connectionId)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Must be a participant
    const profileId = account.active_profile_id;
    if (
      connection.from_profile_id !== profileId &&
      connection.to_profile_id !== profileId
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Can only hide past connections (declined or expired/withdrawn)
    if (connection.status !== "declined" && connection.status !== "expired") {
      return NextResponse.json(
        { error: "Can only remove past connections" },
        { status: 400 }
      );
    }

    // Set hidden flag in metadata
    const existingMeta =
      (connection.metadata as Record<string, unknown>) || {};
    const { error: updateError } = await supabase
      .from("connections")
      .update({
        metadata: { ...existingMeta, hidden: true },
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("Hide error:", updateError);
      return NextResponse.json(
        { error: "Failed to remove" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "hidden" });
  } catch (err) {
    console.error("Hide error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
