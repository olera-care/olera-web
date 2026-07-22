import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/operations-summary
 *
 * Current-state counts for the Provider Outreach Stats page tiles.
 * Same shape as MedJobs operations-summary.
 *
 * Stub: returns zeroes until the provider outreach pipeline tables exist.
 */

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    return NextResponse.json({
      providers: 0,
      contacted: 0,
      meetings: 0,
      partners: 0,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[admin/provider-outreach/operations-summary] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
