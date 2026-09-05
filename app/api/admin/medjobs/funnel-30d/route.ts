import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { loadFunnel30d } from "@/lib/medjobs/funnel-30d";

/**
 * GET /api/admin/medjobs/funnel-30d
 *
 * Trailing-30-day performance per stage, for the tracker on the operating
 * system diagram. Stages that are not instrumented come back carrying the
 * reason rather than a number; see docs/medjobs/FUNNEL_MEASUREMENT_MAP.md.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = await loadFunnel30d(getServiceClient());
    return NextResponse.json(data, {
      // A rolling window does not need to be to-the-second, and the diagram
      // is read far more often than the numbers move.
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (err) {
    console.error("[medjobs/funnel-30d]", err);
    return NextResponse.json({ error: "Failed to load funnel metrics" }, { status: 500 });
  }
}
