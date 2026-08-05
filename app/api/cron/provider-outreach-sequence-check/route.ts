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
 *   - Find providers in in_sequence stage where sequence_started_at + 14 days <= now()
 *   - Check they haven't claimed (claimed_at is still null)
 *   - Check email engagement (did they click any links?)
 *   - Move to needs_call stage with appropriate reason:
 *       - 'clicked_not_claimed' if provider clicked a link but didn't claim
 *       - 'sequence_exhausted' if no clicks detected
 *   - Log touchpoint for each transition
 *
 * Timing: The cadence is Day 0, 3, 7, 14. After Day 14 (final email) with
 * no claim, we immediately escalate to manual calls (Follow Up stage).
 *
 * Local testing:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     http://localhost:3000/api/cron/provider-outreach-sequence-check
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { DAYS_AFTER_FINAL_TO_NEEDS_CALL, PROVIDER_OUTREACH_CADENCE } from "@/lib/provider-outreach";
import { findFaxForProvider, saveFaxResult } from "@/lib/provider-fax-finder";

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
    // Limit to 20 because we also run fax lookup which takes time
    const { data: expiredProviders, error: fetchError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, sequence_started_at")
      .eq("stage", "in_sequence")
      .is("claimed_at", null)
      .not("sequence_started_at", "is", null)
      .lte("sequence_started_at", cutoffDate.toISOString())
      .limit(20);

    if (fetchError) {
      console.error("[provider-outreach-sequence-check] Fetch error:", fetchError);
      return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }

    if (!expiredProviders || expiredProviders.length === 0) {
      return NextResponse.json({ transitioned: 0 });
    }

    // Get email engagement data for all expired providers
    // Check if they clicked any links in their outreach emails
    const providerIds = expiredProviders.map((p) => p.provider_id);
    const { data: emailLogs } = await db
      .from("email_log")
      .select("provider_id, first_clicked_at")
      .eq("email_type", "provider_outreach_sequence")
      .in("provider_id", providerIds)
      .not("first_clicked_at", "is", null);

    // Build a set of provider_ids who clicked at least one email
    const clickedProviderIds = new Set(
      (emailLogs || []).map((log) => log.provider_id)
    );

    const transitioned: string[] = [];
    const transitionedClicked: string[] = [];
    const failed: Array<{ provider_id: string; error: string }> = [];

    for (const provider of expiredProviders) {
      try {
        // Determine reason based on engagement
        const hasClicked = clickedProviderIds.has(provider.provider_id);
        const reason = hasClicked ? "clicked_not_claimed" : "sequence_exhausted";

        // Update stage to needs_call with appropriate reason
        const nowIso = new Date().toISOString();
        const { error: updateError } = await db
          .from("provider_outreach_tracking")
          .update({
            stage: "needs_call",
            stage_changed_at: nowIso,
            needs_call_reason: reason,
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
            reason,
            auto_transitioned: true,
            sequence_started_at: provider.sequence_started_at,
            days_elapsed: totalDays,
            had_email_click: hasClicked,
          },
          admin_user_id: null, // System action
          created_at: new Date().toISOString(),
        });

        transitioned.push(provider.provider_id);
        if (hasClicked) {
          transitionedClicked.push(provider.provider_id);
        }

        // Auto-run fax finder so "Has Fax" indicator is pre-populated in Follow Up tab
        try {
          const { data: providerData } = await db
            .from("olera-providers")
            .select("provider_id, provider_name, website, place_id, city, state")
            .eq("provider_id", provider.provider_id)
            .maybeSingle();

          if (providerData) {
            const faxResult = await findFaxForProvider({
              provider_id: providerData.provider_id,
              provider_name: providerData.provider_name,
              website: providerData.website,
              place_id: providerData.place_id,
              city: providerData.city,
              state: providerData.state,
            });
            await saveFaxResult(db, provider.provider_id, faxResult);
          }
        } catch (faxErr) {
          // Non-fatal: log but don't fail the transition
          console.error(
            `[provider-outreach-sequence-check] Fax lookup failed for ${provider.provider_id}:`,
            faxErr instanceof Error ? faxErr.message : faxErr
          );
        }
      } catch (err) {
        failed.push({
          provider_id: provider.provider_id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      transitioned: transitioned.length,
      transitioned_clicked: transitionedClicked.length,
      failed: failed.length,
      transitioned_providers: transitioned,
      clicked_providers: transitionedClicked,
      failed_providers: failed,
    });
  });
}
