/**
 * Cron endpoint: auto-transition providers from in_sequence to needs_call.
 *
 * Triggered by Vercel Cron (hourly at :45 — see vercel.json) or by an
 * admin curling locally with the CRON_SECRET bearer token.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Fails closed
 * (401) if CRON_SECRET is unset OR doesn't match — never publicly callable.
 *
 * Behavior:
 *   - Find providers in in_sequence stage where sequence_started_at + 21 days <= now()
 *   - Check they haven't claimed (claimed_at is still null)
 *   - Move to needs_call stage with reason 'sequence_exhausted'
 *   - Log touchpoint for each transition
 *
 * Why 21 days? The cadence is Day 0, 3, 7, 14. After Day 14 + 7 days of
 * waiting for a response, we escalate to manual calls.
 *
 * Local testing:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     http://localhost:3000/api/cron/provider-outreach-sequence-check
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { DAYS_AFTER_FINAL_TO_NEEDS_CALL, PROVIDER_OUTREACH_CADENCE } from "@/lib/provider-outreach";

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}

async function runCron(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("provider-outreach-sequence-check", async () => {
    const db = getServiceClient();

    // Calculate the cutoff date: Day 14 (last email) + DAYS_AFTER_FINAL_TO_NEEDS_CALL
    const lastStep = PROVIDER_OUTREACH_CADENCE[PROVIDER_OUTREACH_CADENCE.length - 1];
    const totalDays = lastStep.day + DAYS_AFTER_FINAL_TO_NEEDS_CALL;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - totalDays);

    // Find providers whose sequence has expired
    const { data: expiredProviders, error: fetchError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, sequence_started_at")
      .eq("stage", "in_sequence")
      .is("claimed_at", null)
      .not("sequence_started_at", "is", null)
      .lte("sequence_started_at", cutoffDate.toISOString())
      .limit(50); // Process in batches

    if (fetchError) {
      console.error("[provider-outreach-sequence-check] Fetch error:", fetchError);
      return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }

    if (!expiredProviders || expiredProviders.length === 0) {
      return NextResponse.json({ transitioned: 0 });
    }

    const transitioned: string[] = [];
    const failed: Array<{ provider_id: string; error: string }> = [];

    for (const provider of expiredProviders) {
      try {
        // Update stage to needs_call
        const { error: updateError } = await db
          .from("provider_outreach_tracking")
          .update({
            stage: "needs_call",
            needs_call_reason: "sequence_exhausted",
          })
          .eq("id", provider.id);

        if (updateError) throw updateError;

        // Log touchpoint
        await db.from("provider_outreach_touchpoints").insert({
          provider_id: provider.provider_id,
          touchpoint_type: "stage_changed",
          details: {
            old_stage: "in_sequence",
            new_stage: "needs_call",
            reason: "sequence_exhausted",
            auto_transitioned: true,
            sequence_started_at: provider.sequence_started_at,
            days_elapsed: totalDays,
          },
          admin_user_id: null, // System action
          created_at: new Date().toISOString(),
        });

        transitioned.push(provider.provider_id);
      } catch (err) {
        failed.push({
          provider_id: provider.provider_id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      transitioned: transitioned.length,
      failed: failed.length,
      transitioned_providers: transitioned,
      failed_providers: failed,
    });
  });
}
