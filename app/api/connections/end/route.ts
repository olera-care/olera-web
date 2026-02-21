import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  type?: string;
}

/**
 * POST /api/connections/end
 *
 * Ends a responded (accepted) connection. Sets status to "archived"
 * with metadata.ended = true. Auto-cancels any active next step request.
 * Adds a system note to the conversation thread.
 *
 * Unlike withdraw, the provider IS notified (handled client-side for now).
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

    // Can only end accepted connections
    if (connection.status !== "accepted") {
      return NextResponse.json(
        { error: "Can only end responded connections" },
        { status: 400 }
      );
    }

    const existingMeta =
      (connection.metadata as Record<string, unknown>) || {};
    const existingThread = (existingMeta.thread as ThreadMessage[]) || [];
    const now = new Date().toISOString();

    // Add system note
    const endMessage: ThreadMessage = {
      from_profile_id: profileId,
      text: "You ended this connection",
      created_at: now,
      type: "system",
    };

    const updatedThread = [...existingThread, endMessage];

    const { error: updateError } = await supabase
      .from("connections")
      .update({
        status: "expired",
        metadata: {
          ...existingMeta,
          thread: updatedThread,
          ended: true,
          ended_at: now,
          next_step_request: null,
        },
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("End connection error:", updateError);
      return NextResponse.json(
        { error: "Failed to end connection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "ended" });
  } catch (err) {
    console.error("End connection error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
