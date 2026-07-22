import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/state-counts
 *
 * Returns the number of active (non-deleted) providers per state from
 * olera-providers. Used by the "Add State" modal to show how many
 * providers will be loaded.
 */

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();

  const { data, error } = await db
    .from("olera-providers")
    .select("state")
    .eq("deleted", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  for (const r of data || []) {
    if (r.state) {
      counts[r.state] = (counts[r.state] || 0) + 1;
    }
  }

  return NextResponse.json({ counts });
}
