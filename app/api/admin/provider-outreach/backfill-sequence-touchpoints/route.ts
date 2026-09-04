import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/backfill-sequence-touchpoints
 *
 * One-time backfill: Creates sequence_launched touchpoints for SmartLead enrollments
 * that are missing them (enrollments before the fix was deployed).
 *
 * Body:
 *   - date: YYYY-MM-DD (required) - The date to backfill
 *   - dry_run: boolean (default: true) - If true, just returns what would be created
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
    const { date, dry_run = true } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date is required (YYYY-MM-DD format)" }, { status: 400 });
    }

    const db = getServiceClient();

    // Find smartlead_enrolled touchpoints for the given date (CT timezone)
    const dayStart = `${date}T00:00:00-06:00`;
    const dayEnd = `${date}T23:59:59-05:00`;

    const { data: enrolledTouchpoints, error: fetchError } = await db
      .from("provider_outreach_touchpoints")
      .select("id, provider_id, admin_user_id, created_at, details")
      .eq("touchpoint_type", "smartlead_enrolled")
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd);

    if (fetchError) {
      console.error("[backfill] Fetch error:", fetchError);
      return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
    }

    if (!enrolledTouchpoints || enrolledTouchpoints.length === 0) {
      return NextResponse.json({
        message: "No smartlead_enrolled touchpoints found for this date",
        date,
        found: 0,
        backfilled: 0,
      });
    }

    // Check which ones already have sequence_launched touchpoints
    const providerIds = enrolledTouchpoints.map((tp) => tp.provider_id);

    const { data: existingLaunched } = await db
      .from("provider_outreach_touchpoints")
      .select("provider_id")
      .eq("touchpoint_type", "sequence_launched")
      .in("provider_id", providerIds)
      .gte("created_at", dayStart);

    const alreadyHaveLaunched = new Set(
      (existingLaunched || []).map((tp) => tp.provider_id)
    );

    // Filter to only those missing sequence_launched
    const needsBackfill = enrolledTouchpoints.filter(
      (tp) => !alreadyHaveLaunched.has(tp.provider_id)
    );

    if (needsBackfill.length === 0) {
      return NextResponse.json({
        message: "All enrollments already have sequence_launched touchpoints",
        date,
        found: enrolledTouchpoints.length,
        already_have_launched: enrolledTouchpoints.length,
        backfilled: 0,
      });
    }

    if (dry_run) {
      return NextResponse.json({
        dry_run: true,
        message: `Would create ${needsBackfill.length} sequence_launched touchpoints`,
        date,
        found: enrolledTouchpoints.length,
        already_have_launched: alreadyHaveLaunched.size,
        would_backfill: needsBackfill.length,
        providers: needsBackfill.map((tp) => ({
          provider_id: tp.provider_id,
          enrolled_at: tp.created_at,
        })),
      });
    }

    // Create the missing sequence_launched touchpoints
    const touchpointsToInsert = needsBackfill.map((tp) => {
      const details = tp.details as { campaign_id?: number; campaign_name?: string } | null;
      return {
        provider_id: tp.provider_id,
        touchpoint_type: "sequence_launched",
        admin_user_id: tp.admin_user_id,
        created_at: tp.created_at, // Use same timestamp as enrollment
        details: {
          engine: "smartlead",
          campaign_id: details?.campaign_id,
          campaign_name: details?.campaign_name,
          backfilled: true,
        },
      };
    });

    const { error: insertError } = await db
      .from("provider_outreach_touchpoints")
      .insert(touchpointsToInsert);

    if (insertError) {
      console.error("[backfill] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to insert touchpoints" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${needsBackfill.length} sequence_launched touchpoints`,
      date,
      found: enrolledTouchpoints.length,
      already_have_launched: alreadyHaveLaunched.size,
      backfilled: needsBackfill.length,
      providers: needsBackfill.map((tp) => tp.provider_id),
    });
  } catch (err) {
    console.error("[backfill] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
