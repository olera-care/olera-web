import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";

/**
 * GET /api/reviews?provider_id=xxx
 *
 * Fetch published reviews for a provider. No auth required.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("provider_id");

  if (!providerId) {
    return NextResponse.json({ error: "provider_id required" }, { status: 400 });
  }

  try {
    const db = getServiceClient();
    const { data: reviews, error } = await db
      .from("reviews")
      .select("id, provider_id, account_id, reviewer_name, rating, title, comment, relationship, status, created_at, updated_at")
      .eq("provider_id", providerId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch reviews:", error);
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    return NextResponse.json({ reviews: reviews ?? [] });
  } catch (err) {
    console.error("Reviews GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/reviews
 *
 * Submit a review for a provider. Requires authentication.
 * Body: { provider_id, rating, comment, relationship, title? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { provider_id, rating, comment, relationship, title } = body;

    // Validate required fields
    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 });
    }
    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: "Review text is required" }, { status: 400 });
    }
    if (!relationship) {
      return NextResponse.json({ error: "Relationship is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Look up account for this user
    const { data: account } = await db
      .from("accounts")
      .select("id, display_name")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Compute reviewer name as "First L."
    const displayName = account.display_name || user.email?.split("@")[0] || "Anonymous";
    const parts = displayName.trim().split(/\s+/);
    const reviewerName = parts.length >= 2
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : parts[0];

    // Check for existing review (one per user per provider)
    const { data: existing } = await db
      .from("reviews")
      .select("id")
      .eq("provider_id", provider_id)
      .eq("account_id", account.id)
      .neq("status", "removed")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this provider." },
        { status: 409 }
      );
    }

    // Insert review
    const { data: newReview, error } = await db
      .from("reviews")
      .insert({
        provider_id,
        account_id: account.id,
        reviewer_name: reviewerName,
        rating,
        title: title?.trim() || null,
        comment: comment.trim(),
        relationship,
        status: "published",
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (race condition)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You have already reviewed this provider." },
          { status: 409 }
        );
      }
      console.error("Failed to create review:", error);
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    return NextResponse.json({ review: newReview }, { status: 201 });
  } catch (err) {
    console.error("Reviews POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
