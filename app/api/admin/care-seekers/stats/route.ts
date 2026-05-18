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
    const [totalRes, membersRes, guestRes, publishedRes, thisWeekRes] = await Promise.all([
      // Total count
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family"),

      // Members count (has account_id)
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family")
        .not("account_id", "is", null),

      // Guest count (no account_id)
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family")
        .is("account_id", null),

      // Published count (active care post)
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
    if (membersRes.error) console.error("Stats members query error:", membersRes.error);
    if (guestRes.error) console.error("Stats guest query error:", guestRes.error);
    if (publishedRes.error) console.error("Stats published query error:", publishedRes.error);
    if (thisWeekRes.error) console.error("Stats thisWeek query error:", thisWeekRes.error);

    // Calculate unpublished as total - published (more reliable than complex OR query)
    const total = totalRes.count ?? 0;
    const published = publishedRes.count ?? 0;
    const unpublished = total - published;

    return NextResponse.json({
      total,
      members: membersRes.count ?? 0,
      guest: guestRes.count ?? 0,
      published,
      unpublished,
      thisWeek: thisWeekRes.count ?? 0,
    });
  } catch (err) {
    console.error("Admin care-seekers stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
