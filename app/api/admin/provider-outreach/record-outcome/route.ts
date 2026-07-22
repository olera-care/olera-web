import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { OUTREACH_STAGES, type OutreachStage } from "../route";

/**
 * POST /api/admin/provider-outreach/record-outcome
 *
 * Record a call outcome for a provider in the Follow Up (needs_call) stage.
 * This powers the call queue workflow with proper counter/date management.
 *
 * Note: "Claimed" is NOT an outcome here - auto-claim detection (migration 133)
 * automatically moves providers to "claimed" when they claim via any method.
 *
 * Request body:
 *   - provider_id: string (required)
 *   - outcome: string (required) - one of the valid outcomes
 *   - callback_date?: string (ISO date) - required for schedule_callback
 *   - notes?: string - optional notes
 *
 * Outcomes and their effects:
 *
 * | Outcome          | Counter/Date Updates            | Stage Change    |
 * |------------------|--------------------------------|-----------------|
 * | resend_link      | resend_count++, due_date=+3d   | stays           |
 * | schedule_callback| due_date=callback_date         | stays           |
 * | no_answer (1-2)  | no_answer_count++, due_date=+2d| stays           |
 * | no_answer (3rd)  | no_answer_count++              | → re_engage     |
 * | wrong_contact    | clears email                   | → not_contacted |
 * | not_interested   | -                              | → not_interested (soft terminal) |
 *
 * Note: "not_interested" is a soft terminal - stops outreach but questions/connections still flow.
 * Use the Archive action (via action modal) for hard terminal with system-wide block.
 */

const VALID_OUTCOMES = [
  "resend_link",
  "schedule_callback",
  "no_answer",
  "wrong_contact",
  "not_interested",
] as const;

type CallOutcome = (typeof VALID_OUTCOMES)[number];

