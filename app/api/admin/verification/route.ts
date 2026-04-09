import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/verification
 *
 * List business profiles with badge requests.
 * Query params: status (default: "pending"), limit, offset
 *
 * Status filters:
 * - pending: Has verification_submission but no badge_approved/badge_rejected
 * - approved: badge_approved = true
 * - rejected: badge_rejected = true
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const db = getServiceClient();

    // Fetch all profiles with badge submissions, then filter in JS
    // This avoids uncertain JSONB query syntax with .or() clauses
    const { data: allProviders, error } = await db
      .from("business_profiles")
      .select("id, display_name, type, category, city, state, verification_state, metadata, created_at, updated_at, email, phone, image_url, slug")
      .in("type", ["organization", "caregiver"])
      .not("metadata->verification_submission", "is", null)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch badge requests:", error);
      return NextResponse.json({ error: "Failed to fetch badge requests" }, { status: 500 });
    }

    // Filter by badge status in JavaScript for reliability
    type ProfileMetadata = { badge_approved?: boolean | null; badge_rejected?: boolean | null };
    let filtered = allProviders ?? [];

    if (status === "pending") {
      // Has submission but not yet approved or rejected
      filtered = filtered.filter((p) => {
        const meta = p.metadata as ProfileMetadata | null;
        const notApproved = !meta?.badge_approved;
        const notRejected = !meta?.badge_rejected;
        return notApproved && notRejected;
      });
    } else if (status === "approved") {
      filtered = filtered.filter((p) => {
        const meta = p.metadata as ProfileMetadata | null;
        return meta?.badge_approved === true;
      });
    } else if (status === "rejected") {
      filtered = filtered.filter((p) => {
        const meta = p.metadata as ProfileMetadata | null;
        return meta?.badge_rejected === true;
      });
    }

    // Apply pagination after filtering
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({ providers: paginated });
  } catch (err) {
    console.error("Admin badge requests error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
