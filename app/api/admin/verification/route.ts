import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/verification
 *
 * List business profiles with pending identity verification.
 * Query params: status (default: "pending"), limit, offset
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

    let query = db
      .from("business_profiles")
      .select("id, display_name, type, category, city, state, verification_state, metadata, created_at, updated_at, email, phone, image_url, slug")
      .in("type", ["organization", "caregiver"])
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== "all") {
      query = query.eq("verification_state", status);
    }

    const { data: providers, error } = await query;

    if (error) {
      console.error("Failed to fetch verification requests:", error);
      return NextResponse.json({ error: "Failed to fetch verification requests" }, { status: 500 });
    }

    return NextResponse.json({ providers: providers ?? [] });
  } catch (err) {
    console.error("Admin verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
