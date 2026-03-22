/**
 * Google Places API (New) — fetch review snippets for provider pages.
 *
 * Uses the Places API (New) which costs $5/1K requests for Advanced fields (reviews).
 * Results are cached in Supabase as JSONB, not fetched on every page load.
 *
 * Reference: https://developers.google.com/maps/documentation/places/web-service/place-details
 */

import type { GoogleReviewsData, GoogleReviewSnippet } from "@/lib/types";

const PLACES_API_BASE = "https://places.googleapis.com/v1/places";

/** Fields we request — reviews is an Advanced field ($5/1K) */
const FIELD_MASK = "rating,userRatingCount,reviews";

/** Max reviews to store per provider (Google returns up to 5) */
const MAX_REVIEWS = 2;

interface PlacesApiReview {
  name: string;
  rating: number;
  text?: { text: string; languageCode: string };
  originalText?: { text: string; languageCode: string };
  relativePublishTimeDescription: string;
  authorAttribution: {
    displayName: string;
    uri?: string;
    photoUri?: string;
  };
  publishTime: string; // ISO 8601
  googleMapsUri?: string;
}

interface PlacesApiResponse {
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesApiReview[];
}

/**
 * Fetch Google review data for a single place.
 *
 * Returns null if:
 * - No API key configured
 * - Place has no reviews
 * - API returns an error (logged, not thrown)
 */
export async function fetchGoogleReviews(
  placeId: string,
): Promise<GoogleReviewsData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[google-places] GOOGLE_PLACES_API_KEY not set, skipping");
    return null;
  }

  if (!placeId) {
    return null;
  }

  try {
    const url = `${PLACES_API_BASE}/${placeId}?fields=${FIELD_MASK}&key=${apiKey}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      console.error(
        `[google-places] API error for ${placeId}: ${res.status} ${errorBody}`,
      );
      return null;
    }

    const data: PlacesApiResponse = await res.json();

    if (!data.rating && !data.reviews?.length) {
      return null;
    }

    const reviews: GoogleReviewSnippet[] = (data.reviews ?? [])
      .slice(0, MAX_REVIEWS)
      .map((r) => ({
        author_name: r.authorAttribution.displayName,
        rating: r.rating,
        text: r.text?.text ?? r.originalText?.text ?? "",
        relative_time: r.relativePublishTimeDescription,
        profile_photo_url: r.authorAttribution.photoUri ?? null,
        time: Math.floor(new Date(r.publishTime).getTime() / 1000),
      }));

    return {
      rating: data.rating ?? 0,
      review_count: data.userRatingCount ?? 0,
      reviews,
      last_synced: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[google-places] Failed to fetch ${placeId}:`, err);
    return null;
  }
}

/**
 * Batch fetch Google reviews with rate limiting.
 *
 * Processes providers in chunks to avoid hitting API rate limits.
 * Returns a map of provider_id → GoogleReviewsData.
 */
export async function batchFetchGoogleReviews(
  providers: { provider_id: string; place_id: string }[],
  options?: { batchSize?: number; delayMs?: number },
): Promise<Map<string, GoogleReviewsData>> {
  const batchSize = options?.batchSize ?? 50;
  const delayMs = options?.delayMs ?? 200;
  const results = new Map<string, GoogleReviewsData>();

  for (let i = 0; i < providers.length; i += batchSize) {
    const batch = providers.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(async (p) => {
        const data = await fetchGoogleReviews(p.place_id);
        return { provider_id: p.provider_id, data };
      }),
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value.data) {
        results.set(result.value.provider_id, result.value.data);
      }
    }

    // Rate limit between batches
    if (i + batchSize < providers.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
