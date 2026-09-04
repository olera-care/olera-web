import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/notes?provider_id=xxx
 *
 * Fetches all notes for a provider with admin names, ordered newest first.
 * Includes both historical notes (from provider_outreach_notes) and
 * Call Log notes (touchpoints with status="note").
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("provider_id");

    if (!providerId) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch historical notes from the legacy table
    const { data: historicalNotes, error: historicalError } = await db
      .from("provider_outreach_notes_with_admin")
      .select("*")
      .eq("provider_id", providerId);

    if (historicalError) {
      console.error("[provider-outreach/notes] Historical notes error:", historicalError);
      return NextResponse.json({ error: historicalError.message }, { status: 500 });
    }

    // Fetch Call Log notes (touchpoints with status="note")
    const { data: callLogNotes, error: callLogError } = await db
      .from("provider_outreach_touchpoints")
      .select(`
        id,
        provider_id,
        details,
        admin_user_id,
        created_at,
        admin_users (
          display_name
        )
      `)
      .eq("provider_id", providerId)
      .eq("touchpoint_type", "call_attempted")
      .filter("details->>status", "eq", "note");

    if (callLogError) {
      console.error("[provider-outreach/notes] Call log notes error:", callLogError);
      // Continue with historical notes if call log query fails
    }

    // Transform Call Log notes to match historical notes format
    const transformedCallLogNotes = (callLogNotes || []).map((tp) => {
      const details = tp.details as { notes?: string } | null;
      const adminData = tp.admin_users as { display_name?: string } | null;
      return {
        id: tp.id,
        provider_id: tp.provider_id,
        note: details?.notes || "",
        admin_user_id: tp.admin_user_id,
        admin_name: adminData?.display_name || null,
        created_at: tp.created_at,
        source: "call_log" as const,
      };
    });

    // Add source marker to historical notes
    const markedHistoricalNotes = (historicalNotes || []).map((n) => ({
      ...n,
      source: "historical" as const,
    }));

    // Merge and sort by created_at DESC
    const allNotes = [...markedHistoricalNotes, ...transformedCallLogNotes]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ notes: allNotes });
  } catch (err) {
    console.error("[provider-outreach/notes] GET error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/provider-outreach/notes
 *
 * Creates a new note for a provider.
 *
 * Request body:
 *   - provider_id: string (required) - The provider's ID from provider_outreach_tracking
 *   - note: string (required) - The note content
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { provider_id, note } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return NextResponse.json({ error: "note is required and cannot be empty" }, { status: 400 });
    }

    const db = getServiceClient();

    const { data, error } = await db
      .from("provider_outreach_notes")
      .insert({
        provider_id,
        admin_user_id: adminUser.id,
        note: note.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("[provider-outreach/notes] POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return with admin name included
    return NextResponse.json({
      success: true,
      note: {
        ...data,
        admin_name: adminUser.display_name ?? adminUser.email,
      },
    });
  } catch (err) {
    console.error("[provider-outreach/notes] POST error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
