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
 * POST /api/connections/respond-proposal
 *
 * Accept or decline a single time proposal.
 * Body: { connectionId, action: "accept" | "decline" }
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
    const { connectionId, action } = body as {
      connectionId?: string;
      action?: string;
    };

    if (!connectionId || !action) {
      return NextResponse.json(
        { error: "connectionId and action are required" },
        { status: 400 }
      );
    }

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { error: "action must be 'accept' or 'decline'" },
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

    const adminDb = getServiceClient();
    const profileId = account.active_profile_id;

    // Fetch connection
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

    // Must be a participant
    if (
      connection.from_profile_id !== profileId &&
      connection.to_profile_id !== profileId
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (connection.status !== "accepted") {
      return NextResponse.json(
        { error: "Connection must be accepted" },
        { status: 400 }
      );
    }

    const existingMeta =
      (connection.metadata as Record<string, unknown>) || {};
    const existingThread = (existingMeta.thread as ThreadMessage[]) || [];
    const timeProposal = existingMeta.time_proposal as Record<string, unknown> | null;

    if (!timeProposal || timeProposal.status !== "pending") {
      return NextResponse.json(
        { error: "No active time proposal to respond to" },
        { status: 400 }
      );
    }

    // Get display name
    const { data: userProfile } = await supabase
      .from("business_profiles")
      .select("display_name")
      .eq("id", profileId)
      .single();

    const displayName = userProfile?.display_name || "Someone";
    const now = new Date().toISOString();
    const stepType = (timeProposal.type as string) || "call";

    const stepNoun =
      stepType === "call" ? "call" :
      stepType === "consultation" ? "consultation" :
      stepType === "visit" ? "home visit" : "call";

    if (action === "accept") {
      const date = timeProposal.date as string;
      const time = timeProposal.time as string;
      const timezone = timeProposal.timezone as string;

      const d = new Date(`${date}T${time}:00`);
      const timeLabel = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }) + " at " + d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      const scheduledCall = {
        type: stepType,
        date,
        time,
        timezone,
        proposed_by: timeProposal.from_profile_id,
        confirmed_at: now,
        status: "confirmed",
      };

      const threadMessage: ThreadMessage = {
        from_profile_id: profileId,
        text: `${displayName} confirmed the ${stepNoun} for ${timeLabel}`,
        created_at: now,
        type: "time_accepted",
      };

      // Send a prep nudge as a system message
      const nudgeMessage: ThreadMessage = {
        from_profile_id: "system",
        text: `Your ${stepNoun} is set for ${timeLabel}. This is a great time to share any details that will make the conversation productive.`,
        created_at: new Date(Date.now() + 100).toISOString(),
        type: "system",
      };

      const updatedThread = [...existingThread, threadMessage, nudgeMessage];

      const { error: updateError } = await adminDb
        .from("connections")
        .update({
          metadata: {
            ...existingMeta,
            thread: updatedThread,
            time_proposal: {
              ...timeProposal,
              status: "accepted",
              resolved_at: now,
            },
            scheduled_call: scheduledCall,
            next_step_request: null,
          },
        })
        .eq("id", connectionId);

      if (updateError) {
        console.error("Accept proposal error:", updateError);
        return NextResponse.json(
          { error: "Failed to accept proposal" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        thread: updatedThread,
        time_proposal: { ...timeProposal, status: "accepted", resolved_at: now },
        scheduled_call: scheduledCall,
        next_step_request: null,
      });
    }

    // action === "decline"
    const threadMessage: ThreadMessage = {
      from_profile_id: profileId,
      text: `${displayName}: that time doesn't work for me`,
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
          time_proposal: null,
        },
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("Decline proposal error:", updateError);
      return NextResponse.json(
        { error: "Failed to decline proposal" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      thread: updatedThread,
      time_proposal: null,
      scheduled_call: null,
      next_step_request: existingMeta.next_step_request || null,
    });
  } catch (err) {
    console.error("Respond proposal error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
