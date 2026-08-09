import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/retry-sequence
 *
 * Retries failed sequence tasks for a provider by resetting them to pending.
 * The cron will pick them up and attempt to send again.
 *
 * Body:
 *   - provider_id: string - The provider to retry sequence for
 *
 * Returns:
 *   - success: boolean
 *   - tasks_reset: number - Count of tasks that were reset
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

    if (!provider_id) {
      return NextResponse.json(
        { error: "provider_id is required" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Verify provider is in in_sequence stage
    const { data: tracking } = await db
      .from("provider_outreach_tracking")
      .select("id, stage")
      .eq("provider_id", provider_id)
      .single();

    if (!tracking) {
      return NextResponse.json(
        { error: "Provider not found in tracking" },
        { status: 404 }
      );
    }

    if (tracking.stage !== "in_sequence") {
      return NextResponse.json(
        { error: "Provider is not in sequence" },
        { status: 400 }
      );
    }

    // Find all failed tasks for THIS tracking record (current sequence only)
    const { data: failedTasks } = await db
      .from("provider_outreach_tasks")
      .select("id, cadence_day, payload")
      .eq("tracking_id", tracking.id)
      .eq("status", "failed");

    if (!failedTasks || failedTasks.length === 0) {
      return NextResponse.json({
        success: true,
        tasks_reset: 0,
        message: "No failed tasks found",
      });
    }

    // Reset failed tasks to pending with new due_at (schedule for 1 hour from now)
    // Preserve the original payload but remove error/outcome fields
    const newDueAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    let tasksReset = 0;

    for (const task of failedTasks) {
      const existingPayload = (task.payload || {}) as Record<string, unknown>;
      // Remove error-related fields but keep recipient_email, provider_name, etc.
      const cleanPayload = { ...existingPayload };
      delete cleanPayload.outcome;
      delete cleanPayload.error;

      const { error: updateError } = await db
        .from("provider_outreach_tasks")
        .update({
          status: "pending",
          completed_at: null,
          due_at: newDueAt,
          payload: cleanPayload,
        })
        .eq("id", task.id);

      if (updateError) {
        console.error(`[retry-sequence] Failed to reset task ${task.id}:`, updateError);
      } else {
        tasksReset++;
      }
    }

    if (tasksReset === 0) {
      return NextResponse.json(
        { error: "Failed to reset any tasks" },
        { status: 500 }
      );
    }

    // Log touchpoint for audit trail
    await db.from("provider_outreach_touchpoints").insert({
      provider_id,
      touchpoint_type: "sequence_retry",
      details: {
        tasks_reset: tasksReset,
        cadence_days: failedTasks.map((t) => t.cadence_day),
        admin_user_id: adminUser.id,
        admin_email: adminUser.email,
      },
      admin_user_id: adminUser.id,
      created_at: new Date().toISOString(),
    });

    console.log(
      `[retry-sequence] Reset ${tasksReset} failed tasks for provider ${provider_id} by ${adminUser.email}`
    );

    return NextResponse.json({
      success: true,
      tasks_reset: tasksReset,
      scheduled_for: newDueAt,
    });
  } catch (error) {
    console.error("Error in retry-sequence:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
