import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
}

/**
 * POST /api/connections/message
 *
 * Appends a message to the connection's metadata.thread array.
 * Only participants can send messages. Connection must be pending or accepted.
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
    const { connectionId, text } = body as {
      connectionId?: string;
      text?: string;
    };

    if (!connectionId || !text?.trim()) {
      return NextResponse.json(
        { error: "connectionId and text are required" },
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

    // Can only message on pending or accepted connections
    if (connection.status !== "pending" && connection.status !== "accepted") {
      return NextResponse.json(
        { error: "Cannot send messages on this connection" },
        { status: 400 }
      );
    }

    // Append message to metadata.thread
    const existingMeta =
      (connection.metadata as Record<string, unknown>) || {};
    const existingThread = (existingMeta.thread as ThreadMessage[]) || [];

    const newMessage: ThreadMessage = {
      from_profile_id: profileId,
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    const updatedThread = [...existingThread, newMessage];

    const { error: updateError } = await supabase
      .from("connections")
      .update({
        metadata: { ...existingMeta, thread: updatedThread },
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("Message error:", updateError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ thread: updatedThread });
  } catch (err) {
    console.error("Message error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
