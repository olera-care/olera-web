import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  type?: string;
  next_step?: string;
}

/**
 * POST /api/connections/propose-times
 *
 * Proposes a single time for a call/consultation/visit.
 * Body: { connectionId, date, time, timezone }
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
    const { connectionId, date, time, timezone } = body as {
      connectionId?: string;
      date?: string;
      time?: string;
      timezone?: string;
    };

    if (!connectionId || !date || !time || !timezone) {
      return NextResponse.json(
        { error: "connectionId, date, time, and timezone are required" },
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

    // Must be accepted
    if (connection.status !== "accepted") {
      return NextResponse.json(
        { error: "Connection must be accepted" },
        { status: 400 }
      );
    }

    const existingMeta =
      (connection.metadata as Record<string, unknown>) || {};
    const existingThread = (existingMeta.thread as ThreadMessage[]) || [];

    // Get display name
    const { data: userProfile } = await supabase
      .from("business_profiles")
      .select("display_name")
      .eq("id", profileId)
      .single();

    const displayName = userProfile?.display_name || "Someone";
    const now = new Date().toISOString();

    // Determine the step type from active next_step_request, or default to "call"
    const nextStepReq = existingMeta.next_step_request as Record<string, unknown> | null;
    const stepType = (nextStepReq?.type as string) || "call";

    // Build the time proposal (single slot)
    const timeProposal = {
      id: `tp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      from_profile_id: profileId,
      type: stepType,
      date,
      time,
      timezone,
      status: "pending",
      created_at: now,
    };

    // Format for thread message
    const d = new Date(`${date}T${time}:00`);
    const timeLabel = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) + " at " + d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const stepNoun =
      stepType === "call" ? "a call" :
      stepType === "consultation" ? "a consultation" :
      stepType === "visit" ? "a home visit" : "a call";

    const threadMessage: ThreadMessage = {
      from_profile_id: profileId,
      text: `${displayName} suggested ${timeLabel} for ${stepNoun}`,
      created_at: now,
      type: "time_proposal",
    };

    const updatedThread = [...existingThread, threadMessage];

    const { error: updateError } = await adminDb
      .from("connections")
      .update({
        metadata: {
          ...existingMeta,
          thread: updatedThread,
          time_proposal: timeProposal,
        },
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("Propose times error:", updateError);
      return NextResponse.json(
        { error: "Failed to save proposal" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      thread: updatedThread,
      time_proposal: timeProposal,
    });
  } catch (err) {
    console.error("Propose times error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
