import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * Call log status options
 */
export const CALL_STATUSES = [
  "voicemail",
  "no_answer",
  "hung_up",
  "callback",
  "new_email",
  "resend",
  "spoke_with",
  "note",
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];

export interface CallLogEntry {
  id: string;
  provider_id: string;
  status: CallStatus;
  notes: string | null;
  admin_id: string;
  admin_name: string | null;
  created_at: string;
}

/**
 * GET /api/admin/provider-outreach/call-logs?provider_id=xxx
 *
 * Fetch call history for a provider.
 * Returns logs ordered by created_at DESC (most recent first).
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

    // Query touchpoints with type = 'call_attempted', join admin_users for names
    const { data: touchpoints, error } = await db
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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[call-logs] Query error:", error);
      return NextResponse.json({ error: "Failed to fetch call logs" }, { status: 500 });
    }

    // Transform to CallLogEntry format
    const logs: CallLogEntry[] = (touchpoints || []).map((tp) => {
      const details = tp.details as { status?: string; notes?: string } | null;
      const adminData = tp.admin_users as { display_name?: string } | null;
      return {
        id: tp.id,
        provider_id: tp.provider_id,
        status: (details?.status as CallStatus) || "no_answer",
        notes: details?.notes || null,
        admin_id: tp.admin_user_id,
        admin_name: adminData?.display_name || null,
        created_at: tp.created_at,
      };
    });

    return NextResponse.json({ logs });
  } catch (err) {
    console.error("[call-logs] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/provider-outreach/call-logs
 *
 * Log a new call attempt.
 * Body: { provider_id, status, notes? }
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
    const { provider_id, status, notes } = body;

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (!status || !CALL_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${CALL_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Insert into provider_outreach_touchpoints
    const { data: inserted, error } = await db
      .from("provider_outreach_touchpoints")
      .insert({
        provider_id,
        touchpoint_type: "call_attempted",
        admin_user_id: adminUser.id,
        details: {
          status,
          notes: notes?.trim() || null,
          trigger: "manual",
        },
      })
      .select()
      .single();

    if (error) {
      console.error("[call-logs] Insert error:", error);
      return NextResponse.json({ error: "Failed to log call" }, { status: 500 });
    }

    const log: CallLogEntry = {
      id: inserted.id,
      provider_id: inserted.provider_id,
      status,
      notes: notes?.trim() || null,
      admin_id: adminUser.id,
      admin_name: adminUser.display_name || null,
      created_at: inserted.created_at,
    };

    return NextResponse.json({ success: true, log });
  } catch (err) {
    console.error("[call-logs] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
