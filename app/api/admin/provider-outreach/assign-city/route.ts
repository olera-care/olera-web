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

    // 2. Get all providers in this city (from olera-providers)
    const { data: allProvidersInCity, error: providersError } = await db
      .from("olera-providers")
      .select("provider_id")
      .eq("state", state)
      .eq("city", city)
      .or("deleted.is.null,deleted.eq.false");

    if (providersError) {
      console.error("[assign-city] Failed to fetch providers:", providersError);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    const allProviderIds = new Set((allProvidersInCity || []).map((p) => p.provider_id));

    // 3. Get existing tracking records in this city
    const { data: trackingRecords, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, assigned_to")
      .eq("state", state)
      .eq("city", city);

    if (trackingError) {
      console.error("[assign-city] Failed to fetch tracking records:", trackingError);
      return NextResponse.json({ error: "Failed to fetch tracking records" }, { status: 500 });
    }

    const trackedProviderIds = new Set((trackingRecords || []).map((t) => t.provider_id));

    // 4. Get claimed providers (exclude from assignment)
    const { data: claimedBps } = await db
      .from("business_profiles")
      .select("source_provider_id")
      .not("source_provider_id", "is", null)
      .not("account_id", "is", null);

    const claimedProviderIds = new Set(
      (claimedBps || []).map((bp) => bp.source_provider_id).filter(Boolean)
    );

    // 5. Find untracked, unclaimed providers that need tracking records created
    const untrackedProviderIds = [...allProviderIds].filter(
      (id) => !trackedProviderIds.has(id) && !claimedProviderIds.has(id)
    );

    let updatedCount = 0;
    let createdCount = 0;
    const touchpoints: Array<{
      provider_id: string;
      touchpoint_type: string;
      admin_user_id: string;
      details: Record<string, unknown>;
    }> = [];

    // 6. Update existing tracking records
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

      // Log assignment_changed touchpoints for tracked providers
      for (const record of trackingRecords) {
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
    }

    // 7. Create tracking records for untracked providers (only if assigning, not unassigning)
    if (owner_id && untrackedProviderIds.length > 0) {
      const now = new Date().toISOString();
      const newTrackingRecords = untrackedProviderIds.map((provider_id) => ({
        provider_id,
        state,
        city,
        stage: "not_contacted",
        assigned_to: owner_id,
        stage_changed_at: now,
        created_at: now,
        updated_at: now,
      }));

      // Batch inserts
      for (let i = 0; i < newTrackingRecords.length; i += IN_CLAUSE_BATCH_SIZE) {
        const batch = newTrackingRecords.slice(i, i + IN_CLAUSE_BATCH_SIZE);
        const { error: insertError } = await db
          .from("provider_outreach_tracking")
          .insert(batch);

        if (insertError) {
          console.error("[assign-city] Failed to create tracking records batch:", insertError);
          // Continue - don't fail the whole request
        }
      }

      createdCount = untrackedProviderIds.length;

      // Log assignment touchpoints for newly tracked providers
      for (const provider_id of untrackedProviderIds) {
        touchpoints.push({
          provider_id,
          touchpoint_type: "assignment_changed",
          admin_user_id: adminUser.id,
          details: {
            previous_assigned_to: null,
            new_assigned_to: owner_id,
            source: "city_assignment",
            city,
            state,
          },
        });
      }
    }

    // 8. Batch insert touchpoints
    if (touchpoints.length > 0) {
      for (let i = 0; i < touchpoints.length; i += IN_CLAUSE_BATCH_SIZE) {
        const batch = touchpoints.slice(i, i + IN_CLAUSE_BATCH_SIZE);
        const { error: touchpointError } = await db
          .from("provider_outreach_touchpoints")
          .insert(batch);

        if (touchpointError) {
          console.error("[assign-city] Failed to log touchpoints batch:", touchpointError);
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
      created_count: createdCount,
      total_assigned: updatedCount + createdCount,
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
