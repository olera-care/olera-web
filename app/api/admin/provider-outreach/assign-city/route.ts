import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * Batch size for .in() queries to avoid URL length limits.
 * Each UUID is 36 chars; 150 UUIDs ≈ 5400 chars, safely under ~8000 limit.
 */
const IN_CLAUSE_BATCH_SIZE = 150;

/**
 * POST /api/admin/provider-outreach/assign-city
 *
 * Assign all providers in a city to an admin.
 *
 * Body:
 *   - state: string (required)
 *   - city: string (required)
 *   - owner_id: string | null (required) - Admin user ID, or null to unassign
 *   - owner_name: string | null (optional) - Display name for denormalization
 *
 * Actions:
 *   1. Upserts provider_outreach_city_owners record
 *   2. Bulk-updates all providers in that city's assigned_to field
 *   3. Logs assignment_changed touchpoint for each affected provider
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
    const { state, city, owner_id, owner_name } = body;

    if (!state || !city) {
      return NextResponse.json(
        { error: "state and city are required" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // 1. Upsert city owner record
    const { error: upsertError } = await db
      .from("provider_outreach_city_owners")
      .upsert(
        {
          state,
          city,
          owner_id: owner_id || null,
          owner_name: owner_name || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "state,city" }
      );

    if (upsertError) {
      console.error("[assign-city] Failed to upsert city owner:", upsertError);
      return NextResponse.json({ error: "Failed to update city assignment" }, { status: 500 });
    }

    // 2. Get all tracking records in this city
    const { data: trackingRecords, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, assigned_to")
      .eq("state", state)
      .eq("city", city);

    if (trackingError) {
      console.error("[assign-city] Failed to fetch tracking records:", trackingError);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    // 3. Bulk-update assigned_to for all tracked providers in this city
    let updatedCount = 0;
    const touchpoints: Array<{
      provider_id: string;
      touchpoint_type: string;
      admin_user_id: string;
      details: Record<string, unknown>;
    }> = [];

    if (trackingRecords && trackingRecords.length > 0) {
      const trackingIds = trackingRecords.map((t) => t.id);

      // Batch updates to avoid URL length limits with large cities
      for (let i = 0; i < trackingIds.length; i += IN_CLAUSE_BATCH_SIZE) {
        const batch = trackingIds.slice(i, i + IN_CLAUSE_BATCH_SIZE);
        const { error: updateError } = await db
          .from("provider_outreach_tracking")
          .update({ assigned_to: owner_id || null })
          .in("id", batch);

        if (updateError) {
          console.error("[assign-city] Failed to update tracking records batch:", updateError);
          return NextResponse.json({ error: "Failed to update provider assignments" }, { status: 500 });
        }
      }

      updatedCount = trackingIds.length;

      // 4. Log assignment_changed touchpoints for each affected provider
      for (const record of trackingRecords) {
        // Only log if assignment actually changed
        if (record.assigned_to !== owner_id) {
          touchpoints.push({
            provider_id: record.provider_id,
            touchpoint_type: "assignment_changed",
            admin_user_id: adminUser.id,
            details: {
              previous_assigned_to: record.assigned_to,
              new_assigned_to: owner_id,
              source: "city_assignment",
              city,
              state,
            },
          });
        }
      }

      if (touchpoints.length > 0) {
        // Batch touchpoint inserts for large cities
        for (let i = 0; i < touchpoints.length; i += IN_CLAUSE_BATCH_SIZE) {
          const batch = touchpoints.slice(i, i + IN_CLAUSE_BATCH_SIZE);
          const { error: touchpointError } = await db
            .from("provider_outreach_touchpoints")
            .insert(batch);

          if (touchpointError) {
            // Log but don't fail the request
            console.error("[assign-city] Failed to log touchpoints batch:", touchpointError);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      city,
      state,
      owner_id: owner_id || null,
      owner_name: owner_name || null,
      updated_count: updatedCount,
      touchpoints_logged: touchpoints.length,
    });
  } catch (err) {
    console.error("[assign-city] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/provider-outreach/assign-city
 *
 * Returns city owners for a state.
 *
 * Query params:
 *   - state: string (required)
 *
 * Returns:
 *   - city_owners: Array<{ city, owner_id, owner_name }>
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
    const state = searchParams.get("state");

    if (!state) {
      return NextResponse.json({ error: "state parameter is required" }, { status: 400 });
    }

    const db = getServiceClient();

    const { data: cityOwners, error } = await db
      .from("provider_outreach_city_owners")
      .select("city, owner_id, owner_name")
      .eq("state", state)
      .order("city", { ascending: true });

    if (error) {
      console.error("[assign-city] Failed to fetch city owners:", error);
      return NextResponse.json({ error: "Failed to fetch city owners" }, { status: 500 });
    }

    return NextResponse.json({
      city_owners: cityOwners || [],
    });
  } catch (err) {
    console.error("[assign-city] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
