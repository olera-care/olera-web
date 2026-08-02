import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { getSiteUrl } from "@/lib/site-url";
import { sendSlackAlert } from "@/lib/slack";
import { readBenefitsNavigator } from "@/lib/family-comms/benefits-navigator.server";
import {
  sendNavigatorLetter,
  markScheduleFailed,
} from "@/lib/family-comms/benefits-navigator-send.server";

/**
 * GET /api/cron/benefits-navigator-scheduler
 *
 * Fires navigator letters TJ scheduled from /admin/benefits. Hourly: a
 * scheduled time means "within the hour", which is what the UI promises.
 * Each due letter goes through the SAME send path as the manual button
 * (lib/family-comms/benefits-navigator-send.server.ts) — governance caps,
 * DNC, and suppression are re-checked at fire time, and the consent-gated
 * SMS companion respects the recipient's quiet hours (parked in sms_queue
 * when the fire lands outside 8am–8pm their time).
 *
 * A blocked fire NEVER retries silently into the same cap: the schedule is
 * cleared, the reason is stamped on the draft (visible in the admin queue),
 * and Slack gets a ping. The draft stays pending for TJ to reschedule or
 * send by hand.
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

  return withCronRun("benefits-navigator-scheduler", async () => {
    const db = getServiceClient();
    const nowIso = new Date().toISOString();

    // ISO-8601 UTC strings compare lexicographically, so lte on the JSON
    // path is a correct due-time filter. Status must still be pending —
    // sent/dismissed drafts keep their history but never fire.
    const { data: due, error } = await db
      .from("business_profiles")
      .select("id, display_name, email")
      .eq("type", "family")
      .eq("metadata->benefits_navigator->>status", "pending")
      .not("metadata->benefits_navigator->>scheduled_at", "is", null)
      .lte("metadata->benefits_navigator->>scheduled_at", nowIso)
      .limit(MAX_SENDS_PER_RUN);
    if (error) throw error;

    const counts = { due: due?.length ?? 0, sent: 0, blocked: 0 };
    const blockedLines: string[] = [];

    for (const row of due ?? []) {
      // Re-read inside the send (it loads fresh) — but double-check the
      // schedule here too so a just-canceled schedule doesn't fire on a
      // stale list row.
      const { data: fresh } = await db
        .from("business_profiles")
        .select("metadata")
        .eq("id", row.id)
        .maybeSingle();
      const nav = readBenefitsNavigator(
        (fresh?.metadata as Record<string, unknown> | null) || {},
      );
      if (nav.status !== "pending" || !nav.scheduled_at || nav.scheduled_at > nowIso) continue;

      try {
        const result = await sendNavigatorLetter(db, { profileId: row.id, trigger: "scheduler" });
        if (result.ok) {
          counts.sent++;
        } else {
          counts.blocked++;
          await markScheduleFailed(db, row.id, result.error);
          blockedLines.push(`${row.display_name || row.email || row.id}: ${result.error}`);
        }
      } catch (err) {
        // Transport-level failure (API down, timeout): keep the schedule so
        // the next hourly run retries — this is NOT a governance block.
        counts.blocked++;
        console.error("[benefits-navigator-scheduler] send threw:", row.id, err);
        blockedLines.push(`${row.display_name || row.email || row.id}: transport error (will retry)`);
      }
    }

    if (counts.sent > 0 || blockedLines.length > 0) {
      try {
        const siteUrl = getSiteUrl();
        const parts: string[] = [];
        if (counts.sent > 0)
          parts.push(`⏱ ${counts.sent} scheduled navigator letter${counts.sent === 1 ? "" : "s"} sent`);
        if (blockedLines.length > 0)
          parts.push(`⚠️ ${blockedLines.length} blocked: ${blockedLines.join("; ")}`);
        await sendSlackAlert(`${parts.join(" · ")} → ${siteUrl}/admin/benefits`);
      } catch (err) {
        console.error("[benefits-navigator-scheduler] Slack ping failed:", err);
      }
    }

    return counts;
  });
}
