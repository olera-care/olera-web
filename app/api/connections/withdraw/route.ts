import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/connections/withdraw
 *
 * Withdraws a pending connection request. Only the sender (from_profile_id)
 * can withdraw. Sets status to "expired" with metadata.withdrawn = true.
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
      .select("id, from_profile_id, status, metadata")
      .eq("id", connectionId)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Only the sender can withdraw
    if (connection.from_profile_id !== account.active_profile_id) {
      return NextResponse.json(
        { error: "Only the sender can withdraw a request" },
        { status: 403 }
      );
    }

    // Can only withdraw pending connections
    if (connection.status !== "pending") {
      return NextResponse.json(
        { error: "Can only withdraw pending connections" },
        { status: 400 }
      );
    }

    // Update status to expired with withdrawn metadata
    const existingMeta =
      (connection.metadata as Record<string, unknown>) || {};
    const { error: updateError } = await supabase
      .from("connections")
      .update({
        status: "expired",
        metadata: {
          ...existingMeta,
          withdrawn: true,
          withdrawn_at: new Date().toISOString(),
        },
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("Withdraw error:", updateError);
      return NextResponse.json(
        { error: "Failed to withdraw" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "withdrawn" });
  } catch (err) {
    console.error("Withdraw error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
