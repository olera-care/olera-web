import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * GET /api/reviews/[id]
 *
 * Fetch a single review by ID. Used for magic link highlighting.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    const { data: review, error } = await db
      .from("reviews")
      .select("id, reviewer_name, rating, title, comment, relationship, created_at")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch review:", error);
      return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
    }

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (err) {
    console.error("Review GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
