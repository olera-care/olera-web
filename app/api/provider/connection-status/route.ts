import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { validateConnectionStatusToken, type ConnectionStatusValue } from "@/lib/claim-tokens";

/**
 * POST /api/provider/connection-status
 *
 * Handles provider self-report of connection status from email buttons.
 * Updates the connection metadata and logs a provider_activity event.
 *
 * Request body: { tok: string } (signed token containing connectionId and value)
 *
 * Values:
 * - "connected" → marks provider_confirmed, stops followup emails
 * - "not_a_fit" → marks as not interested, stops followup emails
 * - "no_capacity" → marks as not interested (capacity), stops followup emails
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tok } = body as { tok?: string };

    if (!tok) {
      return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
    }

    // Validate the signed token
    const validation = validateConnectionStatusToken(tok);
    if (!validation.valid) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const { connectionId, value } = validation;
    const db = getServiceClient();
    const now = new Date().toISOString();

    // Fetch the connection to get existing metadata, type, and profile IDs
    const { data: connection, error: fetchError } = await db
      .from("connections")
      .select("id, type, from_profile_id, to_profile_id, metadata")
      .eq("id", connectionId)
      .single();

    if (fetchError || !connection) {
      console.error("[api/provider/connection-status] Connection not found:", fetchError);
      return NextResponse.json({ ok: false, error: "Connection not found" }, { status: 404 });
    }

    // Determine provider based on connection type:
    // - inquiry: from=family, to=provider
    // - request: from=provider, to=family
    const providerId = connection.type === "inquiry"
      ? connection.to_profile_id
      : connection.from_profile_id;

    const existingMeta = (connection.metadata as Record<string, unknown>) ?? {};

    // Check if already reported (idempotent — don't error, just acknowledge)
    const existingStatus = existingMeta.provider_connection_status as Record<string, unknown> | undefined;
    if (existingStatus?.self_reported) {
      return NextResponse.json({
        ok: true,
        already_reported: true,
        value: existingStatus.value,
      });
    }

    // Build updated metadata
    const updatedMeta: Record<string, unknown> = {
      ...existingMeta,
      provider_connection_status: {
        self_reported: true,
        value,
        at: now,
        source: "email_button",
      },
      followup_stopped_at: now,
      followup_stopped_reason: mapValueToStopReason(value),
    };

    // For "connected", also set provider_confirmed
    if (value === "connected") {
      updatedMeta.provider_confirmed = true;
      updatedMeta.provider_confirmed_at = now;
      updatedMeta.provider_confirmed_source = "self_report";
    }

    // Update the connection
    const { error: updateError } = await db
      .from("connections")
      .update({ metadata: updatedMeta })
      .eq("id", connectionId);

    if (updateError) {
      console.error("[api/provider/connection-status] Update error:", updateError);
      return NextResponse.json({ ok: false, error: "Failed to update connection" }, { status: 500 });
    }

    // Log provider_activity event
    const { error: activityError } = await db.from("provider_activity").insert({
      provider_id: providerId,
      event_type: "provider_connection_status_reported",
      metadata: {
        connection_id: connectionId,
        value,
        source: "email_button",
      },
    });

    if (activityError) {
      // Non-fatal — the status update succeeded, just log the failure
      console.error("[api/provider/connection-status] Activity log error:", activityError);
    }

    return NextResponse.json({
      ok: true,
      value,
      connection_id: connectionId,
    });
  } catch (err) {
    console.error("[api/provider/connection-status] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Map connection status value to followup_stopped_reason
 */
function mapValueToStopReason(value: ConnectionStatusValue): string {
  switch (value) {
    case "connected":
      return "provider_confirmed_connected";
    case "not_a_fit":
    case "no_capacity":
      return "provider_declined";
    default:
      return "provider_declined";
  }
}
