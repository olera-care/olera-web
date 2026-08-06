/**
 * Cron endpoint: auto-progress providers through re-engagement channels.
 *
 * Triggered by Vercel Cron (daily at 9:00 AM — see vercel.json) or by an
 * admin curling locally with the CRON_SECRET bearer token.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Fails closed
 * (401) if CRON_SECRET is unset OR doesn't match — never publicly callable.
 *
 * Channel Progression (after 5 days without response):
 *   - fax (sent 5+ days ago) → linkedin
 *   - linkedin (entered 5+ days ago) → direct_mail
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

const CHANNEL_WAIT_DAYS = 5;

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
    const cutoffDate = new Date(now.getTime() - CHANNEL_WAIT_DAYS * 24 * 60 * 60 * 1000);
    const cutoffIso = cutoffDate.toISOString();
    const nowIso = now.toISOString();

    let faxToLinkedin = 0;
    let linkedinToDirectMail = 0;

    // ── Step 1: Move fax → linkedin ──
    // Find providers in fax channel where fax was sent 5+ days ago
    const { data: faxProviders, error: faxError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, fax_sent_at")
      .eq("stage", "re_engage")
      .eq("re_engage_channel", "fax")
      .not("fax_sent_at", "is", null)
      .lte("fax_sent_at", cutoffIso)
      .limit(50);

    if (faxError) {
      console.error("[provider-outreach-channel-lifecycle] Fax query error:", faxError);
    } else if (faxProviders && faxProviders.length > 0) {
      // Check which providers have claimed (exclude them)
      const faxProviderIds = faxProviders.map((p) => p.provider_id);
      const { data: claimedBps } = await db
        .from("business_profiles")
        .select("source_provider_id")
        .in("source_provider_id", faxProviderIds)
        .not("account_id", "is", null);

      const claimedSet = new Set((claimedBps || []).map((bp) => bp.source_provider_id));

      // Move unclaimed providers to linkedin
      const toMoveToLinkedin = faxProviders.filter((p) => !claimedSet.has(p.provider_id));

      for (const provider of toMoveToLinkedin) {
        const { error: updateError } = await db
          .from("provider_outreach_tracking")
          .update({
            re_engage_channel: "linkedin",
            channel_entered_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", provider.id);

        if (updateError) {
          console.error(`[provider-outreach-channel-lifecycle] Failed to move ${provider.provider_id} to linkedin:`, updateError);
        } else {
          faxToLinkedin++;
        }
      }
    }

    // ── Step 2: Move linkedin → direct_mail ──
    // Find providers in linkedin channel where channel_entered_at was 5+ days ago
    // OR where fax_sent_at was 10+ days ago (fallback if channel_entered_at not set)
    const tenDaysCutoff = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

    const { data: linkedinProviders, error: linkedinError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, channel_entered_at, fax_sent_at")
      .eq("stage", "re_engage")
      .eq("re_engage_channel", "linkedin")
      .limit(50);

    if (linkedinError) {
      console.error("[provider-outreach-channel-lifecycle] LinkedIn query error:", linkedinError);
    } else if (linkedinProviders && linkedinProviders.length > 0) {
      // Filter by time: either channel_entered_at 5+ days ago OR fax_sent_at 10+ days ago
      const eligibleLinkedin = linkedinProviders.filter((p) => {
        if (p.channel_entered_at && p.channel_entered_at <= cutoffIso) return true;
        if (p.fax_sent_at && p.fax_sent_at <= tenDaysCutoff) return true;
        return false;
      });

      if (eligibleLinkedin.length > 0) {
        // Check which providers have claimed (exclude them)
        const linkedinProviderIds = eligibleLinkedin.map((p) => p.provider_id);
        const { data: claimedBps } = await db
          .from("business_profiles")
          .select("source_provider_id")
          .in("source_provider_id", linkedinProviderIds)
          .not("account_id", "is", null);

        const claimedSet = new Set((claimedBps || []).map((bp) => bp.source_provider_id));

        // Move unclaimed providers to direct_mail
        const toMoveToDirectMail = eligibleLinkedin.filter((p) => !claimedSet.has(p.provider_id));

        for (const provider of toMoveToDirectMail) {
          const { error: updateError } = await db
            .from("provider_outreach_tracking")
            .update({
              re_engage_channel: "direct_mail",
              channel_entered_at: nowIso,
              updated_at: nowIso,
            })
            .eq("id", provider.id);

          if (updateError) {
            console.error(`[provider-outreach-channel-lifecycle] Failed to move ${provider.provider_id} to direct_mail:`, updateError);
          } else {
            linkedinToDirectMail++;
          }
        }
      }
    }

    console.log(`[provider-outreach-channel-lifecycle] Moved ${faxToLinkedin} from fax→linkedin, ${linkedinToDirectMail} from linkedin→direct_mail`);

    return NextResponse.json({
      success: true,
      fax_to_linkedin: faxToLinkedin,
      linkedin_to_direct_mail: linkedinToDirectMail,
    });
  });
}
