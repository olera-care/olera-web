import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";

/**
 * GET /api/cron/cleanup
 *
 * Runs daily at 4 AM UTC. Cleans up:
 * - Expired verification codes (older than 1 hour)
 *
 * NOTE: Previously deleted stale connections after 30 days, but this was removed
 * because leads need to persist for re-engagement campaigns over weeks/months.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("cleanup", async () => {
  try {
    const db = getServiceClient();
    const results: Record<string, number> = {};

    // 1. Delete expired verification codes (expired_at < now)
    const { count: expiredCodes } = await db
      .from("claim_verification_codes")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString());

    results.expiredCodes = expiredCodes ?? 0;

    // NOTE: Stale connection deletion was removed - leads must persist for re-engagement

    console.log("[cron/cleanup] results:", results);

    return NextResponse.json({ status: "ok", cleaned: results });
  } catch (err) {
    console.error("[cron/cleanup] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  });
}
