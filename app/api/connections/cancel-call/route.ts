import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  type?: string;
}

/**
 * POST /api/connections/cancel-call
 *
 * Cancels a scheduled call on a connection.
 * Body: { connectionId }
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

    const adminDb = getServiceClient();
    const profileId = account.active_profile_id;

    const { data: connection, error: fetchError } = await adminDb
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

    if (
      connection.from_profile_id !== profileId &&
      connection.to_profile_id !== profileId
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const existingMeta =
      (connection.metadata as Record<string, unknown>) || {};
    const existingThread = (existingMeta.thread as ThreadMessage[]) || [];
    const scheduledCall = existingMeta.scheduled_call as Record<string, unknown> | null;

    if (!scheduledCall || scheduledCall.status !== "confirmed") {
      return NextResponse.json(
        { error: "No confirmed call to cancel" },
        { status: 400 }
      );
    }

    const { data: userProfile } = await supabase
      .from("business_profiles")
      .select("display_name")
      .eq("id", profileId)
      .single();

    const displayName = userProfile?.display_name || "Someone";
    const now = new Date().toISOString();

    const threadMessage: ThreadMessage = {
      from_profile_id: profileId,
      text: `${displayName} cancelled the scheduled call`,
      created_at: now,
      type: "system",
    };

    const updatedThread = [...existingThread, threadMessage];

    const { error: updateError } = await adminDb
      .from("connections")
      .update({
        metadata: {
          ...existingMeta,
          thread: updatedThread,
          scheduled_call: {
            ...scheduledCall,
            status: "cancelled",
            cancelled_by: profileId,
            cancelled_at: now,
          },
          next_step_request: null,
          time_proposal: null,
        },
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("Cancel call error:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel call" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      thread: updatedThread,
      scheduled_call: { ...scheduledCall, status: "cancelled", cancelled_by: profileId, cancelled_at: now },
    });
  } catch (err) {
    console.error("Cancel call error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
