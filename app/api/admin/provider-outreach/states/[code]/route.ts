import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { US_STATES } from "@/lib/us-states";

/**
 * PATCH /api/admin/provider-outreach/states/[code]
 *
 * Update a state's status or notes.
 *
 * Body: { status?: "active" | "paused" | "completed", notes?: "..." }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { code } = await params;
    const stateCode = code.toUpperCase();
    const body = await request.json().catch(() => ({}));

    const db = getServiceClient();

    // Check if state exists
    const { data: existing, error: fetchError } = await db
      .from("provider_outreach_states")
      .select("*")
      .eq("state_code", stateCode)
      .maybeSingle();

    if (fetchError) {
      console.error("[provider-outreach/states] Fetch error:", fetchError);
      return NextResponse.json({ error: "Failed to fetch state" }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: `State ${stateCode} not found` }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!["active", "paused", "completed"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status. Must be: active, paused, or completed" },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Update the state
    const { data: updated, error: updateError } = await db
      .from("provider_outreach_states")
      .update(updates)
      .eq("state_code", stateCode)
      .select()
      .single();

    if (updateError) {
      console.error("[provider-outreach/states] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update state" }, { status: 500 });
    }

    const stateLabel = US_STATES.find((s) => s.value === stateCode)?.label || stateCode;

    return NextResponse.json({
      success: true,
      state: {
        ...updated,
        state_name: stateLabel,
      },
    });
  } catch (err) {
    console.error("[provider-outreach/states] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/provider-outreach/states/[code]
 *
 * Remove a state from active work.
 * This doesn't delete provider tracking data, just removes the state from the list.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { code } = await params;
    const stateCode = code.toUpperCase();

    const db = getServiceClient();

    // Check if state exists
    const { data: existing } = await db
      .from("provider_outreach_states")
      .select("id, state_code")
      .eq("state_code", stateCode)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: `State ${stateCode} not found` }, { status: 404 });
    }

    // Delete the state
    const { error: deleteError } = await db
      .from("provider_outreach_states")
      .delete()
      .eq("state_code", stateCode);

    if (deleteError) {
      console.error("[provider-outreach/states] Delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete state" }, { status: 500 });
    }

    const stateLabel = US_STATES.find((s) => s.value === stateCode)?.label || stateCode;

    return NextResponse.json({
      success: true,
      message: `${stateLabel} removed from active states`,
    });
  } catch (err) {
    console.error("[provider-outreach/states] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/provider-outreach/states/[code]
 *
 * Refresh stats for a specific state.
 * Body: { action: "refresh_stats" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { code } = await params;
    const stateCode = code.toUpperCase();
    const body = await request.json().catch(() => ({}));

    if (body.action !== "refresh_stats") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = getServiceClient();

    // Check if state exists
    const { data: existing } = await db
      .from("provider_outreach_states")
      .select("id")
      .eq("state_code", stateCode)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: `State ${stateCode} not found` }, { status: 404 });
    }

    // Refresh stats
    const { error: refreshError } = await db.rpc("refresh_provider_outreach_state_stats", {
      target_state_code: stateCode,
    });

    if (refreshError) {
      console.error("[provider-outreach/states] Stats refresh error:", refreshError);
      return NextResponse.json({ error: "Failed to refresh stats" }, { status: 500 });
    }

    // Fetch updated state
    const { data: updated } = await db
      .from("provider_outreach_states")
      .select("*")
      .eq("state_code", stateCode)
      .single();

    const stateLabel = US_STATES.find((s) => s.value === stateCode)?.label || stateCode;

    return NextResponse.json({
      success: true,
      state: {
        ...updated,
        state_name: stateLabel,
      },
    });
  } catch (err) {
    console.error("[provider-outreach/states] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
