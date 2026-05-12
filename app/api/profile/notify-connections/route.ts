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
 * POST /api/profile/notify-connections
 *
 * Adds a "Care request updated" system message to all active connections
 * where the given profile is a participant. Called when a family user
 * completes editing their profile via ProfileEditWizard.
 *
 * This notifies providers that the family has updated their care details.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId } = body as { profileId?: string };

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    // Verify the caller owns this profile
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check that user owns this profile
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "No account found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("business_profiles")
      .select("id, account_id, type")
      .eq("id", profileId)
      .single();

    if (!profile || profile.account_id !== account.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Only family profiles should trigger this
    if (profile.type !== "family") {
      return NextResponse.json({ ok: true, updated: 0 });
    }

    // Find all active connections where this profile is a participant
    const admin = getServiceClient();
    const { data: connections, error: fetchError } = await admin
      .from("connections")
      .select("id, metadata")
      .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`)
      .in("status", ["pending", "accepted"]);

    if (fetchError) {
      console.error("[notify-connections] Fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch connections" },
        { status: 500 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({ ok: true, updated: 0 });
    }

    // Add system message to each connection
    const now = new Date().toISOString();
    let updatedCount = 0;

    for (const conn of connections) {
      const existingMeta = (conn.metadata || {}) as Record<string, unknown>;
      const existingThread = (existingMeta.thread as ThreadMessage[]) || [];

      // Check if we already added this message recently (within 5 minutes)
      // to avoid duplicate messages if user closes/reopens wizard quickly
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      const recentSystemMsg = existingThread.find(
        (m) =>
          m.type === "system" &&
          m.text === "Care request updated" &&
          new Date(m.created_at).getTime() > fiveMinAgo
      );

      if (recentSystemMsg) {
        continue; // Skip - already notified recently
      }

      const systemMessage: ThreadMessage = {
        from_profile_id: profileId,
        text: "Care request updated",
        created_at: now,
        type: "system",
      };

      const updatedThread = [...existingThread, systemMessage];

      const { error: updateError } = await admin
        .from("connections")
        .update({
          metadata: { ...existingMeta, thread: updatedThread },
        })
        .eq("id", conn.id);

      if (!updateError) {
        updatedCount++;
      }
    }

    return NextResponse.json({ ok: true, updated: updatedCount });
  } catch (err) {
    console.error("[notify-connections] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
