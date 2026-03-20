import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { fetchGoogleReviews } from "@/lib/google-places";

/**
 * POST /api/internal/backfill-google-review
 *
 * On-demand backfill: called (non-blocking) when a provider page is viewed
 * and the provider has a place_id but no cached google_reviews_data.
 *
 * Supports both olera-providers (source=ios) and business_profiles (source=bp).
 */
export async function POST(request: NextRequest) {
  try {
    const { provider_id, place_id, source } = await request.json();

    if (!provider_id || !place_id) {
      return NextResponse.json({ error: "Missing provider_id or place_id" }, { status: 400 });
    }

    const data = await fetchGoogleReviews(place_id);
    if (!data) {
      return NextResponse.json({ message: "No reviews found" });
    }

    const db = getServiceClient();

    if (source === "bp") {
      // Business profile — store in metadata.google_reviews_data
      const { data: bp } = await db
        .from("business_profiles")
        .select("metadata")
        .eq("id", provider_id)
        .single();

      const existingMeta = (bp?.metadata as Record<string, unknown>) ?? {};
      const { error } = await db
        .from("business_profiles")
        .update({ metadata: { ...existingMeta, google_reviews_data: data } })
        .eq("id", provider_id);

      if (error) {
        console.error(`[backfill-google-review] BP update failed for ${provider_id}:`, error);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }
    } else {
      // olera-providers — store in google_reviews_data column
      const { error } = await db
        .from("olera-providers")
        .update({ google_reviews_data: data })
        .eq("provider_id", provider_id);

      if (error) {
        console.error(`[backfill-google-review] Update failed for ${provider_id}:`, error);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "Backfilled", provider_id });
  } catch (err) {
    console.error("[backfill-google-review] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
