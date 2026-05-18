import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/care-seekers/cities
 *
 * Returns distinct cities from care seeker profiles.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const db = getServiceClient();

    // Get all family profiles with cities (we need to fetch all to get distinct values)
    const { data, error } = await db
      .from("business_profiles")
      .select("city, state")
      .eq("type", "family")
      .not("city", "is", null)
      .order("city", { ascending: true });

    if (error) {
      console.error("Admin care-seekers cities error:", error);
      return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
    }

    // Build distinct cities with counts
    const cityMap = new Map<string, { city: string; state: string; count: number }>();

    for (const row of data || []) {
      if (row.city) {
        const key = `${row.city}|||${row.state || ""}`;
        const existing = cityMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          cityMap.set(key, { city: row.city, state: row.state || "", count: 1 });
        }
      }
    }

    const cities = Array.from(cityMap.values()).sort((a, b) =>
      a.city.localeCompare(b.city)
    );

    return NextResponse.json({ cities });
  } catch (err) {
    console.error("Admin care-seekers cities error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
