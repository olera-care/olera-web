import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * GET /api/cron/staffing-sequence-check
 *
 * Runs hourly. Auto-transitions providers from `sequencing` → `needs_call`
 * when their email sequence is complete (Email 2 sent + 3 days passed).
 *
 * This ensures providers who don't respond to emails are moved to the
 * calling queue for manual follow-up.
 *
 * Logic:
 * 1. Find all providers with status = 'sequencing'
 * 2. Check if email2_sent_at is set AND is more than 3 days ago
 * 3. Update status to 'needs_call'
 * 4. Log a touchpoint for audit trail
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getServiceClient();
    const now = new Date().toISOString();

    // 3 days ago
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // Find providers in sequencing status where:
    // - email2_sent_at is set (Email 2 was sent)
    // - email2_sent_at is more than 3 days ago
    const { data: readyToTransition, error: queryError } = await db
      .from("staffing_outreach")
      .select("id, provider_id, batch_id")
      .eq("status", "sequencing")
      .not("email2_sent_at", "is", null)
      .lt("email2_sent_at", threeDaysAgo);

    if (queryError) {
      console.error("[cron/staffing-sequence-check] Query error:", queryError);
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    if (!readyToTransition || readyToTransition.length === 0) {
      console.log("[cron/staffing-sequence-check] No providers ready for transition");
      return NextResponse.json({ status: "ok", transitioned: 0 });
    }

    console.log(
      `[cron/staffing-sequence-check] Found ${readyToTransition.length} providers ready for transition`
    );

    // Update each provider to needs_call status
    const outreachIds = readyToTransition.map((r) => r.id);

    const { error: updateError } = await db
      .from("staffing_outreach")
      .update({
        status: "needs_call",
        next_action_due_at: now, // Set to now so it appears in "Needs Call" tab immediately
        updated_at: now,
      })
      .in("id", outreachIds);

    if (updateError) {
      console.error("[cron/staffing-sequence-check] Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Insert touchpoints for audit trail
    const touchpoints = readyToTransition.map((r) => ({
      outreach_id: r.id,
      type: "sequence_completed",
      notes: "Auto-transitioned after Email 2 + 3 days",
      payload: {
        triggered_by: "cron",
        previous_status: "sequencing",
        new_status: "needs_call",
      },
      created_at: now,
    }));

    const { error: touchpointError } = await db
      .from("staffing_touchpoints")
      .insert(touchpoints);

    if (touchpointError) {
      // Log but don't fail - the status update was successful
      console.error("[cron/staffing-sequence-check] Touchpoint insert error:", touchpointError);
    }

    console.log(
      `[cron/staffing-sequence-check] Transitioned ${readyToTransition.length} providers to needs_call`
    );

    return NextResponse.json({
      status: "ok",
      transitioned: readyToTransition.length,
      outreachIds,
    });
  } catch (err) {
    console.error("[cron/staffing-sequence-check] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
