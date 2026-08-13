import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { getSiteUrl } from "@/lib/site-url";
import { sendSlackAlert } from "@/lib/slack";
import { sendAdBoostLifecycleEmail } from "@/lib/ad-boost/lifecycle-notifications.server";

/**
 * GET /api/cron/ad-boost-launch-scheduler
 *
 * Fires the "Your Find Families campaign is live" provider email at the time
 * the admin picked when flipping a campaign to live (hourly = "within the
 * hour" — same promise as the benefits navigator scheduler). Lets the flip
 * happen at the operator's convenience (TJ works from Thailand) while the
 * email still lands in the provider's US morning.
 *
 * The send goes through the SAME path as the immediate flip
 * (sendAdBoostLifecycleEmail): launched_email_sent_at reserves the send
 * atomically, so this can never double-email even if the admin also hits
 * Send now. Permanent skips (no provider email, unsubscribed) clear the
 * schedule and ping Slack instead of retrying into the same wall every hour;
 * transport failures keep the schedule and retry next run.
 */

export const maxDuration = 300;

const MAX_SENDS_PER_RUN = 20;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` || querySecret === process.env.CRON_SECRET;
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("ad-boost-launch-scheduler", async () => {
    const db = getServiceClient();
    const nowIso = new Date().toISOString();

    const { data: due, error } = await db
      .from("ad_campaign_requests")
      .select(
        "id, provider_id, provider_slug, display_name, requested_setup_week, flight_start_date, channel, campaign_tag, intended_monthly_budget, ad_spend_cents, ad_clicks, ad_impressions, created_at",
      )
      .eq("status", "live")
      .is("deleted_at", null)
      .is("launched_email_sent_at", null)
      .not("launched_email_scheduled_at", "is", null)
      .lte("launched_email_scheduled_at", nowIso)
      .limit(MAX_SENDS_PER_RUN);
    if (error) throw error;

    const counts = { due: due?.length ?? 0, sent: 0, blocked: 0 };
    const blockedLines: string[] = [];

    for (const row of due ?? []) {
      const name = row.display_name || row.provider_slug || row.id;

      // Re-check right before sending — the admin can cancel the schedule (or
      // end the campaign) while this run is mid-loop, and a stale list row
      // must not fire. Same guard as the benefits navigator scheduler.
      const { data: fresh } = await db
        .from("ad_campaign_requests")
        .select("status, deleted_at, launched_email_sent_at, launched_email_scheduled_at")
        .eq("id", row.id)
        .maybeSingle();
      // Epoch comparison, not string: Postgres returns "+00:00"-suffixed
      // timestamps while nowIso is Z-format, and mixed-format lexicographic
      // comparison misjudges boundary rows.
      if (
        !fresh ||
        fresh.status !== "live" ||
        fresh.deleted_at != null ||
        fresh.launched_email_sent_at != null ||
        fresh.launched_email_scheduled_at == null ||
        new Date(fresh.launched_email_scheduled_at).getTime() > Date.now()
      ) {
        continue;
      }

      try {
        const result = await sendAdBoostLifecycleEmail({ request: row, kind: "launched" });
        if (result.sent || result.skipped === "already_sent") {
          if (result.sent) counts.sent++;
          await db
            .from("ad_campaign_requests")
            .update({ launched_email_scheduled_at: null })
            .eq("id", row.id);
        } else if (result.skipped === "send_failed" || result.skipped === "reservation_failed") {
          // Transient — the sent-marker was rolled back (or never set), so
          // keeping the schedule retries next hour.
          counts.blocked++;
          blockedLines.push(`${name}: ${result.skipped} (will retry)`);
        } else {
          // Permanent (missing_email, provider_unsubscribed, suppression):
          // clear the schedule so it surfaces once instead of failing hourly.
          counts.blocked++;
          await db
            .from("ad_campaign_requests")
            .update({ launched_email_scheduled_at: null })
            .eq("id", row.id);
          blockedLines.push(`${name}: ${result.skipped}`);
        }
      } catch (err) {
        counts.blocked++;
        console.error("[ad-boost-launch-scheduler] send threw:", row.id, err);
        blockedLines.push(`${name}: transport error (will retry)`);
      }
    }

    if (counts.sent > 0 || blockedLines.length > 0) {
      try {
        const siteUrl = getSiteUrl();
        const parts: string[] = [];
        if (counts.sent > 0)
          parts.push(`⏱ ${counts.sent} scheduled Ad Boost launch email${counts.sent === 1 ? "" : "s"} sent`);
        if (blockedLines.length > 0)
          parts.push(`⚠️ ${blockedLines.length} blocked: ${blockedLines.join("; ")}`);
        await sendSlackAlert(`${parts.join(" · ")} → ${siteUrl}/admin/ad-boost`);
      } catch (err) {
        console.error("[ad-boost-launch-scheduler] Slack ping failed:", err);
      }
    }

    return counts;
  });
}
