import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/skip-warning
 *
 * Record that an admin skipped the generic email warning for a provider.
 * - Creates a touchpoint for audit trail
 * - Sets generic_email_skipped_at on tracking record for state persistence
 *
 * Request body:
 *   - provider_id: string (required)
 *   - notes?: string (optional)
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
    const { provider_id, notes } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();
    const nowIso = new Date().toISOString();

    // Insert touchpoint for audit trail
    // Use "call_attempted" (exists in DB constraint) with outcome indicating skip
    const { error: touchpointError } = await db
      .from("provider_outreach_touchpoints")
      .insert({
        provider_id,
        touchpoint_type: "call_attempted",
        details: {
          trigger: "generic_email_warning",
          outcome: "warning_skipped",
          ...(notes?.trim() && { notes: notes.trim() }),
        },
        admin_user_id: adminUser.id,
        created_at: nowIso,
      });

    if (touchpointError) {
      console.error("[skip-warning] Touchpoint insert error:", touchpointError);
      return NextResponse.json({ error: "Failed to record skip" }, { status: 500 });
    }

    // Update tracking record to persist the skipped state
    // This enables the state to survive page refreshes
    const { data: existingTracking } = await db
      .from("provider_outreach_tracking")
      .select("id")
      .eq("provider_id", provider_id)
      .maybeSingle();

    if (existingTracking) {
      // Update existing tracking record
      const { error: updateError } = await db
        .from("provider_outreach_tracking")
        .update({ generic_email_skipped_at: nowIso })
        .eq("id", existingTracking.id);

      if (updateError) {
        console.error("[skip-warning] Tracking update error:", updateError);
        // Non-fatal - touchpoint was recorded, just log the error
      }
    } else {
      // Get provider details for new tracking record
      const { data: provider } = await db
        .from("olera-providers")
        .select("city, state")
        .eq("provider_id", provider_id)
        .maybeSingle();

      if (provider) {
        // Create new tracking record with the skipped flag
        const { error: insertError } = await db
          .from("provider_outreach_tracking")
          .insert({
            provider_id,
            stage: "not_contacted",
            city: provider.city,
            state: provider.state,
            generic_email_skipped_at: nowIso,
          });

        if (insertError) {
          console.error("[skip-warning] Tracking insert error:", insertError);
          // Non-fatal - touchpoint was recorded
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[skip-warning] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
