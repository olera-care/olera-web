import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * GET /api/cron/cleanup
 *
 * Runs daily at 4 AM UTC. Cleans up:
 * - Expired verification codes (older than 1 hour)
 * - Stale draft connections (pending + no thread activity for 30 days)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getServiceClient();
    const results: Record<string, number> = {};

    // 1. Delete expired verification codes (expired_at < now)
    const { count: expiredCodes } = await db
      .from("claim_verification_codes")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString());

    results.expiredCodes = expiredCodes ?? 0;

    // 2. Delete stale pending connections (no activity for 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count: staleConnections } = await db
      .from("connections")
      .delete({ count: "exact" })
      .eq("status", "pending")
      .eq("type", "inquiry")
      .lt("updated_at", thirtyDaysAgo);

    results.staleConnections = staleConnections ?? 0;

    console.log("[cron/cleanup] results:", results);

    return NextResponse.json({ status: "ok", cleaned: results });
  } catch (err) {
    console.error("[cron/cleanup] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
