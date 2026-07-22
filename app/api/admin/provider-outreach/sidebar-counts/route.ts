import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/sidebar-counts
 *
 * Returns { in_basket, sites } counts for the Provider Outreach sidebar.
 * in_basket = providers with active outreach status (not closed).
 * sites = distinct states loaded into the pipeline.
 */

const CLOSED_STATUSES = ["not_interested", "do_not_contact", "partner"];

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();

  const [
    { count: totalActive },
    { count: unreadActive },
    { data: stateRows },
  ] = await Promise.all([
    db
      .from("provider_outreach")
      .select("id", { count: "exact", head: true })
      .not("status", "in", `(${CLOSED_STATUSES.map((s) => `"${s}"`).join(",")})`),
    db
      .from("provider_outreach")
      .select("id", { count: "exact", head: true })
      .not("status", "in", `(${CLOSED_STATUSES.map((s) => `"${s}"`).join(",")})`)
      .is("viewed_at", null),
    db
      .from("provider_outreach")
      .select("state"),
  ]);

  const distinctStates = new Set((stateRows || []).map((r) => r.state));

  return NextResponse.json({
    counts: {
      in_basket: { unread: unreadActive ?? 0, total: totalActive ?? 0 },
      sites: { unread: 0, total: distinctStates.size },
    },
  });
}
