import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { US_STATES } from "@/lib/us-states";

/**
 * GET /api/admin/provider-outreach/states
 *
 * List all states that have been added for outreach work.
 * Returns states with their current stats and status.
 *
 * Query params:
 *   status - Filter by status (active, paused, completed). Default: all.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const db = getServiceClient();

    let query = db
      .from("provider_outreach_states")
      .select("*")
      .order("added_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[provider-outreach/states] Query error:", error);
      return NextResponse.json({ error: "Failed to fetch states" }, { status: 500 });
    }

    // Add state labels from US_STATES
    const stateLabels = new Map(US_STATES.map((s) => [s.value, s.label]));
    const states = (data ?? []).map((row) => ({
      ...row,
      state_name: stateLabels.get(row.state_code) || row.state_code,
    }));

    return NextResponse.json({
      states,
      total_us_states: US_STATES.length,
      added_count: states.length,
    });
  } catch (err) {
    console.error("[provider-outreach/states] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/provider-outreach/states
 *
 * Add a new state to work on.
 *
 * Body: { state_code: "CA", notes?: "..." }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const stateCode = body.state_code?.toUpperCase()?.trim();
    const notes = body.notes?.trim() || null;

    // Validate state code
    if (!stateCode) {
      return NextResponse.json({ error: "state_code is required" }, { status: 400 });
    }

    const validState = US_STATES.find((s) => s.value === stateCode);
    if (!validState) {
      return NextResponse.json({ error: `Invalid state code: ${stateCode}` }, { status: 400 });
    }

    const db = getServiceClient();

    // Check if already added
    const { data: existing } = await db
      .from("provider_outreach_states")
      .select("id, status")
      .eq("state_code", stateCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `${validState.label} has already been added`, existing },
        { status: 409 }
      );
    }

    // Insert new state
    const { data: inserted, error: insertError } = await db
      .from("provider_outreach_states")
      .insert({
        state_code: stateCode,
        status: "active",
        added_by: user.id,
        notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[provider-outreach/states] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to add state" }, { status: 500 });
    }

    // Refresh stats for this state (calls the DB function)
    const { error: refreshError } = await db.rpc("refresh_provider_outreach_state_stats", {
      target_state_code: stateCode,
    });

    if (refreshError) {
      console.error("[provider-outreach/states] Stats refresh error:", refreshError);
      // Don't fail the request - state was added, stats can be refreshed later
    }

    // Fetch the updated row with stats
    const { data: updated } = await db
      .from("provider_outreach_states")
      .select("*")
      .eq("state_code", stateCode)
      .single();

    return NextResponse.json({
      success: true,
      state: {
        ...(updated || inserted),
        state_name: validState.label,
      },
    });
  } catch (err) {
    console.error("[provider-outreach/states] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
