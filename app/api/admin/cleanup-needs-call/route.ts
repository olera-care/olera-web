import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";

/**
 * POST /api/admin/cleanup-needs-call
 *
 * OBSOLETE: This endpoint is no longer needed after the engagement level merge.
 *
 * The old system used separate "stuck" (stage 5) and "needs_call" (stage 7) levels
 * with metadata flags that could get out of sync. The new system merged these into
 * a single "needs_follow_up" level calculated in real-time based on connection age,
 * so there are no flags to clean up.
 *
 * This endpoint is kept for backwards compatibility and returns a message explaining
 * the migration.
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminUser = await getAdminUser(authUser.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  return NextResponse.json({
    message: "This cleanup is no longer needed after the engagement level merge.",
    explanation: [
      "The old system used 'stuck' (stage 5) and 'needs_call' (stage 7) with metadata flags.",
      "The new system merged these into 'needs_follow_up' calculated in real-time from connection age.",
      "No manual cleanup is required - the new engagement calculation handles all connections automatically.",
    ],
    triggered_by: adminUser.email,
    timestamp: new Date().toISOString(),
  });
}
