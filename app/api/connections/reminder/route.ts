import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/connections/reminder
 *
 * Marks a connection as having had a reminder sent.
 * This is a provider-initiated nudge for pending outreach.
 *
 * Requirements:
 * - User must be authenticated
 * - User must own the connection (from_profile_id matches their active profile)
 * - Connection must be pending
 * - No reminder already sent
 * - At least 48 hours since initial outreach
 */

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { connectionId } = body as { connectionId: string };

    if (!connectionId) {
      return NextResponse.json(
        { error: "Missing connectionId" },
        { status: 400 }
      );
    }

    // Get user's active profile
    const admin = getAdminClient();
    const db = admin || supabase;

    const { data: account } = await db
      .from("accounts")
      .select("active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json(
        { error: "No active profile found" },
        { status: 404 }
      );
    }

    // Fetch connection and verify ownership
    const { data: connection, error: connError } = await db
      .from("connections")
      .select("id, from_profile_id, status, created_at, metadata")
      .eq("id", connectionId)
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this connection
    if (connection.from_profile_id !== account.active_profile_id) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Verify connection is pending
    if (connection.status !== "pending") {
      return NextResponse.json(
        { error: "Can only send reminders for pending connections" },
        { status: 400 }
      );
    }

    // Check if reminder already sent
    const metadata = (connection.metadata || {}) as Record<string, unknown>;
    if (metadata.reminder_sent) {
      return NextResponse.json(
        { error: "Reminder already sent" },
        { status: 400 }
      );
    }

    // Check 48-hour requirement
    const createdAt = new Date(connection.created_at).getTime();
    const hoursSince = (Date.now() - createdAt) / (1000 * 60 * 60);
    if (hoursSince < 48) {
      return NextResponse.json(
        { error: "Must wait 48 hours before sending reminder" },
        { status: 400 }
      );
    }

    // Update connection metadata to mark reminder as sent
    const updatedMetadata = {
      ...metadata,
      reminder_sent: true,
      reminder_sent_at: new Date().toISOString(),
    };

    const { error: updateError } = await db
      .from("connections")
      .update({ metadata: updatedMetadata })
      .eq("id", connectionId);

    if (updateError) {
      console.error("[reminder] Update failed:", updateError);
      return NextResponse.json(
        { error: "Failed to send reminder" },
        { status: 500 }
      );
    }

    // TODO: In the future, we could:
    // 1. Send an email/SMS to the family
    // 2. Log this event for analytics
    // For now, we just mark it as sent so the UI updates

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reminder] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
