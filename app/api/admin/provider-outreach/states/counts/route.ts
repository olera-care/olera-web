import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { US_STATES } from "@/lib/us-states";

/**
 * GET /api/admin/provider-outreach/states/counts
 *
 * Returns provider counts for all US states.
 * Used by the Add State modal to show how many providers are in each state.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const db = getServiceClient();

    // Get provider counts grouped by state
    // Only count non-deleted providers (deleted IS NOT TRUE matches both NULL and false)
    const { data, error } = await db
      .from("olera-providers")
      .select("state")
      .or("deleted.is.null,deleted.eq.false");

    if (error) {
      console.error("[provider-outreach/states/counts] Query error:", error);
      return NextResponse.json({ error: "Failed to fetch counts" }, { status: 500 });
    }

    // Count providers per state
    const countsByState: Record<string, number> = {};
    for (const row of data ?? []) {
      if (row.state) {
        countsByState[row.state] = (countsByState[row.state] || 0) + 1;
      }
    }

    // Build response with all US states
    const counts = US_STATES.map((s) => ({
      state_code: s.value,
      state_name: s.label,
      provider_count: countsByState[s.value] || 0,
    }));

    // Sort by provider count descending (most providers first)
    counts.sort((a, b) => b.provider_count - a.provider_count);

    return NextResponse.json({ counts });
  } catch (err) {
    console.error("[provider-outreach/states/counts] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
