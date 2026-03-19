import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { fetchGoogleReviews } from "@/lib/google-places";

/**
 * POST /api/internal/backfill-google-review
 *
 * On-demand backfill: called (non-blocking) when a provider page is viewed
 * and the provider has a place_id but no cached google_reviews_data.
 *
 * This is the safety net in the tiered refresh strategy — catches providers
 * not yet covered by the monthly cron without blocking page render.
 */
export async function POST(request: NextRequest) {
  try {
    const { provider_id, place_id } = await request.json();

    if (!provider_id || !place_id) {
      return NextResponse.json({ error: "Missing provider_id or place_id" }, { status: 400 });
    }

    const data = await fetchGoogleReviews(place_id);
    if (!data) {
      return NextResponse.json({ message: "No reviews found" });
    }

    const db = getServiceClient();
    const { error } = await db
      .from("olera-providers")
      .update({ google_reviews_data: data })
      .eq("provider_id", provider_id);

    if (error) {
      console.error(`[backfill-google-review] Update failed for ${provider_id}:`, error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    return NextResponse.json({ message: "Backfilled", provider_id });
  } catch (err) {
    console.error("[backfill-google-review] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
