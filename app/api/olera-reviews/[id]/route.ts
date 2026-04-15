import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * GET /api/olera-reviews/[id]
 *
 * Fetch a single Olera review by ID. Used for magic link highlighting.
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
      .from("olera_reviews")
      .select("id, reviewer_name, rating, review_text, created_at")
      .eq("id", id)
      .eq("flagged", false)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch olera review:", error);
      return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
    }

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (err) {
    console.error("Olera review GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
