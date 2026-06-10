import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/connections/[id]/mark-status
 *
 * Allows admins to manually mark a connection's status when they verify
 * off-platform activity (e.g., called provider and confirmed they connected).
 *
 * This creates an admin override that takes priority over automatic tracking
 * in engagement level calculation.
 */

const VALID_STATUSES = ["viewed", "connected"] as const;
type AdminOverrideStatus = typeof VALID_STATUSES[number];

const PRESET_REASONS = {
  viewed: [
    "Called provider - they viewed the lead",
    "Provider confirmed via email",
    "Found evidence in notes",
    "Other (see notes)",
  ],
  connected: [
    "Called provider - they connected with family",
    "Called family - they confirmed provider contacted them",
    "Provider confirmed connection via email",
    "Found evidence in conversation thread",
    "Other (see notes)",
  ],
} as const;

interface MarkStatusRequest {
  status: AdminOverrideStatus;
  reason: string;
  notes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const connectionId = params.id;
    const body: MarkStatusRequest = await request.json();
    const { status, reason, notes } = body;

    // Validate inputs
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!reason?.trim()) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Fetch current connection
    const { data: connection, error: fetchError } = await db
      .from("connections")
      .select("id, metadata")
      .eq("id", connectionId)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    const currentMetadata = (connection.metadata || {}) as Record<string, unknown>;

    // Create admin override object
    const adminOverride = {
      status,
      marked_at: new Date().toISOString(),
      marked_by: user.id,
      marked_by_email: user.email,
      reason: reason.trim(),
      notes: notes?.trim() || null,
    };

    // Update metadata with admin override
    const updatedMetadata = {
      ...currentMetadata,
      admin_override: adminOverride,
    };

    // If marking as connected, also stop the email sequence
    if (status === "connected") {
      updatedMetadata.followup_stopped_at = new Date().toISOString();
      updatedMetadata.followup_stopped_reason = "admin_marked_connected";
    }

    // Update connection
    const { error: updateError } = await db
      .from("connections")
      .update({ metadata: updatedMetadata })
      .eq("id", connectionId);

    if (updateError) {
      console.error("[mark-status] Update failed:", updateError);
      return NextResponse.json(
        { error: "Failed to update connection" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connection: {
        id: connectionId,
        admin_override: adminOverride,
      },
    });
  } catch (err) {
    console.error("[mark-status] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
