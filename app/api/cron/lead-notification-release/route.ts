import { NextRequest, NextResponse } from "next/server";
import { withCronRun } from "@/lib/crons/run";
import { releaseExpiredLeadNotifications } from "@/lib/leads/provider-notifications.server";

/**
 * GET /api/cron/lead-notification-release
 *
 * The ceiling half of the lead notification hold. Provider emails, SMS and
 * WhatsApp are no longer sent when an inquiry is created, because at that moment
 * the family has submitted an email address and nothing else — the six-step
 * qualifying flow runs afterwards and roughly six in ten people skip out of it.
 *
 * Most releases never reach this route: the family finishes enrichment and
 * `PATCH /api/connections/update-intent` sends immediately. This sweep exists for
 * the ones who abandon. Measured on 353 sessions to 2026-09-22, median time from
 * lead to enrichment finishing was 53 seconds and 352 of 353 finished inside ten
 * minutes, so a ten minute ceiling delays nobody who was going to answer.
 *
 * Runs every 5 minutes, so the worst case a provider waits is about 15 minutes
 * and only on a lead that arrived with no information in it.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` || querySecret === process.env.CRON_SECRET;
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("lead-notification-release", async () => {
    const result = await releaseExpiredLeadNotifications();
    return {
      ok: true,
      examined: result.examined,
      sent: result.sent,
      skipped: result.skipped,
      summary: `${result.sent} released, ${result.skipped} skipped, of ${result.examined} due`,
    };
  });
}
