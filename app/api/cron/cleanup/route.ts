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

    // 2. Purge stale MedJobs guest providers (anonymous "Continue as guest"
    //    accounts) older than 7 days that were never converted via Finish setup.
    //    Tears down the full chain: profile -> membership -> account -> anon user.
    //    Guests can't write (no connections/activity), so deletes are clean.
    const GUEST_TTL_DAYS = 7;
    const guestCutoff = new Date(Date.now() - GUEST_TTL_DAYS * 86_400_000).toISOString();
    const { data: staleGuests } = await db
      .from("business_profiles")
      .select("id, account_id")
      .eq("metadata->>is_guest", "true")
      .lt("created_at", guestCutoff);

    let purgedGuests = 0;
    for (const g of staleGuests ?? []) {
      try {
        const { data: acct } = await db
          .from("accounts")
          .select("user_id")
          .eq("id", g.account_id)
          .maybeSingle();
        await db.from("business_profiles").delete().eq("id", g.id);
        await db.from("memberships").delete().eq("account_id", g.account_id);
        await db.from("accounts").delete().eq("id", g.account_id);
        if (acct?.user_id) {
          await db.auth.admin.deleteUser(acct.user_id).catch(() => {});
        }
        purgedGuests++;
      } catch (e) {
        console.error("[cron/cleanup] guest purge failed for", g.id, e);
      }
    }
    results.guestProfiles = purgedGuests;

    console.log("[cron/cleanup] results:", results);

    return NextResponse.json({ status: "ok", cleaned: results });
  } catch (err) {
    console.error("[cron/cleanup] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  });
}
