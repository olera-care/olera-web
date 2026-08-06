import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/confirm
 *
 * Record that an admin has confirmed a provider is ready for sequencing.
 * - Sets confirmed_at and confirmed_by on tracking record
 * - Provides visual confirmation (blue checkmark) in Ready tab
 *
 * Request body:
 *   - provider_id: string (required)
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
    const { provider_id } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();
    const nowIso = new Date().toISOString();

    // Check for existing tracking record
    const { data: existingTracking } = await db
      .from("provider_outreach_tracking")
      .select("id")
      .eq("provider_id", provider_id)
      .maybeSingle();

    if (existingTracking) {
      // Update existing tracking record
      const { error: updateError } = await db
        .from("provider_outreach_tracking")
        .update({
          confirmed_at: nowIso,
          confirmed_by: adminUser.id,
        })
        .eq("id", existingTracking.id);

      if (updateError) {
        console.error("[confirm] Tracking update error:", updateError);
        return NextResponse.json({ error: "Failed to confirm provider" }, { status: 500 });
      }
    } else {
      // Get provider details for new tracking record
      const { data: provider } = await db
        .from("olera-providers")
        .select("city, state")
        .eq("provider_id", provider_id)
        .maybeSingle();

      if (!provider) {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      }

      // Create new tracking record with confirmation
      const { error: insertError } = await db
        .from("provider_outreach_tracking")
        .insert({
          provider_id,
          stage: "not_contacted",
          city: provider.city,
          state: provider.state,
          confirmed_at: nowIso,
          confirmed_by: adminUser.id,
        });

      if (insertError) {
        console.error("[confirm] Tracking insert error:", insertError);
        return NextResponse.json({ error: "Failed to confirm provider" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      confirmed_at: nowIso,
      confirmed_by: adminUser.id,
    });
  } catch (err) {
    console.error("[confirm] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