// Add days to a date, return ISO date string (date only, no time) in UTC
// Uses UTC to match database CURRENT_DATE (Supabase runs in UTC)
function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0];
}

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
    const { provider_id, outcome, callback_date, notes } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (!outcome || !VALID_OUTCOMES.includes(outcome as CallOutcome)) {
      return NextResponse.json(
        { error: `Invalid outcome. Must be one of: ${VALID_OUTCOMES.join(", ")}` },
        { status: 400 }
      );
    }

    if (outcome === "schedule_callback" && !callback_date) {
      return NextResponse.json({ error: "callback_date is required for schedule_callback" }, { status: 400 });
    }

    // Validate callback_date format and ensure it's not in the past
    if (outcome === "schedule_callback" && callback_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(callback_date)) {
        return NextResponse.json({ error: "callback_date must be in YYYY-MM-DD format" }, { status: 400 });
      }
      const todayISO = new Date().toISOString().split("T")[0];
      if (callback_date < todayISO) {
        return NextResponse.json({ error: "callback_date cannot be in the past" }, { status: 400 });
      }
    }

    const db = getServiceClient();
    const nowIso = new Date().toISOString();
    const today = new Date();

    // Get current tracking record
    const { data: tracking, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage, resend_count, no_answer_count, due_date, city, state")
      .eq("provider_id", provider_id)
      .single();

    if (trackingError || !tracking) {
      return NextResponse.json({ error: "Provider not found in tracking" }, { status: 404 });
    }

    // Verify provider is in needs_call stage
    if (tracking.stage !== "needs_call") {
      return NextResponse.json(
        { error: `Provider must be in Follow Up stage. Current stage: ${tracking.stage}` },
        { status: 400 }
      );
    }

    // Current counter values (default to 0 if null)
    const currentResendCount = tracking.resend_count ?? 0;
    const currentNoAnswerCount = tracking.no_answer_count ?? 0;

    // Process outcome - determine updates
    let newStage: OutreachStage | null = null;
    let newDueDate: string | null = null;
    let newResendCount = currentResendCount;
    let newNoAnswerCount = currentNoAnswerCount;
    let clearEmail = false;
    let rejectionMessage: string | null = null;

    switch (outcome as CallOutcome) {
      case "resend_link":
        // Reject if already at limit
        if (currentResendCount >= 2) {
          rejectionMessage = "Resend link limit reached (2). Consider moving to Re-Engage.";
          return NextResponse.json({ error: rejectionMessage }, { status: 400 });
        }
        newResendCount = currentResendCount + 1;
        newDueDate = addDays(today, 3);
        break;

      case "schedule_callback":
        // callback_date already validated above
        newDueDate = callback_date;
        break;

      case "no_answer":
        newNoAnswerCount = currentNoAnswerCount + 1;
        if (newNoAnswerCount >= 3) {
          // 3rd no-answer: auto-transition to re_engage
          newStage = "re_engage";
        } else {
          // 1st or 2nd: bump due date by 2 days
          newDueDate = addDays(today, 2);
        }
        break;

      case "wrong_contact":
        newStage = "not_contacted";
        clearEmail = true;
        break;

      case "not_interested":
        // Soft terminal - no system-wide archive sync
        // Provider stops receiving outreach but can still get questions/connections
        newStage = "not_interested";
        break;
    }

    // ── Update tracking record ──

    const updateData: Record<string, unknown> = {
      updated_at: nowIso,
    };

    if (newResendCount !== currentResendCount) {
      updateData.resend_count = newResendCount;
    }

    if (newNoAnswerCount !== currentNoAnswerCount) {
      updateData.no_answer_count = newNoAnswerCount;
    }

    if (newDueDate) {
      updateData.due_date = newDueDate;
    }

    if (newStage) {
      updateData.stage = newStage;
      updateData.stage_changed_at = nowIso;

      if (notes?.trim()) {
        updateData.notes = notes.trim();
      }
    } else if (notes?.trim()) {
      // Append notes without stage change (use existing or set new)
      updateData.notes = notes.trim();
    }

    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update(updateData)
      .eq("id", tracking.id);

    if (updateError) {
      console.error("[record-outcome] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update tracking record" }, { status: 500 });
    }

    // ── Clear email if wrong_contact ──

    if (clearEmail) {
      const { error: emailError } = await db
        .from("olera-providers")
        .update({ email: null, updated_at: nowIso })
        .eq("provider_id", provider_id);

      if (emailError) {
        console.error("[record-outcome] Clear email error:", emailError);
        // Non-fatal, continue
      }
    }

    // ── Log touchpoints ──

    const touchpointRows: Array<{
      provider_id: string;
      touchpoint_type: string;
      details: Record<string, unknown>;
      admin_user_id: string;
      created_at: string;
    }> = [];

    // Always log outcome_recorded
    touchpointRows.push({
      provider_id,
      touchpoint_type: "outcome_recorded",
      details: {
        outcome,
        resend_count: newResendCount,
        no_answer_count: newNoAnswerCount,
        ...(newDueDate && { new_due_date: newDueDate }),
        ...(notes?.trim() && { notes: notes.trim() }),
        ...(newStage && { triggered_stage_change: newStage }),
        ...(clearEmail && { email_cleared: true }),
      },
      admin_user_id: adminUser.id,
      created_at: nowIso,
    });

    // Also log stage_changed if stage moved
    if (newStage) {
      touchpointRows.push({
        provider_id,
        touchpoint_type: "stage_changed",
        details: {
          old_stage: "needs_call",
          new_stage: newStage,
          trigger: `outcome_${outcome}`,
          ...(notes?.trim() && { notes: notes.trim() }),
        },
        admin_user_id: adminUser.id,
        created_at: nowIso,
      });
    }

    const { error: touchpointError } = await db
      .from("provider_outreach_touchpoints")
      .insert(touchpointRows);

    if (touchpointError) {
      // Non-fatal: log but don't fail the request
      console.error("[record-outcome] Touchpoint insert error:", touchpointError);
    }

    return NextResponse.json({
      success: true,
      outcome,
      stage_changed: !!newStage,
      new_stage: newStage,
      new_due_date: newDueDate,
      resend_count: newResendCount,
      no_answer_count: newNoAnswerCount,
    });
  } catch (err) {
    console.error("[record-outcome] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
