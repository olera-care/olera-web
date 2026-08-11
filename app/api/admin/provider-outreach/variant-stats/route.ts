import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";
import { getVariantStats } from "@/lib/provider-outreach/variant-testing";

/**
 * GET /api/admin/provider-outreach/variant-stats
 *
 * Get per-variant performance statistics for dashboard display.
 *
 * Returns:
 *   - variants: Array of variant stats
 *     - variant_id: string
 *     - variant_key: string
 *     - name: string
 *     - is_control: boolean
 *     - enrolled_count: number
 *     - opened_count: number
 *     - clicked_count: number
 *     - claimed_count: number
 *     - claim_rate: number (percentage, rounded to 1 decimal)
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const stats = await getVariantStats();

    return NextResponse.json({
      variants: stats,
    });
  } catch (error) {
    console.error("Error fetching variant stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
