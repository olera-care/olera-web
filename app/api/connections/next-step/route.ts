import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  type?: string;
  next_step?: string;
}

const NEXT_STEP_LABELS: Record<string, { label: string; msg: string }> = {
  call: { label: "Request a call", msg: "would like to request a phone call" },
  consultation: { label: "Request a consultation", msg: "would like to request a consultation" },
  visit: { label: "Request a home visit", msg: "would like to request a home visit" },
};

/**
 * POST /api/connections/next-step
 *
 * Creates or cancels a next step request on a responded connection.
 * Stores the request in metadata.next_step_request and appends a
 * structured message to metadata.thread.
 *
 * Body: { connectionId, action: "request" | "cancel", type?: string, note?: string }
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
    const { connectionId, action, type, note } = body as {
      connectionId?: string;
      action?: string;
      type?: string;
      note?: string;
    };

    if (!connectionId || !action) {
      return NextResponse.json(
        { error: "connectionId and action are required" },
        { status: 400 }
      );
    }

    if (action !== "request" && action !== "cancel") {
      return NextResponse.json(
        { error: "action must be 'request' or 'cancel'" },
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

    // Fetch connection
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

    // Must be an accepted connection
    if (connection.status !== "accepted") {
      return NextResponse.json(
        { error: "Next steps only available for responded connections" },
        { status: 400 }
      );
    }

    const existingMeta =
      (connection.metadata as Record<string, unknown>) || {};
    const existingThread = (existingMeta.thread as ThreadMessage[]) || [];
    const existingRequest = existingMeta.next_step_request as Record<string, unknown> | null;

    // Get the user's display name for thread messages
    const { data: userProfile } = await supabase
      .from("business_profiles")
      .select("display_name")
      .eq("id", profileId)
      .single();

    const displayName = userProfile?.display_name || "Care seeker";

    if (action === "request") {
      if (!type || !NEXT_STEP_LABELS[type]) {
        return NextResponse.json(
          { error: "Invalid type. Must be call, consultation, or visit" },
          { status: 400 }
        );
      }

      // One request at a time
      if (existingRequest) {
        return NextResponse.json(
          { error: "A request is already active. Cancel it first." },
          { status: 400 }
        );
      }

      const stepInfo = NEXT_STEP_LABELS[type];
      const now = new Date().toISOString();

      // Build structured thread message
      const threadMessage: ThreadMessage = {
        from_profile_id: profileId,
        text: `${displayName} ${stepInfo.msg}.${note ? ` "${note}"` : ""}`,
        created_at: now,
        type: "next_step_request",
        next_step: type,
      };

      const updatedThread = [...existingThread, threadMessage];
      const nextStepRequest = {
        type,
        note: note || null,
        created_at: now,
      };

      const { error: updateError } = await supabase
        .from("connections")
        .update({
          metadata: {
            ...existingMeta,
            thread: updatedThread,
            next_step_request: nextStepRequest,
          },
        })
        .eq("id", connectionId);

      if (updateError) {
        console.error("Next step request error:", updateError);
        return NextResponse.json(
          { error: "Failed to send request" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        thread: updatedThread,
        next_step_request: nextStepRequest,
      });
    }

    // action === "cancel"
    if (!existingRequest) {
      return NextResponse.json(
        { error: "No active request to cancel" },
        { status: 400 }
      );
    }

    const cancelledType = (existingRequest.type as string) || "request";
    const cancelLabel = NEXT_STEP_LABELS[cancelledType]?.label || "request";
    const now = new Date().toISOString();

    // System cancellation note
    const cancelMessage: ThreadMessage = {
      from_profile_id: profileId,
      text: `${displayName} cancelled the ${cancelLabel.toLowerCase()}`,
      created_at: now,
      type: "system",
    };

    const updatedThread = [...existingThread, cancelMessage];

    const { error: updateError } = await supabase
      .from("connections")
      .update({
        metadata: {
          ...existingMeta,
          thread: updatedThread,
          next_step_request: null,
        },
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("Cancel request error:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      thread: updatedThread,
      next_step_request: null,
    });
  } catch (err) {
    console.error("Next step error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
