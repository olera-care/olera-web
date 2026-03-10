import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || "all";
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const db = getServiceClient();

  let query = db
    .from("reviews")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by status
  if (status !== "all") {
    query = query.eq("status", status);
  }

  // Search by reviewer name or provider_id (slug)
  if (search) {
    query = query.or(
      `reviewer_name.ilike.%${search}%,provider_id.ilike.%${search}%`
    );
  }

  const { data: reviews, count, error } = await query;

  if (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }

  return NextResponse.json({ reviews: reviews ?? [], count: count ?? 0 });
}
