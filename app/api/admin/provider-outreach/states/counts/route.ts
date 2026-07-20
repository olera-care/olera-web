import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { US_STATES } from "@/lib/us-states";

/**
 * GET /api/admin/provider-outreach/states/counts
 *
 * Returns provider counts for all US states.
 * Used by the Add State modal to show how many providers are in each state.
 *
 * Uses Supabase's count feature per state for accuracy (vs fetching all rows).
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

    // Query count for each state in parallel using Supabase's count feature
    // This is more reliable than fetching all rows and counting client-side
    const countPromises = US_STATES.map(async (s) => {
      const { count, error } = await db
        .from("olera-providers")
        .select("provider_id", { count: "exact", head: true })
        .eq("state", s.value)
        .or("deleted.is.null,deleted.eq.false");

      if (error) {
        console.error(`[provider-outreach/states/counts] Error counting ${s.value}:`, error);
        return { state_code: s.value, state_name: s.label, provider_count: 0 };
      }

      return {
        state_code: s.value,
        state_name: s.label,
        provider_count: count || 0,
      };
    });

    const counts = await Promise.all(countPromises);

    // Sort by provider count descending (most providers first)
    counts.sort((a, b) => b.provider_count - a.provider_count);

    return NextResponse.json({ counts });
  } catch (err) {
    console.error("[provider-outreach/states/counts] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
