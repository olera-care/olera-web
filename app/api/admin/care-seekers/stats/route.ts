import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/care-seekers/stats
 *
 * Returns counts for care seeker filter tabs.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const db = getServiceClient();

    // Run all count queries in parallel
    const [totalRes, guestRes, claimedRes, publicRes, thisWeekRes] = await Promise.all([
      // Total count
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family"),

      // Guest count (no account_id)
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family")
        .is("account_id", null),

      // Claimed count (has account_id)
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family")
        .not("account_id", "is", null),

      // Public count (active care post)
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family")
        .eq("is_active", true)
        .contains("metadata", { care_post: { status: "active" } }),

      // New this week
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Log any query errors for debugging
    if (totalRes.error) console.error("Stats total query error:", totalRes.error);
    if (guestRes.error) console.error("Stats guest query error:", guestRes.error);
    if (claimedRes.error) console.error("Stats claimed query error:", claimedRes.error);
    if (publicRes.error) console.error("Stats public query error:", publicRes.error);
    if (thisWeekRes.error) console.error("Stats thisWeek query error:", thisWeekRes.error);

    return NextResponse.json({
      total: totalRes.count ?? 0,
      guest: guestRes.count ?? 0,
      claimed: claimedRes.count ?? 0,
      public: publicRes.count ?? 0,
      thisWeek: thisWeekRes.count ?? 0,
    });
  } catch (err) {
    console.error("Admin care-seekers stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
