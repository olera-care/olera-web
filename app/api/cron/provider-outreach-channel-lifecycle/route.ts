/**
 * Cron endpoint: move providers from Alternative Channels to Call tab after 7 days.
 *
 * Triggered by Vercel Cron (daily at 5:00 AM UTC — see vercel.json) or by an
 * admin curling locally with the CRON_SECRET bearer token.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Fails closed
 * (401) if CRON_SECRET is unset OR doesn't match — never publicly callable.
 *
 * After 7 days in re_engage (Alternative Channels) without claiming:
 *   - Move to call_exhausted stage (Call tab)
 *   - Log a stage_changed touchpoint for audit trail
 *   - Provider stays there until manual resolution (archive, not interested, etc.)
 *
 * Does NOT move providers who have claimed their profile.
 *
 * Local testing:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     http://localhost:3000/api/cron/provider-outreach-channel-lifecycle
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";

const DAYS_IN_ALT_CHANNELS = 7;

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

  return withCronRun("provider-outreach-channel-lifecycle", async () => {
    const db = getServiceClient();
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - DAYS_IN_ALT_CHANNELS * 24 * 60 * 60 * 1000);
    const cutoffIso = cutoffDate.toISOString();
    const nowIso = now.toISOString();

    let movedToCall = 0;

    // Find providers in re_engage stage where they entered 7+ days ago
    // Use stage_changed_at as the entry time (when they moved to re_engage)
    // Filter out null stage_changed_at to avoid edge cases with old/migrated data
    // Limit 500 per run (daily cron, should handle any reasonable backlog)
    const { data: reEngageProviders, error: queryError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage_changed_at")
      .eq("stage", "re_engage")
      .not("stage_changed_at", "is", null)
      .lte("stage_changed_at", cutoffIso)
      .limit(500);

    if (queryError) {
      console.error("[provider-outreach-channel-lifecycle] Query error:", queryError);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    if (!reEngageProviders || reEngageProviders.length === 0) {
      console.log("[provider-outreach-channel-lifecycle] No providers to move");
      return NextResponse.json({
        success: true,
        moved_to_call: 0,
      });
    }

    // Check which providers have claimed (exclude them)
    const providerIds = reEngageProviders.map((p) => p.provider_id);
    const { data: claimedBps } = await db
      .from("business_profiles")
      .select("source_provider_id")
      .in("source_provider_id", providerIds)
      .not("account_id", "is", null);

    const claimedSet = new Set((claimedBps || []).map((bp) => bp.source_provider_id));

    // Move unclaimed providers to call_exhausted
    const toMove = reEngageProviders.filter((p) => !claimedSet.has(p.provider_id));

    for (const provider of toMove) {
      // Update stage
      const { error: updateError } = await db
        .from("provider_outreach_tracking")
        .update({
          stage: "call_exhausted",
          stage_changed_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", provider.id);

      if (updateError) {
        console.error(`[provider-outreach-channel-lifecycle] Failed to move ${provider.provider_id}:`, updateError);
        continue;
      }

      // Log touchpoint for audit trail (consistent with other automatic stage changes)
      const { error: touchpointError } = await db
        .from("provider_outreach_touchpoints")
        .insert({
          provider_id: provider.provider_id,
          touchpoint_type: "stage_changed",
          metadata: {
            from_stage: "re_engage",
            to_stage: "call_exhausted",
            reason: `Auto-moved after ${DAYS_IN_ALT_CHANNELS} days in Alternative Channels`,
            triggered_by: "cron:provider-outreach-channel-lifecycle",
          },
        });

      if (touchpointError) {
        console.error(`[provider-outreach-channel-lifecycle] Failed to log touchpoint for ${provider.provider_id}:`, touchpointError);
      }

      movedToCall++;
    }

    console.log(`[provider-outreach-channel-lifecycle] Moved ${movedToCall} providers from re_engage to call_exhausted`);

    return NextResponse.json({
      success: true,
      moved_to_call: movedToCall,
    });
  });
}
